// agreement/pages/yinsizhengce/index.js
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
  },

  goback: function() {
    wx.navigateBack({})
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})