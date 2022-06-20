// pages/products/buy/index.js

// 余额支付部分，按照订单 discount_total 计算
// 微信支付折扣api可以控制goods_tag处理
// brcb 支付api 可以处理

var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')
var helper = require('../../../utils/helper.js')
var storage = require('../../../utils/storage.js')
var jdHelper = require('./jd_helper.js')
var couponJs = require('./coupon.js')

var balancePay = require('../../../utils/balance_pay.js')

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
    lineItems: [], // 购物车中已勾选的商品
    showAddressNotice: false,
    payMethod: 'brcb_pay',
    showPayMethodLayer: false,
    orderTotal: null,
    shipmentExpenses: null,
    canCreateOrder: true,
    checkCoupon:null,
    nowDate:Date.parse(new Date()) / 1000,
    couponShow:false,
    freeNotice:'',// 本单京东商品符合免邮费条件
    canReceiveCoupon:false,//检查是否可以领取优惠券
    notCouponShow:false,//未领取优惠券弹窗
    isBalance:null,//是否开启余额支付
    balance:0,//平台余额
    balancePayResult: null,//纯余额支付结果弹窗
    navStyle:{
      navbarStyle: 'custom',
      imgSrc: '/images/v1.2/order_detailbg_01.png'
    },
    startTime: Math.ceil((new Date).getTime()/1000),
    nowTime: Math.ceil((new Date).getTime()/1000),
    showProductQuantity:2,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    jdHelper.extend(this)
    //余额支付通用方法
    balancePay.extend(this)

    var store_id = options.store_id || 0
    // var store_id = 1

    if (options.buyType == 'now') {
      var storeCart = this.params.cart
      console.log(storeCart)
      this.setData({ buyType: 'now' })
    } else {
      var cart = cartApi.getCartCache()
      var storeCart = cart.data['store_' + store_id]
    }

    this.setData({
      store_id: store_id,
      startTime: Math.ceil((new Date).getTime()/1000),
      storeCart: storeCart
    })
    this.setCartLength(storeCart)
    this.setNowTime()

    if (options.store_short_name == '京东') {
      this.setData({ store_short_name: '京东' })
      // 京东订单
      this.checkJdPrice(storeCart).then(res=>{
        this.getCouponCount()
      })
    } else {
      // 其他订单
      this.getOrderTotal(storeCart)
    }

    let avatars = this.params.avatars
    if (avatars != null && Object.keys(avatars).length > 0) {
      this.setData({ avatars: avatars })
    }

    if (options.productType != null) {
      this.setData({ productType: options.productType })
    }

    this.setLineItems(storeCart)

    // 获取余额
    this.getAccountBalance('pay')
    // this.setData({
    //   product: this.params.product,
    //   quantity: this.params.quantity,
    //   currentVariant: this.params.currentVariant,
    //   total: total.toFixed(2),
    //   coupons: this.params.coupons,
    //   protocolType: _protocolType
    // })


    // 21/12/25 注
    // if (typeof(this.data.userInfo.kzx_user_identification) == 'undefined' || this.data.userInfo.kzx_user_identification.length == 0) {
    //   this.yanglaoTouch()
    // }
  },

  onShow: function () {
    if (this.data.payMethod == 'brcb_pay' && this.data.order != null && this.data.order.number != null) {
      this.redirectTo("/pages/orders/show/index?id=" + this.data.order.number)
    }
    this.setData({ submitStatus: false })

    submitStatus = false
    
    this.getShipAddress()
 
    if(this.data.couponLoading == false){
      this.getCouponCount()
    }

    // 检查是否可以领取优惠券
    this.canReceiveCoupon()
    
  },


  seeAll: function (e){
    var number = e.target.dataset.length;
    var showProductQuantity = this.data.showProductQuantity
    if(number <= showProductQuantity){
      this.setData({
        showProductQuantity: 2
      })
    }else if(showProductQuantity == 2){
      console.log('2')
      this.setData({
        showProductQuantity: number
      })
    }
  },

  setNowTime: function () {
    this.setData({ nowTime: Math.ceil((new Date).getTime()/1000) })
    setTimeout( res => 
      this.setNowTime(), 1000)
  },

  // 跳转领优惠券页面
  toDashboard:function(){
    this.navigateTo('/pages/coupons/dashboard/index')
  },

  // 检查是否可以领取优惠券
  canReceiveCoupon:function(){
    http.get({
      url: 'api/promotions/can_receive_promotion',
      success: res => {
        if(res.data.status != null){
          this.setData({
            canReceiveCoupon:res.data.status
          })
        }
      }
    })
  },

  // 优惠券切换
  couponChange:function(e){
    // console.log(this.data.couponNew)
    var checkNumber = e.currentTarget.dataset.item;
    var couponNew = this.data.couponNew;
    couponNew.forEach((ele,i)=>{
      var key = `couponNew[${i}].isCheck`;
      if(ele.number == checkNumber.number){
        if(ele.isCheck){
          this.setData({
            checkCoupon:null,
            [key]:!ele.isCheck
          })
          // console.log('true',this.data.checkCoupon)
        }else{
          this.setData({
            checkCoupon:ele,
            [key]:!ele.isCheck
          })
          // console.log('false',this.data.checkCoupon)
        }
      }else{
        this.setData({
          [key]:false
        })
      }
    })
    this.closeCoupon()

  },
  // 下拉
  down:function(e){
    var el = e.currentTarget.dataset.index;
    var isCan = e.currentTarget.dataset.item.isCan;
    var key;
    if(isCan){
      key = `couponNew[${el}].detailShow`;
      this.setData({
        [key]:!this.data.couponNew[el].detailShow
      })
    }else{
      key = `couponNewCant[${el}].detailShow`;
      this.setData({
        [key]:!this.data.couponNewCant[el].detailShow
      })
    }

  },
  // 关闭优惠券弹窗
  closeCoupon:function(){
    this.setData({
      couponShow:false
    })
  },
  // 打开优惠券弹窗
  openCoupon:function(){
    this.setData({
      couponShow:true
    })
  },


  priceTos:function(price) {
    if (price == null) {return ''}
    price = parseFloat(price)
    return price.toFixed(2)
  },

  // 打开优惠券未领取提示弹窗
  openCanReceive:function(){

    var couponShow = this.data.couponShow;
    couponShow ? this.setData({couponShow:false,notCouponShow:true}) : this.setData({notCouponShow:true})

  },
  // 关闭优惠券未领取提示弹窗
  closeCanReceive:function(){
    this.setData({
      notCouponShow:false
    })
  },

  // 放弃优惠券
  giveUp:function(){
    this.closeCanReceive();
    this.createOrder()
  },

  // 去领取优惠券
  toReceive:function(){
    this.closeCanReceive();
    this.toDashboard();
  },


  createOrder: function () {

    this.closeCoupon()
    if (this.data.shipAddress == null || this.data.shipAddress.id == null) {
      this.errorToast('请先选择收货地址')
      return false
    }

    if (this.data.area_limit) {
      this.errorToast("订单中商品在所选地区不支持销售，请确认后再购买。", 2000)
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

    if (!this.data.canCreateOrder) {
      this.errorToast('库存不足或订单中商品在所选地区不支持销售')
      return
    }

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
      total:parseFloat(this.priceTos(this.data.storeCart.total)),
      ship_address_id: this.data.shipAddress.id,
      card_type: '0',
      order_type: '2'
      // coupon_id: coupon.id
    }

    // if (this.data.orderTotal != null) {
    //   _data.total = this.data.orderTotal
    // }

    if (this.data.productType == 3) {
      _data['secret'] = this.data.secretText
      _data.order_type = '3'
    }

    // 使用优惠券
    if(this.data.checkCoupon != null){
      _data.user_promotions_number = this.data.checkCoupon.number
      // _data.total = couponJs.calculatePrice(this.data.checkCoupon,_data.total) 
    }

    // 加运费
    if (this.data.shipmentExpenses > 0) {
      _data.shipment_expense = this.data.shipmentExpenses
      _data.total = Math.round((_data.total + this.data.shipmentExpenses) * 100)/100
    }
    
    http.post({
      url: "api/orders",
      data: _data,
      success: function (res) {
        $this.setData({ order: res.data })
        if($this.data.buyType != 'now') {
          cartApi.removeStoreLineOfSelect($this.data.storeCart)
        }

        if($this.data.isBalance && res.data.discount_total - $this.data.balance <= 0){//如果余额支付开启调用websocket
          $this.subscriptionOrder()
        }

        $this.showPayMethod()
        // $this.getPayInfo(res.data)
        // if ($this.data.payMethod == 'brcb_pay') {
        //   $this.getBrcbPayInfo(res.data)
        // } else {

          // $this.checkPayNotice(res.data)

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

  // 修改submitStatus
  modifySubmitStatus:function(status) {
    submitStatus = status
  },

  onUnload: function () {
    storage.delSync('ship_address_real')
    this.closeSubscription()
    this.closeTimer()
  },

  //是否启用余额支付
  switchBalance: function(e) {
    this.setData({
      isBalance: e.detail.value
    })
  },

  getPayInfo: function (order) {
    var $this = this
    var _total = order.discount_total;
    var _balance = $this.data.balance;
    
    var paramsData = {
      pay_params: {
        wx_pay_params: {
          // total: '1',
          total: _total,
        },
        // cash_params: {
        //   total: '1',
        // }
      }
    }

    if($this.data.isBalance){
      paramsData = $this.calculateTotal(_total,_balance);
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
      return new Promise((resolve,reject)=>{
        helper.getShipAddress({
          success: (data) => {
            // 验证地址是否还存在 
            if (data.from_type == 'localStorage') {
              // this.setData({ shipAddress: data })
              // 2437 老地址认为无效地址  if ( data.id <= 2437 ) { storage.delSync('ship_address') this.setShipAddress({}) }else{
                this.setShipAddress(data)
              // }
            } else {
              http.get({
                url: 'api/ship_addresses/' + data.id,
                success: res => {
                  // this.setData({ shipAddress: data })
                  this.setShipAddress(data)
                },
                fail: res => {
                  storage.delSync('ship_address')
                  // this.setData({ shipAddress: {} })
                  this.setShipAddress({})
                }
              })
            }
          },
          fail: (res) => {
            console.log('获取地址失败')
            if (res.data != null && res.data.code == 100123) {
              storage.delSync('ship_address')
              // this.setData({ shipAddress: {} })
              this.setShipAddress({})
            }
          }
        })
      })

    }
  },

  setShipAddress: function (data) {
    this.setData({ shipAddress: data })
    this.checkAreaLimit(this.data.storeCart, data)
    if (this.data.store_short_name == '京东') {
      this.checkJdStockAndAreaLimit(this.data.storeCart, data.id)
      this.fetchJdFreight(this.data.storeCart, data.id)
    }
  },

  selectAddress: function () {
    this.navigateTo('/pages/addresses/choose/index?referrer=confirm_order')
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
      // if (this.data.payMethod == 'brcb_pay') {
      //   this.getBrcbPayInfo(order)
      // } else {
      //   this.getPayInfo(order)
      // }
      // this.showPayMethod()
      this.getBrcbPayInfo(order)
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
            this.getBrcbPayInfo(order)
            // if (getApp().globalData.brcbPayAvailable) {
            //   this.showPayMethod()
            // } else {
            //   this.getPayInfo(order)
            // }
          }
        },
        fail: res => {
          if (getApp().globalData.brcbPayAvailable) {
            this.showPayMethod()
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
    this.getBrcbPayInfo(this.data.order)

    this.setData({ showPayNotice: false })
    // this.closePayNoticeToast()
  },

  changePayNoticeProtocol: function () {
    this.setData({ payNoticeProtocolStatus: !this.data.payNoticeProtocolStatus })
  },

  closePayNoticeToast: function () {
    this.setData({ showPayNotice: false })

    if (getApp().globalData.brcbPayAvailable) {
      this.showPayMethod()
    } else {
      var order = this.data.payOrder
      this.getPayInfo(order)
    }
    // var order = this.data.payOrder
    // if (this.data.payMethod == 'brcb_pay') {
    //   this.getBrcbPayInfo(order)
    // } else {
    //   this.getPayInfo(order)
    // }
  },

  yanglaoTouch: function () {
    http.post({
      url: 'api/users/select_user_to_kzx',
      success: res => {
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

  // 选择支付方式
  selectWxPay: function () {
    this.setData({ payMethod: 'wx_pay' })
  },

  selectBrcbPay: function () {
    this.setData({ payMethod: 'brcb_pay' })
  },

  hidePayMethod: function () {
    this.hideCreateLoading()
    this.setData({ showPayMethodLayer: false })
  },

  closePay: function () {
    this.hidePayMethod()
    this.errorToast('支付取消', 800)

    setTimeout(res => {
      var order = this.data.order
      submitStatus = false
      this.setData({ submitStatus: submitStatus })

      this.redirectTo("/pages/orders/show/index?id=" + order.number)
    }, 800)
  },

  showPayMethod: function () {
    if(this.data.isBalance != null){
      this.hideCreateLoading()
      this.setData({ showPayMethodLayer: true })
    }else{
      var overtime = setTimeout(() => {
        if(getBalanceTimer){
          clearInterval(getBalanceTimer)
        }
        this.hideCreateLoading()
        this.setData({ showPayMethodLayer: true })
      }, 2000);
      var getBalanceTimer = setInterval(() => {
        if(this.data.isBalance != null){
          clearInterval(getBalanceTimer)
          clearTimeout(overtime)
          this.hideCreateLoading()
          this.setData({ showPayMethodLayer: true })
        }
      }, 500);
    }
  },

  confirmPayMethod: function () {
    this.hidePayMethod()
    var order = this.data.order
    if (this.data.payMethod == 'brcb_pay') {
      this.checkPayNotice(order)
      // this.getBrcbPayInfo(order)
    } else {
      this.getPayInfo(order)
    }
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
    var _total = order.discount_total
    var _balance = $this.data.balance;

    // if (this.data.orderTotal != null) {
    //   if(this.data.checkCoupon != null) {
    //     _total = this.data.orderTotal - parseFloat(this.data.checkCoupon.value)
    //   }else{
    //     _total = this.data.orderTotal
    //   }
    // }

    // 如果_total为负数 ， 置为0
    // if(_total <= 0){
    //   _total=0
    // }

    var paramsData = {
      pay_params: {
        brcb_pay_params: {
          // total: '1',
          total: _total,
        },
      }
    }

    if($this.data.isBalance){
      paramsData = $this.calculateTotal(_total,_balance);
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
      // console.log(e)
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

  getOrderTotal: function (storeCart) {
    let lineItems = []
    for(let key in storeCart.lineItems) {
      let _line = storeCart.lineItems[key]
      if(_line.selectStatus) {
        let _line_item = {
          quantity: _line.quantity,
          variant_id: _line.variant_id,
          price: _line.price
        }
        lineItems.push(_line_item)
      }
    }

    http.post({
      url: '/api/products/cal_product_order_total',
      data: { line_items: lineItems },
      success: res => {
        this.setData({ orderTotal: res.data.total })
        // 请求成功加载优惠券
        this.getCouponCount()
      }
    })
  },

  // 关闭支付失败弹窗
  closeFail: function(){
    this.setData({
      balancePayResult: null
    })
  },
})