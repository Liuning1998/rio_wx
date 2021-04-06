// pages/products/show/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    swiperCurrent: 0,
    currentVariant: null,
    showVariantLayer: false,
    variants: null,
    quantity: 1,
    optionTypes: null,
    available: true,
    showSelectContainer: false,
    navbarStatus: true,
    navbarActive: 1,
    submitType: null,
    productType: null, // 1 虚拟卡券, 2 实物, 3 一元购商品
    optionIds: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getProductDetail(options.id)
    // this.getProductDetail('wkm3')

    this.setData({ isIphoneX: getApp().isIphoneX() })
  },

  onShow: function () {
    if (this.data.product != null && this.data.product.id != null) {
      // this.setData({ showSelectContainer: false })
      this.getProductDetail(this.data.product.id)
    }

    this.loadCartInfo()
  },

  getProductDetail: function (id) {
    http.get({
      url: "api/products/" + id,
      success: (res) => {
        var _product = res.data.product
        let _currentVariant
        let optionIds = []
        if (this.data.currentVariant != null) {
          // 从其他页面返回时已经存在 currentVariant
          _currentVariant = _product.variants.filter(item => item.id == this.data.currentVariant.id)[0]
          console.log(_currentVariant)
        }
        
        for(var i=0; i < _product.variants.length; i++) {
          if (_currentVariant == null && _product.variants[i].is_master) {
            _currentVariant = _product.variants[i]
          }
          _product.variants[i].option_values.forEach(item => optionIds.push(item.id))
        }
        
        if (_currentVariant == null) {
          _currentVariant = _product.variants[0]
        }
        this.checkProductType(_product)
        this.setData({ product: _product, currentVariant: _currentVariant, optionTypes: _product.options, optionIds: optionIds })

        if (this.data.showSelectContainer && this.data.currentVariant != null) {
          this.setOptionsStatus(this.data.currentVariant)
        }

        // this.variantToOption()

        if (_product.available_on == null || _product.available_on == 0) {
          this.setData({ available: false })
        }
      },
      fail: (res) => {
        if (res.statusCode == '404') {
          this.errorToast('找不到商品')
          setTimeout(wx.navigateBack, 1000)
        } else {
          // wx.navigateBack({
          //   delta: 1
          // })
        }
      }
    })
  },

  checkProductType: function (product) {
    if(product.tags.includes('虚拟卡券')) {
      this.setData({ productType: 1 })
    } else if (product.tags.includes('一元购')) {
      this.setData({ productType: 3 })
    } else if (product.tags.includes('实物')) {
      this.setData({ productType: 2 })
    }
  },

  changeSwiperCurrent: function (e) {
    this.setData({ swiperCurrent: e.detail.current })
  },

  changeCurrent (currentOv) {
    let options = this.data.optionTypes
    let _values = []  // 选择的option_values
    var tempVariant = null

    for (var opid in options) {
      let optionValues = options[opid].option_value

      for (var i = 0; i < optionValues.length; i++) {
        let ov = optionValues[i]

        if(ov.status == "active") {
          if (ov.option_type_id == currentOv.option_type_id) {
            _values.push(currentOv.id)
          } else {
            _values.push(ov.id)
          }
        }
      }
    }

    for (let i = 0; i < this.data.product.variants.length; i++) {
      let _variant = this.data.product.variants[i];
      let item_ov_ids = []
      for (var x = 0; x < _variant.option_values.length; x++) {
        item_ov_ids.push(_variant.option_values[x].id)
      }
      if (item_ov_ids.sort().join(',') == _values.sort().join(',')) {
        tempVariant = _variant
      }
    }
    
    if (tempVariant != null) {
      this.setData({currentVariant: tempVariant})
      this.setOptionsStatus(tempVariant)
    }

  },
  setOptionsStatus(variant) {
    let options = this.data.optionTypes
    let actives = []  // 

    // 设置active
    for (var opid in options) {
      let optionValues = options[opid].option_value

      for (var i = 0; i < optionValues.length; i++) {
        let ov = optionValues[i]
        
        if (variant.option_values.filter(item=>(item.id == ov.id)).length > 0) {
          ov["status"] = "active"
          actives.push(ov)
        } else {
          if (ov["status"] == "active") {
            ov["status"] = null
          }
        }
      }
    }

    // 设置 disabled
    for (var opid in options) {
      let optionValues = options[opid].option_value

      for (var i = 0; i < optionValues.length; i++) {
        let ov = optionValues[i]
        if (ov.status == "active") {
          continue
        }

        var tempovs = []
        let _status = 'disabled'

        for (var j = 0; j < actives.length; j++) {
          if (ov.option_type_id == actives[j].option_type_id) {
            tempovs.push(ov.id)
          } else {
            tempovs.push(actives[j].id)
          }
        }

        for (let k = 0; k < this.data.product.variants.length; k++) {
          let item = this.data.product.variants[k];
          let item_ov_ids = []
          for(var x=0; x < item.option_values.length; x++){
            item_ov_ids.push(item.option_values[x].id)
          }
          if (item_ov_ids.sort().join(',') == tempovs.sort().join(',')) {
            _status = null
            break
          }

        }

        ov.status = _status
      }
    }
    this.setData({ optionTypes: options })
  },

  showSelectContainer: function (e) {
    if (!this.data.available) { return false }
    if (e && e.currentTarget.dataset.state) {
      this.setData({ showSelectContainer: true, btnSelectState: e.currentTarget.dataset.state })
    } else {
      this.setData({ showSelectContainer: true })
    }

    this.setOptionsStatus(this.data.currentVariant)
  },

  changeOptionValues: function (e) {
    // optionType, optionValue

    // var optionType = e.currentTarget.dataset.optionType
    var optionValue = e.currentTarget.dataset.optionValue

    if (optionValue.state == 'selected' || optionValue.state == 'disabled') { return false }
    // this.optionToVariant(optionType, optionValue)
    this.changeCurrent(optionValue)
  },

  hideSelectContainer: function () {
    this.setData({ showSelectContainer: false, btnSelectState: null })
  },

  plusQuantity: function () {
    if (this.data.product.limit_number <= this.data.quantity) {
      
      return false
    }
    if (this.data.currentVariant.limit_number <= this.data.quantity) {

      return false
    }

    if (this.data.currentVariant.stock <= this.data.quantity) {

      return false
    }

    this.setData({ quantity: this.data.quantity + 1 })
  },

  subQuantity: function () {
    if (this.data.quantity <= 1) { return false }
    this.setData({ quantity: this.data.quantity - 1 })
  },

  buyCard: function () {
    if (this.data.currentVariant == null || Object.keys(this.data.currentVariant).length <= 0) {
      this.errorToast('请先选择商品型号')
      return false
    }

    if (this.data.currentVariant.stock <= 0) {
      this.errorToast('该商品已售罄')
      return false
    }

    let cartParams = {
      quantity: this.data.quantity || 1,
      product: this.data.product,
      currentVariant: this.data.currentVariant,
    }
    // this.setParamsToGlobal('cart_params', cartParams)

    // wx.navigateTo({
    //   url: "/pages/products/buy/index",
    // })
    this.navigateTo("/pages/products/buy/index", cartParams)
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
    wx.createSelectorQuery().select('.carousels').boundingClientRect(res => {
      if (res != null) {
        if(res.top > 0) {
          this.setData({ navbarStatus: true })
        } else {
          this.setData({ navbarStatus: false })
        }
      }
    }).exec()

    wx.createSelectorQuery().select('.product-info').boundingClientRect(res => {
      if (res != null) {
        if (res.top > 20) {
          this.setData({ navbarActive: 1 })
        } else {
          this.setData({ navbarActive: 2 })
        }
      }
    }).exec()
  },

  confirmOrder: function () {
    if (this.data.btnSelectState == 'buyNow') {
      // if(this.data.productType == 1) {
      //   this.buyCard()
      // } else {
      //   this.buyNow()
      // }
      this.buyNow()
    } else if (this.data.btnSelectState == 'addCart') {
      this.addCart()
    }
  },

  buyNow: function () {
    if (this.data.currentVariant.stock <= 0) {
      this.errorToast('该商品已售罄')
      return false
    }
    
    let store_id = this.data.product.store_id || 0
    let lineItem = {
      quantity: this.data.quantity || 1,
      variant_id: this.data.currentVariant.id,
      price: this.data.currentVariant.price,
      vip_price: this.data.currentVariant.vip_price,
      origin_price: this.data.currentVariant.origin_price,
      available_on: this.data.currentVariant.available_on,
      stock: this.data.currentVariant.stock,
      store_id: store_id,
      product: this.data.product,
      // variant: this.data.currentVariant,
      show_name: this.data.currentVariant.show_name,
      selectStatus: true
    }

    let cart = {
      quantity: this.data.quantity || 1,
      store_id: store_id,
      store_name: this.data.product.store_name,
      lineItems: [lineItem],
      total: Math.round(lineItem.price * lineItem.quantity * 100) / 100.0,
      vip_total: Math.round(lineItem.vip_price * lineItem.quantity * 100) / 100.0,
      origin_total: Math.round(lineItem.origin_price * lineItem.quantity * 100) / 100.0,
    }
    let url = `/pages/orders/confirm/index?store_id=${store_id}&buyType=now&productType=${this.data.productType}`
    this.navigateTo(url, {
      cart: cart
    })
  },

  addCart: function () {
    let lineItem = {
      quantity: this.data.quantity || 1,
      variant_id: this.data.currentVariant.id,
      price: this.data.currentVariant.price,
      vip_price: this.data.currentVariant.vip_price,
      origin_price: this.data.currentVariant.origin_price,
      available_on: this.data.currentVariant.available_on,
      stock: this.data.currentVariant.stock,
      store_id: this.data.currentVariant.store_id || '0',
      product: this.data.product,
      // variant: this.data.currentVariant,
      show_name: this.data.currentVariant.show_name,
      product_limit_number: this.data.product.limit_number,
      limit_number: this.data.currentVariant.limit_number
    }

    if(lineItem.stock <= 0) {
      this.errorToast('该商品型号已售罄')
      return false
    }

    let cart = cartApi.addCart(lineItem)
    wx.reLaunch({
      url: '/pages/orders/cart/index'
    })
  },

  gotoCart: function () {
    wx.switchTab({
      url: '/pages/orders/cart/index'
    })
  },

  onlyShowSelectLayer: function () {
    if (!this.data.available) { return false }
    this.setData({ showSelectContainer: true, btnSelectState: null })

    this.setOptionsStatus(this.data.currentVariant)
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})