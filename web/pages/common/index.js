// web/pages/common/index.js
var storage = require('../../../utils/storage')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    webUrl: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    if (options.url == null || options.url.length <= 0) {
      wx.navigateBack({})
    }
    // console.log(options)

    getApp().globalData.webviewUrl = options //跳转rural_pay页面必须设置

    var $this = this;
    var url = decodeURIComponent(options.url)
    var session = storage.getSyncWithExpire('session');
    
    if(!!session){
      if(url.indexOf('?') >= 0) {
        url = url + `&openid=${session.openid}&appid=wx45ddcf8d9ade8e9f`
      } else {
        url = url + `?openid=${session.openid}&appid=wx45ddcf8d9ade8e9f`
      }
      
      $this.setData({
        webUrl: url,
      })
    }else{
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
    
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