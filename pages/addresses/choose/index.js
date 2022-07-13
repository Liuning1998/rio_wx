// pages/address/index/index.js
var http = require('../../../utils/http.js')
// var conllection = require('../../../utils/conllection.js')
// var messageModal = require('../../../utils/message_modal.js')
var helper = require('../../../utils/helper.js')
var storage = require("../../../utils/storage.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    addresses: [],
    pageNo: 1,
    loaded: false,
    referrer: null,
    isIphoneX: false,
    canScroll: true,
    deleteButtonShowId: -1,
    deleteButton: [{
      type: 'warn',
      text: '删除',
      extClass: 'test',
      // src: '/page/weui/cell/icon_del.svg', // icon的路径
      src: '/images/delete_icon.png'
    }],
  },

  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    
    if (options.referrer != null && options.referrer != '') {
      this.setData({ referrer: options.referrer })
    }

    this.setData({ isIphoneX: getApp().isIphoneX() })    
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          scrollHeight: res.windowHeight
        })
      }
    })


    this.getAddresses()
    
  },

  onShow: function () {

    // this.setData({ addresses: [], loaded: false, pageNo: 1, touchMoveList: {}, deleteButtonShowId: -1 })
    // this.getAddresses()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  // onReachBottom: function () {
  //   http.get({
  //     url: 'ship_addresses?page=' + this.data.pageNo,
  //     success: (res) => {
  //       this.pushItemToList(res.data)
  //     },
  //   })
  // },
  stopPDRefresh: function () {
    setTimeout(res => {
      wx.stopPullDownRefresh()
      this.setData({ showLoading: false })
    }, 500)
  },
  getAddresses: function () {
    http.get({
      url: 'api/ship_addresses?page=' + this.data.pageNo,
      success: (res) => {
        // this.pushItemToList(res.data)
        var cacheAddressReal = storage.getSync('ship_address_real')
        res.data.forEach((ele,index)=>{
          if(cacheAddressReal != null && cacheAddressReal.id == ele.id){
            ele.isSelected = true;
          }else if(!cacheAddressReal && ele.default_address){
            ele.isSelected = true;
          }else{
            ele.isSelected = false;
          }
        })
        this.setData({
          loaded: true,
          addresses:res.data
        })
        this.stopPDRefresh()
      },
      fail: (res) => { this.setData({ loaded: true }) }
    })
  },

  pushItemToList: function (data) {
    var addresses = this.data.addresses || []
    let _addrs = data.filter(item => !addresses.map(a => a.id).includes(item.id) )

    if (data.length == getApp().globalData.perPage) {
      this.setData({ pageNo: this.data.pageNo + 1 })
    }

    this.setData({ addresses: addresses.concat(_addrs) })
    // console.log(this.data.addresses)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  editAddress: function (e) {
    var address = e.currentTarget.dataset.address
    var paramId = 'address_' + address.id
    if (this.setParamsToGlobal(paramId, address)){
      if (this.data.referrer != null && this.data.referrer != '') {
        wx.redirectTo({
          url: '/pages/addresses/edit/index?referrer=' + this.data.referrer + '&paramId=' + paramId,
        })
      } else {
        wx.navigateTo({
          url: '/pages/addresses/edit/index?paramId=' + paramId,
        })
      }
    } else {
      // messageModal.errorToast('操作失败', 1000)
    }
    
  },

  newAddress: function () {
    if (this.data.addresses.filter(item => !item.deleted).length > 20) {
      this.errorToast('抱歉，地址最多只有20条哦，删一条在创建吧！')
      return false
    }
    if (this.data.referrer != null && this.data.referrer != '') {
      wx.redirectTo({
        url: '/pages/addresses/edit/index?referrer=' + this.data.referrer,
      })
    } else {
      wx.navigateTo({
        url: '/pages/addresses/edit/index',
      })
    }
  },

  setDefaultAddress: function (e) {
    var address = e.currentTarget.dataset.address
    http.post({
      url: 'api/ship_addresses/' + address.id + '/set_default_address',
      success: (res) => {
        // messageModal.successToast('设置成功', 1000)
        this.setDefaultAddressState(address)
        helper.cacheShipAddress(address)
      },
      fail: (res) => {
        // messageModal.errorToast('设置失败', 1000)
      }
    })
  },

  setDefaultAddressState: function (address) {
    var addresses = this.data.addresses
    for (var i = 0; i < addresses.length; i++) {
      if (address.id == addresses[i].id) {
        addresses[i].default_address = true
      } else {
        addresses[i].default_address = false
      }
    }

    this.setData({ addresses: addresses })
  },

  selectAddress: function (e) {
    if (this.data.referrer != null) {
      var address = e.currentTarget.dataset.address
      var addressesData = this.data.addresses;
      if(address.default_address){
        helper.cacheShipAddress(address)
      }
      helper.cacheShipAddressReal(address)
      addressesData.forEach((ele,index)=>{
        if(ele.isSelected == true && ele.id != address.id){
          ele.isSelected = false;
          var key = `addresses[${index}]`
          this.setData({
            [key]: ele
          })
        }
        if(ele.id == address.id && !ele.isSelected){
          ele.isSelected = true
          var key = `addresses[${index}]`
          this.setData({
            [key]: ele
          })
        }
      })
    } else {
      return false
    }

    if (this.data.referrer == 'confirm_order') {
      wx.navigateBack()
    }
  },


  slideviewShow: function (e) {
    var item = e.currentTarget.dataset.item
    this.setData({ deleteButtonShowId: item.id })
  },


  onPullDownRefresh: function(e) {
    // 触发下拉刷新时执行
    this.setData({ showLoading: true })
    this.getAddresses()
  },
})