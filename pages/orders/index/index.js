// pages/orders/index/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    active: "all", // 'all', 'completed', 'new', 'paid', 'shipping', 'completed'
    orders: {
      allOrders: [],
      completedOrders: [],
      newOrders: [],
      paidOrders: [],
      shippingOrders: [],
      saleServiceOrders: [],
    },
    loaded: {
      all: false,
      completed: false,
      new: false,
      paid: false,
      shipping: false,
      saleService: false
    },
    emptyStatus: false,
    secondLoad: false,
    showLoading: false,
    nowTime: Math.ceil((new Date).getTime()/1000)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    let _state = options.state || 'all'
    this.setData({ active: _state })
    this.fetchOrders(_state)
  },

  onShow: function () {
    if (this.data.secondLoad) {
      this.refreshData()
    }
    this.setData({ secondLoad: true })
    this.resetUerInfo()
    this.setNowTime()
  },

  fetchOrders: function (state) {
    state = state || this.data.active

    var params = this.queryParams(state)
    http.get({
      url: 'api/orders',
      data: params,
      success: res => {
        if (res.data.err == 'err') {
          this.setData({ emptyStatus: true })
          return
        }
        if(res.data != null && res.data.length > 0) {
          this.appendOrders(res.data, state)
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

  queryParams: function (state) {
    state = state || this.data.active
    let params = {q: { order_type_not_eq: '1' }}
    if (state == 'saleService') {
      params.q.state_not_in = ['new', 'canceled', 'handle_canceled', 'deleted']
      params.q.order_type_eq = 2
      delete params.q.order_type_not_in
    } else if ( state == 'completed' ) {
      params.q.sale_state_blank = true
      params.q.state_eq = state
    } else if (state != 'all') {
      params.q.state_eq = state
    }
    params.page = Math.ceil((this.data.orders[state+'Orders'].filter(item => item != 'deleted').length + 1)/getApp().globalData.perPage)
    if(params.page <= 0) {
      params.page = 1
    }
    return params
  },

  appendOrders: function (orders, state) {
    if (orders.length > 0) {
      this.setData({ emptyStatus: false })
    }
    state = state || this.data.active
    
    let _datas = this.data.orders[state+'Orders']
    let offset = _datas.length
    for(let i=0; i < orders.length; i++) {
      let item = orders[i]
      if (_datas.filter(d => d.number == item.number).length <= 0) {
        let key = `orders.${state}Orders[${offset}]`
        this.setData({ [key]: item })
        offset = offset + 1
      }
    }
  },

  changeTab: function (e) {
    var targetState = e.currentTarget.dataset.state
    this.setData({ active: targetState, emptyStatus: false })
    if (this.data.orders[targetState + 'Orders'].filter(item => item != 'deleted').length <= 4) {
      this.fetchOrders(targetState)
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
    let states = ['all', 'completed', 'new', 'paid', 'shipping', 'saleService']
    for (let k=0; k < states.length; k++) {
      let offset = null
      let state = states[k]
      let orders = this.data.orders[state + 'Orders']
      for (let i=0; i < orders.length; i++) {
        if(orders[i].number == order.number) {
          offset = i
          break
        }
      }
      if (offset != null) {
        let key = `orders.${state}Orders[${offset}]`
        this.setData({ [key]: 'deleted' })
      }
    }

    if (this.data.orders[this.data.active + 'Orders'].filter(item => item != 'deleted').length <= 4) {
      this.fetchOrders()
    }
  },

  buyAgain: function (e) {
    var order = e.currentTarget.dataset.order
    // let product = order.line_items[0].product

    // this.navigateTo('/pages/products/show/index?id=' + product.id)
    // return false

    for(var i=0; i < order.line_items.length; i++) {
      let line_item = order.line_items[i]
      let product = line_item.product
      if (product.tags.length <= 0 || product.tags.indexOf('虚拟卡券') >= 0 || product.tags.indexOf('一元购') >= 0) {
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
    let state = this.data.active

    let params = { q: { order_type_not_eq: '1' } }

    if (state == 'saleService') {
      params.q.state_not_in = ['new', 'canceled', 'handle_canceled', 'deleted']
      params.q.order_type_eq = 2
      delete params.q.order_type_not_in
    } else if (state != 'all') {
      params.q.state_eq = state
    }
    params.page = 1

    http.get({
      url: 'api/orders',
      data: params,
      success: res => {
        // if (res.data != null && res.data.length > 0) {
        //   this.appendOrders(res.data, state)
        // }
        if (res.data.err == 'err' || res.data.length <= 0) {
          this.setData({ emptyStatus: true })
          this.stopPDRefresh()
          return
        }

        this.replaceOrders(res.data, state)
        this.setData({ emptyStatus: false })
        // wx.stopPullDownRefresh()
        this.stopPDRefresh()
      },
      fail: res => {
        if (res.data.code == 100105) {
          this.setData({ 
            emptyStatus: true,
            orders: {
              allOrders: [],
              completedOrders: [],
              newOrders: [],
              paidOrders: [],
              shippingOrders: [],
            }
          })
        }
        // wx.stopPullDownRefresh()
        this.stopPDRefresh()
      }
    })

    this.resetUerInfo()
  },

  replaceOrders: function (data, state) {
    // let orders = {
    //   allOrders: [],
    //   completedOrders: [],
    //   newOrders: [],
    // }
    // delete orders[state + 'Orders']
    // this.setData({
    //   orders
    // })

    let _states = ['all', 'new', 'completed', 'saleService']
    for(var i=0; i < _states.length; i++) {
      if (_states[i] != state) {
        this.setData({
          [`orders.${_states[i]}Orders`]: []
        })
      }
    }

    if (data == null || data.length <= 0) {
      let _key = `orders.${state}Orders`
      this.setData({
        [_key]: []
      })
      return
    }

    let offset = 0
    for(let i = 0; i < data.length; i++) {
      // if(data[i].number != orders[i].number || data[i].)
      let _key = `orders.${state}Orders[${i}]`
      this.setData({
        [_key]: data[i]
      })
    }

    this.setData({
      [`orders.${state}Orders`]: data
    })
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 500)
  },

  orderService: function (e) {
    var order = e.currentTarget.dataset.order
    // if(this.data.orderServiceStatus.click != 'on') {
    //   this.errorToast('该订单不能申请售后')
    //   return false
    // }
    this.navigateTo("/orders/pages/service/index",{
      order: order
    })
  },

  setNowTime: function () {
    this.setData({ nowTime: Math.ceil((new Date).getTime()/1000) })
    setTimeout( res => 
      this.setNowTime(), 1000)
  }

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {
    
  // }
})