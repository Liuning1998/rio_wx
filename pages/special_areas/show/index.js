// pages/store/home/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    products: [],
    ads: [],
    searchInputStatus: false,
    fineProducts: [],
    navbarOpacity: false, 
    navbarBackgroundcolor: 'rgba(0,0,0,0.6)',
    pageTitle: '',
    pageNo: 1,
    currentStore: {},
    searchStyle: "",
    pageBottom: false,
    specialArea: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    let item_id = options.item_id
    // let item_id = 3

    // this.getCategories(item_id) // v1.2只展示手机卡所以不用调用分类接口
    this.getProducts(item_id)
    // this.getFineProducts(item_id) // v1.2只展示手机卡所以不用调用推荐商品接口
    this.getAds(item_id)
    this.setData({
      pageTitle: decodeURI(options.name) || "专区首页",
      currentStore: {
        id: item_id,
        name: decodeURI(options.name)
      },
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
      searchStatus: 2
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkNavbar()
    this.loadCartInfo()
  },

  getCategories: function (special_area_id) {
    http.get({
      url: `api/special_areas/${special_area_id}/categories`,
      data: {
        special_area_id: special_area_id
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.setData({ categories: res.data })
        }
      }
    })
  },

  onPullDownRefresh() {
    this.refreshData()
    // wx.stopPullDownRefresh()
    this.setData({ showLoading: true })
    this.stopPDRefresh()
  },

  refreshData: function () {
    // this.getCategories(this.data.currentStore.id) // v1.2只展示手机卡所以不用调用分类接口
    // this.getFineProducts(this.data.currentStore.id) // v1.2只展示手机卡所以不用调用推荐商品接口
    this.getAds(this.data.currentStore.id)
    this.setData({ products: [], pageNo: 1 })
    this.getProducts(this.data.currentStore.id, 1)
    this.hideSearchInput()
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 800)
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
      this.setData({ pageNo: this.data.pageNo + 1, pageBottom: false })
    } else {
      this.setData({ pageBottom: true })
    }

    this.stopPDRefresh()
  },

  getAds: function (special_area_id) {
    http.get({
      url: "/api/special_areas/" + special_area_id,
      success: res => {
        this.setData({ specialArea: res.data })
      }
    })
  },

  getProducts: function (special_area_id, pageNo) {
    http.get({
      // url: `api/special_areas/${special_area_id}/products`,//原专区接口
      url: `api/special_areas/${special_area_id}/phone_products`,//现请求手机卡接口
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

  getFineProducts: function (special_area_id) {
    http.get({
      url: `api/special_areas/${special_area_id}/fine_products`,
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.setData({ fineProducts: res.data })
        }
      }
    })
  },

  showSearchInput: function () {
    this.setData({ searchInputStatus: true})
    setTimeout(res => {
      this.setData({ focus: true })
    }, 50)
    
  },

  hideSearchInput: function () {
    this.setData({ searchInputStatus: false, focus: false, searchText: null })
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    wx.createSelectorQuery().select('.ads-container').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 0) {
          if (!this.data.navbarOpacity) {
            this.setData({ 
              navbarOpacity: true, navbarBackgroundcolor: '#666666',
              searchStatus: 1
            })
          }
        } else {
          this.setData({ 
            navbarOpacity: false, navbarBackgroundcolor: 'rgba(0,0,0,0.6)',
            searchStatus: 2
          })
        }
      }
    }).exec()
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  gotoCategory: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo(`/products/pages/index/index?pageType=category&special_area_id=${this.data.currentStore.id}`,
      {
        'category': item
      }
    )
  },

  searchProducts: function () {
    if (this.data.searchText == null || this.data.searchText.length <= 0) {
      return false
    }
    this.navigateTo(`/products/pages/search/index?searchKey=${this.data.searchText}&special_area_id=${this.data.currentStore.id}&store_name=${this.data.currentStore.name}`)
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  clearSearchText: function (e) {
    this.setData({ searchText: null, focus: true })
  },

  onReachBottom: function () {
    this.getProducts(this.data.currentStore.id)
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