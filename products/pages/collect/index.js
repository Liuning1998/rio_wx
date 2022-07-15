// products/pages/index/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageTitle: '凑单免运费',
    products: [],
    pageNo: 1,
    category: null,
    //  正在点击，避免重复点击
    clicked:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    console.log('上个页面信息',options)
    var category = {
      code: options.store_code,
      store_short_name: options.store_short_name,
      total: options.total,
    }

    this.setData({ 
      category: category,
    })

    this.getProducts(category.code, null)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo();
  },

  //获取商品
  getProducts: function (category_code, orderType, refresh) {
    let _url = '/api/stores/store_products';
    let _data = {
      code: category_code
    };
    
    if(orderType!=null){
      _url = `/api/stores/search`;
    }

    var length = 0
    if (this.data.products != null) {
      length = this.data.products.length
    }

    var page = Math.floor(length/getApp().globalData.perPage) + 1

    if (refresh) {//if要清空数据时
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

        wx.hideLoading()

        if (res.data != null && res.data.constructor.name == 'Array') {

          this.appendProduct(res.data,category_code)

        }



      }
    })
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  addCart: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.tags != null && item.tags.indexOf('虚拟卡券') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return
    }

    if (item.tags != null && item.tags.indexOf('特殊商品') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return
    }

    if (item.store_code == null || item.store_code.trim() == '') {
      this.errorToast('加入购物车失败')
      return
    }

    let master = item.master
    if (master == null) {
      return
    }

    if (master.stock <= 0) {
      this.errorToast('商品库存不足', 500)
      return false
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
      store_code: item.store_code || '',
      product: item,
      // variant: master,
      show_name: master.show_name,
      limit_number: master.limit_number,
      product_limit_number: item.limit_number
    }

    if(this.data.cartData != null && this.data.cartData.data != null && this.data.cartData.data['store_' + item.store_code] != null && this.data.cartData.data['store_' + item.store_code].lineItems != null && this.data.cartData.data['store_' + item.store_code].lineItems['variant_' + master.id] != null) {
      let _quantity = this.data.cartData.data['store_' + item.store_code].lineItems['variant_' + master.id].quantity

      // 判断数量是否超过单品购买数量限制
      if (_quantity >= master.limit_number || _quantity >= item.limit_number) {
        this.errorToast('已超过单品数量限制')
        return false
      }

      // 判断是否超过库存
      if ( _quantity >= master.stock ) {
        this.errorToast('库存不足')
        return false
      }
    }

    let cart = cartApi.addCart(lineItem)
    wx.showToast({
      title: '添加成功',
      icon: 'none',
      duration: 1000
    })
    this.setData({ cartData: cart })
  },

  changeOrder: function (e) {
    var orderType = e.currentTarget.dataset.orderType

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

    if(this.data.products.length > 1){
      wx.showLoading({
        title: '加载中...',
      })
      this.setData({
        products:[],
        pageBottom:false,
        clicked:true
      })

      this.getProducts(this.data.category.code, orderType, true)
    }

  },


  onReachBottom: function () {
    this.getProducts(this.data.category.code, this.data.orderType, false)
  },

  // 页数判断
  appendProduct: function (resProducts, categoryId) {
    
    var products = this.data.products || [];

    var currentIndex = products.length
    for(var i in resProducts) {
      var product = resProducts[i]
      if (product == null) { continue }
      let exist_flag = 5//允许重复次数)
      if (resProducts.length < getApp().globalData.perPage) {
        exist_flag = 0
      }
      if (products.length <= 0 || products.filter(item => item.id == product.id).length <= exist_flag) {//判断每一条商品id是否存在
        var dataKey = `products[${currentIndex}]`
        this.setData({ [dataKey]: product })
        currentIndex += 1
      }
    }

    if (resProducts.length < 10) {
      this.setData({ pageBottom: true ,clicked:false})
    } else {
      this.setData({ pageBottom: false ,clicked:false })
    }
  },

})