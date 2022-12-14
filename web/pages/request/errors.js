// web/pages/request/errors.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    errorType: 0,//0:网络错误 1:服务器错误
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    getApp().commonBeforeOnLoad(this)
    console.log(options)
    if(options.error_type != null){
      this.setData({
        errorType: options.error_type
      })
    }
  },

  gotoHome:function(){
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})