var msgToast = require('./pages/components/message/api.js')
var cartApi = require('./utils/cart.js');
const storage = require('./utils/storage.js');

var checkPhonePage = [
  // "/pages/products/show/index",
  "/pages/coupons/list/index",
  // "/pages/coupons/dashboard/index",
  "/pages/orders/show/index",
  "/pages/products/buy/index",
  "/pages/orders/confirm/index",
  "/try_product/pages/orders/confirm/index",
  "/pages/addresses/index/index",
  "/try_product/pages/products/show/index",
  "/live/pages/index/index",
  "/pages/coupons/dashboard/index",
  "/try_product/pages/orders/index/index"
  // "/pages/contact/index"
]

function beforeOnload (context) {
  context = context || this;
  var app = getApp()
  ;(function () {
    // 
    // onLoad前调用的代码，写在了这个方法的后面部分
    // 

    wx.getSystemInfo({
      success: res => {
        this.windowRect = {
          height: res.windowHeight,
          width: res.windowWidth
        }
      }
    })

    // 定义公用方法，可以在页面js文件可以通过this直接调用
    function updateApp() {
      var updateManager = wx.getUpdateManager()
      updateManager.onUpdateReady(function () {
        updateManager.applyUpdate()
      })
    }

    this.getParamsFromGlobal = function (objId) {
      var obj = getApp().globalData.params[objId]

      if (obj != null) {
        delete getApp().globalData.params[objId]
      }

      return obj
    }

    this.setParamsToGlobal = function (objId, param) {
      if (objId == null) {
        return false
      }

      getApp().globalData.params[objId] = param
      return true
    }

    this.navigateTo = function (url, params={}) {
      var skipPage = [
        "/pages/products/show/index",
        "/pages/special_areas/show/index",
        "/pages/special_areas/show01/index",
        "/products/pages/index/index",
        "/products/pages/index2/index",
        "/products/pages/index3/index",
        "/products/pages/index4/index",
      ]
      if(!app.globalData.authLoginStatus && !skipPage.includes(url.split('?')[0])) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }

      if (!this.checkPhone(url)) {
        return
      }

      this.setParamsToGlobal('params', params)
      wx.navigateTo({
        url: url
      })
    }

    this.redirectTo = function (url, params = {}) {
      var skipPage = [
        "/pages/products/show/index",
        "/pages/special_areas/show/index",
        "/pages/special_areas/show01/index",
        "/products/pages/index/index",
        "/products/pages/index2/index",
        "/products/pages/index3/index",
        "/products/pages/index4/index",
      ]
      if (!app.globalData.authLoginStatus  && !skipPage.includes(url.split('?')[0])) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }

      if (!this.checkPhone(url)) {
        return
      }

      this.setParamsToGlobal('params', params)
      wx.redirectTo({
        url: url
      })
    }

    this.checkPhone = function (url) {
      var phoneReg = getApp().globalData.phoneReg

      if (!checkPhonePage.includes(url.split('?')[0])) {
        return true
      }

      if (this.data.userInfo == null || !phoneReg.test(this.data.userInfo.phone)) {
        wx.redirectTo({
          url: "/pages/account/phone/validate",
        })
        return false
      } else {
        return true
      }
    }

    this.gotoLink = function (e) {
      var url = e.currentTarget.dataset.url
      this.navigateTo(url)
    }

    // this.onShareAppMessage = function () {
    //   // imageUrl
    //   // 自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径。支持PNG及JPG。显示图片长宽比是 5: 4。	
    //   // 使用默认截图
    //   return {
    //     title: '金色家园·幸福生活',
    //     path: `/${this.route}?from=share` ,
    //     imageUrl: 'https://score-admin.ixiaoliu.com/wx_share.jpg'
    //   }
    // }

    // 加入购物车，并产生动画效果
    this.addCartAndAnimation = function (e) {
      var item = e.currentTarget.dataset.item
      
      if (item.tags != null && item.tags.indexOf('虚拟卡券') >= 0) {
        this.navigateTo("/pages/products/show/index?id=" + item.id)
        return false
      }

      if (item.tags != null && item.tags.indexOf('一元购') >= 0) {
        this.navigateTo("/pages/products/show/index?id=" + item.id)
        return false
      }

      let master = item.master
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
        show_name: master.show_name,
        limit_number: master.limit_number,
        product_limit_number: item.limit_number
      }

      // 判断是否超过库存
      if ( master.stock <= 0 ) {
        this.errorToast('库存不足')
        return false
      }

      if(this.data.cartData != null && this.data.cartData.data != null && this.data.cartData.data['store_' + master.store_id] != null && this.data.cartData.data['store_' + master.store_id].lineItems != null && this.data.cartData.data['store_' + master.store_id].lineItems['variant_' + master.id] != null) {
        let _quantity = this.data.cartData.data['store_' + master.store_id].lineItems['variant_' + master.id].quantity

        // 判断数量是否超过单品购买数量限制
        if (_quantity >= master.limit_number || _quantity >= item.limit_number) {
          this.errorToast('已超过单品数量限制')
          return false
        }

        // 判断是否超过库存
        if ( _quantity >= master.stock ) {
          this.errorToast('库存不足')
          return false
        }
      }

      let cart = cartApi.addCart(lineItem)

      this.setData({ cartData: cart })

      var position = {
        right: this.windowRect.width - e.touches[0].clientX,
        bottom: this.windowRect.height - e.touches[0].clientY
      }
      let item_key = 'item_' + (new Date).getTime()
      let key = `cartAnimations.${item_key}.style`
      this.setData({
        [key]: `bottom: ${position.bottom}px; right: ${position.right}px; display: block; opacity: 1;`
      })

      let animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'linear',
      })

      animation.bottom((position.bottom + 25)/2).right((position.right+35)/2).step()
      animation.bottom(25).right(35).step()

      animation.opacity(0).step()

      key = `cartAnimations.${item_key}.animation`
      this.setData({
        [key]: animation.export(),
      })

      setTimeout( res => {
        let _key = `cartAnimations.${item_key}.class`
        this.setData({
          [_key]: "hidden"
        })
      }, 500)
    }

    this.loadCartInfo = function () {
      let cartData = cartApi.getCartCache()
      if (Object.keys(cartData).length <= 0) {
        cartData = null
      }
      this.setData({ cartData: cartData, cartLoaded: true })
    }

    this.gotoCart = function () {
      wx.reLaunch({
        url: '/pages/orders/cart/index',
      })
    }
    // end 定义公用方法

    // 处理 session
    this.setSession = function () {
      if (app.globalData.session && Object.keys(app.globalData.session).length > 0) {
        // 如果有值，说明接口已经返回，所以直接赋值使用
        this.setData({
          session: app.globalData.session
        })
      } else {
        //如果没有，给app定义一个回调，拿到接口返回参数
        app.CallbackForSession = data => {
          if (data != '') {
            this.setData({
              session: data
            })
          }
        }
      }
    }

    // 处理 userInfo
    this.setUserInfo = function () {
      if (app.globalData.userInfo && Object.keys(app.globalData.userInfo).length > 0) {
        // 如果有值，说明接口已经返回，所以直接赋值使用
        this.setData({
          userInfo: app.globalData.userInfo
        })
      } else {
        //如果没有，给app定义一个回调，拿到接口返回参数
        app.CallbackForUserInfo = data => {
          if (data != '') {
            this.setData({
              userInfo: data
            })
          }
        }
      }
    }

    // 检查授权登录状态
    this.checkAuthLoginStatus = function () {
      // if (app.globalData.authLoginStatus) {
      //   this.setData({ authLoginStatus: app.globalData.authLoginStatus })
      // } else {
      //   wx.getSetting({
      //     success: res => {
      //       this.setData({ authLoginStatus: !!res.authSetting['scope.userInfo'] })
      //       app.globalData.authLoginStatus = !!res.authSetting['scope.userInfo']
      //     }
      //   })
      // }
      var authLoginStatus = storage.getSync('authLoginStatus')
      app.globalData.authLoginStatus = !!authLoginStatus
      this.setData({ authLoginStatus: true })
    }

    // 从 global data 中重新获取 userInfo
    this.resetUerInfo = function () {
      if(getApp().globalData.userInfo != null) {
        this.setData({ userInfo: getApp().globalData.userInfo })
      }
    }

    // 在onLoad方法前面调用代码
    ; (function () {
      // 获取上一个页面传递的参数
      this.params = this.getParamsFromGlobal('params') || {}

      // 分享
      wx.showShareMenu({ withShareTicket: true })

      // 设置 pageMarginTop (statusBarHeight)
      this.setData({ pageMarginTop: wx.getSystemInfoSync().statusBarHeight })

      // 导入 message toast api
      msgToast.importApi(this)

      // 设置 iphoneX 机型参数
      this.setData({ isIphoneX: getApp().isIphoneX() })

      // 设置 session
      this.setSession()

      // 设置 userInfo
      this.setUserInfo()

      // 检查授权登录状态
      this.checkAuthLoginStatus()
    }).call(this)

  }).call(context)
}

module.exports = {
  beforeOnload
}