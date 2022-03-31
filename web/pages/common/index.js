// web/pages/common/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    webUrl: '',
    showWebView:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    if (options.url == null && options.url.length <= 0) {
      wx.navigateBack({})
    }
    var $this = this;
    var url = decodeURIComponent(options.url)
    $this.setData({ webUrl: url })
    
    wx.showModal({
      title: '提示',
      content: '即将打开北京农商银行“凤凰乡村游”商城',
      confirmColor: '#F64C47',
      success (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          $this.setData({
            showWebView: true
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
          wx.navigateBack({})
        }
      }
    })
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})