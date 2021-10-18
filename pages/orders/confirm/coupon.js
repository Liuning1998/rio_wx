

function couponSort(couponArr,price,app){//优惠券数组和优惠前价格
  // console.log('price',price)
  if(isNaN(price) || typeof(price) != "number"){
    app.errorToast('优惠券参数错误')
    return false
  }
  var canUse = [];
  // var cantUse = [];

  // 分类
  couponArr.forEach(ele=>{
    if(ele.type.trim() == '满减' && parseFloat(ele.limit_value) <= price){
      ele.discountPrice = price - parseFloat(ele.value)
      ele.price = price + app.data.shipmentExpenses
      ele.isCan=true //有效优惠券
      ele.isCheck=false //是否选中
      canUse.push(ele)
    }else if(ele.type.trim() == '折扣'){
      // ele.discountPrice = price * parseFloat(ele.折扣)
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
    canUse[0].isCheck=true
    app.setData({
      checkCoupon:canUse[0],
      couponNew:canUse
    })
  }
}

// 计算当前优惠券价格
// function calculatePrice(checkCoupon,price){
//   if(checkCoupon.type == '满减'){
//     var afterPrice = parseFloat(price) - parseFloat(checkCoupon.value)
//     return afterPrice
//   }else if(checkCoupon.type == '折扣'){
//     return price
//   }
// }





module.exports = {
  couponSort: couponSort,
  // calculatePrice:calculatePrice
}