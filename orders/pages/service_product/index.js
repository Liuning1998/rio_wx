// orders/pages/service/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    allSelected: false,
    orderServiceStatus: null,
    canNext: false, //是否可以跳转下一页
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    let order = this.params.order;

    this.getOrderServiceStatus(order).then(()=>{
      let currentLineItems = new Object();
      currentLineItems.line_items = new Array();
      currentLineItems.quantity = new Number();
      currentLineItems.total = new Number();
      let productLength = 0
  
      if(order){
        currentLineItems.line_items = order.line_items.filter((value,key)=>{
          if(this.data.orderServiceStatus[value.variant_id] == 'ok'){
            value.selected = true;
            value.selectedQuantity = value.quantity
            currentLineItems.quantity += value.selectedQuantity
            currentLineItems.total += parseFloat(value.price) * value.selectedQuantity
            productLength += 1
            return value
          }
        })
      }

      this.setData({ 
        order: this.params.order,
        currentLineItems: currentLineItems,
        productLength: productLength,
        canNext: true,
      })
      this.computeTAndQ()
    })

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
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

  subQuantity: function (e) {
    var index = e.currentTarget.dataset.index;
    var selectedQuantity = this.data.currentLineItems.line_items[index].selectedQuantity;
    var key = `currentLineItems.line_items[${index}].selectedQuantity`
    if (selectedQuantity < 1) { return false}
    let quantity = selectedQuantity - 1
    if (selectedQuantity <= 1) { quantity = 1 }
    this.setData({ [key]: quantity })
    this.computeTAndQ()
  },

  plusQuantity: function (e) {
    var index = e.currentTarget.dataset.index;
    var selectedQuantity = this.data.currentLineItems.line_items[index].selectedQuantity;
    var maxQuantity = this.data.currentLineItems.line_items[index].quantity;
    var key = `currentLineItems.line_items[${index}].selectedQuantity`
    if (selectedQuantity >= maxQuantity) { return false }
    let quantity = selectedQuantity + 1
    if (quantity >= maxQuantity) { quantity = maxQuantity }
    this.setData({ [key]: quantity })
    this.computeTAndQ()
  },

  // 全选
  selectALldata:function(){
    var allSelected = this.data.allSelected;
    var data = this.data.currentLineItems.line_items;
    var key = `currentLineItems.line_items`
    data.forEach((ele,index)=>{
      ele.selected = !allSelected
    })
    this.setData({
      [key]: data
    })
    this.computeTAndQ()
  },

  // 单选
  selectItem: function(e){
    var index = e.currentTarget.dataset.index;
    var item = e.currentTarget.dataset.item;
    var key = `currentLineItems.line_items[${index}].selected`
    
    this.setData({
      [key]: !item.selected,
    })
    
    this.computeTAndQ()
  },

  // 计算总额和总数
  computeTAndQ: function(){
    var lineItems = this.data.currentLineItems.line_items
    var total = 0;
    var quantity = 0;
    var allSelected = true;
    var totalKey = `currentLineItems.total`
    var quantityKey = `currentLineItems.quantity`
    lineItems.forEach((ele,index) => {
      if(ele.selected){
        quantity += ele.selectedQuantity
        total += parseFloat(ele.price) * ele.selectedQuantity
      }else{
        allSelected = false
      }
    });
    this.setData({
      [totalKey]: parseFloat(total.toFixed(2)),
      [quantityKey]: quantity,
      allSelected: allSelected
    })
  },

  // 提交
  submitForm:function(){

    var quantity = this.data.currentLineItems.quantity
    if(quantity > 0){
      this.navigateTo("/orders/pages/service/index",{
        currentLineItems: this.data.currentLineItems,
        order: this.data.order,
        productLength: this.data.productLength
      })
    }else{
      this.errorToast('请选择售后商品')
      return false
    }



  },

  onUnload: function () {
    
  },

})