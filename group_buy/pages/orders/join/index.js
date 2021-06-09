// pages/products/show/index.js

// group_buy_activities 返回值中 no_websocket 为true时，websocket 不订阅该接口信息

var http = require('../../../../utils/http.js')
var websocket = require('../../../../utils/websocket.js')
var md5 = require('../../../../utils/md5.js')
var storage = require('../../../../utils/storage.js')

let timer
let specialAreaId = 7
// let specialAreaId = 3
let specialAreaName = '伊利专区'

let payTime = 2*60*1000
let successTime =  5*1000

var fetchTimerTimestamp = 0

// webscoket心跳超时，每次心跳3秒，3次后重试
var websocketHeartTimeout = 3*3

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
    umd5: '',
    payNotice: '',
    timeNotice: '',
    activityNotice: '',
    user_completed_quantity: -1,
    home_brand_id: null,
    specialAreaName: specialAreaName,
    showSuccessPay: false,
    group: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getActivity(options.id)

    this.setData({ isIphoneX: getApp().isIphoneX(), home_brand_id: options.home_brand_id })

    this.getSpecialInfo()

    
    if (this.data.userInfo != null && this.data.userInfo.kzx_user_identification != 1) {
      // this.checkPayNotice()
      this.yanglaoTouch()
    }

    /**
    * 用户点击右上角分享
    */
    this.onShareAppMessage = function () {
      let params = {
        // from: 'share_group_buy',
        // activity_id: this.data.activity.id,
        // id: this.data.activity.id,
        // from_user_id: this.data.userInfo,
        id: this.data.home_brand_id
      }
      let parmsArray = []
      if (this.data.home_brand_id == null) {
        var path = "/pages/index/index"
      } else {
        var path = "/group_buy/pages/products/index/index"
      }

      for (let key in params) {
        parmsArray.push(`${key}=${params[key]}`)
      }

      path = path + '?' + parmsArray.join('&')

      return {
        title: '金色家园 幸福生活',
        path: path,
        // imageUrl: ''
      }
    }
  },

  onShow: function () {
    this.backParams = this.getBackParamsFromGlobal('params') || {}
    
    if (this.data.activity != null && this.data.activity.id != null && this.backParams.successPay != true) {
      this.setData({ showSelectContainer: false })
      this.getActivity(this.data.activity.id)
    }

    if (timer == null) {
      timer = setTimeout( this.setNow, 1000)
    }

    this.loadCartInfo()

    this.setData({ umd5: md5(getApp().globalData.userInfo.phone || '')})
    this.dealBackParams()
  },

  onHide: function () {
    if (this.data.socketTask != null) {
      try {
        this.data.socketTask.close()
      } catch (error) {}
      this.setData({ socketTask: null })
    }
    // wx.closeSocket()

    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },

  onUnload: function () {
    if (this.data.socketTask != null) {
      try {
        this.data.socketTask.close()
      } catch {}
      this.setData({ socketTask: null })
    }
    // wx.closeSocket()

    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
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
    if (!this.checAuthAndPhone()) {
      return false
    }
    
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

    var activity = this.data.activity
    if (activity != null) {
      if (activity.refresh_time != null && activity.refresh_time > 0) {
        if (fetchTimerTimestamp == 0 ) {
          fetchTimerTimestamp = now
        } else {
          if (now - fetchTimerTimestamp >= activity.refresh_time) { 
            fetchTimerTimestamp = now
            this.getActivity(this.data.activity.id)
          }
        }
        
      } else if (activity.refresh_time == null || activity.refresh_time == 0) {
        if (this.data.websocketPing != null && now - this.data.websocketPing > websocketHeartTimeout) {
          this.reconnect()
        }
      }
    }

    timer = setTimeout(this.setNow, 1000)
  },

  reconnect: function () {
    var activity = this.data.activity
    if (activity.refresh_time == null || activity.refresh_time == 0) {
      let now = new Date
      this.setData({ websocketPing: now })
      try {
        this.data.socketTask.close()
      } catch {}
      try {
        // this.subscription(this.data.activity)
        this.data.socketTask.reconnect()
      } catch {}
    }
  },

  subscription: function (activity) {
    var socketTask = null
    if(this.data.socketTask == null) {
      socketTask = websocket.connect()
      this.setData({ socketTask: socketTask })
    } else {
      socketTask = this.data.socketTask
    }
    var roomId = `v2_${activity.id}`
    socketTask.subscription('GroupBuyActivityChannel', roomId, (data) => {
      if (data.type == 'ping'){
        this.setData({ websocketPing: data.message })
      }
      else if(data.type == 'confirm_subscription') {
        this.setData({ wsConnected: true })
      } else {
        if (data != null) {
          this.checkWxMessage(data)
        }
      }
    })
    // this.setData({ socketTask: socketTask })
  },

  subscriptionUserGroup: function (activity) {
    var socketTask = null
    if(this.data.socketTask == null) {
      socketTask = websocket.connect()
      this.setData({ socketTask: socketTask })
    } else {
      socketTask = this.data.socketTask
    }
    var roomId = `${activity.id}_${md5(getApp().globalData.userInfo.phone)}`
    socketTask.subscription('UserGroupInfoChannel', roomId, (data) => {
      if (data.type == 'ping'){
        this.setData({ userGroupWebsocketPing: data.message })
      }
      else if(data.type == 'confirm_subscription') {
        this.setData({ wsConnected: true })
      } else {
        if (data != null) {
          setTimeout(res => {
            this.checkUserGroupMsg(data)
          }, 500)
        }
      }
    })
  },

  checkUserGroupMsg: function (msg) {
    var resData = msg.message
    if (msg.type == 'welcome' || msg.type == 'ping' || msg.type == 'confirm_subscription') { return false }
    var last_group = this.setLastGroup( this.data.activity.completed_groups, resData, this.data.activity.last_group )
    var show_left_group_time = this.showLeftGroupTime(this.data.activity, last_group)
    this.setData({show_left_group_time: show_left_group_time, current_user_group_info: resData})
  },

  checkWxMessage: function (msg) {
    // var last_group = this.data.group

    var resData = msg.message
    if (msg.type == 'welcome' || msg.type == 'ping' || msg.type == 'confirm_subscription') { return false }
    if (resData.activity != null) {
      this.setActivity(resData.activity, true)

      if (resData.activity.refresh_time != null && resData.activity.refresh_time != 0) {
        try {
          this.data.socketTask.close()
        } catch {}
      }
      
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

  getActivity: function (id) {
    http.get({
      url: `api/group_buy_activities/${id}?v2=true`,
      success: (res) => {
        this.setProductInfo(res.data.product)
        if (( res.data.refresh_time == null || res.data.refresh_time == 0) && this.data.socketTask == null) {
          this.subscription(res.data)
          this.subscriptionUserGroup(res.data)
        }
        this.setActivity(res.data)
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

  // 检查支付前是否需要弹框提示
  checkPayNotice: function (order) {
    var notice_flag = storage.getSync('group_buy_notice_flag')
    if (notice_flag != true) {
      http.get({
        url: `api/buy_groups/buy_notice`,
        success: res => {
          if (res.data.alert == 'on' && res.data.body != null && res.data.body.length > 0) {
            this.setData({
              payNotice: res.data,
              showPayNotice: true,
            })
          }
        }
      })
    }
  },

  payNoticeCancelBtn: function () {
    this.closePayNoticeToast()
  },

  payNoticeConfirmBtn: function () {
    if (this.data.payNoticeProtocolStatus) {
      storage.setSync('group_buy_notice_flag', true)
    }

    this.closePayNoticeToast()
  },

  changePayNoticeProtocol: function () {
    this.setData({ payNoticeProtocolStatus: !this.data.payNoticeProtocolStatus })
  },

  closePayNoticeToast: function () {
    this.setData({ showPayNotice: false })
  },

  // 获取商品推荐数据
  // id 7 伊利专区，临时代码
  getSpecialInfo: function () {
    http.get({
      url: `api/special_areas/${specialAreaId}/fine_products`,
      success: res => {
        if (res.data.length > 0) {
          this.setData({
            specialProducts: res.data
          })
        }
      }
    })
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  gotoSpecialArea: function () {
    this.navigateTo(`/pages/special_areas/show/index?item_id=${specialAreaId}&name=${specialAreaName}`)
  },

  yanglaoTouch: function () {
    http.post({
      url: 'api/users/select_user_to_kzx',
      success: res => {
        console.log(res)
        var data = res.data
        if (data != null && data.phone != null) {
          this.setData({ userInfo: data })
          getApp().globalData.userInfo = data
          storage.setSyncWithExpire('userInfo', data)
        }
      }
    })
  },

  dealBackParams: function () {
    // this.setData({showSuccessPay: true})

    if (this.backParams.successPay == true) {
      setTimeout(res => {
        this.getActivity(this.data.activity.id)
        this.setData({ showSuccessPay: false })
      }, successTime)
    }

    if (this.backParams.waitPay == true) {
      setTimeout( res => {
        this.getActivity(this.data.activity.id)
      }, payTime)
    }
  },

  // 重组团购数据
  // activity.show_notice
  // group.disabled
  setActivity: function (activity, from_websockt=false) {
    var show_notice = this.showNotice(activity)

    activity.show_notice = show_notice
    
    if (!from_websockt) {
      var current_user_group_info = activity.current_user_group_info
      this.setData({
        current_user_group_info: current_user_group_info,
        user_completed_quantity: activity.user_completed_quantity
      })
    } else {
      var current_user_group_info = this.data.current_user_group_info
    }
    var last_group = this.setLastGroup( activity.completed_groups, current_user_group_info, activity.last_group )
    var show_left_group_time = this.showLeftGroupTime(activity, last_group)
    this.setData({show_left_group_time: show_left_group_time})

    this.setData({ activity: activity })
  },

  setLastGroup: function (completed_groups, current_user_group, group) {
    if(group == null) { group = {} }
    var lastGroup = this.formatLastGroup(completed_groups, current_user_group, group)

    this.setData({ group: lastGroup })
    return lastGroup
  },

  formatLastGroup: function (completed_groups, current_user_group, group) {
    var lastGroup = {
      members: [],
      start_time: group.start_time,
      end_time: group.end_time,
      end_time_t: group.end_time_t,
      id: group.id,
      origin_state: group.state,
    }

    if (current_user_group != null && Object.keys(current_user_group).length > 0) {
      lastGroup.members.push(current_user_group)
      lastGroup.current_user_exist = true
      lastGroup.current_user_state = current_user_group.order_state
      lastGroup.current_order_number = current_user_group.order_number

      for (var i in completed_groups) {
        var group_item = completed_groups[i]
        for(var j in group_item.members) {
          if (group_item.members[j].md5 == current_user_group.md5) {
            lastGroup = group_item
            lastGroup.current_user_exist = true
            return lastGroup  // 当前用户在展示的完成头像中
          }
        }
      }
    }

    if (Object.keys(group).length <= 0) {
      if (current_user_group != null && Object.keys(current_user_group).length > 0) {
        lastGroup.current_user_exist = true
        lastGroup.state = 'doing'
      }
      return lastGroup // 处理完成的6个外，没有其他member，只显示当前用户
    }

    if (current_user_group != null && current_user_group.state == 'completed') {
      lastGroup.current_user_exist = true
      var members = group.members.filter(item => {
        item.state == 'completed' && item.md5 == !current_user_group.md5
      })
      if (members.length >= 2) {
        lastGroup.members.push(members[0])
        lastGroup.members.push(members[1])
        lastGroup.state = 'completed'
        return lastGroup // 当前用户能够满足3个member完成的group
      }
    }

    var group_members = []
    if (current_user_group != null && Object.keys(current_user_group).length > 0) {
      group_members = group.members.filter(item => item.md5 != current_user_group.md5)
    } else {
      group_members = group.members
    }

    for(var i in group_members) {
      if (i >= 2) { break }
      lastGroup.members.push(group_members[i])
    }

    lastGroup.state = group.state
    return lastGroup
  },

  showNotice: function (activity={}) {
    if (activity.activity_notice != null && activity.activity_notice.content != null && activity.activity_notice.content.length > 0) {
      return 1
    }

    if (activity.time_notice.content != null && activity.time_notice.content.length > 0 ) {
      return 2
    }

    return false
  },

  setProductInfo: function (product) {
    var _product = product
      let _currentVariant = _product.master
      let optionIds = []
      // if (this.data.currentVariant != null) {
      //   从其他页面返回时已经存在 currentVariant
      //   _currentVariant = _product.variants.filter(item => item.id == this.data.currentVariant.id)[0]
      // }

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
      this.setData({ product: _product, currentVariant: _currentVariant, optionTypes: _product.options, optionIds: optionIds })

      if (_product.available_on == null || _product.available_on == 0) {
        this.setData({ available: false })
      }
  },

  showLeftGroupTime: function (activity, last_group) {
    if (activity.show_notice == 1) { return false }
    if (last_group.state != 'new' && last_group.state != 'doing') { return false }
    if (activity.show_notice == 2 && last_group.state == 'completed') { return false }
    return true
  },
  // 重组团购数据
})