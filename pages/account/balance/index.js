// pages/account/balance/index.js

var http = require('../../../utils/http.js')

var loading = false;//避免重复加载

Page({

  /**
   * 页面的初始数据
   */
  data: {
    lists:[],
    listCount:0,
    emptyStatus:false,
    navStyle:{
      navbarStyle: 'custom',
      imgSrc: 'https://jhqli.oss-cn-beijing.aliyuncs.com/rio_wxs/images/order_detailbg_01.png'
    },
    screenSticky: false,
    skityHeight:null,
    time_type:null,//时间筛选
    trade_type: null,//类型筛选
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    var balance = options.balance;
    if(!balance){
      this.getBalance()
    }else{
      this.setData({
        balance:balance
      })
    }

    this.getBalanceInfo()
  },

  onShow: function () {
    if(!this.data.skityHeight){
      this.getSkityHeight();
    }
  },

  //获取余额
  getBalance: function () {
    http.get({
      url: 'api/accounts/fetch_account_balance',
      success: res => {
        this.setData({ balance: res.data.balance })
      }
    })
  },

  // 获取余额列表
  getBalanceInfo:function() {
    loading = true
    var params = this.countParams()
    http.get({
      url: "api/accounts/balance_info",
      data:params,
      success: res => {
        if(!!res.data){
          loading = false
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
    var _time_type = this.data.time_type;
    var _trade_type = this.data.trade_type;

    params.page = Math.ceil(this.data.lists.length / getApp().globalData.perPage) + 1

    if(_time_type != null){
      params.time_type = _time_type
    }

    if(_trade_type != null){
      params.trade_type = _trade_type
    }

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

  // 时间筛选
  changeTime: function(e){
    var type = e.currentTarget.dataset.type;
    this.setData({
      time_type:type,
      lists:[],
      finished:false
    })
    this.getBalanceInfo()
    this.screenTimeClose()
  },

  // 类型筛选
  changeType: function(e){
    var type = e.currentTarget.dataset.type;
    this.setData({
      trade_type:type,
      lists:[],
      finished:false
    })
    this.getBalanceInfo()
    this.screenTypeClose()
  },

  reachBottom: function() {
    if(!this.data.finished && !loading){
      this.getBalanceInfo()
    }
  },

  scrollEvent:function(e){
    var distance = e.detail.scrollTop;
    var skityHeight = this.data.skityHeight;

    if(skityHeight != null && distance > skityHeight){
      this.setData({
        screenSticky:true
      })
    }else{
      this.setData({
        screenSticky:false
      })
    }
  },

  getSkityHeight:function(){
    var that = this;
    var query = wx.createSelectorQuery()
    query.select('.screen').boundingClientRect(function (res) {
      that.setData({
        skityHeight: res.top - res.height
      })
    }).exec()
  },

  // 时间筛选弹窗
  screenTimeOpen: function(){
    this.setData({
      timeShow: true
    })
  },
  
  // 时间筛选弹窗
  screenTimeClose: function(){
    this.setData({
      timeShow: false
    })
  },

  // 交易类型筛选弹窗
  screenTypeOpen: function(){
    this.setData({
      typeShow: true
    })
  },
  
  // 交易类型筛选弹窗
  screenTypeClose: function(){
    this.setData({
      typeShow: false
    })
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