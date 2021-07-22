// pages/products/buy/index.js
var http = require('../../../../utils/http.js')
var cartApi = require('../../../../utils/cart.js')
var helper = require('../../../../utils/helper.js')
var storage = require('../../../../utils/storage.js')

var submitStatus = false
Page({

  /**
   * 页面的初始数据
   */
  data: {
    submitStatus: false,
    shipAddress: {},
    product: null,
    showAddressNotice: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    // let product = this.params.product

    // if (product == null) {
    //   this.getProductDetail(options.id)
    // } else {
    //   this.setData({ product: product })
    // }
    var storeCart = this.params.cart
    var store_id = options.store_id || 0
    this.setData({
      store_id: store_id,
      storeCart: storeCart,
      group: this.params.group
    })
  },

  onShow: function () {
    this.setData({ submitStatus: false })
    submitStatus = false
    this.getShipAddress()
    
    // if (this.data.product != null && this.data.product.id != null) {
    //   // this.setData({ showSelectContainer: false })
    //   this.getProductDetail(this.data.product.id)
    // }
  },

  createOrder: function () {
    if (!this.data.storeCart.virtual && (this.data.shipAddress == null || this.data.shipAddress.id == null)) {
      this.errorToast('请先选择收货地址')
      return false
    }

    if (!this.data.protocolStatus) {
      this.errorToast('请先阅读并同意《“金色家园”团购活动规则》')
      return false
    }

    if (this.data.area_limit) {
      this.errorToast("订单中商品在所选地区不支持销售，请确认后再购买。", 2000)
      return false
    }

    if (submitStatus) {
      return false
    }
    submitStatus = true
    this.setData({ submitStatus: submitStatus })
    this.showCreateLoading()

    // let lineItems = [{
    //   quantity: 1,
    //   variant_id: this.data.product.master.id,
    //   price: this.data.product.price
    // }]

    let lineItems = []
    for(let key in this.data.storeCart.lineItems) {
      let _line = this.data.storeCart.lineItems[key]
      if(_line.selectStatus) {
        lineItems.push({
          quantity: _line.quantity,
          variant_id: _line.variant_id,
          price: _line.price
        })
      }
    }

    var orderData = {
      line_items: lineItems,
      total: this.data.storeCart.total,
      ship_address_id: this.data.shipAddress.id,
      card_type: '0',   // api验证配送地址
      order_type: '4',
      buy_group_id: this.data.group.id
      // coupon_id: coupon.id
    }

    if (this.data.storeCart.virtual) {
      orderData.order_type = '5'
    }

    var $this = this
    http.post({
      url: "api/orders",
      data: orderData,
      success: function (res) {
        // console.log(res)
        // if($this.data.buyType != 'now') {
        //   cartApi.removeStoreLineOfSelect($this.data.storeCart)
        // }
        // $this.getPayInfo(res.data)
        submitStatus = false
        // $this.setData({ submitStatus: submitStatus })
        $this.hideCreateLoading()
        // $this.redirectTo('/try_product/pages/orders/index/index')
        $this.checkPayNotice(res.data)
      },
      fail: function (res) {
        $this.hideCreateLoading()
        var msg = '拼团失败, 请稍后再试'
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t
        }
        $this.errorToast(msg)
        submitStatus = false
        $this.setData({ submitStatus: submitStatus })
        var resCode = '' + res.data.code
        if (['100157', '100158', '100159'].indexOf(resCode) >= 0 ) {
          setTimeout(res => {
            wx.navigateBack({})
          }, 1000)
        }
      }
    });
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
            // this.setData({ shipAddress: data })
            // 2437 老地址认为无效地址
            if ( data.id <= 2437 ) {
              storage.delSync('ship_address')
              this.setShipAddress({})
            } else {
              this.setShipAddress(data)
            }
          } else {
            http.get({
              url: 'api/ship_addresses/' + data.id,
              success: res => {
                // this.setData({ shipAddress: data })
                this.setShipAddress(data)
              },
              fail: res => {
                storage.delSync('ship_address')
                if (res.data != null && res.data.code == 100123) {
                  storage.delSync('ship_address')
                }
                this.setShipAddress({})
              }
            })
          }
        },
        fail: (res) => {
          console.log('获取地址失败')
          this.setShipAddress({})
        }
      })
    }
  },

  setShipAddress: function (data) {
    this.setData({ shipAddress: data })
    this.checkAreaLimit(this.data.storeCart, data)
  },

  selectAddress: function () {
    this.navigateTo('/pages/addresses/index/index?referrer=confirm_order')
  },

  getProductDetail: function (id) {
    http.get({
      url: "api/try_goods/" + id,
      success: (res) => {
        var _product = res.data.product
        var _master = null

        if (_product != null && _product.variants != null) {
          _master = _product.variants.filter(item => item.is_master)[0]
        }

        this.setData({ product: _product, master: _master })

        if (_product.available_on == null || _product.available_on == 0) {
          this.setData({ available: false })
        }
      },
      fail: (res) => {
        if (res.statusCode == '404') {
          this.errorToast('找不到商品')
          setTimeout(wx.navigateBack, 1000)
        } else {
          // wx.navigateBack({
          //   delta: 1
          // })
        }
      }
    })
  },

  getPayInfo: function (order) {
    var paramsData = {
      pay_params: {
        wx_pay_params: {
          // total: '0.05',
          total: order.total,
        },
        // cash_params: {
        //   total: '0.05',
        //   cash_ids: [1]
        // }
      }
    }

    var $this = this
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

        // wx.redirectTo({
        //   url: '/group_buy/pages/orders/index/index',
        // })

        this.checkSubscribeMessage([
          "9i0Har0JOSN0fw2ZP8KD6chW_ySnKPVpk_leD8sNAWI",
          "00m2x7rgBj45ghkRCSNMREsGoakf0KX3-gaXRzl-lQ8"
          // "l0Hpae-AViUtw3lzwio14dAc1JvFP1AGwBIFSuXuuGg"
        ])

      },
      'fail': (res) => {
        this.errorToast('支付失败', 1000)
        submitStatus = false
        // this.setData({ submitStatus: submitStatus })
        // if ( res.errMsg == "requestPayment:fail cancel" ) {
        this.cancelPayBack()
        // } else {
          // this.redirectTo("/pages/orders/show/index?id=" + order.number)
        // }
      },
    })
  },

  checkSubscribeMessage: function (templateIds = []) {
    wx.getSetting({
      withSubscriptions: true,
      success: res => {
        if (res.subscriptionsSetting == null || res.subscriptionsSetting.itemSettings == null) {
          // console.error('订阅消息失败')
          this.subscribeMessage(templateIds)
          // wx.redirectTo({
          //   url: '/group_buy/pages/orders/index/index',
          // })
          return false
        }
        
        let flag = true
        for ( let key in templateIds ) {
          let item = templateIds[key]
          if (res.subscriptionsSetting.itemSettings[item] == 'reject') {
            // wx.redirectTo({
            //   url: '/group_buy/pages/orders/index/index',
            // })
            // setTimeout(res => {
            //   wx.navigateBack({})
            // }, 10)
            this.successPayBack()
            return false
          }
          if (res.subscriptionsSetting.itemSettings[item] != 'accept') {
            flag = false
            break
          }
        }

        if (!flag) {
          this.subscribeMessage(templateIds)
        } else {
          this.successPayBack()
        }

        // if (!flag) {
        //   this.subscribeMessage(templateIds)
        // } else {
        //   wx.redirectTo({
        //     url: '/group_buy/pages/orders/index/index',
        //   })
        // }
      },
      fail: res => {
        // console.error('订阅消息失败')
        this.subscribeMessage(templateIds)
      }
    })
  },

  subscribeMessage: function (templateIds) {
    wx.requestSubscribeMessage({
      tmplIds: templateIds,
      success: res => {
        console.log('订阅消息成功')
        console.log(res)
        // wx.redirectTo({
        //   url: '/group_buy/pages/orders/index/index',
        // })
        // setTimeout(res => {
        //   wx.navigateBack({})
        // }, 10)
        this.successPayBack()
      },
      fail: res => {
        console.error('订阅消息失败')
        console.error(res)
        // wx.redirectTo({
        //   url: '/group_buy/pages/orders/index/index',
        // })
        // setTimeout(res => {
        //   wx.navigateBack({})
        // }, 1000)
        this.successPayBack()
      }
    })
  },

  // 检查支付前是否需要弹框提示
  checkPayNotice: function (order) {
    var notice_flag = storage.getSync('pay_notice_flag')
    if (notice_flag) {
      this.getPayInfo(order)
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
            this.getPayInfo(order)
          }
        },
        fail: res => {
          this.getPayInfo(order)
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
    this.getPayInfo(order)
  },

  successPayBack: function () {
    this.navigateBack({
      showSuccessPay: true
    })
  },

  cancelPayBack: function () {
    this.navigateBack({
      waitPay: true
    })
  },

  checkAreaLimit: function (storeCart, shipaddress) {
    var result = false
    if (shipaddress != null && shipaddress.province != null) {
      for(var i in storeCart.lineItems) {
        var lineItem = storeCart.lineItems[i]
        if (!lineItem.selectStatus) { continue }
        
        if (lineItem.product.area_limit != null && lineItem.product.area_limit.area_limit != null && lineItem.product.area_limit.area_limit.length > 0) {
          for(var j in lineItem.product.area_limit.area_limit) {
            var lm = lineItem.product.area_limit.area_limit[j]
            if (lm != null && shipaddress.province.match(lm)) {
              result = true
              lineItem.area_limit = true
              break
            }
          }
        }
      }
    }

    if (result && this.data.showPayNotice != true) {
      this.setData({ showAddressNotice: true })
    }

    this.setData({ storeCart: storeCart, area_limit: result })
  },

  addressNoticeCancelBtn: function (params) {
    this.setData({ showAddressNotice: false })
  },
  
  addressNoticeConfirmBtn: function () {
    this.setData({ showAddressNotice: false })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})