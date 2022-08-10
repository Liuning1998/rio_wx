// pages/account/balance/index.js

var http = require('../../../utils/http.js')

var loading = false;//避免重复加载

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    if(!!options.products){
      var _products = JSON.parse(options.products);
      this.setData({
        products:_products
      })
    }

  },

  onShow: function () {
    
  },

  gotoHome: function () {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})