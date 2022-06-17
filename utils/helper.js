var storage = require('./storage.js')
var http = require('./http.js')

function getShipAddress(options) {
  var p = new Promise((resolve, reject) => {
    var address = storage.getSyncWithExpire('ship_address_real') || storage.getSyncWithExpire('ship_address')
    if ( address != '' && address !=null ) {
      address.from_type = 'localStorage'
      resolve(address)
    } else {
      http.get({
        url: 'api/ship_addresses/fetch_default_address',
        success: (res) => {
          cacheShipAddress(res.data)
          if (resolve != null) {
            resolve(res.data)
          }
        },
        fail: (res) => {
          if (reject != null) {
            reject(res)
          }
        }
      })
    }
  })

  return p.then(options['success'], options['fail'])
}

function cacheShipAddress(address) {
  storage.setSyncWithExpire('ship_address', address, 360*24*60*60)
}
//修改订单确认页面实时切换的地址
function cacheShipAddressReal(address) {
  storage.setSyncWithExpire('ship_address_real', address, 360*24*60*60)
}

function hidePhone (phone=null) {
  phone = '' + phone
  if (phone.length < 11) {
    return phone
  }
  var reg = /^(\d{3})\d{4}(\d{4})$/
  var _phone = phone.replace(reg, '$1****$2')
  return _phone
}

//对象数组arr1去重
function checkRepeat(arr,arr1){
  arr.forEach((e)=>{
    arr1.forEach((item,index) => {
      if(!item || e.id == item.id){
          delete arr1[index]
      }
    })
  })
  return arr1
}

// 生成n位随机数
function getRandom (n) {
  //返回值: 字符串
  return Math.random().toString().slice(-n);
}

// 将数组拆分成多个num数量的子数组 [a,b,c,d] ==> [[a,b],[c,d]]
function splitArray (arr, num){
  num = num*1 || 1;
  var ret = [];
  arr.forEach(function(item, i){
    if(i % num === 0){
      ret.push([]);
    }
    ret[ret.length - 1].push(item);
  });
  console.log(ret);
  return ret;
};

module.exports = {
  getShipAddress: getShipAddress,
  cacheShipAddress: cacheShipAddress,
  hidePhone: hidePhone,
  cacheShipAddressReal: cacheShipAddressReal,
  checkRepeat: checkRepeat,
  getRandom: getRandom,
  splitArray: splitArray
}