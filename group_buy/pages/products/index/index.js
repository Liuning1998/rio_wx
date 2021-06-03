// group_buy/pages/products/index/index.js
var http = require('../../../../utils/http.js')
var storage = require('../../../../utils/storage.js')

var timer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    now: Math.floor((new Date).getTime()/1000),
    apiLoad: false,
    payNotice: '',
    activities_avatars: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let brand = this.params.brand

    if (options.navbarColor == 'dark') {
      this.setData({ navbarColor: 'dark' })
      wx.setNavigationBarColor({
        backgroundColor: '#ffffff',
        frontColor: '#000000',
      })
    }

    if (brand == null) {
      this.getBrand(options.id)
      this.setData({ home_brand_id: options.id })
      // this.getBrand(2)
    } else {
      this.setData({ home_brand_id: brand.id })
      this.setData({ brand: brand })
    }

    this.setData({ tagName: options.tag_name, tagID: options.tag_id, sortBadge: options.sort_badge })

    this.getProducts()

    // if (this.data.userInfo == null || this.data.userInfo.kzx_user_identification != 1) {
    //   this.checkPayNotice()
    // }

    // if (typeof(options.sources) != 'undefined') {
    //   this.yanglaoApi(options)
    // }
  },

  onShow: function () {
    if (timer == null) {
      timer = setTimeout( this.setNow, 1000)
    }

    if (this.data.reloadFlag && this.data.brand != null) {
      this.getBrand(this.data.brand.id)
      this.getProducts({reload: true})
    }
    this.setData({ reloadFlag: true })
  },

  onHide: function () {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },

  onUnload: function () {
    console.log('onunload')
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  },
  
  getProducts: function (options={}) {
    var pageNo = Math.ceil((this.data.products.length+1)/getApp().globalData.perPage)
    http.get({
      url: 'api/group_buy_activities',
      data: {
        page: pageNo
      },
      success: res => {
        this.setData({ apiLoad: true })
        this.appendProducts(res.data, options)
        for(var i in res.data) {
          if (res.data[i].state == 'completed') {
            this.getActivitiesAvartars(res.data[i].id)
          }
        }
      }
    })
  },

  appendProducts: function (data, options={}) {
    let products = this.data.products
    let offset = products.length

    if (options.reload) {
      this.setData({products: data})
    } else {
      data.forEach(item => {
        if (products.filter(i => i.id == item.id).length <= 0) {
          products.push(item)
          let key = `products.[${offset}]`
          this.setData({ [key]: item })
          offset += 1
        }
      })
    }

    this.setData({ loaded: true })

    // this.stopPDRefresh()
  },

  gotoProduct: function (e) {
    let item = e.currentTarget.dataset.item

    // if (this.data.now > item.activity.end_at) {
    //   this.errorToast('该活动已结束')
    //   return false
    // }

    if (item.state == 'completed') { return }

    this.navigateTo('/group_buy/pages/products/show/index?id=' + item.id)
  },

  gotoJoinWithId: function (e) {
    if( !this.checkAuthLoginStatusAndPhone({back: true}) ) {
      return false
    }
    let item = e.currentTarget.dataset.item
    var home_brand_id = this.data.home_brand_id

    if (this.data.userInfo == null || this.data.userInfo.kzx_user_identification != 1) {
      this.setData({ currentItem: item })
      this.checkPayNotice()
      return false
    }
    
    this.navigateTo(`/group_buy/pages/orders/join/index?id=${item.id}&home_brand_id=${home_brand_id}`)
  },

  setNow: function () {
    let now = new Date
    now = Math.floor(now.getTime()/1000)
    this.setData({ now: now })

    timer = setTimeout(this.setNow, 1000)
  },

  onReachBottom: function () {
    this.getProducts()
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    // if (this.data.navbarColor == 'dark') { return }
    wx.createSelectorQuery().select('.ad-image').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 0) {
          if (!this.data.scollStatus) {
            this.setData({ 
              scollStatus: true
            })

            wx.setNavigationBarColor({
              backgroundColor: '#ffffff',
              frontColor: '#000000',
            })
          }
        } else {
          this.setData({ 
            scollStatus: false
          })

          if (this.data.navbarColor != 'dark') {
            wx.setNavigationBarColor({
              backgroundColor: '#000000',
              frontColor: '#ffffff',
            })
          }          
        }
      }
    }).exec()
  },

  getBrand: function(id) {
    http.get({
      url: `api/home_brands/${id}`,
      success: res => {
        if (res.data != null) {
          this.setData({ brand: res.data })
        }
      }
    })
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

  // 检查支付前是否需要弹框提示
  checkPayNotice: function () {
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
    // if (this.data.payNoticeProtocolStatus) {
    //   storage.setSync('group_buy_notice_flag', true)
    // }

    this.closePayNoticeToast()
  },

  closePayNoticeToast: function () {
    this.setData({ showPayNotice: false })
    var item = this.data.currentItem
    var home_brand_id = this.data.brand.id

    this.navigateTo(`/group_buy/pages/orders/join/index?id=${item.id}&home_brand_id=${home_brand_id}`)
  },

  // ?decrypted_string="xxxxxxxxxxxxxxxxxxx"&app_id='xxxxxxxxxx'&sources='xxxxx'
  // yanglaoApi: function (options) {
  //   http.post({
  //     url: 'api/api_users/valid_api_user',
  //     data: {
  //       decrypted_string: options.decrypted_string,
  //       app_id: options.app_id,
  //       sources: options.sources
  //     },
  //     success: res => {
  //       console.log(res)
  //     }
  //   })
  // },

  getActivitiesAvartars: function (activity_id) {
    http.get({
      url: `/api/group_buy_activities/${activity_id}/activity_avatar`,
      success: res => {
        if(res.data.result != null) {
          this.setData({
            [`activities_avatars.${activity_id}`]: res.data.result
          })
          // for(var i in res.data.result) {
          //   this.setData({
          //     [`activities_avatars.${activity_id}[${i}]`]: res.data.result[i]
          //   })
          // }
        }
      }
    })
  },

})