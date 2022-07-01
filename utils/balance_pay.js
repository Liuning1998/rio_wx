var http = require('./http.js')
var websocket = require('./websocket.js')
var md5 = require('./md5.js')

//全局websocket超时时间
const socketTimeOut = 1000 * 60 * 30;
//websocket等待结果时间
const waitInfo = 1000 * 6;
//延时跳转时间
const waitGoPage = 1000 * 5
//房间号
var roomId = null;
// 手动查询支付结果定时器
var timer = ''
// 页面跳转定时器
var pageTimer = ''
//page(pay/detail)
var pagePath = '';

var payFun = {
  //返回首页
  goHome:function() {
    wx.switchTab({
      url: '/pages/index/index',
    })
    clearTimeout(pageTimer)
  },
  //查看订单
  goOrder:function() {
    if(this.data.order){
      // this.redirectTo("/pages/orders/show/index?id=" + this.data.order.number)
      wx.reLaunch({
        url: '/pages/orders/index/index',
      })
    }else{
      return false
    }
    clearTimeout(pageTimer)
  },
  detailGoOrder:function() {
    if(pageTimer != ''){
      clearTimeout(pageTimer)
    }
    wx.reLaunch({
      url: '/pages/orders/index/index',
    })
  },
  detailGoOrderFail:function() {
    if(pageTimer != ''){
      clearTimeout(pageTimer)
    }
    this.setData({
      balancePayResult: null
    })
  },
  getAccountBalance: function (page){
    pagePath = page
    http.get({
      url: 'api/accounts/fetch_account_balance',
      success: res => {
        this.setData({
          balance: res.data.balance
        })
        if(res.data.balance <= 0 || this.data.showPayMethodLayer == true){
          this.setData({ isBalance: false })
        }else{
          this.setData({ isBalance: true })
        }
      },
    })
  },
  //创建订单后建立websocket连接
  subscriptionOrder: function() {
    var socketTask = null
    socketTask = websocket.connect()
    this.setData({ socketTask: socketTask })

    roomId = md5(this.data.userInfo.phone);

    var timeOut = setTimeout(()=>{
      this.closeSubscription()
    },socketTimeOut)

    socketTask.subscription('PayChannel', roomId, (data) => {
      this.listen(data)
    })
  },
  // websocket监听是否返回支付结果
  listen: function(data) {
    try {
      if (data.message.msg == '支付成功'){
        
        clearTimeout(timer)
        this.modifySubmitStatus(false)
        console.log(pagePath,'支付成功页面')
        if(pagePath == 'detail'){
          this.reflashOrder()
          wx.hideLoading()
          this.setData({
            balancePayResult:true,
          })
        }else{
          wx.hideLoading()
          this.setData({ 
            submitStatus: false,
            balancePayResult:true,
           })
          pageTimer = setTimeout(()=>{
            // this.redirectTo("/pages/orders/show/index?id=" + this.data.order.number)
            wx.reLaunch({
              url: '/pages/orders/index/index',
            })
          },waitGoPage)
        }
      }
    }
    catch (e){
      // console.log(e)
    }

  },
  // 调用商品详情接口
  getPayResult: function(number) {
    console.log('调用商品详情接口')
    http.get({
      url: 'api/orders/'+number,
      success: res => {
        if (res.data != null && Object.keys(res.data).length >0) {
          if(res.data.payment_state == 'completed'){
            
            this.modifySubmitStatus(false)
            
            if(pagePath == 'detail'){
              this.reflashOrder()
              wx.hideLoading()
              this.setData({
                balancePayResult:true,
              })
            }else{
              wx.hideLoading()
              this.setData({ 
                submitStatus: false,
                balancePayResult:true,
               })
              pageTimer = setTimeout(()=>{
                // this.redirectTo("/pages/orders/show/index?id=" + number)
                wx.reLaunch({
                  url: '/pages/orders/index/index',
                })
              },waitGoPage)
            }
          }else{
            
            this.modifySubmitStatus(false)
            
            if(pagePath == 'detail'){
              wx.hideLoading()
              this.reflashOrder()
              this.setData({
                balancePayResult:false,
              })
            }else{
              wx.hideLoading()
              this.setData({ 
                submitStatus: false,
                balancePayResult:false,
               })
              pageTimer = setTimeout(()=>{
                // this.redirectTo("/pages/orders/show/index?id=" + number)
                wx.reLaunch({
                  url: '/pages/orders/index/index',
                })
              },waitGoPage)
            }
          }
        }
      },
      fail: res => {
        this.modifySubmitStatus(false)

        if(pagePath == 'detail'){
          wx.hideLoading()
          this.reflashOrder()
          this.setData({
            balancePayResult:false,
          })
        }else{
          wx.hideLoading()
          this.setData({ 
            submitStatus: false,
            balancePayResult:false,
           })
          pageTimer = setTimeout(()=>{
            // this.redirectTo("/pages/orders/show/index?id=" + number)
            wx.reLaunch({
              url: '/pages/orders/index/index',
            })
          },waitGoPage)
        }
      }
    })
  },
  // 关闭websocket连接
  closeSubscription: function() {
    if (this.data.socketTask != null) {
      console.log('关闭websocket连接')
      try {
        this.data.socketTask.close()
      } catch (error) {
        console.log(error)
      }
      this.setData({ socketTask: null })
    }
  },
  //计算抵扣余额后的钱数和余额
  calculateTotal: function(total,balance){
    var balance = parseFloat(balance)
    var total = parseFloat(total)
    switch(this.data.payMethod){
        case 'wx_pay':
          if(total - balance > 0){
            return {
              pay_params: {
                wx_pay_params: {
                  total: (total - balance).toFixed(2),
                },
                cash_params: {
                  total: balance.toFixed(2),
                }
              }
            }
          }else{
            return false
          }
          break
        case 'brcb_pay':
          if(total - balance > 0){
            return {
              pay_params: {
                brcb_pay_params: {
                  // total: '1',
                  total: (total - balance).toFixed(2),
                },
                cash_params: {
                  total: balance.toFixed(2),
                }
              }
            }
          }else{
            return false
          }
    }
  },
  //纯余额支付
  getBalancePayInfo: function(){
    var $this = this
    var order = $this.data.order
    wx.showLoading({mask: true})
    //点击确定支付创建定时器n秒后查询支付结果
    timer = setTimeout(() => {
      // 取消监听手动调用详情接口查询支付结果
      $this.closeSubscription();
      $this.getPayResult($this.data.order.number)
    },waitInfo)

    if(pagePath == 'detail'){
      if (this.getSubmitStatus()) {
        return
      }
      this.modifySubmitStatus(true)
      this.hidePayMethod()
    }else{
      this.setData({ showPayMethodLayer: false })
    }

    var paramsData = {
      pay_params: {
        cash_params: {
          total: order.discount_total,
        },
      },
      room_number:md5($this.data.userInfo.phone)
    }
    
    try {
      http.post({
        url: `api/orders/${order.number}/pay`,
        // data: { pay_score_total: Math.round($this.data.storeCart.total * 100) },
        data: paramsData,
        success: function (res) {
          
        },
        fail: function (res) {
        }
      })
      return false
    }
    catch (e) {
      console.log(e)
    }
  },
  //关闭定时器(加自动跳转代码的页面都要关闭---onUnload)
  closeTimer:function() {
    if(pageTimer != ''){
      clearTimeout(pageTimer)
    }
  }
    
}
function extend (content) {
  for (var key in payFun) {
    content[key] = payFun[key]
  }
}
module.exports = {
  extend:extend
}