// pages/coupons/coupons_popup/index.js

var http = require('../../../utils/http.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    couponsList:{
      type:Array,
      value:[]
    },
    loadErr:{
      type:Boolean,
      value:false
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShow:false
  },

  /**
   * 页面生命周期
   */
  pageLifetimes: {
    show: function() {
      // 页面被展示
    },
    hide: function() {
      // 页面被隐藏
    },
    resize: function(size) {
      // 页面尺寸变化
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    // 关闭弹窗
    closePopup:function(){
      this.setData({
        isShow:false
      })
    },
    openPopup:function(){
      this.setData({
        isShow:true
      })
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
          if(res.data.status =='ok'){
            console.log([key])
            this.setData({
              successPopup:true,
              [key]:false
            })
            console.log([key])
            wx.showToast({
              title: '领取成功',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: res=>{
          var msg =  '领取失败';
          if (getApp().globalData.errorMap[res.data.code] != null) {
            msg = getApp().globalData.errorMap[res.data.code].msg_t;
            wx.showToast({
              title: msg,
              icon: 'none',
              duration: 2000
            })
          }
          
        }
      })
    },
  
  }
})
