// pages/orders/index/index.js
var http = require('../../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    active: "all", // 'all', 'completed', 'new', 'paid', 'shipping', 'completed'
    orders: [],
    loaded: false,
    emptyStatus: false,
    secondLoad: false,
    showLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.fetchOrders()
  },

  onShow: function () {
    if (this.data.secondLoad) {
      this.refreshData()
    }
    this.setData({ secondLoad: true })
    this.resetUerInfo()
  },

  fetchOrders: function () {

    var params = this.queryParams()
    http.get({
      url: 'api/orders',
      data: params,
      success: res => {
        if(res.data != null && res.data.length > 0) {
          this.appendOrders(res.data)
          this.setData({ emptyStatus: false })
        } else {
          if (params['page'] == 1) {
            this.setData({ emptyStatus: true })
          }
        }
      },
      fail: res => {
        if(res.data.code == 100105) {
          this.setData({ emptyStatus: true })
          this.refreshData()
        }
      }
    })
  },

  queryParams: function () {
   
    let params = {q: { order_type_eq: '1' }}
   
    params.page = Math.ceil((this.data.orders.filter(item => item != 'deleted').length + 1)/getApp().globalData.perPage)
    if(params.page <= 0) {
      params.page = 1
    }
    return params
  },

  appendOrders: function (orders) {
    if (orders.length > 0) {
      this.setData({ emptyStatus: false })
    }
    
    let _datas = this.data.orders
    let offset = _datas.length
    for(let i=0; i < orders.length; i++) {
      let item = orders[i]
      if (_datas.filter(d => d.number == item.number).length <= 0) {
        let key = `orders[${offset}]`
        this.setData({ [key]: item })
        offset = offset + 1
      }
    }
  },

  onReachBottom: function () {
    this.fetchOrders()
  },

  // 删除订单
  deleteOrder: function (e) {
    var order = e.currentTarget.dataset.order
    wx.showModal({
      title: '删除订单',
      content: '您确定删除该订单吗？',
      success: (res) => {
        if (res.confirm) {
          http.delete({
            url: 'api/orders/' + order.number,
            success: res => {
              this.delOrderForData(order)
              this.successToast('删除订单成功')
            },
            fail: res => {
              this.errorToast('删除失败, 请稍后再试')
            }
          })
        }
      }
    })
  },

  delOrderForData: function (order) {
    
    let offset = null
    let orders = this.data.orders
    for (let i=0; i < orders.length; i++) {
      if(orders[i].number == order.number) {
        offset = i
        break
      }
    }
    if (offset != null) {
      let key = `orders[${offset}]`
      this.setData({ [key]: 'deleted' })
    }

    if (this.data.orders.filter(item => item != 'deleted').length <= 4) {
      this.fetchOrders()
    }
  },

  
  cancelOrder: function (e) {
    var order = e.currentTarget.dataset.order
    wx.showModal({
      title: '取消订单',
      content: '您确定取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          http.put({
            url: 'api/orders/' + order.number + '/cancel_order',
            success: res => {
              this.cancelOrderForData(order)
              this.successToast('取消订单成功')
            },
            fail: res => {
              this.errorToast('取消失败, 请稍后再试')
            }
          })
        }
      }
    })
  },

  cancelOrderForData: function (order) {
    let offset = null
    let orders = this.data.orders['allOrders']

    // 处理全部订单里的数据
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].number == order.number) {
        offset = i
        break
      }
    }
    if (offset != null) {
      let key = `orders.allOrders[${offset}].state`
      let key1 = `orders.allOrders[${offset}].state_t`
      this.setData({ [key]: 'handle_canceled', [key1]: '已取消' })
    }

    // 处理待支付里的数据
    offset = null
    orders = this.data.orders['newOrders']
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].number == order.number) {
        offset = i
        break
      }
    }
    if (offset != null) {
      let key = `orders.newOrders[${offset}]`
      this.setData({ [key]: 'deleted' })
    }
  },

  gotoHome: function () {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  onPullDownRefresh() {
    this.refreshData()
    // wx.stopPullDownRefresh()
    this.setData({ showLoading: true })
  },

  refreshData: function () {
    let params = { q: { order_type_eq: '1' } }
    params.page = 1

    http.get({
      url: 'api/orders',
      data: params,
      success: res => {
        // if (res.data != null && res.data.length > 0) {
        //   this.appendOrders(res.data, state)
        // }
        this.replaceOrders(res.data)
        if( res.data != null && res.data.length >= 0) {
          this.setData({ emptyStatus: false })
        }
        // wx.stopPullDownRefresh()
        this.stopPDRefresh()
      },
      fail: res => {
        if (res.data.code == 100105) {
          this.setData({ 
            emptyStatus: true,
            orders: []
          })
        }
        // wx.stopPullDownRefresh()
        this.stopPDRefresh()
      }
    })

    this.resetUerInfo()
  },

  replaceOrders: function (data) {
    if (data == null || data.length <= 0) {
      let _key = `orders`
      this.setData({
        [_key]: []
      })
      return
    }

    let offset = 0
    for(let i = 0; i < data.length; i++) {
      // if(data[i].number != orders[i].number || data[i].)
      let _key = `orders[${i}]`
      this.setData({
        [_key]: data[i]
      })
    }

    this.setData({
      orders: data
    })
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 500)
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {
    
  // }
})