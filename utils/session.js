// 用户数据交换，登录、授权验证
var http = require("./http.js")
var storage = require("./storage.js")

function login() {
  var p = new Promise((resolve, reject) => {
    wx.login({
      success: function(res) {
        http.post({
          url: 'api/wx_login',
          data: {
            code: res.code
          },
          success: res => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              storage.setSyncWithExpire('session', res.data, 7 * 24 * 60 * 60)
              storage.delSync('userInfo')
              if (res.data.need_user_info) {
                updateUserInfo()
              }
              resolve(res.data)
            } else {
              reject(res)
            } 
          }
        })
      },
    })
  })

  return p
}

function updateUserInfo () {
  wx.getSetting({
    success: res => {
      if (res.authSetting['scope.userInfo']) {
        wx.getUserInfo({
          success: res => {
            http.post({
              url: 'api/wechat_users',
              data: {
                iv: res.iv,
                encrypted_data: res.encryptedData
              },
              success: (e) => {
                console.log('success, update user info')
              },
              fail: (e) => {
                console.error('error, update user info')
              }
            })
          }
        })
      }
    }
  })
}

function getUserInfo () {
  var p = new Promise((resolve, reject) => {
    http.post({
      url: 'api/users/show_user',
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          storage.setSyncWithExpire('userInfo', res.data)
          resolve(res.data)
        } else {
          reject(res)
        }
      }
    })
      
  })

  return p
}

module.exports = {
  login: login,
  getUserInfo: getUserInfo
  // checkScoreLogin: checkScoreLogin,
  // scoreLogin: scoreLogin,
  // scoreAuthenticate: scoreAuthenticate,
  // pageErrorState: pageErrorState,
  // // updateScoreUserInfo: updateScoreUserInfo,
  // getScoreUserInfo: getScoreUserInfo
}