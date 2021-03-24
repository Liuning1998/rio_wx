// pages/products/show/index.js
var http = require('../../../../utils/http.js')
var cartApi = require('../../../../utils/cart.js')

var timer1 = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    swiperCurrent: 0,
    currentVariant: null,
    available: true,
    navbarStatus: true,
    navbarActive: 1,
    submitType: null,
    now: Math.floor((new Date).getTime()/1000),
    canBuy: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getProductDetail(options.id)
    // this.getProductDetail(30)

    this.setData({ isIphoneX: getApp().isIphoneX() })
  },

  onShow: function () {
    if (this.data.product != null && this.data.product.id != null) {
      // this.setData({ showSelectContainer: false })
      this.getProductDetail(this.data.product.id)
    }

    // this.loadCartInfo()
    this.setNow(true)
    if (timer1 == null) {
      timer1 = setTimeout( this.setNow, 1000)
    }
  },

  onUnload: function () {
    if (timer1 != null) {
      clearTimeout(timer1)
      timer1 = null
    }
  },

  getProductDetail: function (id) {
    http.get({
      url: "api/try_goods/" + id,
      success: (res) => {
        var _product = res.data.product

        this.setData({ product: _product, canBuy: res.data.can_buy })

        // if (_product.available_on == null || _product.available_on == 0) {
        //   this.setData({ available: false })
        // }
      },
      fail: (res) => {
        if (res.statusCode == '404') {
          this.errorToast('找不到商品')
          setTimeout(wx.navigateBack, 1000)
        } else {
          // wx.navigateBack({
          //   delta: 1
          // })
        }
      }
    })
  },

  changeSwiperCurrent: function (e) {
    this.setData({ swiperCurrent: e.detail.current })
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

  changeNavbar: function () {
    wx.createSelectorQuery().select('.carousels').boundingClientRect(res => {
      if (res != null) {
        if(res.top > 0) {
          this.setData({ navbarStatus: true })
        } else {
          this.setData({ navbarStatus: false })
        }
      }
    }).exec()

    wx.createSelectorQuery().select('.product-info').boundingClientRect(res => {
      if (res != null) {
        if (res.top > 20) {
          this.setData({ navbarActive: 1 })
        } else {
          this.setData({ navbarActive: 2 })
        }
      }
    }).exec()
  },

  confirmOrder: function () {
    // if (this.data.btnSelectState == 'buyNow') {
    //   if(this.data.productType == 1) {
    //     this.buyCard()
    //   } else {
        this.buyNow()
      // }
    // } else if (this.data.btnSelectState == 'addCart') {
    //   this.addCart()
    // }
  },

  buyNow: function () {
    let store_id = this.data.product.store_id || 0
    let lineItem = {
      quantity: this.data.quantity || 1,
      variant_id: this.data.currentVariant.id,
      price: this.data.currentVariant.price,
      available_on: this.data.currentVariant.available_on,
      stock: this.data.currentVariant.stock,
      store_id: store_id,
      product: this.data.product,
      // variant: this.data.currentVariant,
      show_name: this.data.currentVariant.show_name,
      selectStatus: true
    }

    let cart = {
      quantity: this.data.quantity || 1,
      store_id: store_id,
      store_name: this.data.product.store_name,
      lineItems: [lineItem],
      total: Math.round(lineItem.price * lineItem.quantity * 100) / 100.0,
    }
    let url = `/type_product/pages/orders/confirm/index?store_id=${store_id}&buyType=now`
    this.navigateTo(url, {
      cart: cart
    })
  },

  setNow: function (flag) {
    let now = new Date
    now = Math.floor(now.getTime()/1000)
    this.setData({ now: now })

    if (!flag) {
      timer1 = setTimeout(this.setNow, 1000)
    }
  },

  gotoConfirm: function () {
    if (this.data.product == null || this.data.product.activity == null) {
      return false
    }
    
    if (this.data.now > this.data.product.activity.end_at) {
      this.errorToast('该活动已结束')
      return false
    }

    if (!this.data.canBuy) {
      this.errorToast('您已参加该活动')
      return false
    }
    this.navigateTo(`/try_product/pages/orders/confirm/index?id=${this.data.product.id}`, {
      product: this.data.product
    })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})