// web/pages/brcb_pay/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    var global = getApp().globalData
    var _params = this.params
    var url = global.apiServer + 'h5/brcb_pay/pay?access_token=' + global.session.access_token
    url = url + '&order_number=' + options.id
    for (var key in _params) {
      url = url + '&' + key + '=' + _params[key]
    }

    // url = 'https://rio-dev.jhqli.com/h5/brcb_pay/pay_notify?order_number=J5565870533464814392'

    this.setData({ webUrl: url })
  },
})