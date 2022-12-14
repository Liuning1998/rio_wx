// orders/pages/service/index.js
var http = require('../../../utils/http.js')
var submiting = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    services: null,
    currentReason: null,
    currentService: null,
    currentLineItems: null,
    submitDisable: true,
    orderServiceStatus: null,
    twice:false,//第二次进入页面
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let currentLineItems = this.params.currentLineItems
    let order = this.params.order
    let productLength = this.params.productLength
    this.setData({ 
      order: order,
      currentLineItems: currentLineItems,
      productLength: productLength,
    })
    
    if(this.data.userInfo.phone && this.data.userInfo.phone.trim() != ''){
      this.setData({
        link_phone: this.data.userInfo.phone
      })
    }

    this.getServices()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    submiting = false
    this.checkSubmitBtnStatus()
    if(this.data.twice){
      //设置售后商品展示个数
      let currentLineItems = this.data.currentLineItems;
      let productLength = 0
      currentLineItems.line_items.forEach((element)=>{
        if(element.selected){
          productLength += 1
        }
      })
      this.setData({
        productLength: productLength
      })
    }else{
      this.setData({
        twice: true
      })
    }


  },

  getServices: function () {
    http.get({
      url: 'api/sale_order_services/apply_reason',
      success: res => {
        if(res.data != null && res.data.length) {
          this.setData({ services: res.data })
        }
      }
    })
  },

  getOrderServiceStatus: function (order) {
    return new Promise((resolve,reject)=>{
      http.get({
        url: 'api/sale_order_services/show_info',
        data: { order_number:  order.number },
        success: res => {
          if (res.data != null && res.data.items != null && res.data.items.length > 0) {
            let _data = {}
            res.data.items.forEach(item => {
              _data['' + item.id] = item.status
            })
            this.setData({ orderServiceStatus: _data })
            resolve();
          }
        }
      })
    })
  },

  submitForm: function () {
    if (!getApp().globalData.phoneReg.test(this.data.link_phone)) {
      this.errorToast('请输入正确手机号')
      return
    }

    if (this.data.link_name == null || this.data.link_name.length <= 0) {
      this.errorToast('请输入联系人姓名')
      return
    }

    if (this.data.currentLineItems.quantity == null || this.data.currentLineItems.quantity <= 0) { 
      this.errorToast('请选择售后商品')
      return
    }

    if (this.data.currentService == null) {
      this.errorToast('请先选择服务类型')
      return
    }

    if (this.data.currentReason == null) {
      this.errorToast('请先选择售后原因')
      return
    }

    if (this.data.reasonText == null || this.data.reasonText.length <= 0) {
      this.errorToast('请填写问题描述')
      return
    }

    if (this.data.submitDisable) {
      return
    }

    if (submiting) { return false }
    submiting = true

    let variant_ids = new Array();

    this.data.currentLineItems.line_items.forEach((ele,index)=>{
      if(ele.variant_id && ele.selected){
        variant_ids.push({
          variant_id: ele.variant_id,
          quantity: ele.selectedQuantity,
        })
      }
    })

    let _data = {
      // quantity: this.data.currentLineItems.quantity,
      link_phone: this.data.link_phone,
      link_name: this.data.link_name,
      service_type: this.data.currentService.service_type,
      apply_reason: this.data.currentReason,
      desc: this.data.reasonText,
      order_number: this.data.order.number,
      variant_ids: variant_ids
    }

    http.post({
      url: 'api/sale_order_services',
      data: _data,
      success: res => {
        // submiting = false
        setTimeout(function(){
          wx.navigateBack({ delta: 2 })
        }, 1000)
        this.successToast('已经发起售后')
      },
      fail: res => {
        submiting = false
        this.errorToast('服务器繁忙，请稍后再试')
      }
    })
  },

  toProducts: function () {
    var line_items = this.data.currentLineItems;
    this.navigateTo(`/orders/pages/service_product/index?line_items=${JSON.stringify(line_items)}&number=${this.data.order.number}`)
  },

  showServices: function () {
    this.setData({ showServiceTypes: true })
  },

  showReasons: function () {
    if (this.data.currentService == null ) {
      this.errorToast('请先选择服务类型', 800)
      return
    }
    this.setData({ showReasonTypes: true })
  },

  hideSelectLayer: function () {
    this.setData({
      showReasonTypes: false,
      showServiceTypes: false
    })
    this.checkSubmitBtnStatus()
  },

  selectServiceType: function (e) {
    var item = e.currentTarget.dataset.item
    this.setData({
      currentService: item
    })
    this.hideSelectLayer()
    this.checkSubmitBtnStatus()
    this.setData({ currentReason: null })
  },

  selectReasonType: function (e) {
    var item = e.currentTarget.dataset.item
    this.setData({
      currentReason: item
    })
    this.hideSelectLayer()
    this.checkSubmitBtnStatus()
  },


  reasonInput: function (e) {
    let text = e.detail.value
    this.setData({ reasonText: text })
    this.checkSubmitBtnStatus()
  },

  checkSubmitBtnStatus: function () {
    if (this.data.link_name == null || this.data.link_name.length <= 0) {
      this.setData({ submitDisable: true })
      return
    }

    if (!getApp().globalData.phoneReg.test(this.data.link_phone)) {
      this.setData({ submitDisable: true })
      return
    }

    if (this.data.currentLineItems == null || this.data.currentLineItems.line_items.length <= 0) { 
      this.setData({ submitDisable: true })
      return
    }

    if (this.data.currentService == null) {
      this.setData({ submitDisable: true })
      return
    }

    if (this.data.currentReason == null) {
      this.setData({ submitDisable: true })
      return
    }

    if (this.data.reasonText == null || this.data.reasonText.length <= 0) {
      this.setData({ submitDisable: true })
      return
    }

    this.setData({ submitDisable: false })
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
    this.checkSubmitBtnStatus()
  },

  gotoAgreement: function () {
    this.navigateTo("/agreement/pages/sale_service/show")
  },
})