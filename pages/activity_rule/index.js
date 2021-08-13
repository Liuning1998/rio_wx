// pages/activity_rule/index.js
var http = require('../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    banner: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getBanner()
  },

  getBanner: function () {
    http.get({
      url: 'api/ads/activity_rule',
      success: res => {
        if (res.data.banner != null) {
          this.setData({ banner: res.data.banner })
        }
      }
    })
  },

  gotoHome: function () {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  goBack: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})