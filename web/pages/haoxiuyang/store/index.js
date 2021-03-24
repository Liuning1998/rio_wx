// web/pages/haoxiuyang/store/index.js
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

  goback: function () {
    wx.navigateBack({})
  },

  callPhone: function (e) {
    var item = e.currentTarget.dataset.item
    console.log(item)
    wx.makePhoneCall({
      phoneNumber: item
    })
  },

})