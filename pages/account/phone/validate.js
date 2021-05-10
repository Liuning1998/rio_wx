// pages/account/phone/validate.js
var http = require('../../../utils/http.js')
var storage = require('../../../utils/storage.js')
var phoneReg = getApp().globalData.phoneReg

var rucaptchaStatus = 0
var getCodeAbleSubmit = true

Page({

  /**
   * 页面的初始数据
   */
  data: {
    rucaptcha_img: '',
    phone: '',
    _rucaptcha: '',
    verification_code: '',
    waitTime: 0,
    userId: null,
    rucaptchaId: null,
    gotCode: false,
    ableSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    if (this.data.userInfo.tmp_user_phone != null && this.data.userInfo.tmp_user_phone.length > 0) {
      this.setData({ phone: this.data.userInfo.tmp_user_phone })
    }
  },

  onShow: function () {
    rucaptchaStatus = 0
    getCodeAbleSubmit = true
    this.setRucaptcha()
  },

  changeRucaptcha: function (e) {
    this.setRucaptcha()
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
    this.checkAbleSubmit()
  },

  getCode: function () {
    

    if (this.data.waitTime > 0) { return false }
    
    if (!phoneReg.test(this.data.phone)) {
      this.errorToast('请输入正确的手机号码')
      return false
    }

    if (this.data._rucaptcha.length < 5) {
      if (rucaptchaStatus > 0) {
        this.errorToast('请输入正确的图形验证码')
        rucaptchaStatus = 0
        return false
      } else {
        rucaptchaStatus = 1
        setTimeout(res => {
          this.getCode()
        }, 500)
        return false
      }
    }

    

    this.getCodeFromServer()     
  },

  getCodeFromServer: function () {
    if (!getCodeAbleSubmit) {
      return false
    }
    getCodeAbleSubmit = false

    rucaptchaStatus = 0

    http.post({
      url: 'api/verifications/send_sms_code',
      data: {
        phone: this.data.phone,
        _rucaptcha: this.data._rucaptcha,
        rucaptcha_id: this.data.rucaptchaId
      },
      success: (res) => {
        this.waiting(60)
        getCodeAbleSubmit = true
        this.setData({ gotCode: true })
        // this.setRucaptcha()
      },
      fail: (res) => {
        getCodeAbleSubmit = true
        // this.phoneErrorToast(res)
        this.setRucaptcha()
        var msg = '获取短信验证码失败'
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t
          if (res.data.code == 100142) {
            this.setData({ gotCode: true })
          }
        }
        this.errorToast(msg)
      }
    })
  },

  bindPhone: function (e) {
    if (!this.data.gotCode) {
      this.errorToast('请先获取短信验证码')
      return false
    }

    if (!phoneReg.test(this.data.phone)) {
      this.errorToast('请输入正确的手机号码')
      return false
    }

    if (this.data.verification_code.length < 6) {
      this.errorToast('请输入正确的短信验证码')
      return false
    }

    http.put({
      url: 'api/users/update_phone',
      data: {
        verification_code: this.data.verification_code,
        phone: this.data.phone
      },
      success: (res) => {
        this.successToast('手机号码验证成功', 1000)
        getApp().globalData.userInfo = res.data
        storage.setSyncWithExpire('userInfo', res.data)
        this.setRucaptcha()
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index',
          })
        }, 1200)
      },
      fail: (res) => {
        // this.phoneErrorToast(res)
        if (res.data.code == 100148) {
          this.getUserInfoFromServer()
        } else {
          var msg = '手机号码验证失败'
          if (getApp().globalData.errorMap[res.data.code] != null) {
            msg = getApp().globalData.errorMap[res.data.code].msg_t
          }
          this.errorToast(msg)
        }
      }
    })
  },

  getUserInfoFromServer: function () {
    http.post({
      url: 'api/users/show_user',
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.successToast('该用户已绑定手机号', 1000)
          getApp().globalData.userInfo = res.data
          storage.setSyncWithExpire('userInfo', res.data)
          this.setRucaptcha()
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/index/index',
            })
          }, 1200)
        } else {
          var msg = '网络繁忙，请稍后再试'
          if (getApp().globalData.errorMap[res.data.code] != null) {
            msg = getApp().globalData.errorMap[res.data.code].msg_t
          }
          this.errorToast(msg)
        }
      }
    })
  },

  waiting: function (time) {
    if (time != null) {
      this.setData({ waitTime: time })
      setTimeout(this.waiting, 1000)
      return true
    }
    if (this.data.waitTime <= 0) {
      return false
    } else {
      this.setData({ waitTime: this.data.waitTime - 1 })
      setTimeout(this.waiting, 1000)
    }
  },

  setRucaptcha: function (e) {
    var rucaptchaId = '' + (new Date().getTime()) + Math.round(Math.random() * 100000)
    this.setData({
      rucaptcha_img: getApp().globalData.apiServer + 'rucaptcha?rucaptcha_id=' + rucaptchaId,
      rucaptchaId: rucaptchaId
    })
  },

  formSubmit: function (e) {
    switch (e.target.id) {
      case 'bindPhone':
        this.bindPhone(e)
        break
      case 'getCode':
        this.getCode(e)
        break
    }
  },

  checkAbleSubmit: function () {
    if (this.data.phone.length == 11 && this.data.verification_code.length == 6) {
      this.setData({ ableSubmit: true })
    } else {
      this.setData({ ableSubmit: false })
    }
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})