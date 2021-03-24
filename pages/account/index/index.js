// pages/account/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    authLoginStatus: false,
    scollStatus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
  },

  onShow: function () {
    this.checkAuthLoginStatus()
    this.resetUerInfo()
  },

  login: function () {
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },

  gotoOrders: function (status) {
    wx.switchTab({
      url: '/pages/orders/index/index',
    })
  },

  gotoAddresses: function (status) {
    wx.reLaunch({
      url: '/pages/addresses/index/index',
    })
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    wx.createSelectorQuery().select('.page-header').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 0) {
          if (!this.data.scollStatus) {
            this.setData({ 
              scollStatus: true
            })
          }
        } else {
          this.setData({ 
            scollStatus: false
          })
        }
      }
    }).exec()
  },


  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})