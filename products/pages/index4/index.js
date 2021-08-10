// products/pages/index/index.js
// 由专区进入的商品列表页面，1元购，养老卡特惠
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
    navbarColor: null,
    pageTitle: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let item_id = options.item_id

    if (options.navbarColor == 'dark') {
      this.setData({ navbarColor: 'dark' })
      wx.setNavigationBarColor({
        backgroundColor: '#ffffff',
        frontColor: '#000000',
      })
    }

    this.setData({ 
      sortBadge: options.sort_badge, 
      pageTitle: options.name || "商品列表",
      special_area_id: item_id
    })
    this.getProducts(item_id)
    this.getAds(item_id)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
  },

  getProducts: function (special_area_id, pageNo) {
    http.get({
      url: `api/special_areas/${special_area_id}/products`,
      data: {
        page: pageNo || this.data.pageNo,
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          // this.setData({ products: res.data })
          this.appendProducts(res.data)
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

    this.getProducts(this.data.special_area_id, 1)
  },

  onReachBottom: function () {
    this.getProducts(this.data.special_area_id, this.data.pageNo)
  },


  goback: function () {
    wx.navigateBack({})
  },

  getAds: function (special_area_id) {
    http.get({
      url: "/api/special_areas/" + special_area_id,
      success: res => {
        this.setData({ specialArea: res.data })
      }
    })
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