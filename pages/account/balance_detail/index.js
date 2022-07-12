// pages/account/balance/index.js

var http = require('../../../utils/http.js')

var loading = false;//避免重复加载

Page({

  /**
   * 页面的初始数据
   */
  data: {
    navStyle:{
      navbarStyle: 'custom',
      imgSrc: 'https://jhqli.oss-cn-beijing.aliyuncs.com/rio_wxs/images/order_detailbg_01.png'
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    var _id = options.id;
    var _sources = options.sources
    if(!!_id && !!_sources){
      this.setData({
        id:_id,
        sources: _sources
      })
      this.getEntryDetail(_id)
    }

  },

  onShow: function () {
    
  },

  //获取余额指出详情
  getEntryDetail: function (id) {
    let params = {};
    if(!!id){
      params.id = id
    }else{
      params.id = this.data.id
    }
    http.get({
      url: '/api/accounts/balance_detail',
      data: params,
      success: res => {
        if(res.data != null && Object.keys(res.data).length > 0){
          this.setData({ entryData: res.data })
        }else{
          this.errorToast('加载错误');
          setTimeout(()=>{
            wx.navigateBack()
          },1000)
        }
      }
    })
  },




  gotoHome: function () {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  goProductDetail:function(e){
    var products = e.currentTarget.dataset.products;
    // if(!!products){
      this.navigateTo(`/pages/account/balance_products/index?products=${JSON.stringify(products)}`)
    // }
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})