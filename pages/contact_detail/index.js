// pages/contact/index.js
var http = require('../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    email: 'contact@jhqli.com',
    adImages: [],
    swiperCurrent: 0,
    nomal: true,
    currentTab: 0,
    qa:{
      "eq_1":{
        question:'“平台余额”从哪里查看？',
        answer:['点击：<span class="dark">我的</span>—<span class="dark">平台余额</span>。']
      },
      "eq_2":{
        question:'“平台余额”如何使用？是否有期限和使用要求？',
        answer:['<span class="dark">“平台余额”</span>会在您下单时系统优先自动扣除；<span class="dark">“平台余额”</span>永久有效，没有使用期限、使用要求。']
      },
      "eq_3":{
        question:'能否修改支付密码？',
        answer:['养老助残卡的支付密码是您的银行卡支付密码；如需修改，请联系北京农商银行。']
      },
      "eq_4":{
        question:'如何查询养老助残卡的余额及使用情况？',
        answer:['请联系北京农商银行线下银行网点，或拨打北京农商银行客服热线96198查询。']
      },
      "eq_5":{
        question:'手机号与银行预留不一致？',
        answer:['请联系北京农商银行客服96198查询是否一致；如需修改银行预留手机号，需要去北京农商银行线下网点办理。']
      },
      "eq_6":{
        question:'如何提交售后申请？',
        answer:['商品拆封后非质量问题不支持7天无理由退换货。如有售后/质量问题，可以从订单中选择需要申请售后的订单，点击<span class="dark">“申请售后”</span>，勾选该订单需要售后的商品，确认后在售后页面填写相应信息即可。']
      },
      "eq_7":{
        question:'退货/退款的订单金额何时到帐？',
        answer:['审核人员审核通过后24小时内，退到您的账户或您的<span class="dark">平台余额</span>。']
      },
      "eq_8":{
        question:'订单如何取消？',
        answer:['点击：<span class="dark">订单</span>-<span class="dark">售后申请</span>']
      },
      "eq_9":{
        question:'收货人地址信息填写错误，该如何修改？',
        answer:['点击：<span class="dark">订单</span>-<span class="dark">申请售后</span>-<span class="dark">服务类型</span>-<span class="dark">退货</span>；退货后重新下单。']
      },
      "eq_10":{
        question:'下单之后何时发货？',
        answer:['<span class="dark">【发货时间】</span>截止当日11:00前订单，当日下午发货；11:00之后订单，次日下午发货；快递单号将在每天18:00之后上传，具体快递信息，在<span class="dark">“我的订单”</span>中查看详情。']
      },
      "eq_11":{
        question:'订单配送的物流快递有哪些？从哪里发货？',
        answer:['大部分商品使用京东物流、顺丰速递，小部分商品使用其他如中通、申通、圆通等。大部分商品都是从北京仓发货。']
      },
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getAds();
    if(!!options.id){
      this.setData({
        id: 'eq_'+options.id
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  // 切换热门问题
  swichNav:function(e){
    var that = this;
    if( this.data.currentTab === e.currentTarget.dataset.current ) {
        return false;
    } else {
        that.setData( {
            currentTab: e.currentTarget.dataset.current
        })
    }
  },

  // 切换热门问题
  bindChange: function( e ) {
    var that = this;
    that.setData( {
        currentTab: e.detail.current
    });
},

  getAds: function() {
    http.get({
      url: '/api/ads',
      data: {
        q: {
          tags_name_eq: '联系我们'
        }
      },
      success: res => {
        var images = []
        var data = res.data
        if(data.length > 0) {
          for(let i in data) {
            for(let j in data[i].images) {
              images.push(data[i].images[j])
            }
          }
          this.setData({adImages: images})
        }
      }
    })
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

})