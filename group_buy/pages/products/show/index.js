// pages/products/show/index.js
var http = require('../../../../utils/http.js')
var websocket = require('../../../../utils/websocket.js')

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
    optionIds: [],
    now: Math.floor((new Date).getTime()/1000),
    wsConnected: false,
    canGroup: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getProductDetail(options.id)
    this.setData({activityId: options.id})
    // this.getProductDetail(1)
    // this.setData({activityId: 1})

    this.setData({ isIphoneX: getApp().isIphoneX() })
  },

  onShow: function () {
    this.subscription()

    if (this.data.activity != null && this.data.activity.id != null) {
      // this.setData({ showSelectContainer: false })
      this.getProductDetail(this.data.activity.id)
    }

    if (timer == null) {
      timer = setTimeout( this.setNow, 1000)
    }

    this.loadCartInfo()
  },

  onHide: function () {
    if (this.data.socketTask != null) {
      console.log(this.data.socketTask)
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
      console.log(this.data.socketTask)
      this.data.socketTask.close()
    }
    // wx.closeSocket()

    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
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
        this.setData({ activity: res.data })
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

  // checkProductType: function (product) {
  //   if(product.tags.includes('虚拟卡券')) {
  //     this.setData({ productType: 1 })
  //   } else if (product.tags.includes('一元购')) {
  //     this.setData({ productType: 3 })
  //   } else if (product.tags.includes('实物')) {
  //     this.setData({ productType: 2 })
  //   }
  // },

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

  gotoJoinWithVariant: function () {
    // if (this.data.btnSelectState == 'buyNow') {
    //   if(this.data.productType == 1) {
    //     this.buyCard()
    //   } else {
    //     this.buyNow()
    //   }
    // } else if (this.data.btnSelectState == 'addCart') {
    //   this.addCart()
    // }

    if (this.data.activity != null && this.data.activity.last_group != null && this.data.activity.last_group.state == 'closed') {
      this.errorToast('还未到开团时间')
      return false
    }

    if (this.data.activity == null || this.data.activity.last_group == null || this.data.activity.last_group.state != 'new') {
      this.errorToast('现在还未开团')
      return false
    }

    if (!this.data.canGroup) {
      this.errorToast('现在还未开团')
      return false
    }

    var url = `/group_buy/pages/orders/join/index`
    url = url + `?activityId=${this.data.activity.id}&id=${this.data.activity.last_group.id}&quantity=${this.data.quantity}&currentVariantId=${this.data.currentVariant.id}`

    this.navigateTo( url, {
      activity: this.data.activity,
      currentVariant: this.data.currentVariant,
      product: this.data.product,
      group: this.data.activity.last_group
    })
  },

  gotoJoin: function () {
    if (this.data.activity != null && (this.data.activity.state == 'closed' || this.data.activity.state == 'completed')) {
      this.errorToast('该拼团活动已结束')
      return false
    }

    if (this.data.activity != null && this.data.activity.last_group != null && this.data.activity.last_group.state == 'closed') {
      this.errorToast('还未到开团时间')
      return false
    }

    if (this.data.activity == null || this.data.activity.last_group == null || this.data.activity.last_group.state != 'new') {
      this.errorToast('现在还未开团')
      return false
    }

    this.navigateTo( `/group_buy/pages/orders/join/index?id=${this.data.activity.last_group.id}`, {
      activity: this.data.activity,
      product: this.data.product,
      currentVariant: this.data.currentVariant,
      optionTypes: this.data.optionTypes,
      optionIds: this.data.optionIds,
      localParams: true,
      group: this.data.activity.last_group
    })
  },

  gotoJoinWithId: function (e) {
    let item = e.currentTarget.dataset.item
    this.navigateTo(`/group_buy/pages/orders/join/index?id=${item.id}`)
  },

  setNow: function () {
    let now = new Date

    // if (now > this.data.activity.next_group_time && now > this.data.activity.last_group.end_time && now%5 == 0) {
    //   // this.getProductDetail(this.data.activityId)
    // }

    now = Math.floor(now.getTime()/1000)
    this.setData({ now: now })

    timer = setTimeout(this.setNow, 1000)
    this.checkGroupState()
  },

  checkGroupState: function () {
    if (this.data.activity != null && (this.data.activity.state == 'closed' || this.data.activity.state == 'completed')) {
      this.setData({ canGroup: false })
      return false
    }

    if (this.data.activity != null && this.data.activity.last_group != null && this.data.activity.last_group.state == 'closed') {
      this.setData({ canGroup: false })
      return false
    }

    if (this.data.activity == null || this.data.activity.last_group == null || this.data.activity.last_group.state != 'new') {
      this.setData({ canGroup: false })
      return false
    }

    // if (this.data.now > this.data.activity.next_group_time && this.data.now > this.data.activity.last_group.end_time ) {
    if (this.data.now > this.data.activity.last_group.end_time ) {
      this.setData({ canGroup: true })
      return false
    }

    if (!this.data.canGroup) {
      this.setData({ canGroup: true })
    }
  },

  subscription: function () {
    var socketTask = websocket.subscription('GroupBuyActivityChannel', this.data.activityId, 0, (data) => {
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
      // var _product = data.activity.product
      //   let _currentVariant
      //   let optionIds = []
      //   if (this.data.currentVariant != null) {
      //     // 从其他页面返回时已经存在 currentVariant
      //     _currentVariant = _product.variants.filter(item => item.id == this.data.currentVariant.id)[0]
      //     console.log(_currentVariant)
      //   }
        
        // for(var i=0; i < _product.variants.length; i++) {
        //   if (_currentVariant == null && _product.variants[i].is_master) {
        //     _currentVariant = _product.variants[i]
        //   }
        //   _product.variants[i].option_values.forEach(item => optionIds.push(item.id))
        // }
        
        // if (_currentVariant == null) {
        //   _currentVariant = _product.variants[0]
        // }
        // this.checkProductType(_product)
        this.setData({ activity: data.activity })
        // this.setData({ product: _product, currentVariant: _currentVariant, optionTypes: _product.options, optionIds: optionIds })
        // this.setData({ product: _product, currentVariant: _currentVariant, optionTypes: _product.options, optionIds: optionIds })

        // if (this.data.showSelectContainer && this.data.currentVariant != null) {
        //   this.setOptionsStatus(this.data.currentVariant)
        // }

        // this.variantToOption()

        // if (_product.available_on == null || _product.available_on == 0) {
        //   this.setData({ available: false })
        // }
    }
    // if (data.message != null && data.message.pay_state == 'fail') {
    //   this.rechargeError()
    // } else if (data.message != null && data.message.pay_state == 'success') {
    //   this.rechargeSuccess()
    // }
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})