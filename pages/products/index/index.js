// pages/products/index/index.js
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

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  onPullDownRefresh() {
    // this.refreshData()
    // wx.stopPullDownRefresh()
    this.setData({ showLoading: true })
    this.stopPDRefresh()
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 500)
  },

  onReachBottom: function () {
  },
})