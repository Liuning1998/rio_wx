// pages/store/home/index.js
var http = require('../../../utils/http.js')
var canLoadMore = true;//触底函数控制变量(是否可以触发加载)

Page({

  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    products: {},
    ads: [],
    pageTitle: '',
    currentStore: {},
    pageBottom: false,
    specialArea: null,
    allowScroll:false,//是否允许内层scrollview滚动
    labelArr: {},//子标签
    currentLabel:{}//当前选中的子标签
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    let item_id = options.item_id
    // let item_id = 3

    this.getCategories(item_id)
    this.getAds(item_id)

    this.setData({
      pageTitle: decodeURI(options.name) || "专区首页",
      currentStore: {
        id: item_id,
        name: decodeURI(options.name)
      },
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ff0000',
    })
    this.loadCartInfo()
  },

  getCategories: function (special_area_id) {
    http.get({
      url: `api/special_areas/${special_area_id}/categories`,
      data: {
        special_area_id: special_area_id
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          res.data.unshift({
            icon: "https://file-download.jhqli.com/202206101643/a485b87bbc902865577c4e7650c8975c/rio_api/38qyc5fz0ra8v8yhikl6a0mlhalz",
            id:"all",
            name: "精选",
          })
          this.setData({
            currentCategory: res.data[0],
            categories: res.data,
            currentLabel: {
              id: 'all',
              name: '全部商品',
              icon: null,
            }
          })
          //默认先加载专区的全部商品
          this.getProducts(this.data.currentCategory.id, this.data.orderType, false)
        }
      }
    })
  },

  onPullDownRefresh() {
    this.refreshData()
    // wx.stopPullDownRefresh()
    this.setData({ showLoading: true })
    this.stopPDRefresh()
  },

  refreshData: function () {
    this.getCategories(this.data.currentStore.id)
    this.getAds(this.data.currentStore.id)
    this.setData({ products: {}})
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 800)
  },

  // 页数判断
  appendProduct: function (resProducts, categoryId) {
    
    var key = `id_${categoryId}`
    var products = this.data.products[key] || [];

    var currentIndex = products.length
    for(var i in resProducts) {
      var product = resProducts[i]
      if (product == null) { continue }
      let exist_flag = 5//允许重复次数)
      if (resProducts.length < getApp().globalData.perPage) {
        exist_flag = 0
      }
      if (products.length <= 0 || products.filter(item => item.id == product.id).length <= exist_flag) {//判断每一条商品id是否存在
        var dataKey = `products.${key}[${currentIndex}]`
        this.setData({ [dataKey]: product })
        currentIndex += 1
      }
    }

    var bottomKey = `pageBottom.${key}`
    if (resProducts.length < 10) {
      this.setData({ [bottomKey]: true })
    } else {
      this.setData({ [bottomKey]: false })
    }
  },

  getAds: function (special_area_id) {
    http.get({
      url: "/api/special_areas/" + special_area_id,
      success: res => {
        this.setData({ specialArea: res.data })
      }
    })
  },

  //加载商品
  getProducts: function (category_id, orderType, refresh) {
    let _data = {}; 
    let _url;
    canLoadMore = false;
    if(category_id == 'all'){
      _url= `api/special_areas/${this.data.currentStore.id}/products`
    }else{
      _url= `api/special_areas/${this.data.currentStore.id}/category_products`
      _data = {
        category_id: category_id,
      }
    }

    let key = `id_${category_id}`
    let length = 0
    if (this.data.products[key] != null) {
      length = this.data.products[key].length
    }

    var page = Math.floor(length/getApp().globalData.perPage) + 1

    if (refresh) {//if要刷新清空数据时
      _data.page = 1
    }else{
      _data.page = page
    }

    if (orderType != null) {
      _data.order = orderType
    }

    http.get({
      url: _url,
      data: _data,
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          canLoadMore = true;
          this.appendProduct(res.data,category_id)
        }
      }
    })
  },

  // 点击子标签
  changeLabel: function(e){
    var item = e.currentTarget.dataset.item
    this.setData({
      currentLabel: item
    })
    
    this.getProducts(item.id, this.data.orderType, false)
  },

  // 筛选
  changeOrder: function (e) {
    var orderType = e.currentTarget.dataset.orderType

    var key = `id_${this.data.currentCategory.id}`;
    console.log(key)
    
    var bottomKey = `pageBottom.${key}`;
    
    if (orderType == 'price') {
      if (this.data.orderType == 'price down') {
        orderType = "price up"
      } else {
        orderType = "price down"
      }
    } else {
      orderType = null
    }

    this.setData({
      orderType: orderType,
    })

    if(this.data.products[key] && this.data.products[key].length > 1){
      this.setData({
        [`products.${key}`]:[],
        [bottomKey]:false,
      })  
    
      
      this.getProducts(this.data.currentLabel.id, orderType, false)
    }


  },

  // 显示搜索弹框
  showSearchLayer: function () {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000',
    })
    this.setData({ showSearch: true, focus: true })
  },

  // 取消搜索
  hideSearch: function () {
    this.setData({ showSearch: false, searchText: '' })
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  changeCategorie: function (e) {
    var item = e.currentTarget.dataset.item
    var labelArr = this.data.labelArr;
    console.log(item)
    this.setData({
      currentCategory: item,
      currentLabel: {
        id: item.id,
        name: '全部商品',
        icon: null,
      }
    })

    if (item.id == null) {
      return
    }

    if(labelArr[`category_${item.id}`] != null){
      return
    }

    this.getLabel(this.data.currentStore.id,item.id)

  },

  //获取标签
  getLabel:function(special_area_id,category_id){
    var categoryKey = `labelArr.category_${category_id}`
    http.get({
      url: `api/special_areas/${special_area_id}/categories?q[father_id_eq]=${category_id}`,
      // data: _data,
      success: res => {
        res.data.unshift({
          id: category_id,
          name: '全部商品',
          icon: null,
        })
        this.setData({
          [categoryKey]:res.data,
          currentLabel:res.data[0]
        })

        this.getProducts(this.data.currentLabel.id, this.data.orderType, true)

      }
    })
  },

  searchProducts: function () {
    if (this.data.searchText == null || this.data.searchText.length <= 0) {
      return false
    }
    this.navigateTo(`/products/pages/search/index?searchKey=${this.data.searchText}&special_area_id=${this.data.currentStore.id}&store_name=${this.data.currentStore.name}`)
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  clearSearchText: function (e) {
    this.setData({ searchText: null, focus: true })
  },

  onReachBottom: function () {

  },

  //上拉加载更多
  loadMore: function(){
    if(!canLoadMore || this.data.pageBottom['id_'+this.data.currentLabel.id]) return;
    console.log('上拉加载')
    this.getProducts(this.data.currentLabel.id, this.data.orderType, false)
  },

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }

  },

  // 改变商品列表scroll-view是否可滚动
  changeScroll: function(e) {
    var direction = e.detail.direction;
    if(direction == 'bottom'){
      this.setData({
        allowScroll: true
      })
    }else{
      this.setData({
        allowScroll: false
      })
    }
  },

  onHide(){
    this.hideSearch()
  },

})