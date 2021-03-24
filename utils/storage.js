// expire 单位秒
// 默认有效时间7天
// expire = expire || (7 * 24 * 60 * 60)
const DefaultExpire = 7 * 24 * 60 * 60
 
function getSyncWithExpire(key, expire) {
  key = keyExtension(key)
  var result = wx.getStorageSync(key)

  if (result == null || result['data'] == null) {
    return ''
  }

  var timestamp = (new Date).getTime()

  if ( result['expire'] == null || timestamp - result['expire'] > 0 ) {
    wx.removeStorageSync(key)

    return ''
  } else {
    return result['data']
  }
}

function getSync(key) {
  key = keyExtension(key)
  var result = wx.getStorageSync(key)
  if (typeof (result['data']) == 'undefined' && result['data'] == null) {
    return result
  } else {
    return result['data']
  }
}

function setSync(key, obj) {
  key = keyExtension(key)
  var timestamp = (new Date).getTime()
  // data['timestamp'] = timestamp
  var data = {
    timestamp: timestamp,
    data: obj
  }
  wx.setStorageSync(key, data)
}

function setSyncWithExpire(key, obj, expire) {
  key = keyExtension(key)
  var timestamp = (new Date).getTime()
  expire = expire || DefaultExpire

  var data = {
    expire: timestamp + expire * 1000,
    data: obj
  }
  wx.setStorageSync(key, data)
}

function delSync(key) {
  key = keyExtension(key)
  wx.removeStorageSync(key)
}

function keyExtension(key) {
  if (typeof(getApp()) == 'undefined' || typeof(getApp().globalData.env) == 'undefined') {
    return key
  } else {
    let extension = getApp().globalData.env
    key = extension + "#" + key
    return key
  }
}

module.exports = {
  getSync: getSync,
  getSyncWithExpire: getSyncWithExpire,
  setSync: setSync,
  setSyncWithExpire: setSyncWithExpire,
  delSync: delSync
}
