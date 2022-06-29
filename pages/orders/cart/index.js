// pages/orders/cart/index.js
var cartApi = require("../../../utils/cart.js")
var http = require('../../../utils/http.js')
var helper = require('../../../utils/helper.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartData: null,
    recommendProducts: [],
    cartLoaded: false,
    itemActionWidth: 117,
    orderLimitQuantity: null,
    deleteButtonShowId: -1,
    deleteButton: [{
      type: 'warn',
      text: '删除',
      extClass: 'test',
      // src: '/page/weui/cell/icon_del.svg', // icon的路径
      src: '/images/delete_icon.png'
    }],
    avatars: {},
    isShowCoupon:false, //是否提示示领取优惠券
    couponGetEnd:false, //优惠券是否已经请求成功
    cPageNow:1, //优惠券列表页数
    cNoData:false, //加载完全部数据
    canUseGetCoupon:true,//是否可以再次请求优惠券
    isShow:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)

    this.getRecommendProducts()
    this.getOrderLimitQuantity()

    // http.get({
    //   url: '/api/products/fetch_product_avatar',
    //   data: {
    //     ids: ['wkm3']
    //   },
    //   success: res => {
    //     console.log(res)
    //   }
    // })

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let cartData = cartApi.getCartCache()
    // var _cartData = cartApi.getCartCache();
    console.log(cartData)
    if (Object.keys(cartData).length <= 0) {
      cartData = null;
      // _cartData = null;
    }else{
      //如果是旧版购物车商铺就删掉
      for(var key in cartData.data){
        if(!cartData.data[key].store_code){
          // _cartData = cartApi.removeStoreLineOfSelect(cartData.data[key])
          cartData = cartApi.removeStoreLineOfSelect(cartData.data[key])
        }
      }
      console.log(cartData)
    }

    // this.setData({ cartData: _cartData, cartLoaded: true, deleteButtonShowId: -1 })
    this.setData({ cartData: cartData, cartLoaded: true, deleteButtonShowId: -1 })

    if(Object.keys(this.data.avatars).length <= 0) {
      // this.fetchAvatars(_cartData)
      this.fetchAvatars(cartData)
    }

    // 更新购物车中的 sku 价格、库存
    cartApi.updateVariantInfo({
      success: res => {
        if (Object.keys(res).length <= 0) {
          res = null
        }
        this.setData({ cartData: res, cartLoaded: true })
      }
    })

    // 判断是否显示领取优惠券
    this.isShowCoupon()
  },

  // 打开优惠券弹窗
  openCoupon:function(){
    var couponGetEnd = this.data.couponGetEnd;
    this.setData({
      isShow:true
    })
    if(!couponGetEnd){
      this.getCouponData()
    }
  },

  // 关闭优惠券弹窗
  closePopup:function(){
    this.setData({
      isShow:false
    })
  },

  // 判断是否显示领取优惠券
  isShowCoupon:function(){
    http.get({
      url: 'api/promotions/can_receive_promotion',
      success: res => {
        // console.log(res)
        if(res.data.status != null){
          if(!res.data.status){
            this.setData({
              isShow:false
            })
          }
          this.setData({
            isShowCoupon:res.data.status
          })
        }
      }
    })
  },

  // 获取数据 getCouponData
  getCouponData:function(){
    var couponsList = this.data.couponsList || [];
    var page = this.data.cPageNow;
    var cNoData = this.data.cNoData;
    this.setData({
      canUseGetCoupon:false,
      couponGetEnd:true,
      loadErr:false,
    })
    if(!cNoData){
      http.get({
        url: 'api/promotions/receive_promotion_index',
        data:{
          page:page
        },
        success: res => {
          if(res.data.data.length != 0 && res.data.data != null){
              res.data.data = helper.checkRepeat(couponsList,res.data.data)
              res.data.data.forEach((ele)=>{
                if(ele){
                  couponsList.push(ele)
                }
              })
              this.setData({
                couponsList:couponsList,
                cPageNow:page + 1,
                canUseGetCoupon:true
              })
          }else if(res.data.data != null && res.data.data.length == 0){
            this.setData({
              cNoData:true,
              canUseGetCoupon:true
            })
          }
        },
        fail: res=>{
          // console.log(res);
          this.setData({
            loadErr:true,
            canUseGetCoupon:true
          })
        }
      })
    }


  },

  // 下一页
  getNextPge:function(){
    if( this.data.canUseGetCoupon && !this.data.cNoData ) {
      this.getCouponData()
    }
  },

  // 领取优惠券
  receiveCoupons:function(e){
    var promotion_id = e.target.dataset.item.id;
    var el = e.target.dataset.index;
    var key = `couponsList[${el}].show_status`;
    
    http.post({
      url: 'api/promotions/receive_promotion',
      data:{
        promotion_id:promotion_id
      },
      success: res => {
        if(res.data.status =='ok'){
          console.log([key])
          this.setData({
            successPopup:true,
            [key]:false
          })
          wx.showToast({
            title: '领取成功',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: res=>{
        var msg =  '领取失败';
        if (getApp().globalData.errorMap[res.data.code] != null) {
          msg = getApp().globalData.errorMap[res.data.code].msg_t;
        }
        wx.showToast({
          title: msg,
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  

  getRecommendProducts: function () {
    http.get({
      url: 'api/products/recommend',
      success: res => {
        if (res.data != null && res.data.constructor.name == 'Array') {
          this.setData({ recommendProducts: res.data })
        }
      }
    })
  },

  getOrderLimitQuantity: function () {
    http.get({
      url: "/api/products/order_limit_quantity",
      success: res => {
        this.setData({
          orderLimitQuantity: res.data.order_limit_quantity
        })
      }
    })
  },

  gotoConfirm: function (e) {
    var item = e.currentTarget.dataset.item
    
    if (item.quantity <= 0) {
      this.errorToast('您没有选择商品')
      return false
    }

    if (this.data.orderLimitQuantity != null && item.quantity > this.data.orderLimitQuantity) {
      this.errorToast(`商品数量超过${this.data.orderLimitQuantity}件`)
      return false
    }

    var url = "/pages/orders/confirm/index?store_code=" + item.store_code
    if (item.store_short_name == '京东') {
      url = url + "&store_short_name=京东"
    }

    this.navigateTo(url, {
      avatars: this.data.avatars
    })
  },

  subQuantity: function (e) {

    var item = e.currentTarget.dataset.item
    if (item.quantity <= 1) { return }
    let _cartData = cartApi.alterQuantityCartCache(item, -1)
    this.setData({ cartData: _cartData })
  },

  plusQuantity: function (e) {

    var item = e.currentTarget.dataset.item

    let _cartData = cartApi.alterQuantityCartCache(item, 1)
    this.setData({ cartData: _cartData })
  },

  changeSelectStatus: function (e) {

    var item = e.currentTarget.dataset.item
    let _cartData = cartApi.setSelectedStatus(item, !item.selectStatus)

    this.setData({ cartData: _cartData })
  },

  deleteItem: function (e) {
    console.log(e)
    var item = e.currentTarget.dataset.item
    let _cartData = cartApi.removeFromCart(item)

    //如果removeFromCart返回false 说明删除失败（一般为缓存过期）手动触发onShow更新商品 
    if(_cartData == false){ 
      wx.showToast({ 
        title: '购物车商品过期', 
        icon: 'none', 
        duration: 2000 
      }) 
      this.onShow() 
    } 

    this.setData({ cartData: _cartData, touchMoveList: {}, deleteButtonShowId: -1 })
  },

  deleteStoreItem: function (e) {
    
    wx.showModal({
      title: '清空商铺购物车',
      content: '您确定要清空该商铺购物车吗？',
      success: (res) => {
        if (res.confirm) {
          var item = e.currentTarget.dataset.item
          let _cartData = cartApi.removeStoreLineOfSelect(item)

          //如果removeStoreLineOfSelect返回false 说明删除失败（一般为缓存过期）手动触发onShow更新商品 
          if(_cartData == false){ 
            wx.showToast({ 
              title: '购物车商品过期', 
              icon: 'none', 
              duration: 2000 
            }) 
            this.onShow() 
          } 

          this.setData({ cartData: _cartData })
        }
      }
    })
  },

  allSelected: function (e) {
    // var cartCache = shop.triggerAllSelectStatus(!this.data.allSelected)
    var item = e.currentTarget.dataset.item

    let _cartData = cartApi.triggerStoreSelectStatus(item, !item.allSelectStatus)
    this.setData({ cartData: _cartData })
  },

  triggerMode: function (e) {
    this.setData({
      editMode: !this.data.editMode
    })
  },

  gotoProduct: function (e) {
    var item = e.currentTarget.dataset.item
    if (item == null || item.id == null) { return }
    this.navigateTo("/pages/products/show/index?id="+item.id)
  },

  gotoStore: function (e) {
    var item = e.currentTarget.dataset.item
    if (item == null || item.store_code == null) { return }
    this.navigateTo(`/products/pages/collect/index?store_code=${item.store_code}&store_short_name=${item.store_short_name}&total=${item.total}`)
  },

  addCart: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.tags != null && item.tags.indexOf('虚拟卡券') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return
    }

    if (item.tags != null && item.tags.indexOf('特殊商品') >= 0) {
      this.navigateTo("/pages/products/show/index?id=" + item.id)
      return
    }

    let master = item.master
    if (master == null) {
      return
    }

    if (master.stock <= 0) {
      this.errorToast('商品库存不足', 500)
      return false
    }
    
    let lineItem = {
      quantity: 1,
      variant_id: master.id,
      price: master.price,
      vip_price: master.vip_price,
      origin_price: master.origin_price,
      available_on: master.available_on,
      stock: master.stock,
      store_id: master.store_id || '0',
      store_code: item.store_code || '',
      product: item,
      // variant: master,
      show_name: master.show_name,
      limit_number: master.limit_number,
      product_limit_number: item.limit_number
    }

    if(this.data.cartData != null && this.data.cartData.data != null && this.data.cartData.data['store_' + item.store_code] != null && this.data.cartData.data['store_' + item.store_code].lineItems != null && this.data.cartData.data['store_' + item.store_code].lineItems['variant_' + master.id] != null) {
      let _quantity = this.data.cartData.data['store_' + item.store_code].lineItems['variant_' + master.id].quantity

      // 判断数量是否超过单品购买数量限制
      if (_quantity >= master.limit_number || _quantity >= item.limit_number) {
        this.errorToast('已超过单品数量限制')
        return false
      }

      // 判断是否超过库存
      if ( _quantity >= master.stock ) {
        this.errorToast('库存不足')
        return false
      }
    }

    let cart = cartApi.addCart(lineItem)
    this.setData({ cartData: cart })
  },

  clearCart: function () {

    wx.showModal({
      title: '清空购物车',
      content: '您确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          let cart = cartApi.clearCart()
          this.setData({ cartData: cart, touchMoveList: {}, deleteButtonShowId: -1 })
        }
      }
    })
  },

  slideviewShow: function (e) {
    var item = e.currentTarget.dataset.item
    this.setData({ deleteButtonShowId: item.variant_id })
  },

  fetchAvatars: function (cartData) {
    if(cartData == null || cartData.data == null || cartData.data.length <= 0) {
      return false
    }

    var ids = []
    for(let ikey in cartData.data) {
      let store = cartData.data[ikey]
      for(let jkey in store.lineItems) {
        let variant = store.lineItems[jkey] 
        ids.push(variant.product.id)
      }
    }

    if(ids.length > 0) {
      http.get({
        url: '/api/products/fetch_product_avatar',
        data: {
          ids: ids
        },
        success: res => {
          var avatars = {}
          if(res.data.length > 0) {
            for(let i in res.data) {
              let item = res.data[i]
              avatars[item.id] = item.avatar_url
            }
          }

          if(Object.keys(avatars).length > 0) {
            this.setData({avatars: avatars})
          }
        }
      })
    }
  },
})