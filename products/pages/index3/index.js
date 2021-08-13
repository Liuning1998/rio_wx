// products/pages/index/index.js
// 排行榜页面、热门精选
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
    brand: null,
    navbarColor: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let brand = this.params.brand

    if (options.navbarColor == 'dark') {
      this.setData({ navbarColor: 'dark' })
      wx.setNavigationBarColor({
        backgroundColor: '#ffffff',
        frontColor: '#000000',
      })
    }

    if (brand == null) {
      this.getBrand(options.id)
    } else {
      this.setData({ brand: brand })
    }

    this.setData({ tagName: decodeURI(options.tag_name), tagID: options.tag_id, sortBadge: options.sort_badge })
    this.getProducts(decodeURI(options.tag_name), 1, null)
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

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    // if (this.data.navbarColor == 'dark') { return }
    wx.createSelectorQuery().select('.ad-image').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 0) {
          if (!this.data.scollStatus) {
            this.setData({ 
              scollStatus: true
            })

            wx.setNavigationBarColor({
              backgroundColor: '#ffffff',
              frontColor: '#000000',
            })
          }
        } else {
          this.setData({ 
            scollStatus: false
          })

          if (this.data.navbarColor != 'dark') {
            wx.setNavigationBarColor({
              backgroundColor: '#000000',
              frontColor: '#ffffff',
            })
          }          
        }
      }
    }).exec()
  },
})