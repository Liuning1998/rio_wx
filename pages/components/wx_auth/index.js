// pages/components/wx_auth/index.js
var storage = require("../../../utils/storage.js")
var scoreApi = require("../../../utils/session.js")
var http = require("../../../utils/http.js")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    back: {
      type: Boolean
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getUserInfo: function (res) {
      if (res.detail.errMsg == "getUserInfo:ok") {
        storage.setSync('authenticated', 'authenticated')

        storage.setSync('wx_user_info', res.detail)
        
        // api/wechat_users接口参数为以下参数  此方法暂时不用
        http.post({
          url: 'api/wechat_users',
          data: {
            iv: res.detail.iv,
            encrypted_data: res.detail.encryptedData
          },
          success: (e) => {
            console.log('success, update user info')
          },
          fail: (e) => {
            console.error('error, update user info')
          }
        })

        var userInfo = getApp().globalData.userInfo
        var phoneReg = getApp().globalData.phoneReg

        if (userInfo == null || !phoneReg.test(userInfo.phone)) {
          var url = "/pages/account/phone/validate"
          url = url + "?back=" + this.data.back
          wx.redirectTo({
            url: url,
          })
        } else {
          if (this.data.back) {
            wx.navigateBack({})
          } else {
            wx.reLaunch({
              url: '/pages/index/index',
            })
          }
        }
      } else {
        console.log('没有授权获取微信用户信息')
      }
    },

    quit_login: function () {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    },

    authLogin: function () {
      wx.getUserProfile({
        lang: 'zh_CN',
        desc: "用于平台展示",
        success: res => {
          console.log(res)
          var data = res.userInfo
          var globalData = getApp().globalData
          var session = globalData.session
          data.open_id = session.openid
          http.post({
            url: 'api/wechat_users',
            data: data,
            success: (e) => {
              console.log('success, update user info')
              storage.setSync('authLoginStatus', true)
              globalData.authLoginStatus = true
            },
            fail: (e) => {
              console.error('error, update user info')
            }
          })
  
          var userInfo = globalData.userInfo
          var phoneReg = globalData.phoneReg
  
          if (userInfo == null || !phoneReg.test(userInfo.phone)) {
            var url = "/pages/account/phone/validate"
            url = url + "?back=" + this.data.back
            wx.redirectTo({
              // url: "/pages/account/phone/validate",
              url: url,
            })
          } else {
            if (this.data.back) {
              wx.navigateBack({})
            } else {
              wx.reLaunch({
                url: '/pages/index/index',
              })
            }
          }

        }
      })
    },
  },
})
