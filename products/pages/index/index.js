// products/pages/index/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    pageNo: 1,
    category: null,
    loaded: false,
    //标签
    labelArr:[],
    moveParams: {
      scrollLeft: 0, // scroll-view滚动的距离,默认为0,因为没有触发滚动
      subLeft:0, //点击元素距离屏幕左边的距离
      subHalfWidth:0, //点击元素的宽度一半
      screenHalfWidth:0 //屏幕宽度的一半
    },
    //  正在点击，避免重复点击
    clicked:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    console.log('上个页面信息',options)
    console.log('this.params',this.params)
    var category
    if(options.pageType == 'category') {
      if (this.params.category == null) {
        category = {
          id: options.store_id,
          name: options.store_name
        }
      } else {
        category = this.params.category
      } 
    }else if(options.pageType == 'store'){//购物车店铺入口
      category = {
        id: options.store_id,
        name: options.store_name,
        pageType:'store'
      }
    }

    var pageTitle = '商品列表'
    if(category != null && category.name != null) {
      pageTitle = category.name
    }

    var labelArr = this.data.labelArr;
    
    var allLabel = {
      id: category.id,
      name: '全部分类',
      icon: null,
      active: true,
      searched: false,
    };
   

    labelArr.unshift(allLabel)

    var moveParams = this.data.moveParams;
    var products = {};
    var id = `id_${category.id}`;
    products[id] = [];

    moveParams.screenHalfWidth = wx.getSystemInfoSync().windowWidth/2;
    this.setData({ category: category, special_area_id: options.special_area_id, pageTitle: pageTitle, moveParams: moveParams, labelArr:labelArr,products:products,currentCategory:allLabel,})

    this.getProducts(category.id, null)

    // 如果不是购物车入口
    if(options.pageType == 'category'){
      this.getLabel();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo();
  },

  //获取商品
  getProducts: function (category_id, orderType, refresh,searchKey) {
    let pageType = this.data.category.pageType;
    let _url,
        _data;
    // 判断是否为购物车入口
    if(pageType != null && pageType =='store'){
      _data = {}
      _url = '/api/stores/' + this.data.category.id;
      if(orderType!=null || searchKey!=null){
        _url = `/api/stores/${this.data.category.id}/search`;
      }
    }else{
      _data = {
        category_id: category_id,
        // page: page || 1
      }
      _url = `api/special_areas/${this.data.special_area_id}/category_products`
    }

    var key = `id_${category_id}`
    var length = 0
    if (this.data.products[key] != null) {
      length = this.data.products[key].length
    }

    var page = Math.floor(length/getApp().globalData.perPage) + 1

    if (refresh) {//if要清空数据时
      _data.page = 1
    }else{
      _data.page = page
    }

    if(searchKey != null){
      _data.search_key = searchKey
    }

    if (orderType != null) {
      _data.order = orderType
    }
  
    http.get({
      url: _url,
      data: _data,
      success: res => {

        wx.hideLoading()
        
        var products = this.data.products;
        
        // if(refresh){
        //   this.setData({
        //       [`products.${key}`]:[],
        //   })
        // }

        if (res.data != null && res.data.constructor.name == 'Array') {
          // if (refresh) {
          //   let pageNo = 1
          //   if (res.data.length >= 10) { pageNo = 2 }
          //   products.forEach(function(e,i){
          //     if(e.id == category_id){
          //       e.proArr = res.data
          //     }
          //   })
          //   this.setData({ products: products, loaded: true, pageNo: pageNo })
          // } else {
            
          // }
          // this.appendProducts(res.data,category_id)
          
          this.appendProduct(res.data,category_id)
        }
        if(this.data.products[key]<=0){
          this.setData({loaded:true})
        }else{
          this.setData({loaded:false})
        }
      }
    })
  },

  // appendProducts: function (data,categoryId) {
  //   var key = `id_${categoryId}`
  //   let products = this.data.products[key]
  //   let offset = products.length
    

  //   data.forEach(item => {
  //     if (products.filter(i => i.id == item.id).length <= 0) {
  //       productsI.proArr.push(item)
  //       this.setData({ products: products})
  //       offset += 1
  //     }
  //   })

  //   if (data.length >= getApp().globalData.perPage) {
  //     this.setData({ pageNo: this.data.pageNo + 1 })
  //   }

  //   this.setData({ loaded: true })

  //   // this.stopPDRefresh()
  // },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  addCart: function (e) {
    var item = e.currentTarget.dataset.item
    let master = item.variants.filter(variant => variant.is_master)[0]
    if (master == null) {
      return
    }

    let lineItem = {
      quantity: 1,
      variant_id: master.id,
      price: master.price,
      vip_price: master.vip_price,
      origin_price: master.origin_price,
      available_on: master.available_on,
      stock: master.stock,
      store_id: master.store_id || '0',
      product: item,
      // variant: master,
      show_name: master.show_name
    }

    let cart = cartApi.addCart(lineItem)
    this.setData({ cartData: cart })
  },

  changeOrder: function (e) {
    var orderType = e.currentTarget.dataset.orderType

    var key = `id_${this.data.currentCategory.id}`;
    
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

    if(this.data.products[key].length > 1){
      wx.showLoading({
        title: '加载中...',
      })
      this.setData({
        [`products.${key}`]:[],
        [bottomKey]:false,
        clicked:true
      })  

      this.getProducts(this.data.currentCategory.id, orderType, true,this.data.searchKey)
    }


  },

  //搜索
  showSearchLayer: function () {
    this.setData({ showSearch: true, searchFocus: true })
  },

  //
  showSearchLayer: function () {
    this.setData({ showSearch: true, searchFocus: true })
  },

  cancelSearch: function () {
    this.setData({ showSearch: false, })
  },

  hideSearch: function () {
    this.setData({ showSearch: false })
  },

  clearSearchInput: function () {
    this.setData({ searchKey: '' })
    this.focusSearchInput()
  },
  
  focusSearchInput: function () {
    this.setData({ searchFocus: true })
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  search: function () {
    if (this.data.searchKey == null || this.data.searchKey.trim() == '') {
      this.hideSearch()
    }

    var key = `id_${this.data.currentCategory.id}`;
    var bottomKey = `pageBottom.${key}`;
    var labelArr = this.data.labelArr;
    labelArr.forEach(function(e,i){
      if(('id_'+e.id) == key){
        e.searched = true
      }
    })
    
    this.setData({
      [`products.${key}`]:[],
      labelArr:labelArr,
      [bottomKey]:false,
      clicked:true
    })

    this.getProducts(this.data.currentCategory.id, null,true,this.data.searchKey)
    
  },

  onReachBottom: function () {
    this.getProducts(this.data.currentCategory.id, this.data.orderType, false,this.data.searchKey)
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
      // var dataKey = `products.${key}[${currentIndex}]`
      // this.setData({ [dataKey]: product })
      // currentIndex += 1
    }

    var bottomKey = `pageBottom.${key}`
    if (resProducts.length < 10) {
      this.setData({ [bottomKey]: true ,clicked:false})
    } else {
      this.setData({ [bottomKey]: false ,clicked:false })
    }
  },

  // 展开标签
  openLabel:function(){
    this.setData({
      labelShow:true
    })
  },

  // 关闭标签栏
  closeLabel:function(){
    this.setData({
      labelShow:false
    })
  },

  //点击标签
  labelSreen:function(e){
    
    if(this.data.labelShow){
      this.closeLabel()
    }
    
    let index = e.currentTarget.dataset.index;
    let labelArr = this.data.labelArr;
    labelArr.forEach(function(e,i){
      if(i == index){
        e.active = true
      }else{
        e.active = false
      }
    })
    // 搜索内容的标签先清空数据
    // var product = `products.id_${this.data.currentCategory.id}`
    // if(e.currentTarget.dataset.item.searched){
    //   labelArr.forEach(function(e,i){
    //     if(i == index){
    //       e.searched = false
    //     }
    //   })
    //   this.setData({
    //     [product]:[],
    //   })
    // }
    //  点击后的标签居中
    let ele = 'ele' + e.currentTarget.dataset.index
    let id = e.currentTarget.dataset.item.id;
    // var currentIndex = (products || []).findIndex((profire) => profire.id===id);
    var key = `id_${this.data.currentCategory.id}`;
    var bottomKey = `pageBottom.${key}`;

    this.setData({
      activeIdx: e.currentTarget.dataset.index,
      labelArr:labelArr,
      currentCategory:e.currentTarget.dataset.item,
      searchKey:'',
      orderType:null,
      [`products.${key}`]:[],
      [bottomKey]:false,
      clicked:true
    });
    
    this.getProducts(id,this.data.orderType,true,this.data.searchKey)
    this.getRect('#'+ele);
    this.cancelSearch();
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

    scrollLeft = scrollLeft + distance;

    this.setData({
      scrollLeft: scrollLeft
    })
  },

  //获取标签
  getLabel:function(){
    var labelArr = this.data.labelArr;
    var products = this.data.products;
    http.get({
      url: `api/special_areas/${this.data.special_area_id}/categories?q[father_id_eq]=${this.data.category.id}`,
      // data: _data,
      success: res => {
        
        res.data.forEach(function(e,i){
          e.active = false
          e.searched = false
          labelArr.push(e)
          var id = `id_${e.id}`
          products[id] = []
        })


        this.setData({
          labelArr:labelArr
        })
      }
    })
  }

})