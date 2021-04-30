// pages/products/show/index.js
var http = require('../../../../utils/http.js')
var websocket = require('../../../../utils/websocket.js')
var md5 = require('../../../../utils/md5.js')

let timer

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
    optionIds: [],
    now: Math.floor((new Date).getTime()/1000),
    umd5: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)

    getApp().commonBeforeOnLoad(this)
    this.getProductDetail(options.id)

    // var params = this.params
    // if (params.localParams != null) {
    //   this.setData({
    //     activity: params.activity,
    //     product: params.product,
    //     currentVariant: params.currentVariant,
    //     optionTypes: params.optionTypes,
    //     optionIds: params.optionIds,
    //     // group: params.activity.last_group
    //     group: params.group
    //   })
    // } else {
    //   // this.getGroupBuyActivity(options.id)
    //   this.getBuyGroup(options.id)
    // }

    this.setData({ isIphoneX: getApp().isIphoneX() })

    /**
    * 用户点击右上角分享
    */
    this.onShareAppMessage = function () {
      let params = {
        from: 'share_group_buy',
        activity_id: this.data.activity.id,
        id: this.data.group.id,
        // from_user_id: this.data.userInfo
      }
      let parmsArray = []
      let path = "/group_buy/pages/orders/join/index"

      for (let key in params) {
        parmsArray.push(`${key}=${params[key]}`)
      }

      path = path + '?' + parmsArray.join('&')

      return {
        title: '金色家园 幸福生活',
        path: path,
        // imageUrl: 'https://score-admin.ixiaoliu.com/wx_share.jpg'
      }
    }
  },

  onShow: function () {
    // this.subscription()
    if (typeof(this.data.activity) != 'undefined') {
      this.subscription()
    }

    if (this.data.group != null && this.data.group.id != null) {
      this.setData({ showSelectContainer: false })
      this.getBuyGroup(this.data.group.id)
    }

    if (timer == null) {
      timer = setTimeout( this.setNow, 1000)
    }

    this.loadCartInfo()

    this.setData({ umd5: md5(getApp().globalData.userInfo.phone || '')})
  },

  onHide: function () {
    if (this.data.socketTask != null) {
      this.data.socketTask.close()
    }
    // wx.closeSocket()

    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },

  onUnload: function () {
    if (this.data.socketTask != null) {
      this.data.socketTask.close()
    }
    // wx.closeSocket()

    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },

  getBuyGroup: function (id) {
    http.get({
      url: "api/buy_groups/" + id,
      success: (res) => {
        var _product = res.data.group_buy_activity.product
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
        this.setData({ activity: res.data.group_buy_activity, group: res.data })
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
          this.errorToast('找不到团购信息')
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
    if ( !this.checAuthAndPhone() ) {
      return false
    }

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

  goback: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({})
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }

  },

  gotoConfirm: function () {
    this.checAuthAndPhone()
    
    if (this.data.currentVariant.stock <= 0) {
      this.errorToast('该商品已售罄')
      return false
    }

    if (this.data.activity.state == 'completed' || this.data.activity.state == 'closed') {
      this.errorToast('该拼团活动已结束')
      return false
    }

    if (this.data.group.end_time < this.data.now) {
      this.errorToast('该拼团活动已结束')
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

    let virtual = false
    if (this.data.product.tags != null && this.data.product.tags.indexOf('虚拟卡券') >= 0) {
      virtual = true
    }

    let cart = {
      virtual: virtual,
      quantity: this.data.quantity || 1,
      store_id: store_id,
      store_name: this.data.product.store_name,
      lineItems: [lineItem],
      total: Math.round(lineItem.price * lineItem.quantity * 100) / 100.0,
      vip_total: Math.round(lineItem.vip_price * lineItem.quantity * 100) / 100.0,
    }
    let url = `/group_buy/pages/orders/confirm/index?store_id=${store_id}&buyType=now&productType=${this.data.productType}`

    this.hideSelectContainer()
    this.navigateTo(url, {
      cart: cart,
      group: this.data.group
    })
  },

  setNow: function () {
    let now = new Date
    now = Math.floor(now.getTime()/1000)
    this.setData({ now: now })

    timer = setTimeout(this.setNow, 1000)
  },

  // subscription: function () {
  //   if (this.data.group == null) { 
  //     console.log("no group, don't subscribe websocket")
  //     return false
  //   }
  //   var socketTask = websocket.subscription('BuyGroupChannel', this.data.group.id, 0, (data) => {
  //     if (data.type == 'confirm_subscription') {
  //       this.setData({ wsConnected: true })
  //     } else {
  //       if (data != null) {
  //         this.checkWxMessage(data)
  //       }
  //     }
  //   })
  //   this.setData({ socketTask: socketTask })
  // },

  subscription: function () {
    var socketTask = websocket.subscription('GroupBuyActivityChannel', this.data.activity.id, 0, (data) => {
      if (data.type == 'confirm_subscription') {
        this.setData({ wsConnected: true })
      } else {
        if (data != null) {
          this.checkWxMessage(data)
        }
      }
    })
    this.setData({ socketTask: socketTask })
  },

  checkWxMessage: function (msg) {

    var data = msg.message
    if(data != null && data.activity != null) {
      var activity = data.activity
      this.setData({ activity: activity, group: activity.last_group, product: activity.product })
    }
  },

  checAuthAndPhone: function () {
    if(!getApp().globalData.authLoginStatus) {
      wx.navigateTo({
        url: '/pages/login/index?gobackStatus=true',
      })
      return false
    }

    var phoneReg = getApp().globalData.phoneReg

    if (getApp().globalData.userInfo == null || !phoneReg.test(getApp().globalData.userInfo.phone)) {
      wx.navigateTo({
        url: "/pages/account/phone/validate?goback=true",
      })
      return false
    }

    return true
  },

  getProductDetail: function (id) {
    http.get({
      url: "api/group_buy_activities/" + id,
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
        // this.checkProductType(_product)
        this.setData({ activity: res.data, group: res.data.last_group })
        this.setData({ product: _product, currentVariant: _currentVariant, optionTypes: _product.options, optionIds: optionIds })
        
        if (!this.data.wsConnected) {
          this.subscription()
        }

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

  gotoPay: function (e) {
    var number = e.currentTarget.dataset.number
    this.navigateTo(`/pages/orders/show/index?id=${number}`)
  },
})