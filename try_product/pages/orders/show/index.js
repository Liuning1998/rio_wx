// pages/orders/show/index.js
var http = require('../../../../utils/http.js')

var submitStatus = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: {},
    expressExtend: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let number = options.id
    // let number = '23508061315614538899'
    http.get({
      url: 'api/orders/'+number,
      success: res => {
        console.log(res)
        if (res.data != null && Object.keys(res.data).length >0) {
          this.setData({ order: res.data })
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
  },

  onShow: function () {
    if(this.data.shown == null) {
      this.setData({ shown: true })
    } else {
      http.get({
        url: 'api/orders/' + this.data.order.number,
        success: res => {
          console.log(res)
          if (res.data != null && Object.keys(res.data).length > 0) {
            this.setData({ order: res.data })
          }
        }
      })
    }
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
              setTimeout(res => {
                // wx.navigateBack({})
                wx.reLaunch({
                  url: '/pages/orders/index/index',
                })
              }, 2000)
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
    if (Object.keys(this.data.order).length <= 0) {
      return false
    }

    let product = this.data.order.line_items[0].product

    this.navigateTo('/pages/products/show/index?id=' + product.id)
    return false
  },

  payOrder: function () {
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
          total: this.data.order.total,
          // cash_ids: [1]
        }
      }
    }

    try {
      var data = {}
      http.post({
        url: `api/orders/${this.data.order.number}/pay`,
        // data: { pay_score_total: Math.round(this.data.order.total * 100) },
        data: paramsData,
        success: (res) => {
          if (res.data && res.data.pay_p != null) {
            this.wxPay(res.data.pay_p, res.data.pay_sign)
          } else {
            this.errorToast("支付失败, 请稍后再试")
            submitStatus = false
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
        this.reflashOrder()
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
              setTimeout( ()=>{
                wx.reLaunch({
                  url: '/pages/orders/index/index',
                })
              }, 500) 
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
    if(this.data.orderServiceStatus.click != 'on') {
      this.errorToast('该订单不能申请售后')
      return false
    }
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

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})