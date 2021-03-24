// pages/coupons/list/index.js

var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    coupons: [],
    pageNo: 1,
    coupon_type: null,
    title: '卡券包',
    store_id: null,
    couponEmpty: false,
    showInfo: {},
    copyLayerStatus: false,
    deleteButtonShowId: -1,
    deleteButton: [{
      type: 'warn',
      text: '删除',
      extClass: 'test',
      // src: '/page/weui/cell/icon_del.svg', // icon的路径
      src: '/images/delete_icon.png'
    }],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    // this.params = { store_id: 2, title: "京东" }

    let title = this.params.title
    if (title != null) {
      this.setData({ title: title })
    }

    this.setData({
      store_id: this.params.store_id,
      // coupon_type: this.params.coupon_type
    })

    this.fetchCoupons(this.params.store_id, 1)
  },

  onShow: function () {
    this.setData({ deleteButtonShowId: -1 })
  },

  fetchCoupons: function (store_id, page) {
    http.get({
      url: 'api/coupons',
      data: {
        q: {
          store_id_eq: store_id,
        },
        page: page
      },
      success: res => {
        if (res.data.status == 'ok') {
          this.pushData(res.data.coupons)
          if (res.data.coupons.length <= 0 && page == 1) {
            this.setData({ couponEmpty: true })
          }
        }
      }
    })
  },

  pushData: function (coupons) {
    let _coupons = this.data.coupons
    let index = _coupons.length
    for(var i=0; i < coupons.length; i++) {
      if(_coupons.filter(item => item.id == coupons[i].id ).length <= 0) {
        let key = `coupons[${index}]`
        this.setData({ [key]: coupons[i] })
        index = index + 1
      }
    }
    if (coupons.length >= getApp().globalData.perPage) {
      this.setData({
        pageNo: this.data.pageNo + 1
      })
    }
  },

  onReachBottom: function () {
    this.fetchCoupons(this.data.store_id, this.data.pageNo)
  },

  gotoHome: function () {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  showInfo: function (e) {
    let item = e.currentTarget.dataset.item
    if (item == null) { return }
    http.get({
      url: `api/coupons/${item.id}/fetch_secret`,
      success: res => {
        if(res.data.secret != null || res.data.number != null) {
          this.setData({ showInfo: res.data })
          this.showCopyLayer()
        }
      }
    })
  },

  showCopyLayer: function () {
    this.setData({ copyLayerStatus: true })
  },

  hideCopyLayer: function () {
    this.setData({ showInfo: {}, copyLayerStatus: false })
  },

  copyInfo: function (e) {
    let item = e.currentTarget.dataset.item
    let id = e.currentTarget.dataset.id
    wx.setClipboardData({
      data: item,
      success: (res) => {
        console.log('内容已复制')
        http.put({
          url: `api/coupons/${id}/copied`,
          success: res => {
            this.resetCopyStatus(id)
            console.log(res)
          }
        })
      }
    })
  },

  resetCopyStatus: function (coupon_id) {
    let offset = null
    let coupons = this.data.coupons

    // 处理全部订单里的数据
    for (let i = 0; i < coupons.length; i++) {
      if (coupons[i].id == coupon_id) {
        offset = i
        break
      }
    }
    if (offset != null) {
      let key = `coupons[${offset}].copied_at`
      this.setData({ [key]: 'copied' })
    }
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // },

  deleteItem: function (e) {
    var item = e.currentTarget.dataset.item

    wx.showModal({
      title: '删除卡券',
      content: '您确定删除该卡券吗？',
      success: (res) => {
        if (res.confirm) {
          http.delete({
            url: 'api/coupons/' + item.id,
            success: (res) => {
              // messageModal.successToast('删除地址成功', 1000)
              this.deleteForShow(item)
            },
            fail: (res) => {
              // messageModal.errorToast('删除地址失败', 1000)
            }
          })
        }

      }
    })
    
  },

  deleteForShow: function (item) {
    var coupons = this.data.coupons

    for (var key in coupons) {
      if (coupons[key].id == item.id) {
        var temp = {}
        temp["coupons[" + key + '].deleted'] = true
        this.setData(temp)
      }
    }

    this.successToast('删除成功')
  },

  slideviewShow: function (e) {
    var item = e.currentTarget.dataset.item
    this.setData({ deleteButtonShowId: item.id })
  },
})