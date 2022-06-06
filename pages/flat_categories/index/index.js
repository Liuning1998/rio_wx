// pages/flat_categories/index/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    currentCategory: {},
    products: {},
    currentIndex: 0,
    showLoading: false,
    moveParams: {
      scrollLeft: 0, // scroll-view滚动的距离,默认为0,因为没有触发滚动
      subLeft:0, //点击元素距离屏幕左边的距离
      subHalfWidth:0, //点击元素的宽度一半
      screenHalfWidth:0 //屏幕宽度的一半
   },
   labelShow:false,
   topShow:false,
   productsTitle:'全部分类'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.fetchCategories()

    var moveParams = this.data.moveParams;

    moveParams.screenHalfWidth = wx.getSystemInfoSync().windowWidth/2;
    this.setData({ moveParams: moveParams})


  },

  onShow: function () {
    this.loadCartInfo()
    this.cancelSearch()
    // 吸顶
    const query = wx.createSelectorQuery();
    query.select(".scroll").boundingClientRect((res) => {
        this.setData({
            parentTop: this.data.pageMarginTop + 44 + 56
        })
    }).exec()
  },
  // 置顶方法
  topShow:function(){
    const query = wx.createSelectorQuery();
    var labelTop = 0;
    query.select("#fixedTop").boundingClientRect((res) => {
      try {
        labelTop = res.top 
        if(this.data.parentTop >= labelTop){ 
          if(!this.data.topShow){ 
            this.setData({ 
              topShow:true, 
              labelTop:labelTop 
            }) 
          } 
        }else{ 
          if(!!this.data.topShow){ 
            this.setData({ 
              topShow:false 
            }) 
          } 
        } 
      } catch (error) {
        console.log(error)
      }
    }).exec()

  },
  onPageScroll: function (e) {
    this.topShow()
  },
 

  // GET  /api/platform_categories
  fetchCategories: function () {
    http.get({
      url: 'api/platform_categories',
      success: res => {
        res.data.forEach(function(ele,i){
          ele.labelArr = [{id:ele.id,name:'全部分类',sort_value:false}]
          ele.secondId = ele.id
        })
        this.setData({ categories: res.data })

        var defaultCategory = res.data.filter(item => item.sort_value)[0] || res.data[0]
        
        if (defaultCategory != null) {
          if (this.data.currentCategory == null || Object.keys(this.data.currentCategory).length <= 0) {
            this.setData({currentCategory: defaultCategory})
          }
          this.fetchProducts(defaultCategory.id)
          // 获取标签
          this.getLabel(defaultCategory.id)
        }
      }
    })
  },

  fetchProducts: function (categoryId, refresh) {
    if (categoryId == null) { return false }
    var key = `id_${categoryId}`
    var length = 0
    if (this.data.products[key] != null) {
      length = this.data.products[key].length
    }
    var page = Math.floor(length/getApp().globalData.perPage) + 1
    if (refresh) {
      page = 1
    }

    http.get({
      url: `api/platform_categories/${categoryId}`,
      data: {
        page: page
      },
      success: res => {
        if (refresh) {
          this.setData({ products: {} })
        }
        this.stopPDRefresh()
        this.appendProduct(res.data, categoryId)
      }
    })
  },

  appendProduct: function (resProducts, categoryId) {
    var key = `id_${categoryId}`
    var products = this.data.products[key] || []
    var currentIndex = products.length
    for(var i in resProducts) {
      var product = resProducts[i]
      if (product == null) { continue }
      let exist_flag = 5//允许重复次数
      
      if (resProducts.length < getApp().globalData.perPage) {
        exist_flag = 0
      }
      if (products.length <= 0 || products.filter(item => item.id == product.id).length <= exist_flag) {//判断每一条数据是否重复
        var dataKey = `products.${key}[${currentIndex}]`
        this.setData({ [dataKey]: product })
        currentIndex += 1
      }
      // var dataKey = `products.${key}[${currentIndex}]`
      // this.setData({ [dataKey]: product })
      // currentIndex += 1
    }

    var bottomKey = `pageBottom.${key}`
    if (resProducts.length < 10) {
      this.setData({ [bottomKey]: true })
    } else {
      this.setData({ [bottomKey]: false })
    }
  },

  onReachBottom: function () {
    if (this.data.currentCategory != null) {
      this.fetchProducts(this.data.currentCategory.secondId)
    }
  },

  changeCategory: function (e) {


    var category = e.currentTarget.dataset.item
    if (category == null || category.id == this.data.currentCategory.id) {
      return false
    }

    this.setData({ currentCategory: category,productsTitle:'全部分类',topShow:false})
    setTimeout(res=>{
      this.topShow()
    },50)
    setTimeout(res=>{
      this.setData({
        scrollLeft:0
      })
    },50)

    var key = `id_${category.id}`
    if (this.data.products[key] == null || this.data.products[key].length < 5) {
      this.fetchProducts(category.id)
    }

    this.setCurentIndex(category, this.data.categories)


    wx.pageScrollTo({
      scrollTop: 0
    })
  },

  setCurentIndex: function (current, categroies) {
    var index = 0
    for(var i in categroies) {
      if (categroies[i].id == current.id) {
        index = i
        break
      }
    }

    this.setData({ currentIndex: index })

    // 获取标签
    this.getLabel(current.id);
   
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  clearSearchInput: function () {
    this.setData({ searchKey: '' })
    this.focusSearchInput()
  },

  focusSearchInput: function () {
    this.setData({ searchFocus: true })
  },

  clearFocusSearchInput: function () {
    this.setData({ searchFocus: false })
  },

  showSearchLayer: function () {
    this.setData({ showSearch: true, searchFocus: true })
  },

  cancelSearch: function () {
    this.setData({ showSearch: false, searchKey: '' })
  },

  hideSearch: function () {
    this.setData({ showSearch: false })
  },

  search: function () {
    if (this.data.searchKey.length <= 0) {
      return
    }

    // console.log('sss')
    this.navigateTo("/products/pages/search_all/index?searchKey="+this.data.searchKey)
  },
  
  onPullDownRefresh() {
    // this.refreshData()
    this.setData({ showLoading: true })
    this.fetchProducts(this.data.currentCategory.secondId, true)
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 1000)
  },

  gotoCart1: function () {
    wx.switchTab({
      url: '/pages/orders/cart/index',
    })
  },

  // 标签筛选居中
  labelSreen:function(e){
    //  点击后的标签居中
    var ele = 'ele' + e.currentTarget.dataset.index;
    console.log(e.currentTarget.dataset.item)
    var id = e.currentTarget.dataset.item.id;
    var currentidKey = `currentCategory.secondId`
    var key = `id_${id}`;
    var dataObject = {}; 
    if(!this.data.products[key]){
      dataObject['topShow'] = false 
    }
    dataObject['productsTitle'] = e.currentTarget.dataset.item.name; 
    dataObject[currentidKey] = id; 
    this.setData(dataObject);
    this.getRect('#'+ele);
    this.fetchProducts(id)
  },

  getRect(ele) { //获取点击元素的信息,ele为传入的id
    var that = this;
    wx.createSelectorQuery().select(ele).boundingClientRect(function (rect) {
      let moveParams = that.data.moveParams;
      moveParams.subLeft = rect.left;
      moveParams.subHalfWidth = rect.width/2;
      that.moveTo();
    }).exec()
  },

  scrollMove(e) {
    let moveParams = this.data.moveParams;
    moveParams.scrollLeft = e.detail.scrollLeft;
    this.setData({
      moveParams: moveParams
    })
  },

  moveTo: function() {
    let subLeft = this.data.moveParams.subLeft;
    let screenHalfWidth = this.data.moveParams.screenHalfWidth;
    let subHalfWidth = this.data.moveParams.subHalfWidth;
    let scrollLeft = this.data.moveParams.scrollLeft;

    let distance = subLeft - screenHalfWidth + subHalfWidth;


    scrollLeft = scrollLeft + distance  -50;

    this.setData({
      scrollLeft: scrollLeft
    })
  },

  // 展开标签栏
  openLabel:function(){
    var labelShow = this.data.labelShow;
    this.setData({
      labelShow:!labelShow
    })
  },

  //获取标签
  getLabel:function(currentId){
    var categories = this.data.categories;
    var currentIndex = this.data.currentIndex;
    var key = `categories[${currentIndex}].labelArr`
    if(categories[currentIndex].labelArr.length == 1){
      http.get({
        url: `api/platform_categories?q[father_id_eq]=${currentId}`,
        // data: _data,
        success: res => {
          console.log('加载成功！',res.data)
          res.data.forEach(function(ele,i){
            ele.active = false
            categories[currentIndex].labelArr.push(ele)
          })
          this.setData({
            [key]:categories[currentIndex].labelArr
          })
        }
      })
    }
   
  }
  

})