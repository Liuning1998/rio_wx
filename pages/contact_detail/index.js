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
        answer:['<span class="dark">“我的”</span>界面中有一项就是<span class="dark">“平台余额”</span>。']
      },
      "eq_2":{
        question:'“平台余额”如何使用？是否有期限和使用要求？',
        answer:['<span class="dark">“平台余额”</span>会在您下单时优先使用，不需要用户做任何操作，系统会自动扣款平台余额中的金额；随时都可以使用，没有使用期限及使用要求。']
      },
      "eq_3":{
        question:'能否修改支付密码？',
        answer:['修改密码和平台无关，需要联系银行才可修改。']
      },
      "eq_4":{
        question:'如何查询养老助残卡的余额及使用情况？',
        answer:['请前往农商银行进行查询，或拨打银行客服热线96198、以及农商银行手机客户端均可查询。']
      },
      "eq_5":{
        question:'手机号与银行预留不一致？',
        answer:['请先联系农商银行客服确认养老助残卡在银行系统预留的手机号是否和下单时填写的手机号一致。']
      },
      "eq_6":{
        question:'如何提交售后申请？',
        answer:['商品拆封后非质量问题不支持7天无理由退换货。如有售后/质量问题，可以从订单中选择需要申请售后的订单，点击<span class="dark">“申请售后”</span>，勾选该订单需要售后的商品，确认后在售后页面填写相应信息即可。']
      },
      "eq_7":{
        question:'退货/退款的订单金额何时到帐？',
        answer:['由于发卡银行限制，隔天退款的订单金额将退到金色家园<span class="dark">“平台余额”</span>，后续下单可以优先使用余额支付。','已发货的订单申请退货退款，则需要等商品退回到仓库后，会由仓库人员审核退款，预计退款时间1-2个工作日，订单金额退到金色家园<span class="dark">“平台余额”</span>。']
      },
      "eq_8":{
        question:'订单如何取消？',
        answer:['请在订单中申请售后退货。']
      },
      "eq_9":{
        question:'收货人地址信息填写错误，该如何修改？',
        answer:['需要在下单2个小时内联系客服人员进行反馈；也可以及时申请取消订单，订单取消后，重新下单填写正确地址及相关信息即可。如果信息修改的不及时，商品一旦出库无法拦截，用户也可以拒收。']
      },
      "eq_10":{
        question:'下单之后何时发货？',
        answer:['<span class="dark">【发货时间】</span>截止当日11:00前订单，当日下午发货；11:00之后订单，次日下午发货；快递单号将在每天18:00之后上传，具体快递信息，在<span class="dark">“我的订单”</span>中查看详情。（个别商品周六、日不发货，可在商品详情查看）','<span class="dark">【温馨提示】</span>由于疫情反复，可能会有订单因政策管控无法发货，或在运输途中滞留，可以联系客服人员查询订单情况，感谢您的理解！']
      },
      "eq_11":{
        question:'订单配送的物流快递有哪些？从哪里发货？',
        answer:['大部分商品使用京东物流、顺丰速递，小部分商品使用其他如中通、申通、圆通等。除千禾、早康、楮木香、秭归橙子等产品从外地发货，其他商品均是北京同城发货。']
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
    console.log(e.currentTarget.dataset.current)
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