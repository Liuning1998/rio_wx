// pages/account/index/index.js
var http = require('../../../utils/http.js')
var store = require('../../../utils/storage')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    authLoginStatus: false,
    scollStatus: false,
    // userBalance: 0,
    orderQuantity: {},
    //用户头像
    userAvatar: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
  },


  //询问是否弹窗订阅
  subscribeMessage:function(){
    //判断是否已经订阅
    var _this = this
    wx.getSetting({
      withSubscriptions: true,
      success(res) {
        console.log(res)
        var itemSettings = res.subscriptionsSetting.itemSettings;
        if (itemSettings) {
          if (itemSettings['j3FKFyq9kJnybm8yoN2em_0kD96zc2sqAhyOmr7mbmo']=='accept' && itemSettings['hxlDiBwF6YabpwEPm4L4vrutDMNEG1wbt8yzxDEBB6I']=='accept') {
            console.log('已订阅')
            _this.setData({
              isSubscribe: true
            });
          }else{
            console.log('未订阅')
            _this.subscribe()
          }
        }else{
          console.log('未订阅')
          _this.subscribe()
        }
      }
    })

  },

  // 订阅消息
  subscribe:function(){
    var _this = this;
    var muId = ['j3FKFyq9kJnybm8yoN2em_0kD96zc2sqAhyOmr7mbmo','hxlDiBwF6YabpwEPm4L4vrutDMNEG1wbt8yzxDEBB6I']
    return new Promise((resolve,reject)=>{
      wx.requestSubscribeMessage({
        tmplIds: muId,
        success (res) { 
          console.log('成功',res)
          resolve(res)
          // if(res.muId[0] == 'reject' || res.muId[1] == 'reject'){
          //   console.log('用户拒绝订阅消息')
          // }else{
          //   console.log(res.muId[0])
          // }
        },
        fail(res){
          console.log('失败',res)
          resolve(res)
        },
        complete(res){
          console.log('完成',res)
          resolve(res)
        }
      })
    }) 

  },

  // 跳转优惠券
  gotoCoupon:function(){
    this.subscribe().then(res =>{
      this.navigateTo('/pages/coupons/list/index')
    })
  },
  // 跳转领券中心
  gotoDashboard:function(){
    this.subscribe().then(res =>{
      this.navigateTo('/pages/coupons/dashboard/index')
    })
  },


  onShow: function () {
    this.checkAuthLoginStatus()
    // this.resetUerInfo()
    this.getUserInfo()
    this.getOrderQauntity()
    
    // 更新头像
    this.setData({
      userAvatar: store.getSync('userAvatar') ||'/images/default_avatar_003.png'
    })
  },

  login: function () {
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },

  gotoOrders: function (status) {
    // this.subscribe().then(res =>{
      wx.switchTab({
        url: '/pages/orders/index/index',
      })
    // })
  },

  gotoAddresses: function (status) {
    wx.reLaunch({
      url: '/pages/addresses/index/index',
    })
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    wx.createSelectorQuery().select('.page-header').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 0) {
          if (!this.data.scollStatus) {
            this.setData({ 
              scollStatus: true
            })
          }
        } else {
          this.setData({ 
            scollStatus: false
          })
        }
      }
    }).exec()
  },

  getUserInfo: function () {
    http.post({
      url: 'api/users/show_user',
      success: res => {
        console.log(res)
        this.setData({ userInfo: res.data })
      }
    })
  },

  getOrderQauntity: function () {
    http.get({
      url: 'api/orders/padding_orders_count',
      success: res => {
        this.setData({ orderQuantity: res.data })
      }
    })
  },

  gotoPhone: function () {
    wx.navigateTo({
      url: '/pages/account/phone/validate',
    })
  },

  gotoOrder: function (e) {
    let status = e.currentTarget.dataset.state
    console.log('ass')
    if(status == 'all'){
      // this.subscribe().then(res =>{
        wx.reLaunch({
          url: `/pages/orders/index/index?state=${status}`,
        })
      // })
    }else{
      wx.reLaunch({
        url: `/pages/orders/index/index?state=${status}`,
      })
    }

  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})