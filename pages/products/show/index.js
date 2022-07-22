// pages/products/show/index.js
var http = require('../../../utils/http.js')
var cartApi = require('../../../utils/cart.js')
var helper = require('../../../utils/helper.js')
var storage = require("../../../utils/storage.js")
var sessionApi = require('../../../utils/session.js')

var addTime;

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
    addCartOk: null,
    isLimit: false,//限购弹窗
    nowTime: Math.ceil((new Date).getTime()/1000),
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
    this.setData({
      canTapShare: false
    })
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

        // 绘制自定义分享图
        this.createImage()
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
      // this.errorToast('加入购物车失败')
      this.setData({
        showSelectContainer: false,
      })
      this.openAddCartPopup(false,'抱歉该商品暂时无法加入购物车')
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
      // this.errorToast('该商品型号已售罄')
      this.setData({
        showSelectContainer: false,
      })
      this.openAddCartPopup(false,'该商品型号已售罄')
      return false
    }

    let cart = cartApi.addCart(lineItem)
    // wx.reLaunch({
    //   url: '/pages/orders/cart/index'
    // })

    this.setData({
      showSelectContainer: false,
      cartData: cart,
    })

    this.openAddCartPopup(true)
  },

  openAddCartPopup: function(result,text){
    var _this = this
    this.setData({
      addCartOk: result
    })
    if(text){
      this.setData({
        addCartOkText: text
      })
    }
    if(result == true){
      addTime = setTimeout(function(){
        _this.setData({
          addCartOkImg: true
        })
      },1500)
    }
  },

  //关闭加入购物车结果弹窗
  closeAddCartPopup: function(){
    clearTimeout(addTime)
    this.setData({
      addCartOk: null,
      addCartOkImg: null,
      addCartOkText: null
    })
  },

  openLimitPopup:function(){
    this.setData({
      isLimit: !this.data.isLimit
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

  // 绘制分享图片
  createImage() {
      wx.createSelectorQuery().select('#endtime').fields({ node: true, size: true })
      .exec((res)=>{
        // 获取设备设备像素比
        const dpr = wx.getSystemInfoSync().pixelRatio

        let canvas = res[0].node  // 重点1
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr

        let ctx = canvas.getContext('2d')  // 重点2
         /**至此，textCanvas，textCtx已经成功获取到，下面代码为绘图测试代码可忽略**/
 
         ctx.clearRect(0,0,canvas._width,canvas._height)
         ctx.beginPath();
         ctx.scale(dpr, dpr)
         this.setData({
           canvas,
           ctx
         })

          //向画布载入图片
          this.canvasDraw(ctx,canvas).then(res=>{
            // console.log('1',res)
            // 向画布载入logo的方法
            return this.code(ctx)
          }).then(rrr=>{
            // console.log('2',rrr)
            //图片头像渲染完成之后，渲染文字
            this.title(ctx)
          })
      })
  },
  
  // 封面图  使用 pormise方法来输出 代码执行成功，返回一个成功标识出去
  canvasDraw(ctx,canvas) {
    return new Promise(res=>{
      let img = this.data.canvas.createImage(); //创建img对象
      img.src = '/images/v1.2/share1111.png';
      img.onload = () => {
        this.data.ctx.drawImage(img, 0, 0,210, 168);
          setTimeout(() => {
            res(true)
          }, 100);
      };  
    })
  },

  // 头像 使用 pormise方法来输出 代码执行成功，返回一个成功标识出去
  code(ctx) {
    return new Promise(rrr=>{
      let code = this.data.canvas.createImage(); //创建img对象

      code.src =this.data.product.avatar;
      code.onload = () => {

        this.data.ctx.save(); // 先保存状态 已便于画完圆再用

        this.data.ctx.beginPath();  //开始绘制

          var bg_x = 8;
          // 图片的y坐标
          var bg_y = 26;
          // 图片宽度
          var bg_w = 96;
          // 图片高度
          var bg_h = 96;
          // 图片圆角
          var bg_r = 10;
    
        ctx.arc(bg_x + bg_r, bg_y + bg_r, bg_r, Math.PI, Math.PI * 1.5);
        ctx.arc(bg_x + bg_w - bg_r, bg_y + bg_r, bg_r, Math.PI * 1.5, Math.PI * 2);
        ctx.arc(bg_x + bg_w - bg_r, bg_y + bg_h - bg_r, bg_r, 0, Math.PI * 0.5);
        ctx.arc(bg_x + bg_r, bg_y + bg_h - bg_r, bg_r, Math.PI * 0.5, Math.PI);
    
        this.data.ctx.clip();//画了圆 再剪切
    
        this.data.ctx.drawImage(code, bg_x,bg_y, bg_w, bg_h);

        this.data.ctx.restore();//恢复之前保存的绘图上下文

        rrr(true)
      };
    })
  },

  //文字模块，不使用pormise，因为他是最后模块，所有不需要了
  title(ctx) {
    let _this = this;
    let unit = '￥'
    let money = this.cropText(this.data.currentVariant.price,8)
    let scribing =  '原价￥' + this.cropText(this.data.currentVariant.origin_price,9)


    ctx.font = 'normal bold 14px PingFangSC-Regular';
    ctx.fillStyle = "#332B2B";
    ctx.textAlign = "start"
    ctx.fillText(unit, 110, 82, )

    ctx.font = 'normal bold 20px PingFangSC-Regular';
    ctx.fillStyle = "#332B2B";
    ctx.textAlign = "start"
    ctx.fillText(money, 122, 82, )
    ctx.font = 'normal normal 12px PingFangSC-Regular';//指定文字样式
    ctx.fillStyle = "#CCBFBF";
    ctx.textAlign = "start"
    ctx.fillText(scribing, 110, 100,) //    ctx.fillText(文字, 像素, 移动y, 移动x) 

    let scribingW = ctx.measureText(scribing).width
    // 两个点进行画线
    ctx.beginPath();  //开始绘制
    ctx.moveTo(110,96);      //起点
    ctx.lineTo(110+scribingW,96);    //终点
    ctx.lineWidth = 1; // 设置线的宽度，单位是像素
    ctx.strokeStyle = '#CCBFBF';  //设置线的颜色
    ctx.stroke();

    // 导出临时图片
    wx.canvasToTempFilePath({
      canvas: this.data.canvas, // 使用2D 需要传递的参数
      success(res) {
        // console.log('导出完成',res.tempFilePath)
        getApp().globalData.shareImg = res.tempFilePath
        _this.setData({
          canTapShare: true
        })
      },
      fail(res){
        console.log(res)
      }
    })
    
  },

  cropText: function(text,size){
    if(text == null){
      return ''
    }
    var textArr = text.split('');
    if(textArr.length > size){
      textArr.splice(size - 2)
      textArr = textArr.join('')
      return textArr + '...'
    }else{
      return text
    }
  }

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function (e) {
  //   console.log(e)
  // }
})