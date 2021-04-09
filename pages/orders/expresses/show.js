// pages/orders/expresses/show.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    expressInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let number = options.id
    // let number = "52458266670949159508"
    // let number = "547950549556"

    this.getExpress(number)
    this.setData({ number: number, order_number: options.order_number })
  },

  getExpress: function (number) {
    http.get({
      url: `/api/expresses/${number}/search_express`,
      data: { order_number: order_number },
      success: res => {
        if (res.statusCode == 200 && res.data != null) {
          this.setData({ expressInfo: res.data })
          console.log(res.data)
        }
      },
      fail: res => {

      }
    })
  }

})