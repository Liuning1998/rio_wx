//index.js
//获取应用实例
const app = getApp()
var http = require('../../utils/http.js')
var sessionApi = require('../../utils/session.js')

Page({
  data: {
    products: [],
    banner: {},
    navHeigth: 0,
    showLoading: false,
    floatNoticeLeft: 0,
    floatNoticeStatus: false,
    noticeText: null,
    pageNo: 1,
    pageTitle: null
  },
  
  onLoad: function (option) {
    getApp().commonBeforeOnLoad(this)
    this.setData({ navHeigth: 44 + wx.getSystemInfoSync().statusBarHeight })
    this.getBanner()
    this.setData({ 
      itemId: option.item_id,
      pageTitle: option.name || '金色家园·幸福生活'
    })
    this.getProducts(option.item_id)
  },

  onShow: function () {
    this.resetUerInfo()
    if (this.data.itemId != null && !!this.data.loadTimes ) {
      this.setData({ loadTimes: 1 })
      this.getProducts(this.data.itemId, 1, true)
    }
    this.getNotice()
  },

  // getProducts: function () {
  //   http.get({
  //     url: 'api/products/home_products',
  //     success: res => {
  //       if(res.data != null) {
  //         this.setData({ products: res.data })
  //       }
  //       this.stopPDRefresh()
  //     },
  //     fail: res => {
  //       this.stopPDRefresh()
  //     }
  //   })
  // },

  getProducts: function (special_area_id, pageNo, reset) {
    http.get({
      url: `api/special_areas/${special_area_id}/products`,
      data: {
        page: pageNo || this.data.pageNo,
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          // this.setData({ products: res.data })
          this.appendProducts(res.data, reset)
        }
      }
    })
  },

  appendProducts: function (data, reset) {
    let products = this.data.products
    let offset = products.length

    if(reset) {
      this.setData({ products: data })
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

    if (data.length >= getApp().globalData.perPage) {
      this.setData({ pageNo: this.data.pageNo + 1 })
    }

    this.setData({ loaded: true })

    // this.stopPDRefresh()
  },

  getBanner: function () {
    http.get({
      url: 'api/ads/home',
      success: res => {
        if(res.data.banner != null) {
          this.setData({ banner: res.data.banner })
        }
      }
    })
  },

  gotoProduct: function (e) {
    let item = e.currentTarget.dataset.item
    // if (item.stock <= 0) {
    //   this.errorToast('该商品已售罄')
    //   return
    // }
    this.navigateTo('/pages/products/show/index?id=' + item.id)
  },

  onPullDownRefresh: function () {
    this.getBanner()
    this.resetUerInfo()
    this.getProducts(this.data.itemId, 1, true)
    this.setData({ showLoading: true })
    this.getNotice()
    // wx.stopPullDownRefresh()
    this.stopPDRefresh()
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 500) 
  },

  getNotice: function () {
    http.get({
      url: "api/ads/show_content",
      success: res => {
        if (res.data.status == 'ok' && res.data.content != null && res.data.content.length > 0) {
          this.setData({ noticeText: res.data.content, floatNoticeLeft: 7 })
          if(!this.data.floatNoticeStatus) {
            this.floatNotice()
          }
        } else if (res.data.status == 'ok'){
          this.setData({ noticeText: '' })
        }
      }
    })
  },

  floatNotice: function () {
    this.setData({ floatNoticeStatus: true })
    wx.createSelectorQuery().select('.float-notice-text').boundingClientRect(res => {
      if (res != null) {
        if (res.width > 0) {
          let left = this.data.floatNoticeLeft - 1
          if (left < 0 - res.width) {
            left = left + res.width
          }

          this.setData({ floatNoticeLeft: left })
        }
        // console.log(res)
      }
    }).exec()

   
    setTimeout(res => {
      this.floatNotice()
    }, 35)
  },

  goback: function () {
    wx.navigateBack({})
  },

  onReachBottom: function () {
    this.getProducts(this.data.itemId, this.data.pageNo)
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

            // wx.setNavigationBarColor({
            //   backgroundColor: '#ffffff',
            //   frontColor: '#000000',
            // })
          }
        } else {
          this.setData({ 
            scollStatus: false
          })

          // if (this.data.navbarColor != 'dark') {
          //   wx.setNavigationBarColor({
          //     backgroundColor: '#000000',
          //     frontColor: '#ffffff',
          //   })
          // }          
        }
      }
    }).exec()
  },
})
