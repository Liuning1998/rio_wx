// group_buy/pages/products/index/index.js
var http = require('../../../../utils/http.js')

var timer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    now: Math.floor((new Date).getTime()/1000),
    apiLoad: false
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
      // this.getBrand(2)
    } else {
      this.setData({ brand: brand })
    }

    this.setData({ tagName: options.tag_name, tagID: options.tag_id, sortBadge: options.sort_badge })

    this.getProducts()
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
    let item = e.currentTarget.dataset.item
    this.navigateTo(`/group_buy/pages/orders/join/index?id=${item.id}`)
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
})