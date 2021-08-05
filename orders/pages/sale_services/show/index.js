// orders/pages/sale_services/show/index.js
var http = require('../../../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    saleService: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    var id = options.id
    // var id = 12

    this.fetch_detail(12)
  },

  fetch_detail: function (id) {
    http.get({
      url: `/api/sale_order_services/${id}`,
      success: res => {
        this.setData({saleService: res.data.result})
      },
      fail: res => {

      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})