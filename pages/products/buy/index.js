// pages/products/buy/index.js
var http = require('../../../utils/http.js')

var submitStatus = false
Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: null,
    quantity: null,
    currentVariant: null,
    total: null,
    vip_total: null,
    protocolStatus: false,
    protocolType: null,
    submitStatus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let total = this.params.currentVariant.price * 100 * this.params.quantity / 100
    let vip_total = this.params.currentVariant.vip_price * 100 * this.params.quantity / 100
    let _protocolType = ''
    if (this.params.product.tags != null && this.params.product.tags.includes('京东E卡电子卡')) {
      _protocolType = 'jd'
    }

    if (this.params.product.tags != null && this.params.product.tags.includes('滴滴快车电子卡')) {
      _protocolType = 'didi'
    }

    if (this.params.product.tags != null && this.params.product.tags.includes('多点电子券')) {
      _protocolType = 'duodian'
    }

    if (this.params.product.tags != null && this.params.product.tags.includes('多点通用型电子券')) {
      _protocolType = 'duodiantongyong'
    }

    if (this.params.product.tags != null && this.params.product.tags.includes('好修养卡')) {
      _protocolType = 'haoxiuyang'
    }

    this.setData({
      product: this.params.product,
      quantity: this.params.quantity,
      currentVariant: this.params.currentVariant,
      total: total.toFixed(2),
      vip_total: vip_total.toFixed(2),
      protocolType: _protocolType
    })
  },

  onShow: function () {
    this.setData({ submitStatus: false })
    submitStatus = false
  },

  createOrder: function () {
    if (!this.data.protocolStatus) {
      this.errorToast('请先阅读并同意相关协议', 1000)
      return
    }

    if (submitStatus) {
      return false
    }
    submitStatus = true
    this.setData({ submitStatus: submitStatus })
    this.showCreateLoading()


    console.log(this.data.currentVariant.price,this.data.total);
    var $this = this
    http.post({
      url: "api/orders",
      data: {
        line_items: [
          {
            quantity: this.data.quantity,
            variant_id: this.data.currentVariant.id,
            price: this.data.currentVariant.price
          }
        ],
        total: this.data.total,
        card_type: 6,
        order_type: '0'
      },
      success: function (res) {
        console.log(res)
        // if (res.status == 'ok') {
        $this.getPayInfo(res.data)
        // } else {
        //   var msg = '下单失败, 请稍后再试'

        //   $this.errorToast(msg)
        //   submitStatus = false
        // $this.setData({ submitStatus: submitStatus })
        // }
      },
      fail: function (res) {
        $this.hideCreateLoading()
        var msg = '下单失败, 请稍后再试'
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t
        }
        $this.errorToast(msg)
        submitStatus = false
        $this.setData({ submitStatus: submitStatus })
      }
    });
  },

  getPayInfo: function (order) {
    var $this = this
    // params[:pay_params] = {
    //   wx_pay_params: {
    //     total: 100
    //   },
    //   cash_params: {
    //     total: 100
    //     cash_ids: [1,2]
    //   }
    // }
    var paramsData = {
      pay_params: {
        wx_pay_params: {
          total: $this.data.total,
          // cash_ids: [1]
        }
      }
    }
    try {
      var data = { }
      http.post({
        url: `api/orders/${order.number}/pay`,
        // data: { pay_score_total: Math.round($this.data.total * 100) },
        data: paramsData,
        success: function (res) {
          $this.hideCreateLoading()

          if (res.data && res.data.pay_p != null) {
            $this.wxPay(res.data.pay_p, res.data.pay_sign, order)
          } else {
            $this.errorToast("支付失败, 请稍后再试")
            submitStatus = false
            $this.setData({ submitStatus: submitStatus })
          }
        },
        fail: function (res) {
          $this.hideCreateLoading()
          $this.errorToast("支付失败, 请稍后再试")
          submitStatus = false
          $this.setData({ submitStatus: submitStatus })
        }
      })
      return false
    }
    catch (e) {
      console.log(e)
      $this.hideCreateLoading()
      $this.errorToast("支付失败, 请稍后再试")
      submitStatus = false
      $this.setData({ submitStatus: submitStatus })
      return false
    }
  },

  wxPay: function (pay_params, pay_sign, order) {
    console.log('开始微信支付')

    wx.requestPayment({
      'timeStamp': pay_params.timeStamp,
      'nonceStr': pay_params.nonceStr,
      'package': pay_params.package,
      'signType': pay_params.signType,
      'paySign': pay_sign,
      'success': (res) => {
        this.successToast('支付成功', 1000)
        submitStatus = false
        this.setData({ submitStatus: submitStatus })

        wx.reLaunch({
          url: '/pages/orders/index/index',
        })
      },
      'fail': (res) => {
        this.errorToast('支付失败', 1000)
        submitStatus = false
        this.setData({ submitStatus: submitStatus })

        this.redirectTo("/pages/orders/show/index?id=" + order.number)
      },
    })
  },

  changeProtocol: function () {
    this.setData({ protocolStatus: !this.data.protocolStatus })
  },

  showCreateLoading: function () {
    wx.showLoading({mask: true})
    setTimeout(()=> {
      wx.hideLoading()
    }, 30000)
  },

  hideCreateLoading: function () {
    wx.hideLoading()
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})