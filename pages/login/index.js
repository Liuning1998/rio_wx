var scoreApi = require("../../utils/session.js")
var storage = require('../../utils/storage.js')

// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    popAuth: false,
    back: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.back) {
      this.setData({ back: options.back })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // var datas = {}
    // scoreApi.checkScoreLogin(datas)
    //   .then((datas) => {
    //     return (new Promise((resolve) => {
    //       resolve(datas)
    //     }))
    //   }, scoreApi.scoreLogin)
    //   .then(
    //     (res) => {
    //     var authenticated = storage.getSync('authenticated')
    //     if (authenticated == "authenticated") {
    //       wx.reLaunch({
    //         url: '/pages/index/index',
    //       })
    //       return
    //     }
    //     wx.getSetting({
    //       success: res => {
    //         if (res.authSetting['scope.userInfo']) {
    //           wx.reLaunch({
    //             url: '/pages/index/index',
    //           })
    //         } else {
    //           this.setData({
    //             popAuth: true
    //           })
    //         }
    //       }
    //     })
    //     },
    //     (res) => {
    //       wx.reLaunch({
    //         url: '/pages/error/index',
    //       })
    //     }
    //   )

  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function() {

  // }
})