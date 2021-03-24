// products/pages/today/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    pageNo: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getProducts(options.pageType)

    let titles = {
      'youxuan': '优选商品',
      'today': '今日特惠'
    }

    this.setData({ pageTitle: titles[options.pageType] || '商品列表', pageType: options.pageType })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
  },

  getProducts: function (pageType, pageNo) {
    let url = ''
    if (pageType == "today") {
      url = "api/products/today_recommend"
    }

    if (pageType == 'youxuan') {
      url = "api/products/youxuan"
    }

    if (url.length <= 0) {
      this.setData({ loaded: true })
      return false
    }
    http.get({
      url: url,
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.setData({ products: res.data })
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

    // this.stopPDRefresh()
  },

  onReachBottom: function () {
    this.getProducts(this.data.pageType, this.data.pageNo)
  },

  addCartAndAnimation1: function (e) {
    var item = e.currentTarget.dataset.item
    
    if (item.tags != null && item.tags.indexOf('虚拟卡券') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return false
    }

    if (item.tags != null && item.tags.indexOf('一元购') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return false
    }

    let master = item.master
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
      show_name: master.show_name,
      limit_number: master.limit_number,
      product_limit_number: item.limit_number
    }

    let cart = cartApi.addCart(lineItem)
    this.setData({ cartData: cart })

    var position = {
      right: this.windowRect.width - e.touches[0].clientX,
      bottom: this.windowRect.height - e.touches[0].clientY
    }
    let item_key = 'item_' + (new Date).getTime()
    let key = `cartAnimations.${item_key}.style`
    this.setData({
      [key]: `bottom: ${position.bottom}px; right: ${position.right}px; display: block; opacity: 1;`
    })

    setTimeout( res => {
      let _key = `cartAnimations.${item_key}.class`
      this.setData({
        [_key]: "hidden"
      })
    }, 400)

    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'linear',
    })

    animation.bottom((position.bottom + 25)/2).right((position.right+35)/2).step()
    animation.bottom(25).right(35).step()

    animation.opacity(0).step()

    key = `cartAnimations.${item_key}.animation`
    this.setData({
      [key]: animation.export(),
    })
  }
})