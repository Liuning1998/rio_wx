const http = require("../../../utils/http")
var storage = require('../../../utils/storage.js')

var jd_functions = {
  checkJdPrice: function (storeCart) {
    let variant_ids = []
    for(let key in storeCart.lineItems) {
      let _line = storeCart.lineItems[key]
      if(_line.selectStatus) {
        variant_ids.push(_line.variant_id)
      }
    }

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
        }
      },
      fail: res => {

      }
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

    http.post({
      url: 'api/jd_products/valid_product',
      data: { variant_ids: variant_ids, ship_address_id:  ship_address_id},
      success: res => {
        if(res.data.status != 'ok') {
          this.setData({ canCreateOrder: false })
        }
      },
      fail: res => {
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
  },

  fetchJdFreight: function (storeCart, ship_address_id) {
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

    http.get({
      url: 'api/jd_orders/freight',
      data: { line_items: lineItems, ship_address_id: ship_address_id },
      success: res => {
        if(res.data.status == 'ok') {
          // this.setData({ shipmentExpenses: res.data.freight })
          this.updateShipmentExpenses(res.data.freight)
        } else {
          this.updateShipmentExpenses(8)
        }
      },
      fail: res => {
        this.updateShipmentExpenses(8)
      }
    })
  },

  updateShipmentExpenses: function (freight) {
    this.setData({ shipmentExpenses: freight })
  }
  // 京东商品
}

// context 为 page 上下文（page 的 this）
// 将上面的方法引入到 page 中
function extend (context) {
  for (var key in jd_functions) {
    context[key] = jd_functions[key]
  }
}

module.exports = {
  extend: extend
}