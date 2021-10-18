const http = require("../../../utils/http")
var storage = require('../../../utils/storage.js')
var couponJs = require('./coupon.js')

var jd_functions = {
  checkJdPrice: function (storeCart) {
    let variant_ids = []
    for(let key in storeCart.lineItems) {
      let _line = storeCart.lineItems[key]
      if(_line.selectStatus) {
        variant_ids.push(_line.variant_id)
      }
    }
    return new Promise((resolve,reject)=>{
      http.post({
        url: 'api/jd_products/fetch_jd_product_price',
        data: {
          variant_ids: variant_ids
        },
        success: res => {
          var prices = res.data.variants
          if (prices != null && prices.length > 0) {
            var lineItems = []
            if (this.data.storeCart != null) { storeCart = this.data.storeCart }
            var total = 0
  
            for (let i in storeCart.lineItems) {
              let _line_item = storeCart.lineItems[i]
              if(!_line_item.selectStatus) { continue }
  
              var price = prices.filter(item => item.id == _line_item.variant_id)[0]
              if (price != null) {
                _line_item.price = price.price
                _line_item.origin_price = price.origin_price
              }
  
              lineItems.push(_line_item)
              total = total + _line_item.price * _line_item.quantity
            }
            
            storeCart.total = total
            this.setData({ storeCart: storeCart, lineItems: lineItems })
            resolve(res)
          }
        },
        fail: res => {
  
        }
      })
    })
  },
  
  // checkJdAreaLimit: function (storeCart) {
  //   let variant_ids = []
  //   for(let key in storeCart.lineItems) {
  //     let _line = storeCart.lineItems[key]
  //     if(_line.selectStatus) {
  //       variant_ids.push(_line.variant_id)
  //     }
  //   }

  //   http.get({
  //     url: '',
  //     data: { variant_ids: variant_ids },
  //     success: res => {

  //     },
  //     fail: res => {

  //     }
  //   })
  // },

  checkJdStockAndAreaLimit: function (storeCart, ship_address_id) {
    let variant_ids = []
    for(let key in storeCart.lineItems) {
      let _line = storeCart.lineItems[key]
      if(_line.selectStatus) {
        variant_ids.push(_line.variant_id)
      }
    }
    return new Promise((resolve,reject)=>{
      http.post({
        url: 'api/jd_products/valid_product',
        data: { variant_ids: variant_ids, ship_address_id:  ship_address_id},
        success: res => {
          if(res.data.status != 'ok') {
            this.setData({ canCreateOrder: false })
          }
          resolve(res);
        },
        fail: res => {
          reject(res);
          if (res.data.code != null) {
            this.setData({ canCreateOrder: false })
            var msg = '库存不足或订单中商品在所选地区不支持销售'
  
            if (getApp().globalData.errorMap[res.data.code] != null) {
              msg = getApp().globalData.errorMap[res.data.code].msg_t
            }
  
            this.errorToast(msg)
          }
        }
      })
    })
  },

  fetchJdFreight: function (storeCart, ship_address_id) {
    // ship_address_id=undefined

    // 判断ship_address_id是否为undefined
    if(!ship_address_id && this.data.shipAddress.id){//如果ship_address_id没取到但是页面收货地址存在直接赋值ship_address_id
      ship_address_id = this.data.shipAddress.id;
    }else if(!ship_address_id && !this.data.shipAddress.id){//如果ship_address_id和上方地址都空，说明没有选择收货地址
      this.warningToast('请选择收货地址')
      return
    }

    let lineItems = []
    for(let key in storeCart.lineItems) {
      let _line = storeCart.lineItems[key]
      if(_line.selectStatus) {
        let _line_item = {
          quantity: _line.quantity,
          variant_id: _line.variant_id,
          price: _line.price
        }
        lineItems.push(_line_item)
      }
    }
    return new Promise((resolve,reject)=>{
      http.get({
        url: 'api/jd_orders/freight',
        data: { line_items: lineItems, ship_address_id: ship_address_id },
        success: res => {
          if(res.data.status == 'ok') {
            // this.setData({ shipmentExpenses: res.data.freight })
            this.updateShipmentExpenses(res.data.freight,res.data.notice)
          } else {
            this.updateShipmentExpenses(8,res.data.notice)
          }
          resolve(res)
        },
        fail: res => {
          reject(res)
          let msg = '地址选择出错，请重试'
          this.errorToast(msg)
          this.updateShipmentExpenses(8,'')
        }
      })
    })
  },

  updateShipmentExpenses: function (freight,notice) {
    notice = notice || ''
    this.setData({ 
      shipmentExpenses: freight,
      freeNotice:notice.trim()
    })
  },
  // 京东商品

  // 优惠券请求和优惠券筛选(获取总数，现在不用)
  getCouponList:function(page){
      return new Promise((resolve,reject)=>{
        var couponArr = this.data.coupon;
        var AllLength = this.data.allPage;
        var couPonLength = this.data.coupon.length;
        http.get({
          url: 'api/promotions',
          data:{
            page:page
          },
          success: res => {
            if(res.data.data.length != 0){
                res.data.data.forEach((ele,i) => {
                  ele.detailShow = false
                  ele.el = couPonLength + i
                  if(ele.description.trim() != null && ele.description.trim() != ''){
                    ele.description = ele.description.split('\r\n')
                  }else if(ele.description.trim() == null || ele.description.trim() == ''){
                    ele.description = null
                  }
                  couponArr.push(ele)
                })
                // console.log(res.data)
                this.setData({
                  coupon:couponArr
                })
                if (++page <= AllLength) {
                  this.getCouponList(page);
                }else{
                  // console.log('开始排序')
                  couponJs.couponSort(this.data.coupon,this.data.storeCart.total+this.data.shipmentExpenses,this)
                }
            }
          },
          fail: res=>{
            console.log(res);
          }
        })

      })
  },
  // 优惠券请求和优惠券筛选
  getCouponCount:function(){
    http.get({
      url: '/api/promotions/select_promotions',
      success: res => {
        if(res.data.data.length != 0){
          // console.log('优惠券请求结果非空，有可用优惠券')
          res.data.data.forEach((ele,i) => {
            ele.detailShow = false
            ele.el = i
            if(ele.description.trim() != null && ele.description.trim() != ''){
              ele.description = ele.description.split('\r\n')
            }else if(ele.description.trim() == null || ele.description.trim() == ''){
              ele.description = null
            }
          })
          this.setData({
            coupon:res.data.data
          })
          // console.log('开始排序')
          couponJs.couponSort(this.data.coupon,( parseFloat(this.data.orderTotal) || this.data.storeCart.total)+this.data.shipmentExpenses,this)
        }else{
          console.log('优惠券请求结果为空,没可用优惠券')
          // var data = [
          //   {detailShow:false,el:0,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'5.0',name:'满5减1',number:'2021091413433973',received_at:1631935774,type:'满减',value:'1.0'},
          //   {detailShow:false,el:1,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'50.0',name:'满50减10.2',number:'2021091413433974',received_at:1631935774,type:'满减',value:'10.2'},
          //   {detailShow:false,el:2,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'10.0',name:'满10减9',number:'2021091413433975',received_at:1631935774,type:'满减',value:'9.0'},
          //   {detailShow:false,el:3,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'2.0',name:'满2减1',number:'2021091413433976',received_at:1631935774,type:'满减',value:'1.0'},
          //   {detailShow:false,el:4,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'5.0',name:'满5减4',number:'2021091413433977',received_at:1631935774,type:'满减',value:'4.0'},
          //   {detailShow:false,el:5,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'35.0',name:'满35减30',number:'2021091413433978',received_at:1631935774,type:'满减',value:'30.0'},
          //   {detailShow:false,el:6,available_on:1630425600,description:'具体描述，具体描述',expires_at:1632844800,limit_value:'30.0',name:'满30减11.11',number:'2021091413433979',received_at:1631935774,type:'满减',value:'11.11'}
          // ]
        }
      },
      fail: res=>{
        console.log(res);
        this.setData({
          coupon:[],
          couponNew:[],
          checkCoupon:null
        })
      }
    })
  }
}

// context 为 page 上下文（page 的 this）
// 将上面的方法引入到 page 中
function extend (context) {
  for (var key in jd_functions) {
    context[key] = jd_functions[key]
  }
}

module.exports = {
  extend: extend,
}