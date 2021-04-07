// pages/coupons/list/index.js

var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    coupons: [],
    pageNo: 1,
    coupon_type: null,
    title: '卡券包',
    store_id: null,
    couponEmpty: false,
    showInfo: {},
    copyLayerStatus: false,
    deleteButtonShowId: -1,
    deleteButton: [{
      type: 'warn',
      text: '删除',
      extClass: 'test',
      // src: '/page/weui/cell/icon_del.svg', // icon的路径
      src: '/images/delete_icon.png'
    }],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
  },

  onShow: function () {

  },

  fetchCoupons: function (store_id, page) {
    
  },

  
  onReachBottom: function () {
  },

  gotoHome: function () {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

})