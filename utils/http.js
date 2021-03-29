// var messageModal = require("./message_modal.js")
var storage = require("./storage.js")
var config = require('../app.config.js').config()

var checkPhonePage = [
  // "/pages/products/show/index",
  "/pages/coupons/list/index",
  "/pages/coupons/dashboard/index",
  "/pages/orders/show/index",
  "/pages/products/buy/index",
  "/pages/addresses/edit/index",
  "/pages/addresses/index/index",
  "/try_product/pages/orders/index/index",
  // "/pages/contact/index"
]

// {errMsg: "request:fail "}
// {data: {…}, header: {…}, statusCode: 400, errMsg: "request:ok"}
function request(options) {
  options = options || {}
  
  var success = options.success || ((res) => { console.log(res) })
  var fail = options.fail
  delete options.success
  delete options.fail

  var session = storage.getSyncWithExpire("session") || {}
  options.url = config.apiServer + options.url
  options.header = { AccessToken: session.access_token }

  if (options.data != null) {
    options.data['ua'] = 'wx_mini_program;jinsejiayuan'
  } else {
    options.data = { 'ua': 'wx_mini_program;jinsejiayuan' }
  }

  var p = new Promise((resolve, reject) => {
    wx.request(Object.assign(options, {
      fail: (res) => {
        res.data = res.data || {}
        reject(res)
      },
      success: (res) => {
        if(res.statusCode >= 200 && res.statusCode < 300){
          resolve(res)
        } else {
          res.data = res.data || {}
          httpFail(res, reject)
        }
      }
    }))
  })

  p.then(success, fail)
}

function httpFail (res, reject) {
  // 100105（需要验证手机）错误时清空缓存中的手机号
  // if (res.data.code == 100105) {
  //   var userInfo = storage.getSyncWithExpire('user_info')
  //   if(userInfo!= null && userInfo != ''){
  //     userInfo.phone = null
  //     storage.setSyncWithExpire('user_info', userInfo)
  //   }
  // }

  if (res.statusCode == 401) {
    var pages = getCurrentPages()
    var currentPage = '/' + pages[pages.length - 1].route

    if (res.data.code == 100400) {
      wx.removeStorageSync('session')
      getApp().globalData.params['reLogin'] = true
      if (currentPage != '/pages/index/index') {
        wx.reLaunch({
          url: '/pages/index/index',
        })
      }
    } else if (currentPage == "/pages/index/index") {
      res.data = res.data || {}
      reject(res)
    } else {
      // messageModal.errorToast('小程序错误', 1000)
      wx.clearStorageSync()
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 1000)
    }
  } else if (res.statusCode == 400 && res.data.code == 100105) {
    var currentUrl = getCurrentUrl()
    if (checkPhonePage.includes(currentUrl)) {
      wx.redirectTo({
        url: '/pages/account/phone/validate',
      })
    } else {
      res.data = res.data || {}
      reject(res)
    }
  } else {
    res.data = res.data || {}
    reject(res)
  }
}

function getCurrentUrl () {
  let pages = getCurrentPages()
  var currentPage = '/' + pages[pages.length - 1].route

  return currentPage
}

function filterValidatePhone () {
  var pages = getCurrentPages()
  var currentPage =  '/' + pages[pages.length - 1].route

  return getApp().globalData.pathOfFilterValidatePhone.includes(currentPage)
}

function get(options) {
  options = options || {}
  options.method = "GET"
  request(options)
}

function post(options) {
  options = options || {}
  options.method = "POST"
  request(options)
}

function put(options) {
  options = options || {}
  options.method = "PUT"
  request(options)
}

function del(options) {
  options = options || {}
  options.method = "DELETE"
  request(options)
}

module.exports = {
  request: request,
  get: get,
  post: post,
  delete: del,
  put: put
}