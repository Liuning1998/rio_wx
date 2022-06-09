// pages/orders/show/index.js

// 重要，支付
// 取消支付后再次支付时，余额支付部分数据不可重新选择，否则会导致预支付出问题
// 重要

var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')
var storage = require('../../../utils/storage.js')
var balancePay = require('../../../utils/balance_pay.js')

var submitStatus = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: {},
    expressExtend: false,
    showPayNotice: false,
    payMethod: 'brcb_pay',
    showPayMethodLayer: false,
    couponShow:false,
    isBalance:null,
    balance:0,
    balancePayResult:null,//纯余额支付结果
    nowTime: Math.ceil((new Date).getTime()/1000),
    showProductQuantity:2,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    //余额支付通用方法
    balancePay.extend(this)

    let number = options.id
    // let number = "J1495708935655979834"
    http.get({
      url: 'api/orders/'+number,
      success: res => {
        if (res.data != null && Object.keys(res.data).length >0) {
          this.setData({ order: res.data })
          if(res.data.refund_state != null || res.data.state == 'canceled' || res.data.state == 'handle_canceled'){
            this.setData({orderStep: 'step4'})
          }else if(res.data.state == 'new'){
            this.setData({orderStep: 'step1'})
          }else if(res.data.state == 'padding'){
            this.setData({orderStep: 'step2'})
          }else if(res.data.state == 'shipping'){
            this.setData({orderStep: 'step3'})
            if(res.data.expresses.length <= 1){
              this.getExpress(res.data.expresses[0].express_number, res.data.number)
            }
          }else if(res.data.state){
            this.setData({orderStep: 'step4'})
            if(res.data.expresses.length <= 1){
              this.getExpress(res.data.expresses[0].express_number, res.data.number)
            }
          }

          if(res.data.payment_state == 'new'){
            this.setNowTime()
          }

          if(res.data.payment_state == 'new' && res.data.balance_expend != null && res.data.balance_expend.status == 'unlock'){
            this.getAccountBalance('detail')
          }
        } else {
          this.errorToast('该订单不存在')
          wx.navigateBack({})
        }
      },
      fail: res => {
        this.errorToast('该订单不存在')
        wx.navigateBack({})
      }
    })

    this.getOrderServiceStatus(number)
    this.fetch_sale_services(number)
  },

  onShow: function () {
    if(this.data.shown == null) {
      this.setData({ shown: true })
    } else {
      // 调用onload重新渲染页面
      console.log('重新渲染页面')
      var params = {
        id:this.data.order.number
      }
      this.onLoad(params);
      // http.get({
      //   url: 'api/orders/' + this.data.order.number,
      //   success: res => {
      //     console.log('onShow-------',res)
      //     if (res.data != null && Object.keys(res.data).length > 0) {
      //       console.log('res.data != null && Object.keys(res.data).length > 0',)
      //       this.setData({ order: res.data })
      //     }
      //   }
      // })
    }
  },

  seeAll: function (e){
    var number = e.target.dataset.length;
    var showProductQuantity = this.data.showProductQuantity
    if(number <= showProductQuantity){
      this.setData({
        showProductQuantity: 2
      })
    }else if(showProductQuantity == 2){
      this.setData({
        showProductQuantity: number
      })
    }
  },

  getExpress: function (number, order_number) {
    http.get({
      url: `/api/expresses/${number}/search_express`,
      data: { order_number: order_number },
      success: res => {
        if (res.statusCode == 200 && res.data != null) {
          this.setData({ expressInfo: res.data })
        }
      },
      fail: res => {

      }
    })
  },

  setNowTime: function () {
    this.setData({ nowTime: Math.ceil((new Date).getTime()/1000) })
    setTimeout( res => 
      this.setNowTime(), 1000)
  },
  
  onPageScroll: function (res){

  },

  onUnload: function () {
    this.closeSubscription()
  },

  // 修改submitStatus
  modifySubmitStatus:function(status) {
    submitStatus = status
  },

  //获取submitStatus
  getSubmitStatus:function() {
    return submitStatus
  },
  
  // 优惠券下拉
  couponDown:function(){
    var couponShow = this.data.couponShow
    this.setData({
      couponShow:!couponShow
    })
  },

  // 删除订单
  deleteOrder: function (e) {
    if (Object.keys(this.data.order).length <= 0) {
      return false
    }
    wx.showModal({
      title: '删除订单',
      content: '您确定删除该订单吗？',
      success: (res) => {
        if (res.confirm) {
          http.delete({
            url: 'api/orders/' + this.data.order.number,
            success: res => {
              this.successToast('删除订单成功')
              if (this.data.order.order_type == 4 || this.data.order.order_type == 5) {
                setTimeout(res => {
                  wx.navigateBack({})
                }, 2000)
              } else {
                setTimeout(res => {
                  // wx.navigateBack({})
                  wx.reLaunch({
                    url: '/pages/orders/index/index',
                  })
                }, 2000)
              }
            },
            fail: res => {
              this.errorToast('删除失败, 请稍后再试')
            }
          })
        }
      }
    })
  },

  buyAgain: function (e) {
    if (this.data.order.order_type == 4 || this.data.order.order_type == 5) {
      // this.navigateTo('/group_buy/pages/products/index/index')
      wx.reLaunch({
        url: '/pages/index/index',
      })
      return true
    }
    if (Object.keys(this.data.order).length <= 0) {
      return false
    }

    // let product = this.data.order.line_items[0].product

    // this.navigateTo('/pages/products/show/index?id=' + product.id)
    // return false
    var order = this.data.order
    for(var i=0; i < order.line_items.length; i++) {
      let line_item = order.line_items[i]
      let product = line_item.product
      if (product.tags.length <= 0 || product.tags.indexOf('虚拟卡券') >= 0 || product.tags.indexOf('一元购') >= 0 || product.tags.indexOf('特殊商品') >= 0) {
        this.navigateTo('/pages/products/show/index?id=' + product.id)
        return false
      }

      let variant = null
      for(var j=0; j < product.variants.length; j++) {
        if (product.variants[j].id == line_item.variant_id) {
          variant = product.variants[j]
          break
        }
      }

      if (variant == null) {
        variant = product.master
      }

      let lineItem = {
        quantity: 1,
        variant_id: variant.id,
        price: variant.price,
        vip_price: variant.vip_price,
        origin_price: variant.origin_price,
        available_on: product.available_on,
        stock: variant.stock,
        store_id: product.store_id || '0',
        product: product,
        // variant: master,
        show_name: variant.show_name,
        limit_number: variant.limit_number,
        product_limit_number: product.limit_number
      }

      cartApi.addCart(lineItem)
    }

    wx.switchTab({
      url: '/pages/orders/cart/index',
    })
  },

  // 检查支付前是否需要弹框提示
  checkPayNotice: function () {
    var order = this.data.order
    var notice_flag = storage.getSync('pay_notice_flag')
    if (notice_flag) {
      // if (this.data.payMethod == 'brcb_pay') {
      //   this.getBrcbPayInfo(this.data.order)
      // } else  {
      //   this.payOrder()
      // }
      // this.showPayMethod()
      this.getBrcbPayInfo(this.data.order)
    } else {
      http.get({
        url: `api/orders/${order.number}/pay_notice`,
        success: res => {
          if (res.data.alert == 'on' && res.data.notice != null && res.data.notice.length > 0) {
            // this.hideCreateLoading()
            this.setData({
              payNotice: res.data.notice,
              showPayNotice: true,
              payOrder: order
            })
          } else {
            this.getBrcbPayInfo(this.data.order)
          }
        },
        fail: res => {
          if (getApp().globalData.brcbPayAvailable) {
            this.showPayMethod()
          } else {
            this.payOrder()
          }
        }
      })
    }
  },

  changePayNoticeProtocol: function () {
    this.setData({ payNoticeProtocolStatus: !this.data.payNoticeProtocolStatus })
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

  closePayNoticeToast: function () {
    this.setData({ showPayNotice: false })
    if (getApp().globalData.brcbPayAvailable) {
      this.showPayMethod()
    } else {
      this.payOrder()
    }
  },

  payOrder: function () {
    // 重要，支付
    // 取消支付后再次支付时，余额支付部分数据不可重新选择，否则会导致预支付出问题
    // 重要
    if (Object.keys(this.data.order).length <= 0) {
      return false
    }

    if (submitStatus) {
      return
    }
    submitStatus = true

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
          total: this.data.order.discount_total,
        },
        // cash_params: {
        //   total: '0.05',
        //   cash_ids: [1]
        // }
      }
    }

    if(this.data.order.balance_expend != null && this.data.order.balance_expend.status == 'lock'){
      if(this.data.order.balance_expend.cash_pre_total > 0){
        paramsData = this.calculateTotal(this.data.order.discount_total,this.data.order.balance_expend.cash_pre_total);
      }
    }else{
      if(this.data.isBalance){
        paramsData = this.calculateTotal(this.data.order.discount_total,this.data.balance);
      }
    }
    
    try {
      var data = {}
      http.post({
        url: `api/orders/${this.data.order.number}/pay`,
        // data: { pay_score_total: Math.round(this.data.order.discount_total * 100) },
        data: paramsData,
        success: (res) => {
          if(res.status != null && typeof(res.status) != 'undefined') {
            if(res.status == 'ok') {
              this.successToast('支付成功', 1000)
              if (this.data.order.order_type == 4 || this.data.order.order_type == 5) {
                this.checkSubscribeMessage([
                  "9i0Har0JOSN0fw2ZP8KD6chW_ySnKPVpk_leD8sNAWI",
                  "00m2x7rgBj45ghkRCSNMREsGoakf0KX3-gaXRzl-lQ8"
                ])
              } else {
                this.reflashOrder()
              }
              submitStatus = false
            } else {
              this.errorToast("支付失败, 请稍后再试")
              submitStatus = false
            }
          } else {
            if (res.data && res.data.pay_p != null) {
              this.wxPay(res.data.pay_p, res.data.pay_sign)
            } else {
              this.errorToast("支付失败, 请稍后再试")
              submitStatus = false
            }
          }
        },
        fail: (res) => {
          var msg = "支付失败, 请稍后再试"
          if (getApp().globalData.errorMap[res.data.code] != null) {
            msg = getApp().globalData.errorMap[res.data.code].msg_t
          }
          this.errorToast(msg)
          submitStatus = false
          this.reflashOrder()
        }
      })
      return false
    }
    catch (e) {
      console.log(e)
      this.errorToast("支付失败, 请稍后再试")
      submitStatus = false
      this.reflashOrder()
      return false
    }
  },

  wxPay: function (pay_params, pay_sign) {
    console.log('开始微信支付')

    wx.requestPayment({
      'timeStamp': pay_params.timeStamp,
      'nonceStr': pay_params.nonceStr,
      'package': pay_params.package,
      'signType': pay_params.signType,
      'paySign': pay_sign,
      'success': (res) => {
        this.successToast('支付成功', 1000)
        if (this.data.order.order_type == 4 || this.data.order.order_type == 5) {
          this.checkSubscribeMessage([
            "9i0Har0JOSN0fw2ZP8KD6chW_ySnKPVpk_leD8sNAWI",
            "00m2x7rgBj45ghkRCSNMREsGoakf0KX3-gaXRzl-lQ8"
          ])
        } else {
          this.reflashOrder()
        }
        submitStatus = false
      },
      'fail': (res) => {
        this.errorToast('支付失败', 1000)
        submitStatus = false
        this.reflashOrder()
      },
    })
  },

  reflashOrder: function () {
    http.get({
      url: 'api/orders/' + this.data.order.number,
      success: res => {
        if (res.data != null && Object.keys(res.data).length > 0) {
          this.setData({ order: res.data })
        } else {
          this.errorToast('获取订单信息失败，请稍后再试')
        }
      },
      fail: res => {
        this.errorToast('获取订单信息失败，请稍后再试')
      }
    })
  },

  cancelOrder: function (e) {
    if (Object.keys(this.data.order).length <= 0) {
      return false
    }
    wx.showModal({
      title: '取消订单',
      content: '您确定取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          http.put({
            url: 'api/orders/' + this.data.order.number + '/cancel_order',
            success: res => {
              this.successToast('取消订单成功')
              if (this.data.order.order_type == 4 || this.data.order.order_type == 5) {
                setTimeout(res => {
                  wx.navigateBack({})
                }, 500)
              } else {
                setTimeout( ()=>{
                  wx.reLaunch({
                    url: '/pages/orders/index/index',
                  })
                }, 500)
              }
            },
            fail: res => {
              this.errorToast('取消失败, 请稍后再试')
            }
          })
        }
      }
    })
  },

  orderService: function (e) {
    // if(this.data.orderServiceStatus.click != 'on') {
    //   this.errorToast('该订单不能申请售后')
    //   return false
    // }
    this.navigateTo("/orders/pages/service/index",{
      order: this.data.order
    })
  },

  copyExpress: function (e) {
    var item = e.currentTarget.dataset.item
    wx.setClipboardData({
      data: item,
    })
  },

  copyNumber: function () {
    wx.setClipboardData({
      data: this.data.order.number,
    })
  },

  getOrderServiceStatus: function (number) {
    http.get({
      url: 'api/sale_order_services/show_info',
      data: { order_number:  number },
      success: res => {
        let _data = {click: res.data.click}
        if (res.data != null && res.data.items != null) {
          res.data.items.forEach(item => {
            _data['item_' + item.id] = {
              status: item.status,
              state: item.state
            }
          })
        }
        this.setData({ orderServiceStatus: _data })
      }
    })
  },

  changeExpressExtend: function () {
    this.setData({
      expressExtend: !this.data.expressExtend
    })
  },

  gotoExpress: function (e) {
    let expresses = e.currentTarget.dataset.expresses
    if (expresses == null) {
      this.errorToast('获取快递信息出错')
      return
    }
    if(expresses.length > 1){
      this.navigateTo(`/pages/orders/expresses_list/index?expresses=${JSON.stringify(expresses)}&order_number=${this.data.order.number}`)
    }else{
      this.navigateTo(`/pages/orders/expresses/show?id=${expresses[0].express_number}&order_number=${this.data.order.number}`)
    }
  },
  
  gotoBuyGroup: function () {
    if (this.data.order.order_type != 4 && this.data.order.order_type != 5) {
      return false
    }

    if (this.data.order.group_buy_activity_id == null) {
      return false
    }

    let pages = getCurrentPages(); //页面对象
    let lastPage = pages[pages.length - 2]; //上一个页面对象
    let path = lastPage.route;

    if (path != null && path == 'group_buy/pages/orders/join/index') {
      this.navigateBack({ showSuccessPay: true })
    } else {
      this.navigateTo(`/group_buy/pages/orders/join/index?id=${this.data.order.group_buy_activity_id}`)
    }
  },

  checkSubscribeMessage: function (templateIds = []) {
    wx.getSetting({
      withSubscriptions: true,
      success: res => {
        if (res.subscriptionsSetting == null || res.subscriptionsSetting.itemSettings == null) {
          // console.error('订阅消息失败')
          this.subscribeMessage(templateIds)
          return false
        }
        
        for ( let key in templateIds ) {
          let item = templateIds[key]
          if (res.subscriptionsSetting.itemSettings[item] == 'reject') {
            setTimeout(res => {
              this.gotoBuyGroup()
            }, 1000)
            return false
          }
          if (res.subscriptionsSetting.itemSettings[item] != 'accept') {
            break
          }
        }

        this.subscribeMessage(templateIds)
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
        setTimeout(res => {
          this.gotoBuyGroup()
        }, 1000)
      },
      fail: res => {
        console.error('订阅消息失败')
        console.error(res)
        
        setTimeout(res => {
         this.gotoBuyGroup()
        }, 1000)
      }
    })
  },

  gotoProduct: function (e) {
    if(this.data.order.order_type == 4 || this.data.order.order_type == 5) {
      return false
    }
    var url = e.currentTarget.dataset.url
    this.navigateTo(url)
  },

  // 选择支付方式
  selectWxPay: function () {
    this.setData({ payMethod: 'wx_pay' })
  },

  selectBrcbPay: function () {
    this.setData({ payMethod: 'brcb_pay' })
  },

  hidePayMethod: function () {
    // this.hideCreateLoading()
    this.setData({ showPayMethodLayer: false })
  },

  closePay: function () {
    this.hidePayMethod()
    this.errorToast('支付取消', 800)
    this.setData({ submitStatus: submitStatus })
    // 关闭websokect监听
    this.closeSubscription()
  },

  showPayMethod: function () {
    var order = this.data.order;
    if(order.balance_expend != null && order.balance_expend.status == 'lock'){
      this.setData({ showPayMethodLayer: true })
    }else{
      if(this.data.isBalance != null){ 
        this.setData({ showPayMethodLayer: true }) 
        if(this.data.isBalance && order.discount_total - this.data.balance <= 0){//如果余额支付开启调用websocket 
          this.subscriptionOrder() 
        } 
      }else{ 
        var overtime = setTimeout(() => { 
          if(getBalanceTimer){ 
            clearInterval(getBalanceTimer) 
          } 
          this.setData({ showPayMethodLayer: true }) 
          if(this.data.isBalance && order.discount_total - this.data.balance <= 0){//如果余额支付开启调用websocket 
            this.subscriptionOrder() 
          } 
        }, 2000); 
        var getBalanceTimer = setInterval(() => { 
          if(this.data.isBalance != null){ 
            clearInterval(getBalanceTimer) 
            clearTimeout(overtime) 
            this.setData({ showPayMethodLayer: true }) 
            if(this.data.isBalance && order.discount_total - this.data.balance <= 0){//如果余额支付开启调用websocket 
              this.subscriptionOrder() 
            } 
          } 
        }, 500);
      }
    }
  },

  confirmPayMethod: function () {
    // this.createOrder()
    if (this.data.payMethod == 'brcb_pay') {
      this.checkPayNotice(this.data.order)
      // this.getBrcbPayInfo(this.data.order)
    } else {
      this.payOrder()
    }
    this.hidePayMethod()
  },

  //是否启用余额支付 
  switchBalance: function(e) { 
    this.setData({ 
      isBalance: e.detail.value 
    }) 
  }, 

  getBrcbPayInfo: function (order) {
    // 重要，支付
    // 取消支付后再次支付时，余额支付部分数据不可重新选择，否则会导致预支付出问题
    // 重要
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
          total: order.discount_total,
        },
      }
    }

    if(order.balance_expend != null && order.balance_expend.status == 'lock'){
      if( order.balance_expend.cash_pre_total > 0 ){
        paramsData = $this.calculateTotal(order.discount_total,order.balance_expend.cash_pre_total);
      }
    }else {
      if($this.data.isBalance){
        paramsData = $this.calculateTotal(order.discount_total,this.data.balance);
      }
    }

    try {
      var data = { }
      http.post({
        url: `api/orders/${order.number}/pay`,
        data: paramsData,
        success: function (res) {
          console.log(res)
          if (res.data && res.data.Signature != null) {
            // $this.wxPay(res.data.pay_p, res.data.pay_sign, order)
            $this.gotoBrcbPay(order, res.data)
          } else {
            $this.errorToast("支付失败, 请稍后再试", 1500)
            $this.reflashOrder()
            submitStatus = false
            $this.setData({ submitStatus: submitStatus })
          }
        },
        fail: function (res) {
          $this.errorToast("支付失败, 请稍后再试", 1500)
          $this.reflashOrder()
          submitStatus = false
          $this.setData({ submitStatus: submitStatus })
        }
      })
      return false
    }
    catch (e) {
      console.log(e)
      $this.errorToast("支付失败, 请稍后再试", 1500)
      $this.reflashOrder()
      submitStatus = false
      $this.setData({ submitStatus: submitStatus })
      return false
    }
  },

  gotoBrcbPay: function (order, data) {
    this.navigateTo(`/web/pages/brcb_pay/index/index?id=${order.number}`, data)
  },
  // 选择支付方式

  fetch_sale_services: function (order_number) {
    http.get({
      url: "api/sale_order_services",
      data: { order_number: order_number },
      success: res => {
        this.setData({ saleServices: res.data.result })
      }
    })
  },

  gotoSaleServiceShow: function (e) {
    let item = e.currentTarget.dataset.item
    if (item.id == null) { return }

    this.navigateTo(`/orders/pages/sale_services/show/index?id=${item.id}`)
  },
  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})