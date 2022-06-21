// orders/pages/service/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    allSelected: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    console.log(options)
    if(options.line_items && options.number){
      var currentLineItems = JSON.parse(options.line_items);
      
      this.setData({ currentLineItems: currentLineItems, orderNumber: options.number })
      this.computeTAndQ()
    }

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
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
    console.log(this.data.currentLineItems.total,this.data.currentLineItems.quantity)
  },

  // 提交
  submitForm:function(){

    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    var quantity = this.data.currentLineItems.quantity
    if(quantity > 0){
      prevPage.setData({
        currentLineItems: this.data.currentLineItems//要向上个页面传的参数！
      })
      wx.navigateBack({})
    }else{
      this.errorToast('请选择售后商品')
      return false
    }



  },

  onUnload: function () {
    
  },

})