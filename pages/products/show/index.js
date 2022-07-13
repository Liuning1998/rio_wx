// pages/products/show/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')
var helper = require('../../../utils/helper.js')
var storage = require("../../../utils/storage.js")
var sessionApi = require('../../../utils/session.js')

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
    isShowCoupon:false,//是否可以领取优惠券
    cPageNow:1, //优惠券列表页数
    cNoData:false, //加载完全部数据
    canUseGetCoupon:true,//是否可以再次请求优惠券
    isShow:false,//优惠券弹框
    giftShow:false,//赠品弹框
    loadErr:false,//加载错误
    couponsList:[],
    addConfirm:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getProductDetail(options.id,options.channel)
    // this.getProductDetail('wkm3')

    //全局添加channel参数re_login使用
    if(!!options.channel && options.channel.trim() != ''){
      this.setData({
        channel: options.channel
      })
      this.postChannel(options.channel)
    }

    // 获取优惠券数据
    this.canReceive()

    this.setData({ isIphoneX: getApp().isIphoneX() })
  },

  onShow: function () {
    if (this.data.product != null && this.data.product.id != null) {
      // this.setData({ showSelectContainer: false })
      this.getProductDetail(this.data.product.id)
    }

    this.loadCartInfo()
  },

  // 打开优惠券弹窗
  openCoupon:function(){
    this.setData({
      isShow:true
    })
  },
  closePopup:function(){
    this.setData({
      isShow:false
    })
  },

  // 打开优惠券弹窗
  openGift:function(){
    this.setData({
      giftShow:true
    })
  },
  closeGift:function(){
    this.setData({
      giftShow:false
    })
  },

  // 领取优惠券
  receiveCoupons:function(e){
    var promotion_id = e.target.dataset.item.id;
    var el = e.target.dataset.index;
    var key = `couponsList[${el}].show_status`;
    http.post({
      url: 'api/promotions/receive_promotion',
      data:{
        promotion_id:promotion_id
      },
      success: res => {
        if(res.data.status =='ok'){
          console.log([key])
          this.setData({
            successPopup:true,
            [key]:false
          })
          wx.showToast({
            title: '领取成功',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: res=>{
        var msg =  '领取失败';
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t;
        }
        wx.showToast({
          title: msg,
          icon: 'none',
          duration: 2000
        })
        
      }
    })
  },

  // 判断是否展示优惠券领取
  canReceive:function(){
      var _logIng = storage.getSync('logIng')//判断是否正在登录
      http.get({
        url: 'api/promotions/can_receive_promotion',
        success: res => {
          if(res.data.status != null && res.data.status == true){
            this.setData({
              isShowCoupon:res.data.status
            })
            this.getData()
          }
        },
        fail: err => {
          console.log(err)
          if(err.statusCode == 401 && err.data.code == 100400){
            if(!_logIng){
              this.reLogin()
            }
          }
        }
      })
  },

  reLogin: function () {
    sessionApi.login().then(res => {
      getApp().globalData.session = res
      this.setData({ session: res })
      this.reGetUserInfo()
      // 重新登录完成 
      this.postChannel(this.data.channel)
    })
  },

  reGetUserInfo: function () {
    sessionApi.getUserInfo().then(res => {
      if (res != null && res.phone != null) {
        getApp().globalData.userInfo = res
        this.setData({ userInfo: res,authLoginStatus: res.check_wx_auth})
      }
    })
  },

  // 下一页
  getNextPge:function(){
    if( this.data.canUseGetCoupon  && !this.data.cNoData ) {
      this.getData()
    }
  },



  // 获取数据 getData
  getData:function(){
    var couponsList = this.data.couponsList || [];
    var page = this.data.cPageNow;
    var cNoData = this.data.cNoData;
    this.setData({
      canUseGetCoupon:false,
      loadErr:false,
    })
    if(!cNoData){
      http.get({
        url: 'api/promotions/receive_promotion_index',
        data:{
          page:page
        },
        success: res => {
          if(res.data.data.length != 0 && res.data.data != null){
              // 去重
              res.data.data = helper.checkRepeat(couponsList,res.data.data)
              res.data.data.forEach((ele)=>{
                if(ele){
                  couponsList.push(ele)
                }
              })
              this.setData({
                couponsList:couponsList,
                cPageNow:page + 1,
                canUseGetCoupon:true
              })
          }else if( res.data.data != null && res.data.data.length == 0){
            this.setData({
              cNoData:true,
              canUseGetCoupon:true
            })
          }
        },
        fail: res=>{
          // console.log(res);
          this.setData({
            loadErr:true,
            canUseGetCoupon:true
          })
        }
      })
    }

  },
  

  getProductDetail: function (id,channel='') {
    http.get({
      url: "api/products/" + id + '?channel=' + channel,
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
    } else if (product.tags.includes('特殊商品')) {
      this.setData({ productType: 4 })
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
    let store_code = this.data.product.store_code || ''
    let store_name = this.data.product.store_name
    let store_short_name = this.data.product.store_short_name
    let lineItem = {
      quantity: this.data.quantity || 1,
      variant_id: this.data.currentVariant.id,
      price: this.data.currentVariant.price,
      vip_price: this.data.currentVariant.vip_price,
      origin_price: this.data.currentVariant.origin_price,
      available_on: this.data.currentVariant.available_on,
      stock: this.data.currentVariant.stock,
      store_id: store_id,
      store_code: store_code,
      product: this.data.product,
      // variant: this.data.currentVariant,
      show_name: this.data.currentVariant.show_name,
      selectStatus: true
    }

    let cart = {
      quantity: this.data.quantity || 1,
      store_id: store_id,
      store_code: store_code,
      store_name: this.data.product.store_name,
      store_short_name: this.data.product.store_short_name,
      lineItems: [lineItem],
      total: Math.round(lineItem.price * lineItem.quantity * 100) / 100.0,
      vip_total: Math.round(lineItem.vip_price * lineItem.quantity * 100) / 100.0,
      origin_total: Math.round(lineItem.origin_price * lineItem.quantity * 100) / 100.0,
    }
    let url = `/pages/orders/confirm/index?&store_code=${store_code}&buyType=now&productType=${this.data.productType}`
    if (store_short_name == '京东') {
      url = url + '&store_short_name=京东'
    }
    this.navigateTo(url, {
      cart: cart
    })
  },

  // 跳转活动商品
  gotoUrl:function(e){
    var url = e.currentTarget.dataset.url
    if (url == null || url.length <= 0) {
      return
    }

    this.navigateTo('/web/pages/yanglaohuodong/index?url='+url)
  },

  addCart: function () {
    if (this.data.product.tags != null && this.data.product.tags.indexOf('团购商品') >= 0) {
      return false
    }
    
    if (this.data.product.tags != null && this.data.product.tags.indexOf('特殊商品') >= 0) {
      return false
    }

    if (this.data.product.store_code == null || this.data.product.store_code.trim() == '') {
      this.errorToast('加入购物车失败')
      return false
    }

    let lineItem = {
      quantity: this.data.quantity || 1,
      variant_id: this.data.currentVariant.id,
      price: this.data.currentVariant.price,
      vip_price: this.data.currentVariant.vip_price,
      origin_price: this.data.currentVariant.origin_price,
      available_on: this.data.currentVariant.available_on,
      stock: this.data.currentVariant.stock,
      store_id: this.data.currentVariant.store_id || '0',
      store_code: this.data.product.store_code || '',
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
    // wx.reLaunch({
    //   url: '/pages/orders/cart/index'
    // })

    // v1.2加入购物车后不跳转购物车页面，只弹窗
    this.showAddConfirm()
    this.setData({
      showSelectContainer: false,
      cartData: cart
    })
  },

  showAddConfirm:function(){
    var addConfirm = this.data.addConfirm;
    if(!addConfirm){
      this.setData({
        addConfirm: true
      })
      setTimeout(res=>{
        this.setData({
          addConfirm: false
        })
      },1500)
    }
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
  // onShareAppMessage: function (e) {
  //   console.log(e)
  // }
})