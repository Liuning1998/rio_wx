// pages/contact/index.js
var http = require('../../utils/http.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    email: 'contact@jhqli.com',
    adImages: [],
    swiperCurrent: 0,
    nomal: true,
    currentTab: 0,
    qa:{
      "eq_1":{question:'去哪里看商品物流信息？',answer:['1. 您可以登录app,<span class="dark">【我的】-【我的订单】-【待收货】【查看物流】</span>，点击查看物流信息。','2. 如未有显示，也可以根据物流信息中的快递单号，登录第三方快递官网查询。','3. 您可以点击<span class="dark">【联系客服】</span>可以进行物流相关问。']},
      "eq_2":{question:'去哪里看商品物流信息？1',answer:['1. 您可以登录app,<span class="dark">【我的】-【我的订单】-【待收货】【查看物流】</span>，点击查看物流信息。','2. 如未有显示，也可以根据物流信息中的快递单号，登录第三方快递官网查询。','3. 您可以点击<span class="dark">【联系客服】</span>可以进行物流相关问。']},
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    this.getAds();
    if(!!options.id){
      this.setData({
        id: 'eq_'+options.id
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  // 切换热门问题
  swichNav:function(e){
    var that = this;
    console.log(e.currentTarget.dataset.current)
    if( this.data.currentTab === e.currentTarget.dataset.current ) {
        return false;
    } else {
        that.setData( {
            currentTab: e.currentTarget.dataset.current
        })
    }
  },

  // 切换热门问题
  bindChange: function( e ) {
    var that = this;
    that.setData( {
        currentTab: e.detail.current
    });
},

  getAds: function() {
    http.get({
      url: '/api/ads',
      data: {
        q: {
          tags_name_eq: '联系我们'
        }
      },
      success: res => {
        var images = []
        var data = res.data
        if(data.length > 0) {
          for(let i in data) {
            for(let j in data[i].images) {
              images.push(data[i].images[j])
            }
          }
          this.setData({adImages: images})
        }
      }
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

})