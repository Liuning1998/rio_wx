// try_product/pages/products/index/index.js
var http = require('../../../../utils/http.js')

var _images = [
  "https://score-admin-file.ixiaoliu.com/brcb/ij4slyx8b5dy2l4ofzzw5jivjglw",
  "https://score-admin-file.ixiaoliu.com/brcb/1j8hhookbm8afrdvods8nfwi8qb5"
]

var timer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    images: _images,
    now: Math.floor((new Date).getTime()/1000)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getProducts()
  },

  onShow: function () {
    if (timer == null) {
      timer = setTimeout( this.setNow, 1000)
    }
  },

  onUnload: function () {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },
  
  getProducts: function () {
    var pageNo = Math.ceil((this.data.products.length+1)/getApp().globalData.perPage)
    http.get({
      url: 'api/try_goods',
      data: {
        page: pageNo
      },
      success: res => {
        this.appendProducts(res.data)
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

    this.setData({ loaded: true })

    // this.stopPDRefresh()
  },

  gotoProduct: function (e) {
    let item = e.currentTarget.dataset.item

    if (this.data.now > item.activity.end_at) {
      this.errorToast('该活动已结束')
      return false
    }

    this.navigateTo('/try_product/pages/products/show/index?id=' + item.id)
  },

  setNow: function () {
    let now = new Date
    now = Math.floor(now.getTime()/1000)
    this.setData({ now: now })

    timer = setTimeout(this.setNow, 1000)
  },

  onReachBottom: function () {
    this.getProducts()
  },

})