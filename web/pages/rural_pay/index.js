// web/pages/rural_pay/index.js
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

    if(!!options.payDataStr){
      var params = JSON.parse(decodeURIComponent(options.payDataStr))
      this.wxPay(params)
    }
    
  },

  wxPay: function (pay_params) {
    // console.log('开始微信支付------------------------------------')
    // console.log(pay_params.timeStamp)
    // console.log(pay_params.nonceStr)
    // console.log(pay_params.package)
    // console.log(pay_params.signType)
    // console.log(pay_params.paySign)

    wx.requestPayment({
      'timeStamp': pay_params.timeStamp,
      'nonceStr': pay_params.nonceStr,
      'package': pay_params.package,
      'signType': pay_params.signType,
      'paySign': pay_params.paySign,
      'success': (res) => {
        // console.log(res)
        var url = '/web/pages/common/index?url='+getApp().globalData.webviewUrl.url
        this.redirectTo(url)
      },
      'fail': (res) => {
        // console.log(res)
        var url = '/web/pages/common/index?url='+getApp().globalData.webviewUrl.url
        this.redirectTo(url)
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})