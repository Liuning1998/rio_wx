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
    
    // 通过页面跳转到支付
    // var url = global.apiServer + 'h5/brcb_pay/pay?access_token=' + global.session.access_token
    // url = url + '&order_number=' + options.id
    // for (var key in _params) {
    //   url = url + '&' + key + '=' + _params[key]
    // }
    
    // 直接渲染支付页面
    var url =  global.brcbPayBaseUrl + "?"
    url = url + "transName=" + _params.transName
    url = url + "&Plain=" + _params.Plain
    url = url + "&Signature=" + _params.Signature

    this.setData({ webUrl: url })
  },

  

  postMessage: function (e) {
    console.log('------------------11')
    console.log(e)
    
  }
})