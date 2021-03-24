// pages/products/buy/index.js
var http = require('../../../../utils/http.js')
var cartApi = require('../../../../utils/cart.js')
var helper = require('../../../../utils/helper.js')
var storage = require('../../../../utils/storage.js')

var submitStatus = false
Page({

  /**
   * 页面的初始数据
   */
  data: {
    submitStatus: false,
    shipAddress: {},
    product: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let product = this.params.product

    if (product == null) {
      this.getProductDetail(options.id)
    } else {
      this.setData({ product: product })
    }
    
  },

  onShow: function () {
    this.setData({ submitStatus: false })
    submitStatus = false
    this.getShipAddress()
    
    // if (this.data.product != null && this.data.product.id != null) {
    //   // this.setData({ showSelectContainer: false })
    //   this.getProductDetail(this.data.product.id)
    // }
  },

  createOrder: function () {
    if (this.data.shipAddress == null || this.data.shipAddress.id == null) {
      this.errorToast('请先选择收货地址')
      return false
    }

    if (!this.data.protocolStatus) {
      this.errorToast('请先阅读并同意《试用规则》')
      return false
    }

    if (submitStatus) {
      return false
    }
    submitStatus = true
    this.setData({ submitStatus: submitStatus })
    this.showCreateLoading()

    let lineItems = [{
      quantity: 1,
      variant_id: this.data.product.master.id,
      price: this.data.product.price
    }]

    // for(let key in this.data.storeCart.lineItems) {
    //   let _line = this.data.storeCart.lineItems[key]
    //   if(_line.selectStatus) {
        // lineItems.push({
        //   quantity: _line.quantity,
        //   variant_id: _line.variant_id,
        //   price: _line.price
        // })
    //   }
    // }

    var $this = this
    http.post({
      url: "api/orders",
      data: {
        line_items: lineItems,
        total: this.data.product.price,
        ship_address_id: this.data.shipAddress.id,
        card_type: '0',
        order_type: '1'
        // coupon_id: coupon.id
      },
      success: function (res) {
        // console.log(res)
        // if($this.data.buyType != 'now') {
        //   cartApi.removeStoreLineOfSelect($this.data.storeCart)
        // }
        // $this.getPayInfo(res.data)
        submitStatus = false
        $this.setData({ submitStatus: submitStatus })
        $this.hideCreateLoading()
        $this.redirectTo('/try_product/pages/orders/index/index')
      },
      fail: function (res) {
        $this.hideCreateLoading()
        var msg = '申请失败, 请稍后再试'
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t
        }
        $this.errorToast(msg)
        submitStatus = false
        $this.setData({ submitStatus: submitStatus })
      }
    });
  },

  changeProtocol: function () {
    this.setData({ protocolStatus: !this.data.protocolStatus })
  },

  showCreateLoading: function () {
    wx.showLoading({mask: true})
    setTimeout(()=> {
      wx.hideLoading()
    }, 30000)
  },

  hideCreateLoading: function () {
    wx.hideLoading()
  },

  getShipAddress: function () {
    if (!this.data.virtual) {
      helper.getShipAddress({
        success: (data) => {
          // 验证地址是否还存在
          if (data.from_type == 'localStorage') {
            this.setData({ shipAddress: data })
          } else {
            http.get({
              url: 'api/ship_addresses/' + data.id,
              success: res => {
                this.setData({ shipAddress: data })
              },
              fail: res => {
                storage.delSync('ship_address')
                this.setData({ shipAddress: {} })
              }
            })
          }
        },
        fail: (res) => {
          console.log('获取地址失败')
          if (res.data != null && res.data.code == 100123) {
            storage.delSync('ship_address')
            this.setData({ shipAddress: {} })
          }
        }
      })
    }
  },

  selectAddress: function () {
    this.navigateTo('/pages/addresses/index/index?referrer=confirm_order')
  },

  getProductDetail: function (id) {
    http.get({
      url: "api/try_goods/" + id,
      success: (res) => {
        var _product = res.data.product
        var _master = null

        if (_product != null && _product.variants != null) {
          _master = _product.variants.filter(item => item.is_master)[0]
        }

        this.setData({ product: _product, master: _master })

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

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})