// pages/coupons/dashboard/index.js

var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    coupons_group: [],
    cards_group: [],
    tab_type: 1,
    brcbEmpty: false,
    cardEmpty: false,
    couponEmpty: false,
    showJingdongNotice: false,
    jingdongNoticeText: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    
    this.getJingdongNotice()
  },

  onShow: function () {
    this.getApiData()
  },

  getApiData: function () {
    http.get({
      url: 'api/coupons/dashboard',
      success: res => {
        if(res.data.status == 'ok') {
          let card_empty = false
          let coupon_empty = false

          if (res.data.cards_group == null || res.data.cards_group.length <= 0) {
            card_empty = true
          }

          if (res.data.coupons_group == null || res.data.coupons_group.length <= 0) {
           coupon_empty = true
          }
          this.setData({
            coupons_group: res.data.coupons_group,
            cards_group: res.data.cards_group,
            couponEmpty: coupon_empty,
            cardEmpty: card_empty
          })
        }
      }
    })
  },

  activeCoupon: function () {
    this.setData({ tab_type: 1 })
  },

  activeCard: function () {
    this.setData({ tab_type: 2 })
  },

  gotoList: function (e) {
    let item = e.currentTarget.dataset.item
    console.log(item)
    this.navigateTo(
      '/pages/coupons/list/index',
      {
        store_id: item.store_id,
        title: item.name,
        // coupon_type: this.data.tab_type
      }
    )
  },

  gotoHome: function () {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },


  closeJingdongNotice: function () {
    this.setData({ showJingdongNotice: false })
  },

  getJingdongNotice: function () {
    http.get({
      url: 'api/ads/coupon_desc',
      success: res => {
        if (res.data.status == 'ok' && res.data.content != null && res.data.content.length > 0) {
          this.setData({ showJingdongNotice: true, jingdongNoticeText: res.data.content })
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})