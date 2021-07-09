// pages/products/buy/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')
var helper = require('../../../utils/helper.js')
var storage = require('../../../utils/storage.js')

var submitStatus = false
Page({

  /**
   * 页面的初始数据
   */
  data: {
    submitStatus: false,
    storeCart: {},
    store_id: '',
    shipAddress: {},
    secretText: '',
    avatars: {},
    showVariantLayer: false,
    userInfo: {},
    lineItems: [],
    payMethod: 'wx_pay',
    showPayMethodLayer: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    var store_id = options.store_id || 0
    // var store_id = 1

    if (options.buyType == 'now') {
      var storeCart = this.params.cart
      this.setData({ buyType: 'now' })
    } else {
      var cart = cartApi.getCartCache()
      var storeCart = cart.data['store_' + store_id]
    }

    this.setCartLength(storeCart)

    let avatars = this.params.avatars
    if (avatars != null && Object.keys(avatars).length > 0) {
      this.setData({ avatars: avatars })
    }

    if (options.productType != null) {
      this.setData({ productType: options.productType })
    }

    this.setData({
      store_id: store_id,
      storeCart: storeCart
    })

    this.setLineItems(storeCart)
    // this.setData({
    //   product: this.params.product,
    //   quantity: this.params.quantity,
    //   currentVariant: this.params.currentVariant,
    //   total: total.toFixed(2),
    //   coupons: this.params.coupons,
    //   protocolType: _protocolType
    // })

    if (typeof(this.data.userInfo.kzx_user_identification) == 'undefined' || this.data.userInfo.kzx_user_identification.length == 0) {
      this.yanglaoTouch()
    }
  },

  onShow: function () {
    if (this.data.payMethod == 'brcb_pay' && this.data.order != null && this.data.order.number != null) {
      this.redirectTo("/pages/orders/show/index?id=" + this.data.order.number)
    }
    this.setData({ submitStatus: false })
    submitStatus = false
    this.getShipAddress()
  },

  createOrder: function () {
    // if (this.data.shipAddress == null || this.data.shipAddress.id == null) {
    //   this.errorToast('请先选择收货地址')
    //   return false
    // }

    // if (this.data.productType == 3) {
    //   if (this.data.secretText.length <= 0) {
    //     this.errorToast('请输入换购码')
    //     return false
    //   }

    //   if (!this.data.protocolStatus) {
    //     this.errorToast('请先阅读并同意活动规则')
    //     return false
    //   }
    // }

    if (submitStatus) {
      return false
    }
    submitStatus = true
    this.setData({ submitStatus: submitStatus })
    this.showCreateLoading()

    let lineItems = []
    for(let key in this.data.storeCart.lineItems) {
      let _line = this.data.storeCart.lineItems[key]
      if(_line.selectStatus) {
        let _line_item = {
          quantity: _line.quantity,
          variant_id: _line.variant_id,
          price: _line.price
        }
        if (this.data.productType == 3) {
          _line_item['secret'] = this.data.secretText
        }
        lineItems.push(_line_item)
      }
    }

    var $this = this
    var _data = {
      line_items: lineItems,
      total: this.data.storeCart.total,
      ship_address_id: this.data.shipAddress.id,
      card_type: '0',
      order_type: '2'
      // coupon_id: coupon.id
    }

    if (this.data.productType == 3) {
      _data['secret'] = this.data.secretText
      _data.order_type = '3'
    }

    http.post({
      url: "api/orders",
      data: _data,
      success: function (res) {
        console.log(res)
        $this.setData({ order: res.data })
        if($this.data.buyType != 'now') {
          cartApi.removeStoreLineOfSelect($this.data.storeCart)
        }
        // $this.getPayInfo(res.data)
        // if ($this.data.payMethod == 'brcb_pay') {
        //   $this.getBrcbPayInfo(res.data)
        // } else {
          $this.checkPayNotice(res.data)
        // }
      },
      fail: function (res) {
        $this.hideCreateLoading()
        var msg = '下单失败, 请稍后再试'
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t
        }
        if (res.data.code == 100149 || res.data.code == 100150) {
          $this.errorToast(msg, -1, {hasClose: true})
        } else {
          $this.errorToast(msg)
        }
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
          // total: '1',
          total: order.total,
        },
        // cash_params: {
        //   total: '1',
        //   cash_ids: [1]
        // }
      }
    }
    try {
      var data = { }
      http.post({
        url: `api/orders/${order.number}/pay`,
        // data: { pay_score_total: Math.round($this.data.storeCart.total * 100) },
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

  getShipAddress: function () {
    if (!this.data.virtual) {
      helper.getShipAddress({
        success: (data) => {
          // 验证地址是否还存在
          if (data.from_type == 'localStorage') {
            this.setData({ shipAddress: data })
          } else {
            http.get({
              url: 'api/ship_addresses/' + data.id,
              success: res => {
                this.setData({ shipAddress: data })
              },
              fail: res => {
                storage.delSync('ship_address')
                this.setData({ shipAddress: {} })
              }
            })
          }
        },
        fail: (res) => {
          console.log('获取地址失败')
          if (res.data != null && res.data.code == 100123) {
            storage.delSync('ship_address')
            this.setData({ shipAddress: {} })
          }
        }
      })
    }
  },

  selectAddress: function () {
    this.navigateTo('/pages/addresses/index/index?referrer=confirm_order')
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  setCartLength: function (cart) {
    let result = 0
    for(var i in cart.lineItems) {
      if(cart.lineItems[i].selectStatus) {
        result = result + 1
      }
    }
    this.setData({ lineItemsLength: result })
  },

  triggerVariantLayer: function () {
    this.setData({ showVariantLayer: !this.data.showVariantLayer })
  },

  // 检查支付前是否需要弹框提示
  checkPayNotice: function (order) {
    var notice_flag = storage.getSync('pay_notice_flag')
    if (notice_flag) {
      if (this.data.payMethod == 'brcb_pay') {
        this.getBrcbPayInfo(order)
      } else {
        this.getPayInfo(order)
      }
    } else {
      http.get({
        url: `api/orders/${order.number}/pay_notice`,
        success: res => {
          if (res.data.alert == 'on' && res.data.notice != null && res.data.notice.length > 0) {
            this.hideCreateLoading()
            this.setData({
              payNotice: res.data.notice,
              showPayNotice: true,
              payOrder: order
            })
          } else {
            if (this.data.payMethod == 'brcb_pay') {
              this.getBrcbPayInfo(order)
            } else {
              this.getPayInfo(order)
            }
          }
        },
        fail: res => {
          if (this.data.payMethod == 'brcb_pay') {
            this.getBrcbPayInfo(order)
          } else {
            this.getPayInfo(order)
          }
        }
      })
    }
  },

  payNoticeCancelBtn: function () {
    this.closePayNoticeToast()
  },

  payNoticeConfirmBtn: function () {
    if (this.data.payNoticeProtocolStatus) {
      storage.setSync('pay_notice_flag', true)
    }

    this.closePayNoticeToast()
  },

  changePayNoticeProtocol: function () {
    this.setData({ payNoticeProtocolStatus: !this.data.payNoticeProtocolStatus })
  },

  closePayNoticeToast: function () {
    this.setData({ showPayNotice: false })

    var order = this.data.payOrder
    if (this.data.payMethod == 'brcb_pay') {
      this.getBrcbPayInfo(order)
    } else {
      this.getPayInfo(order)
    }
  },

  yanglaoTouch: function () {
    http.post({
      url: 'api/users/select_user_to_kzx',
      success: res => {
        console.log(res)
        var data = res.data
        if (data != null && data.phone != null) {
          this.setData({ userInfo: data })
          getApp().globalData.userInfo = data
          storage.setSyncWithExpire('userInfo', data)
        }
      }
    })
  },

  setLineItems: function (storeCart) {
    var lineItems = []
    for(var i in storeCart.lineItems) {
      if (storeCart.lineItems[i].selectStatus) {
        lineItems.push(storeCart.lineItems[i])
      }
    }

    this.setData({ lineItems: lineItems })
  },

  // 选择支付方式
  selectWxPay: function () {
    this.setData({ payMethod: 'wx_pay' })
  },

  selectBrcbPay: function () {
    this.setData({ payMethod: 'brcb_pay' })
  },

  hidePayMethod: function () {
    this.setData({ showPayMethodLayer: false })
  },

  showPayMethod: function () {
    if (this.data.shipAddress == null || this.data.shipAddress.id == null) {
      this.errorToast('请先选择收货地址')
      return false
    }

    if (this.data.productType == 3) {
      if (this.data.secretText.length <= 0) {
        this.errorToast('请输入换购码')
        return false
      }

      if (!this.data.protocolStatus) {
        this.errorToast('请先阅读并同意活动规则')
        return false
      }
    }
    
    this.setData({ showPayMethodLayer: true })
  },

  confirmPayMethod: function () {
    this.createOrder()
    this.hidePayMethod()
  },

  getBrcbPayInfo: function (order) {
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
        brcb_pay_params: {
          // total: '1',
          total: order.total,
        },
      }
    }
    try {
      var data = { }
      http.post({
        url: `api/orders/${order.number}/pay`,
        data: paramsData,
        success: function (res) {
          $this.hideCreateLoading()

          if (res.data && res.data.Signature != null) {
            // $this.wxPay(res.data.pay_p, res.data.pay_sign, order)
            $this.gotoBrcbPay(order, res.data)
          } else {
            $this.errorToast("支付失败, 请稍后再试", 1500)
            if ($this.data.order != null) {
              setTimeout(res => {
                submitStatus = false
                $this.setData({ submitStatus: submitStatus })
                $this.redirectTo("/pages/orders/show/index?id=" + $this.data.order.number)
              }, 1500)
            } else {
              submitStatus = false
              $this.setData({ submitStatus: submitStatus })
            }
          }
        },
        fail: function (res) {
          $this.hideCreateLoading()
          $this.errorToast("支付失败, 请稍后再试", 1500)
          if ($this.data.order != null) {
            setTimeout(res => {
              submitStatus = false
              $this.setData({ submitStatus: submitStatus })
              $this.redirectTo("/pages/orders/show/index?id=" + $this.data.order.number)
            }, 1500)
          } else {
            submitStatus = false
            $this.setData({ submitStatus: submitStatus })
          }
        }
      })
      return false
    }
    catch (e) {
      console.log(e)
      $this.hideCreateLoading()
      $this.errorToast("支付失败, 请稍后再试", 1500)
      if ($this.data.order != null) {
        setTimeout(res => {
          submitStatus = false
          $this.setData({ submitStatus: submitStatus })
          $this.redirectTo("/pages/orders/show/index?id=" + $this.data.order.number)
        }, 1500)
      } else {
        submitStatus = false
        $this.setData({ submitStatus: submitStatus })
      }
      return false
    }
  },

  gotoBrcbPay: function (order, data) {
    this.navigateTo(`/web/pages/brcb_pay/index/index?id=${order.number}`, data)
  },
  // 选择支付方式
})