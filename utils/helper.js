var storage = require('./storage.js')
var http = require('./http.js')

function getShipAddress(options) {
  var p = new Promise((resolve, reject) => {
    var address = storage.getSyncWithExpire('ship_address')
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

module.exports = {
  getShipAddress: getShipAddress,
  cacheShipAddress: cacheShipAddress
  
}