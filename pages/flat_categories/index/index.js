// pages/flat_categories/index/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    currentCategory: {},
    products: {},
    currentIndex: 0,
    showLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.fetchCategories()
  },

  onShow: function () {
    this.loadCartInfo()
    this.cancelSearch()
  },

  // GET  /api/platform_categories
  fetchCategories: function () {
    http.get({
      url: 'api/platform_categories',
      success: res => {
        this.setData({ categories: res.data })
        var defaultCategory = res.data.filter(item => item.sort_value)[0] || res.data[0]
        
        if (defaultCategory != null) {
          if (this.data.currentCategory == null || Object.keys(this.data.currentCategory).length <= 0) {
            this.setData({currentCategory: defaultCategory})
          }
          this.fetchProducts(defaultCategory.id)
        }
      }
    })
  },

  fetchProducts: function (categoryId, refresh) {
    if (categoryId == null) { return false }
    var key = `products_${categoryId}`
    var length = 0
    if (this.data[key] != null) {
      length = this.data[key].length
    }
    var page = Math.floor(length/getApp().globalData.perPage) + 1
    if (refresh) {
      page = 1
    }

    http.get({
      url: `api/platform_categories/${categoryId}`,
      data: {
        page: page
      },
      success: res => {
        if (refresh) {
          this.setData({ products: {} })
        }
        this.stopPDRefresh()
        this.appendProduct(res.data, categoryId)
      }
    })
  },

  appendProduct: function (resProducts, categoryId) {
    var key = `id_${categoryId}`
    var products = this.data.products[key] || []
    var currentIndex = products.length
    for(var i in resProducts) {
      var product = resProducts[i]
      if (product == null) { continue }
      if (products.length <= 0 || products.filter(item => item.id == product.id).length <= 0) {
        var dataKey = `products.${key}[${currentIndex}]`
        this.setData({ [dataKey]: product })
        currentIndex += 1
      }
    }
  },

  onReachBottom: function () {
    if (this.data.currentCategory != null) {
      this.fetchProducts(this.data.currentCategory.id)
    }
  },

  changeCategory: function (e) {
    var category = e.currentTarget.dataset.item
    if (category == null || category.id == this.data.currentCategory.id) {
      return false
    }

    this.setData({ currentCategory: category })
    var key = `id_${category.id}`
    if (this.data.products[key] == null || this.data.products[key].length < 5) {
      this.fetchProducts(category.id)
    }

    this.setCurentIndex(category, this.data.categories)
  },

  setCurentIndex: function (current, categroies) {
    var index = 0
    for(var i in categroies) {
      if (categroies[i].id == current.id) {
        index = i
        break
      }
    }

    this.setData({ currentIndex: index })
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  clearSearchInput: function () {
    this.setData({ searchKey: '' })
    this.focusSearchInput()
  },

  focusSearchInput: function () {
    this.setData({ searchFocus: true })
  },

  clearFocusSearchInput: function () {
    this.setData({ searchFocus: false })
  },

  showSearchLayer: function () {
    this.setData({ showSearch: true, searchFocus: true })
  },

  cancelSearch: function () {
    this.setData({ showSearch: false, searchKey: '' })
  },

  search: function () {
    if (this.data.searchKey.length <= 0) {
      return
    }

    // console.log('sss')
    this.navigateTo("/products/pages/search_all/index?searchKey="+this.data.searchKey)
  },
  
  onPullDownRefresh() {
    // this.refreshData()
    this.setData({ showLoading: true })
    this.fetchProducts(this.data.currentCategory.id, true)
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 1000)
  },
})