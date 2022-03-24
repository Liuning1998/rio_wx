// pages/account/balance/index.js

var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    lists:[],
    listCount:0,
    emptyStatus:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getBalanceInfo()
  },

  onShow: function () {
  },

  // 获取余额详情
  getBalanceInfo:function() {
    var params = this.countParams()
    http.get({
      url: "api/accounts/balance_info",
      data:params,
      success: res => {
        if(!!res.data){
          this.setData({
            listCount:res.data.count || null,
          })
          this.appendOrders(params.page,res.data.data)
        }
      }
    })
  },

  countParams: function(count) {
    var params = {}

    params.page = Math.ceil(this.data.lists.length / getApp().globalData.perPage) + 1

    return params
  },
  
  appendOrders: function (page,array) {
    let offset = this.data.lists.length;
    for(let i=0; i < array.length; i++) {
      let item = array[i]
      let key = `lists[${offset}]`
      this.setData({ [key]: item })
      offset = offset + 1
    }
    var allPage = Math.ceil(this.data.listCount / getApp().globalData.perPage)

    if(page >= allPage){
      this.setData({
        finished: true
      })
    }
  },

  onReachBottom: function() {
    if(!this.data.finished){
      this.getBalanceInfo()
    }
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