// orders/pages/service/index.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    lineItem:[],
    allSelected: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    console.log(options)
    if(options.line_items && options.number){
      var line_items = JSON.parse(options.line_items);
      
      line_items.forEach((ele,index) => {
        ele.selected = false;
        ele.selectedQuantity = 1
      });
      
      this.setData({ line_items: line_items, orderNumber: options.number })
    }

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },
  subQuantity: function (e) {
    var index = e.currentTarget.dataset.index;
    var selectedQuantity = this.data.line_items[index].selectedQuantity;
    var key = `line_items[${index}].selectedQuantity`
    if (selectedQuantity < 1) { return false}
    let quantity = selectedQuantity - 1
    if (selectedQuantity <= 1) { quantity = 1 }
    this.setData({ [key]: quantity })
  },

  plusQuantity: function (e) {
    var index = e.currentTarget.dataset.index;
    var selectedQuantity = this.data.line_items[index].selectedQuantity;
    var maxQuantity = this.data.line_items[index].quantity;
    var key = `line_items[${index}].selectedQuantity`
    if (selectedQuantity >= maxQuantity) { return false }
    let quantity = selectedQuantity + 1
    if (quantity >= maxQuantity) { quantity = maxQuantity }
    this.setData({ [key]: quantity })
  },

  // 全选
  selectALldata:function(){
    var allSelected = this.data.allSelected;
    var data = this.data.line_items;
    data.forEach((ele,index)=>{
      ele.selected = !allSelected
    })
    this.setData({
      allSelected: !allSelected,
      line_items: data
    })
  },

  // 单选
  selectItem: function(e){
    var index = e.currentTarget.dataset.index;
    var item = e.currentTarget.dataset.item;
    var key = `line_items[${index}].selected`
    
    this.setData({
      [key]: !item.selected,
    })

    var line_items = this.data.line_items;

    for (var i = 0; i < line_items.length; i++) {
      if (line_items[i].selected == false) {
        this.setData({
          allSelected: false
        })
        return;
      }
    }

    this.setData({
      allSelected: true
    })
  },

  // 提交
  submitForm:function(){
    var line_items = this.data.line_items;
    var currentLineItem = {
      quantity:0,
      total:0,
      line_items:[]
    };
    line_items.forEach((ele,index)=>{

      if(ele.selected){
        currentLineItem.quantity += ele.selectedQuantity
        currentLineItem.total += ele.selectedQuantity * ele.price
        currentLineItem.line_items.push(ele)
      }

    })

    if(currentLineItem.line_items.length <= 0){
      this.errorToast('请选择售后商品')
      return false
    }
    

    this.setData({
      currentLineItem: currentLineItem
    })

    wx.navigateBack({})

  },

  onUnload: function () {
   
    var that = this
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      currentLineItem: that.data.currentLineItem//要向上个页面传的参数！
    })

  },

})