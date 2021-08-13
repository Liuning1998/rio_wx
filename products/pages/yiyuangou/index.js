// products/pages/yiyuangou/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    pageNo: 1,
    loaded: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let item_id = options.item_id
    // let item_id = 7
    
    getApp().commonBeforeOnLoad(this)
    this.getProducts(item_id)
  },

  getProducts: function (special_area_id, pageNo) {
    http.get({
      url: `api/special_areas/${special_area_id}/products`,
      data: {
        page: pageNo || this.data.pageNo,
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          // this.setData({ products: res.data })
          this.appendProducts(res.data)
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

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

})