// pages/store/index/index.js
var http = require('../../utils/http.js')
var sessionApi = require('../../utils/session.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    specialAreas: [], // 专区
    pageNo: 1,
    ads: [],
    todayProducts: [],
    ctpIndex: 1,
    cartAnimations: {},
    canScroll: true,
    scorllViewHeight: 'auto',
    homeBrands: null,
    tryProduct: null,
    noticeText: null,
    swiperCurrent: 0,
    pageBottom: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let _reLogin = this.getParamsFromGlobal('reLogin')

    if (_reLogin) {
      this.reLogin()
    }
    
    this.getRecommendProducts()
    this.getspecialAreas()
    this.getAds()
    this.getNotice()
    // this.getTodayProduct()

    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          scrollHeight: res.windowHeight
        })
      }
    })
    this.getHomeBrands()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadCartInfo()
    this.setData({ canScroll: true })
    this.getUserInfo()
  },

  getRecommendProducts: function (pageNo) {
    http.get({
      url: 'api/products/youxuan',
      data: {
        page: pageNo || this.data.pageNo,
      },
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.appendProducts(res.data)
        }
      }
    })
  },

  refreshProducts: function () {
    http.get({
      url: 'api/products/youxuan',
      data: {
        page: 1,
      },
      success: res => {
        this.stopPDRefresh()
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.setData({ products: res.data })
          if(res.data.length >= getApp().globalData.perPage) {
            this.setData({ pageNo: 2, pageBottom: false })
          } else {
            this.setData({ pageNo: 1, pageBottom: true })
          }
        }
      },
      fail: res => {
        this.stopPDRefresh()
      }
    })
  },

  getHomeBrands: function () {
    http.get({
      url: '/api/home_brands',
      success: res => {
        if(res.data != null && res.data.length > 0) {
          let _tryProduct = null
          let _todayProducts = null
          let _data = []
          for(let i=0; i < res.data.length; i++) {
            let item = res.data[i]
            if(item.tags.indexOf('试用商品') >= 0) {
              _tryProduct = item
            // } else if (item.tags.indexOf('今日特惠') >= 0) {
            //   _todayProducts = item
            } else {
              _data.push(item)
            }
          }
          this.setData({
            homeBrands: _data,
            tryProduct: _tryProduct,
            todayProducts: _todayProducts
          })
        }
      }
    })
  },

  // getTodayProduct: function (pageNo) {
  //   http.get({
  //     url: 'api/products/today_recommend',
  //     success: res => {
  //       if (res.data != null && res.data.constructor.name == 'Array') {
  //         // if(res.data.length > 1) {
  //         //   var _data = res.data.slice(0,2)
  //         //   _data = _data.concat(res.data)
  //         //   _data = _data.concat(res.data.slice(res.data.length-2, res.data.length))
  //         // } else {
  //         //   var _data = res.data
  //         //   _data.concat(res.data, res.data, res.data, res.data)
  //         // }
  //         this.setData({ todayProducts: res.data})
  //       }
  //     }
  //   })
  // },

  appendProducts: function (data) {
    let products = this.data.products
    let offset = products.length

    data.forEach(item => {
      if (products.filter(i => i.id == item.id).length <= 0) {
        products.push(item)
        let key = `products.[${offset}]`
        this.setData({ [key]: item })
        offset += 1
      }
    })

    if (data.length >= getApp().globalData.perPage) {
      this.setData({ pageNo: this.data.pageNo + 1, pageBottom: false })
    } else {
      this.setData({ pageBottom: true })
    }

    // this.stopPDRefresh()
  },

  getspecialAreas: function () {
    http.get({
      url: 'api/special_areas/recommend',
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          var result = []
          for(let i in res.data){
            let j = Math.floor(i/8)
            if(result[j] == null) { result[j] = [] }
            result[j].push(res.data[i])
          }
          this.setData({ specialAreas: result })
        }
      }
    })
  },

  getAds: function () {
    http.get({
      url: "api/ads",
      data: {
        q: {
          tags_name_eq: '商城轮播图'
        }
      },
      success: res => {
        console.log(res)
        if (res.data != null && res.data.constructor.name == "Array") {
          this.setData({ ads: res.data })
        }
      }
    })
  },

  refreshData: function () {
    this.setData({
      // pageNo: 1,
      // products: [],
      // specialAreas: []
    })

    this.getAds()
    this.getspecialAreas()
    // this.getRecommendProducts(1)
    this.refreshProducts()
    // this.getTodayProduct()
    this.getHomeBrands()
    this.getUserInfo()
  },

  onPullDownRefresh() {
    this.refreshData()
    this.setData({ showLoading: true })
    // this.stopPDRefresh()
  },

  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 1000)
  },

  onReachBottom: function () {
    this.getRecommendProducts()
  },

  gotoShow: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    if (item.url != null && item.url.length > 0) {
      let url = item.url
      if(url.indexOf('?') >= 0) {
        url = url + `&item_id=${item.id}`
      } else {
        url = url + `?item_id=${item.id}`
      }
      if (item.mark != null && item.mark.length > 0) {
        url = url + `&item_mark=${item.mark}`
      }
      this.navigateTo(url)
      return
    }
    this.navigateTo(`/pages/special_areas/show/index?item_id=${item.id}&name=${item.name}`)
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.id == null) {
      return
    }

    this.navigateTo("/pages/products/show/index?id=" + item.id)
  },

  gotoTodayProducts: function (e) {
    this.navigateTo("/products/pages/today/index?pageType=" + 'today')
  },

  gotoYouxuan: function (e) {
    this.navigateTo("/products/pages/today/index?pageType=" + 'youxuan')
  },

  gotoUrl: function (e) {
    console.log(e)
    var url = e.currentTarget.dataset.url
    if (url == null || url.length <= 0) {
      return
    }

    this.navigateTo(url)
  },

  reLogin: function () {
    sessionApi.login().then(res => {
      // this.globalData.session = res
      // getUser()
      // if (this.CallbackForSession) {
      //   this.CallbackForSession(res)
      // }
      getApp().globalData.session = res
      this.setData({ session: res })
      this.reGetUserInfo()
    })


  },

  reGetUserInfo: function () {
    sessionApi.getUserInfo().then(res => {
      getApp().globalData.userInfo = res
      this.setData({ userInfo: res })
      // if (this.CallbackForUserInfo) {
      //   this.CallbackForUserInfo(res)
      // }
    })
  },

  gotoCart1: function () {
    wx.switchTab({
      url: '/pages/orders/cart/index',
    })
  },

  gotoBrand: function (e) {
    var item = e.currentTarget.dataset.item
    if (item != null && item.url != null && item.url.length > 0) {
      let url = item.url
      if(url.indexOf('?') >= 0) {
        url = url + `&id=${item.id}&tag_name=${item.tags[0]}`
      } else {
        url = url + `?id=${item.id}&tag_name=${item.tags[0]}`
      }

      this.navigateTo(url, { brand: item })
      return true
    }

    if (item.tags != null && item.tags.length > 0 && item.tags[0] != null) {
      this.navigateTo(
        `/products/pages/index2/index?id=${item.id}&tag_name=${item.tags[0]}`,
        { brand: item }
      )
    }
  },

  gotoTryProduct: function (e) {
    wx.navigateTo({ url: '/try_product/pages/products/index/index' })
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

  changeSwiperCurrent: function (e) {
    this.setData({ swiperCurrent: e.detail.current })
  },

  changeNavbar: function () {
    this.checkNavbar()
    setTimeout(res => {
      this.changeNavbar()
    }, 500)
  },

  checkNavbar: function () {
    wx.createSelectorQuery().select('.user-content').boundingClientRect(res => {
      if (res != null) {
        if (res.top < 50) {
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

          wx.setNavigationBarColor({
            backgroundColor: '#000000',
            frontColor: '#ffffff',
          })
        }
      }
    }).exec()
  },

  getUserInfo: function () {
    http.post({
      url: 'api/users/show_user',
      success: res => {
        getApp().globalData.userInfo = res.data
        this.setData({ userInfo: res.data })
      }
    })
  },
  
})