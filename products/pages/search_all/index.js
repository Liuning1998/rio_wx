// products/pages/index/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    pageNo: 1,
    searchText: null,
    pageTitle: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    var pageTitle = '搜索商品'

    this.setData({ 
      searchText: options.searchKey, 
      special_area_id: options.special_area_id,
      pageTitle: pageTitle
    })
    this.getProducts(options.searchKey, 1, null)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
  },

  getProducts: function (searchKey, pageNo, orderType, refresh) {
    let _data = {
      search_key: searchKey,
      page: pageNo || 1
    }

    if (orderType != null) {
      _data.order = orderType
    }
    http.get({
      url: 'api/search',
      data: _data,
      success: res => {
        
        if (res.data != null && res.data.constructor.name == 'Array') {
          if (refresh) {
            let pageNo = 1
            if (res.data.length >= 10) { pageNo = 2 }
            this.setData({ products: res.data, loaded: true, pageNo: pageNo })
          } else {
            this.appendProducts(res.data)
          }
          // this.setData({ products: res.data })
        }
      }
    })
  },

  appendProducts: function (data) {
    let products = this.data.products
    let offset = products.length

    data.forEach(item => {
      if (products.filter(i => i.id == item.id).length <= 0) {
        products.push(item)
        let key = `products.[${offset}]`
        this.setData({ [key]: item })
        offset += 1
      }
    })

    if (data.length >= getApp().globalData.perPage) {
      this.setData({ pageNo: this.data.pageNo + 1 })
    }

    this.setData({ loaded: true })

    // this.stopPDRefresh()
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  clearSearchText: function (e) {
    this.setData({ searchText: null, focus: true })
  },

  searchProducts: function (e) {
    this.setData({pageNo: 1, loaded: false})
    this.getProducts(this.data.searchText, 1, this.data.orderType, true)
  },

  onReachBottom: function () {
    this.getProducts(this.data.searchText, this.data.pageNo, this.data.orderType)
  },

  changeOrder: function (e) {
    var orderType = e.currentTarget.dataset.orderType

    if (orderType == 'price') {
      if (this.data.orderType == 'price down') {
        orderType = "price up"
      } else {
        orderType = "price down"
      }
    } else {
      orderType = null
    }

    this.setData({
      orderType: orderType
    })

    this.getProducts(this.data.searchText, 1, orderType, true)
  },

  clearSearchText: function (e) {
    this.setData({ searchText: null, focus: true })
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.switchTab({
        url: '/pages/index/index',
      })
    }

  },
})