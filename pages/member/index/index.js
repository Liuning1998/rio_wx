// pages/member/index/index.js
var http = require('../../../utils/http.js')

const levelMap = {
  V1:{level:1,total:0,discount:9.8,next:'V2'},
  V2:{level:2,total:500,discount:9.7,next:'V3'},
  V3:{level:3,total:1000,discount:9.6,next:'V4'},
  V4:{level:4,total:2000,discount:9.5,next:''}
}

var navswitchHeight = 0;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageTitle:'我的会员权益',
    statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
    level:levelMap,
    levelLength:Object.keys(levelMap).length,
    navSwitch:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getMemberInfo();
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  onReady: function(){

  },

  getMemberInfo:function(){
    http.get({
      url: 'api/vips',
      data:{},
      success: res => {
        // console.log(res.data)
        if(res.data != null){
          // res.data.payment_total = 600
          this.setData({
            vips:res.data
          })
          this.getNavSwitchHeight()
        }
      },
      fail: res=>{
        this.errorToast('加载失败！')
      }
    })
  },

  // 获取需要切换nav颜色的高度
  getNavSwitchHeight:function(){
    var _this = this;
    wx.createSelectorQuery().select('#navswitch').boundingClientRect(function (rect) {
      _this.navswitchHeight = rect.top - 88
    }).exec()
  },

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },

  onPageScroll: function(e) {
    if(e.scrollTop > this.navswitchHeight){
      if(!this.data.navSwitch){
        this.setData({
          navSwitch:true
        })
      }
    }else{
      if(this.data.navSwitch){
        this.setData({
          navSwitch:false
        })
      }
    }
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