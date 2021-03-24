// pages/contact/index.js
var http = require('../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    email: 'contact@ixiaoliu.com',
    adImages: [],
    swiperCurrent: 0,
    nomal: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getAds()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  getAds: function() {
    http.get({
      url: '/api/ads',
      data: {
        q: {
          tags_name_eq: '联系我们'
        }
      },
      success: res => {
        var images = []
        var data = res.data
        if(data.length > 0) {
          for(let i in data) {
            for(let j in data[i].images) {
              images.push(data[i].images[j])
            }
          }
          this.setData({adImages: images})
        }
      }
    })
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

})