// 取 env 加入 storage cartKey, 以区分不同环境下的购物车数据
const storage = require('./storage.js')
const http = require('./http.js')

// 获取小程序运行环境
var cartKey = 'cartCache'

// 增加 lineItem 到购物车
function addCart (lineItem) {
  let _cart = storage.getSyncWithExpire(cartKey) || {}
  let cart = _cart.data || {}
  if(lineItem == null || lineItem.variant_id == null) {
    return _cart
  }

  // let storeCart = cart['store_'+lineItem.store_id] || {}
  let storeCart = cart['store_'+lineItem.store_code] || {}

  storeCart.store_id = lineItem.store_id
  storeCart.store_code = lineItem.store_code //拆单
  storeCart.store_name = lineItem.product.store_name
  storeCart.store_short_name = lineItem.product.store_short_name
  if (storeCart['lineItems'] != null && storeCart['lineItems']['variant_'+lineItem.variant_id] != null) {
    let _line = storeCart['lineItems']['variant_' + lineItem.variant_id]
    _line.quantity += lineItem.quantity

    if(lineItem.limit_number != null && _line.quantity > lineItem.limit_number) {
      _line.quantity = lineItem.limit_number
    }

    if (lineItem.product_limit_number != null && _line.quantity > lineItem.product_limit_number) {
      _line.quantity = lineItem.product_limit_number
    }

    if (lineItem.stock != null && _line.quantity > lineItem.stock) {
      _line.quantity = lineItem.stock
    }

    _line.price = lineItem.price
    _line.vip_price = lineItem.vip_price
    _line.origin_price = lineItem.origin_price
    _line.total = Math.round(_line.quantity*_line.price * 100)/100.0
    _line.vip_total = Math.round(_line.quantity*_line.vip_price * 100)/100.0
    _line.origin_total = Math.round(_line.quantity*_line.origin_price * 100)/100.0
    _line.selectStatus = true
  } else {
    let _line = Object.assign({
      total: Math.round(lineItem.price * lineItem.quantity * 100)/100.0,
      vip_total: Math.round(lineItem.vip_price * lineItem.quantity * 100)/100.0,
      origin_total: Math.round(lineItem.origin_price * lineItem.quantity * 100)/100.0,
      selectStatus: true
    }, lineItem)
    
    if (storeCart['lineItems'] == null) { storeCart['lineItems'] = {} }
    storeCart['lineItems']['variant_' + lineItem.variant_id] = _line 
  }

  cart['store_' + lineItem.store_code] = storeCart

  return setCartToCache(cart)
}

// 从缓存中获取购物车
function getCartCache () {
  var cart = storage.getSyncWithExpire(cartKey) || {}
  console.log(cart)
  // 如果购物车存在旧版商铺删除
  for(var key in cart.data){
    if(!cart.data[key].store_code){
      delete cart.data[key]
      setCartToCache(cart) 
    }
  }
  return cart
}

// 设置购物车中 lineItem 的选中状态
function setSelectedStatus (lineItem, status) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  // let storeCart = cartData['store_' + lineItem.store_id]
  let storeCart = cartData['store_' + lineItem.store_code]

  storeCart.lineItems['variant_' + lineItem.variant_id].selectStatus = status

  return setCartToCache(cartData)
}

// 设置购物车中 storeCart 的选中状态
function triggerStoreSelectStatus(storeData, status) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  // let storeCart = cartData['store_' + storeData.store_id]
  let storeCart = cartData['store_' + storeData.store_code]

  for(let line in storeCart.lineItems) {
    storeCart.lineItems[line].selectStatus = status
  }

  return setCartToCache(cartData)
}

// 将 lineItem 从购物车中删除
function removeFromCart (lineItem) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  // let storeCart = cartData['store_' + lineItem.store_id]
  let storeCart = cartData['store_' + lineItem.store_code]

  try { 
 
    delete storeCart.lineItems['variant_' + lineItem.variant_id] 
    return setCartToCache(cartData) 
 
  } catch (error) { 
     
    return false 
 
  } 
}

// 删除 storeCart 中选中的 lineItem
function removeStoreLineOfSelect (storeData) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  // let storeCart = cartData['store_' + storeData.store_id]
  let storeCart = cartData['store_' + storeData.store_code]

  try { 
 
    for (let line in storeCart.lineItems) { 
      if (storeCart.lineItems[line].selectStatus) { 
        delete storeCart.lineItems[line] 
      } 
    } 
    return setCartToCache(cartData) 
 
  } catch (error) { 

    return false 
    
  } 
    
}

// 修改购物车中 lineItem 的 quantity
function alterQuantityCartCache (lineItem, quantity) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  // let storeCart = cartData['store_' + lineItem.store_id]
  let storeCart = cartData['store_' + lineItem.store_code]

  storeCart.lineItems['variant_' + lineItem.variant_id].quantity += quantity
  if (storeCart.lineItems['variant_' + lineItem.variant_id].quantity < 0) {
    storeCart.lineItems['variant_' + lineItem.variant_id].quantity = 0
  }

  if (lineItem.limit_number != null && storeCart.lineItems['variant_' + lineItem.variant_id].quantity > lineItem.limit_number) {
    storeCart.lineItems['variant_' + lineItem.variant_id].quantity = lineItem.limit_number
  }

  if (lineItem.product_limit_number != null && storeCart.lineItems['variant_' + lineItem.variant_id].quantity > lineItem.product_limit_number) {
    storeCart.lineItems['variant_' + lineItem.variant_id].quantity = lineItem.product_limit_number
  }

  if (lineItem.stock != null && storeCart.lineItems['variant_' + lineItem.variant_id].quantity > lineItem.stock) {
    storeCart.lineItems['variant_' + lineItem.variant_id].quantity = lineItem.stock
  }

  if (storeCart.lineItems['variant_' + lineItem.variant_id].quantity == 0) {
    storeCart.lineItems['variant_' + lineItem.variant_id].selectStatus = false
  } else {
    storeCart.lineItems['variant_' + lineItem.variant_id].selectStatus = true
  }

  return setCartToCache(cartData)
}

// 将购物车数据写入缓存的总接口
// 并计算每个 store 的相关参数
function setCartToCache (cartData) {
  let cartQuantity = 0
  let cartTotalQuantity = 0
  for (let store in cartData) {
    if (cartData[store].lineItems == null || Object.keys(cartData[store].lineItems).length <= 0) { 
      delete (cartData[store])
      continue
    }
    let storeCartQauntity = 0
    let storeCartTotal = 0
    let storeCartVipTotal = 0
    let storeCartOriginTotal = 0
    let allSelectStatus = true
    for (let line in cartData[store].lineItems) {
      //无库存(stock<=0)或者下架(available_on == false)的删除掉购物车缓存
      // console.log(cartData[store].lineItems[line].available_on)
      if (!cartData[store].lineItems[line].available_on || cartData[store].lineItems[line].stock <= 0) {
        return removeFromCart(cartData[store].lineItems[line])
      }
      // 没有选中的 lineItem 不统计到 store cart 中的 quantity、total
      cartTotalQuantity += cartData[store].lineItems[line].quantity
      if (!cartData[store].lineItems[line].selectStatus) { 
        allSelectStatus = false
        continue 
      }

      storeCartQauntity += cartData[store].lineItems[line].quantity
      cartData[store].lineItems[line].total = Math.round(cartData[store].lineItems[line].quantity * cartData[store].lineItems[line].price * 100) / 100.0
      cartData[store].lineItems[line].vip_total = Math.round(cartData[store].lineItems[line].quantity * cartData[store].lineItems[line].vip_price * 100) / 100.0
      cartData[store].lineItems[line].origin_total = Math.round(cartData[store].lineItems[line].quantity * cartData[store].lineItems[line].origin_price * 100) / 100.0
      storeCartTotal += cartData[store].lineItems[line].total
      storeCartVipTotal += cartData[store].lineItems[line].vip_total
      storeCartOriginTotal += cartData[store].lineItems[line].origin_total

      cartQuantity += cartData[store].lineItems[line].quantity
    }

    cartData[store].quantity = storeCartQauntity
    cartData[store].total = Math.round(storeCartTotal * 100) / 100.0
    cartData[store].vip_total = Math.round(storeCartVipTotal * 100) / 100.0
    cartData[store].origin_total = Math.round(storeCartOriginTotal * 100) / 100.0
    cartData[store].allSelectStatus = allSelectStatus
  }

  let _cart = {
    data: cartData,
    quantity: cartQuantity,
    totalQuantity: cartTotalQuantity
  }

  storage.setSyncWithExpire(cartKey, _cart, 30 * 24 * 60 * 60)

  return _cart
}

// 从服务器获取 variant 最新数据并写入缓存
function updateVariantInfo (options) {
  let cart = storage.getSyncWithExpire(cartKey) || {}
  let cartData = cart.data || {}
  let variant_ids = []
  for(let store in cartData) {
    if (cartData[store].lineItems == null) { continue }
    for(let line in cartData[store].lineItems) {
      variant_ids.push(cartData[store].lineItems[line].variant_id)
    }
  }

  var p = new Promise((resolve, reject) => {
    if (variant_ids.length > 0) {
      http.post({
        url: 'api/products/fetch_variant_stock',
        data: {
          variant_ids: variant_ids
        },
        success: (res) => {
          resolve(updateVariantInfoToCache(cartData, res.data))
        }
      })
    }
  })

  return p.then(options['success'], options['fail'])
}

// 根据 api 返回的数据修改 storage cart 数据
function updateVariantInfoToCache (cart, res) {
  if (res.constructor.name != 'Array') {
    return cart
  }
  for (let store in cart) {

    if (cart[store].lineItems == null) { continue }
    for (let line in cart[store].lineItems) {
      let lineItem = cart[store].lineItems[line]
      let variant = res.filter(v => v.id == lineItem.variant_id)[0]
      if (variant == null) { continue }
      cart[store].lineItems[line].price = variant.price
      cart[store].lineItems[line].vip_price = variant.vip_price
      cart[store].lineItems[line].stock = variant.stock
      cart[store].lineItems[line].origin_price = variant.origin_price
      cart[store].lineItems[line].available_on = variant.available_on
    }
  }

  return setCartToCache(cart)
}

function clearCart () {
  return setCartToCache({})
}

module.exports = {
  addCart: addCart,
  getCartCache: getCartCache,
  setSelectedStatus: setSelectedStatus,
  removeFromCart: removeFromCart,
  alterQuantityCartCache: alterQuantityCartCache,
  updateVariantInfo: updateVariantInfo,
  triggerStoreSelectStatus: triggerStoreSelectStatus,
  removeStoreLineOfSelect: removeStoreLineOfSelect,
  clearCart: clearCart

  // subcart: subcart,
  // subcartForCartList: subcartForCartList,
  // getOrderList: getOrderList,
  // getOrderDetail: getOrderDetail,
  // deleteOrder: deleteOrder,
  // deleteItemOfSelect: deleteItemOfSelect,
  // setCartCache: setCartCache,
  // alterStockAndPrice: alterStockAndPrice
}