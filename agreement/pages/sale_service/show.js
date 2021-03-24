// agreement/pages/sale_service/show.js

var titleMap = {
  'huawei': '华为售后协议',
  'shounong': '首农/扶贫售后协议'
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageTitle: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.setData({
      pageTitle: titleMap[options.store] || '售后协议',
      pageType: options.store
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})