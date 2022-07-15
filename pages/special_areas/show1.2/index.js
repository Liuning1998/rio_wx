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
    allowScroll:true,//是否允许内层scrollview滚动
    labelArr: {},//子标签
    currentLabel:{},//当前选中的子标签
    scrollTop:{}, //滚动条滚动高度
    showLoading: false,
    firstGetLoading:{},//首次加载的loading状态
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
          let allItem = res.data.filter(item => item.name == '精选')
          if(allItem.length > 0){
            allItem[0].id = 'all'
            res.data = res.data.filter(item => item.name != '精选')
            res.data.unshift(allItem[0])
          }else{
            res.data.unshift({
              icon: "/images/v1.2/jingxuan.png",
              id:"all",
              name: "精选",
            })
          }

          this.setData({
            currentCategory: res.data[0],
            categories: res.data,
            currentLabel: {
              id: 'all',
              name: '全部',
              icon: null,
            }
          })
          //默认先加载专区的全部商品
          this.getProducts(this.data.currentCategory.id, this.data.orderType, false)
          this.stopScrollRefresh()
        }else{
          this.stopScrollRefresh()
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
  
  // scroll-view下拉刷新
  scrollRefresh() {
    if(!this.data.showLoading){
      this.refreshData()
      this.setData({ showLoading: true })
    }
  },

  stopScrollRefresh(){
    if(this.data.showLoading == true){//如果刷新状态为true置为false
      var _this = this;
      setTimeout(()=>{
        _this.setData({
          showLoading: false
        })
      },500)
    }
  },

  refreshData: function () {
    this.getCategories(this.data.currentStore.id)
    this.getAds(this.data.currentStore.id)
    this.setData({ 
      products: {},
      pageBottom: {},
      labelArr: {},
      firstGetLoading: {},
    })
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

    var scrollTopKey = `scrollTop.${key}`
    if(this.data.scrollTop[key] == null && this.data.scrollTop[key] != 0){
      this.setData({
        [scrollTopKey]: 0
      })
    }

    var firstGetLoadingKey = `firstGetLoading.${key}`
    if( !this.data.firstGetLoading[key] ){
      this.setData({
        [firstGetLoadingKey]: true
      })
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
    var key = `id_${item.id}`;
    this.setData({
      currentLabel: item
    })

    if(this.data.products[key] == null || this.data.products[key].length < 1){
      this.getProducts(item.id, this.data.orderType, false)
    }
    
  },

  // 筛选
  changeOrder: function (e) {
    var orderType = e.currentTarget.dataset.orderType

    var key = `id_${this.data.currentLabel.id}`;
    
    var bottomKey = `pageBottom.${key}`;
    var firstGetLoadingKey = `firstGetLoading.${key}`;
    
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
        [firstGetLoadingKey]:false,
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
    this.setData({
      currentCategory: item,
      currentLabel: {
        id: item.id,
        name: '全部',
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
          name: '全部',
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
  // changeScroll: function(e) {
  //   var direction = e.detail.direction;
  //   if(direction == 'bottom'){
  //     this.setData({
  //       allowScroll: true
  //     })
  //   }else{
  //     this.setData({
  //       allowScroll: false
  //     })
  //   }
  // },

    // 获取滚动条当前位置
  viewScroll: function(e){
    var key = `id_${this.data.currentLabel.id}`
    var cangotopKey = `cangotop.${key}`
    if (e.detail.scrollTop > 100) {
      this.setData({
        [cangotopKey]: true
      });
    } else {
      this.setData({
        [cangotopKey]: false
      });
    }
  },

  //回到顶部
  goTop: function (e) {  // 一键回到顶部
    var key = `id_${this.data.currentLabel.id}`;
    var scrollTopKey = `scrollTop.${key}`
    this.setData({
      [scrollTopKey]:0
    })
  },

  onHide(){
    this.hideSearch()
  },

})