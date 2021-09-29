// pages/coupons/list/index.js

var http = require('../../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coupons: [],
    pageNo: 1,
    nowDate:Date.parse(new Date()) / 1000,
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
    noData:false,
    loading:false,
    loadErr:false,
    couponsList:[],//优惠券列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    // 获取优惠券
    this.getCoupons(1)
    
  },

  onShow: function () {

  },

  fetchCoupons: function (store_id, page) {
    
  },

  getCoupons:function(page){
    var couponsList = this.data.couponsList;
    var couponsListEl = this.data.couponsList.length;
    this.setData({
      loading:true
    })
    http.get({
      url: 'api/promotions',
      data:{
        page:page
      },
      success: res => {
        console.log(res.data.data)
        if(res.data.data.length != 0){
            res.data.data.forEach((ele,i) => {
              ele.detailShow = false
              ele.el = couponsListEl + i
              if(ele.description != null){
                ele.description = ele.description.split('\\n ')
              }else if(ele.description == null){
                ele.description = ['无']
              }
              couponsList.push(ele)
            })

            if(res.data.data.length < 10){
              this.setData({noData:true})
            }

            this.setData({
              couponsList:couponsList,
              couponsCount:res.data.count,
              loading:false,
              loadErr:false,
              noData:true,
              pageNo:page
            })
            
        }else{
          console.log(page)
          this.setData({
            pageNo:page-1,
            loadErr:false,
            loading:false,
          })
        }
      },
      fail: res=>{
        console.log(res);
        this.setData({
          loading:false,
          loadErr:true
        })
      }
    })
  },

  // 下拉
  down:function(e){
    var el = e.currentTarget.dataset.info.el;
    var key = `couponsList[${el}].detailShow`;
    this.setData({
      [key]:!this.data.couponsList[el].detailShow
    })
  },

  // 上拉加载
  upLoad:function(){
    console.log(this.data.isTap)
    var page = this.data.pageNo;
    var allPage;
    if(this.data.couponsCount / 10 < 1){
      allPage = 1
    }else{
      allPage = Math.ceil(this.data.couponsCount/10.0)
      console.log(this.data.couponsCount,allPage)
    }
    
    if(this.data.loading == false && page < allPage){
      console.log(allPage,'加载下一页')
      this.getCoupons(page+1)
    }else{
      console.log('不用加载下一页')
    }
  },

  onReachBottom: function () {
  },

  gotoHome: function () {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

})