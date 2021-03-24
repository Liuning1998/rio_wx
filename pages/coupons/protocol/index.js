// pages/coupons/protocol/index.js

var jdData = require('./jd_data.js').data
var didiData = require('./didi_data.js').data
var duodianData = require('./duodian_data.js').data
var duodianData = require('./duodian_data.js').data
var duodiantongyongData = require('./duodiantongyong_data.js').data
var haoxiuyangData = require('./haoxiuyang_data.js').data

var titleMap = {
  jd: '京东E卡购卡章程',
  didi: '滴滴出行卡章程',
  duodian: '多点电子券',
  duodiantongyong: '多点通用型电子券',
  haoxiuyang: '好修养电子券'
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    protocolData: {},
    title: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    if(titleMap[options.protocol_type] != null) {
      this.setData({ title: titleMap[options.protocol_type] })
    }

    if (options.protocol_type == 'jd') {
      this.setData({ protocolData: jdData })
    }

    if (options.protocol_type == 'didi') {
      this.setData({ protocolData: didiData })
    }

    if (options.protocol_type == 'duodian') {
      this.setData({ protocolData: duodianData })
    }

    if (options.protocol_type == 'duodiantongyong') {
      this.setData({ protocolData: duodiantongyongData })
    }

    if (options.protocol_type == 'haoxiuyang') {
      this.setData({ protocolData: haoxiuyangData })
    }
  },

  goback: function () {
    wx.navigateBack({})
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})