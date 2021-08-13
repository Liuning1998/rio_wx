// products/pages/index/index.js
// 商城按标签分类商品列表
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    pageNo: 1,
    loaded: false,
    tagName: null,
    tagID: null,
    navbarBackgroundcolor: 'rgba(0,0,0,0)',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let brand = this.params.brand
    if (brand == null) {
      // this.getBrand(2)
      this.getBrand(options.id)
    } else {
      this.setData({ brand: brand })
    }

    this.setData({ 
      tagName: decodeURI(options.tag_name),
      tagID: options.tag_id,
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight 
    })
    this.getProducts(decodeURI(options.tag_name), 1, null)
    // this.getProducts('休闲零食', 1, null)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
  },

  getProducts: function (tagName, pageNo, orderType, refresh) {
    let _data = {
      tags_name_eq: tagName,
      page: pageNo || 1
    }

    if (orderType != null) {
      _data.order = orderType
    }

    http.get({
      url: 'api/products/scope_tag',
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

          if (res.data.length < 10) {
            this.setData({ pageBottom: true })
          } else {
            this.setData({ pageBottom: false })
          }
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

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  addCart: function (e) {
    var item = e.currentTarget.dataset.item
    let master = item.variants.filter(variant => variant.is_master)[0]
    if (master == null) {
      return
    }

    let lineItem = {
      quantity: 1,
      variant_id: master.id,
      price: master.price,
      vip_price: master.vip_price,
      origin_price: master.origin_price,
      available_on: master.available_on,
      stock: master.stock,
      store_id: master.store_id || '0',
      product: item,
      // variant: master,
      show_name: master.show_name
    }

    let cart = cartApi.addCart(lineItem)
    this.setData({ cartData: cart })
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

    this.getProducts(this.data.tagName, 1, orderType, true)
  },

  onReachBottom: function () {
    this.getProducts(this.data.tagName, this.data.pageNo, this.data.orderType)
  },

  getBrand: function(id) {
    http.get({
      url: `api/home_brands/${id}`,
      success: res => {
        if (res.data != null) {
          this.setData({ brand: res.data })
        }
      }
    })
  },

  pageScroll: function () {
    wx.createSelectorQuery().select('.position-location').boundingClientRect(res => {
      if (res != null) {
        if(res.top < (this.data.pageMarginTop + 44)) {
          this.setData({ menuStatus: 'fixed' })
        } else {
          this.setData({ menuStatus: 'initial' })
        }
      }
    }).exec()
  },

  changeNavbar: function () {
    wx.createSelectorQuery().select('.position-location').boundingClientRect(res => {
      if (res != null) {
        if(res.top < (this.data.pageMarginTop + 44)) {
          this.setData({ menuStatus: 'fixed' })
        } else {
          this.setData({ menuStatus: 'initial' })
        }
      }
    }).exec()

    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    wx.createSelectorQuery().select('.page-container').boundingClientRect(res => {
      if (res != null) {
        if (res.top < -50) {
          if (!this.data.navbarOpacity) {
            this.setData({ 
              navbarOpacity: true, navbarBackgroundcolor: '#666666',
              searchStatus: 1
            })
          }
        } else {
          this.setData({ 
            navbarOpacity: false, navbarBackgroundcolor: 'rgba(0,0,0,0)',
            searchStatus: 2
          })
        }
      }
    }).exec()
  },

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }

  }
})