//app.js

// commonBeforeOnLoad: function (context)
// 定义 page 中公共的方法，以及在 onload 方法的前面执行一些操作
// 需要在 onload 方法中调用 getApp().commonBeforeOnLoad(this)

var appCofnig = require('./app.config.js')
var msgToast = require('./pages/components/message/api.js')
var pageMethods = require('./page.js')
var store = require('./utils/storage.js')
var sessionApi = require('./utils/session.js')
App({
  globalData: appCofnig.config({
    userInfo: null,
    isIphoneX: null,
    params: {},
    authLoginStatus: false,
  }),

  onLaunch: function () {
    var getUser = () => {
      // 从本地存储获取userInfo
      var userInfo = store.getSyncWithExpire('userInfo')
      if (userInfo != null && Object.keys(userInfo).length > 0) {
        this.globalData.userInfo = userInfo
        if (this.CallbackForUserInfo) {
          this.CallbackForUserInfo(userInfo)
        }
      } else {
        // 从服务器获取
        sessionApi.getUserInfo().then(res => {
          this.globalData.userInfo = res
          if (this.CallbackForUserInfo) {
            this.CallbackForUserInfo(res)
            
            // 设置用户授权状态
            if (!this.globalData.authLoginStatus && res.check_wx_auth) {
              this.globalData.authLoginStatus = true
              store.setSync('authLoginStatus', true)
            }
          }
        })
      }
    }

    // 从本地存储获取session
    var session = store.getSyncWithExpire('session')
    if(session != null && Object.keys(session).length > 0) {
      this.globalData.session = session

      getUser()
      if (this.CallbackForSession) {
        this.CallbackForSession(session)
      }
    } else {
      // 登录服务器
      sessionApi.login().then(res=> {
        this.globalData.session = res
        getUser()
        if (this.CallbackForSession) {
          this.CallbackForSession(res)
        }
      })
    }
    
    

    // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           // 可以将 res 发送给后台解码出 unionId
    //           this.globalData.userInfo = res.userInfo

    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (this.userInfoReadyCallback) {
    //             this.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
  },

  isIphoneX: function () {
    if (this.globalData.isIphoneX) { return true }
    if (this.globalData.isIphoneX == false) { return false }

    var sysInfo = wx.getSystemInfoSync()

    if (['iPhone X', 'iPhone XS', 'iPhone XR', 'iPhone XS MAX'].includes(sysInfo.model) || sysInfo.model.match(/iPhone X/g) != null || sysInfo.model.match(/iPhone1[01234]/g)) {
      this.globalData.isIphoneX = true
      return true
    } else {
      this.globalData.isIphoneX = false
      return false
    }
  },

  // 定义 page 中公共的方法，以及在 onload 方法的前面执行一些操作
  // 需要在 onload 方法中调用 getApp().commonBeforeOnLoad(this)
  commonBeforeOnLoad: function (context) {
    pageMethods.beforeOnload(context)
  },

  onShow(options) {
    if (options.query.from == 'share' && options.path != "/pages/index/index") {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }
})