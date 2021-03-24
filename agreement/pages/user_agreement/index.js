// agreement/pages/user_agreement/index.js
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

  gotoYinsizhengce: function () {
    console.log('ssss')
    this.navigateTo("/agreement/pages/yinsizhengce/index")
  },

})