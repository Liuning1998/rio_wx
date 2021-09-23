

function couponSort(couponArr,price,app){//优惠券数组和优惠前价格
  console.log(app.data.shipmentExpenses)
  if(isNaN(price) || typeof(price) != "number"){
    app.errorToast('优惠券参数错误')
    return false
  }
  var canUse = [];
  // var cantUse = [];

  // 分类
  couponArr.forEach(ele=>{
    if(ele.type.trim() == '满减' && parseFloat(ele.limit_value) <= price){
      ele.discountPrice = Math.round((price + app.data.shipmentExpenses - parseFloat(ele.value))*100) / 100
      ele.price = price + app.data.shipmentExpenses
      ele.isCan=true //有效优惠券
      ele.isCheck=false //是否选中
      canUse.push(ele)
    }else if(ele.type.trim() == '折扣'){
      ele.discountPrice = Math.round((price + app.data.shipmentExpenses) * parseFloat(ele.discount)) /100
      ele.price = price + app.data.shipmentExpenses
      ele.isCan=true //有效优惠券
      ele.isCheck=false //是否选中
      canUse.push(ele)
    }else{
      ele.isCan=false //无效优惠券
      ele.isCheck=false //是否选中
      ele.price = price
      // cantUse.push(ele)
    }
  })
  if(canUse.length > 0){
    // 排序
    canUse.sort((a,b)=>{
      if(a.discountPrice > b.discountPrice){
        return 1  //返回正数 ，b排列在a之前
      }else{
        return -1 //返回负数 ，a排列在b之前
      }
    })
    // 有效无效合并
    // cantUse.forEach(ele=>{
    //   canUse.push(ele)
    // })
    //默认选中第一个
    console.log(canUse)
    canUse[0].isCheck=true
    if(app.data.store_short_name == '京东'){
      var key = `storeCart.afterTotal`
      console.log('京东')
    }else{
      var key = `afterOrderTotal`
    }
    app.setData({
      [key]:canUse[0].discountPrice,
      checkCoupon:canUse[0],
      isUse:true
    })
  }
  return canUse
}

module.exports = {
  couponSort: couponSort
}