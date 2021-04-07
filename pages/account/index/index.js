// pages/account/index/index.js
var http = require('../../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    authLoginStatus: false,
    scollStatus: false,
    // userBalance: 0,
    orderQuantity: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
  },

  onShow: function () {
    this.checkAuthLoginStatus()
    // this.resetUerInfo()
    this.getUserInfo()
    this.getOrderQauntity()
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

  getUserInfo: function () {
    http.post({
      url: 'api/users/show_user',
      success: res => {
        console.log(res)
        this.setData({ userInfo: res.data })
      }
    })
  },

  getOrderQauntity: function () {
    http.get({
      url: 'api/orders/padding_orders_count',
      success: res => {
        this.setData({ orderQuantity: res.data })
      }
    })
  },

  gotoPhone: function () {
    wx.navigateTo({
      url: '/pages/account/phone/validate',
    })
  },

  gotoOrder: function (e) {
    let status = e.currentTarget.dataset.state
    console.log('ass')
    wx.reLaunch({
      url: `/pages/orders/index/index?state=${status}`,
    })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})