// pages/coupons/dashboard/index.js

var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponsList:[],
    bannerArr:[],
    noData:false,
    loading:false,
    loadErr:false,
    successPopup:false,
    errorMsg:'领取失败，请稍后再试!',
    errorShow:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    // 加载banner
    this.getBanner()
  
    // 加载数据
    this.getData(1)

  },

  onShow: function () {
  },

  gotoHome: function () {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },


  // 获取数据 getData
  getData:function(page){
    var couponsList = this.data.couponsList;
    this.setData({
      loading:true
    })
    http.get({
      url: 'api/promotions/receive_promotion_index',
      data:{
        page:page
      },
      success: res => {
        if(res.data.data.length != 0 && res.data.data != null){
          // couponsList = [...couponsList,...res.data.data]
            res.data.data.forEach((ele)=>{
              if(ele){
                couponsList.push(ele)
              }
            })

          if(res.data.data.length < 10){
            this.setData({noData:true})
          }

          this.setData({
            couponsList:couponsList,
            couponsCount:res.data.count || null,//总数
            loading:false,
            loadErr:false,
            pageNo:page
          })
            
        }else{
          this.setData({
            pageNo:page-1,
            loadErr:false,
            loading:false,
          })
        }
      },
      fail: res=>{
        // console.log(res);
        this.setData({
          pageNo:page-1,
          loadErr:true,
          loading:false,
        })
      }
    })
  },
  // 微信客服
  toCS:function(){
    wx.openCustomerServiceChat({
      extInfo: {url: 'https://work.weixin.qq.com/kfid/kfc00a22d27e10abbaf'},
      corpId: 'ww8fb0efed659c7362',
      success(res) {
        // console.log(res)
      },
      fail(res){
        // console.log(res)
      }
    })
  },

  // 上拉加载
  upLoad:function(){
    // console.log('触发上拉加载')
    var page = this.data.pageNo;
    var allPage;
    if(this.data.couponsCount / 10 < 1){
      allPage = 1
    }else{
      allPage = Math.ceil(this.data.couponsCount/10.0)
      // console.log(this.data.couponsCount,allPage)
    }
    
    if(this.data.loading == false && page < allPage){
      // console.log(allPage,'加载下一页')
      this.getData(page+1)
    }else{
      // console.log('不用加载下一页')
    }
  },
  
  // 查看领取优惠券（跳转优惠券页面）
  toCoupons:function(){
    this.navigateTo('/pages/coupons/list/index')
  },

  // 领取优惠券
  receiveCoupons:function(e){
    var promotion_id = e.target.dataset.item.id;
    var el = e.target.dataset.index;
    var key = `couponsList[${el}].show_status`;
    http.post({
      url: 'api/promotions/receive_promotion',
      data:{
        promotion_id:promotion_id
      },
      success: res => {
        // console.log(res)
        if(res.data.status =='ok'){
          this.setData({
            successPopup:true,
            [key]:false
          })

        }
      },
      fail: res=>{
        // console.log(res);

        var msg = this.data.errorMap;
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t;
          this.setData({
            errorMsg:msg,
            errorShow:true
          })
        }
        
      }
    })
  },
  
  getBanner:function(){
    http.get({
      url: '/api/ads',
      data: {
        q: {
          tags_name_eq: '优惠券'
        }
      },
      success: res => {
        // console.log(res)
        if(res.data[0]){
          this.setData({
            bannerArr:res.data[0].images
          })
        }

      }
    })
  },

  // 关闭成功弹窗
  closePopup:function(){
    this.setData({
      successPopup:false
    })
  },
  // 关闭失败弹窗
  closeErrorPopup:function(){
    this.setData({
      errorShow:false
    })
  },
  

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})