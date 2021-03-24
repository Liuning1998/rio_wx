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
    loaded: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    var category
    if(options.pageType == 'category') {
      if (this.params.category == null) {
        category = {
          id: options.category_id,
          name: options.category_name
        }
      } else {
        category = this.params.category
      } 
    }

    var pageTitle = '商品列表'
    if(category != null && category.name != null) {
      pageTitle = category.name
    }

    this.setData({ category: category, special_area_id: options.special_area_id, pageTitle: pageTitle })
    this.getProducts(category.id, 1, null)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
  },

  getProducts: function (category_id, pageNo, orderType, refresh) {
    let _data = {
      category_id: category_id,
      page: pageNo || 1
    }

    if (orderType != null) {
      _data.order = orderType
    }

    http.get({
      url: `api/special_areas/${this.data.special_area_id}/category_products`,
      data: _data,
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          if (refresh) {
            let pageNo = 1
            if (res.data.length >= 10) { pageNo = 2 }
            this.setData({ products: res.data, loaded: true, pageNo: pageNo })
          } else {
            this.appendProducts(res.data)
          }
        }
      }
    })
  },

  appendProducts: function (data) {
    let products = this.data.products
    let offset = products.length

    data.forEach(item => {
      if (products.filter(i => i.id == item.id).length <= 0) {
        products.push(item)
        let key = `products.[${offset}]`
        this.setData({ [key]: item })
        offset += 1
      }
    })

    if (data.length >= getApp().globalData.perPage) {
      this.setData({ pageNo: this.data.pageNo + 1 })
    }

    this.setData({ loaded: true })

    // this.stopPDRefresh()
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
      orderType: orderType
    })

    this.getProducts(this.data.category.id, 1, orderType, true)
  },

  onReachBottom: function () {
    this.getProducts(this.data.category.id, this.data.pageNo, this.data.orderType)
  },
})