var storage = require('./storage.js')

function subscription(channel, room_number, callback) {
  connect()
    
  wx.onSocketOpen(function() {
    let id =  JSON.stringify({channel: channel});
    wx.sendSocketMessage({
      data: JSON.stringify({command: "subscribe", identifier: id})
    })
  })

  wx.onSocketMessage(function(res) {
    var data = res.data
    if(JSON.parse(data).type != 'ping'){
      callback(JSON.parse(data))
    }
  })

}

function connect() {
  var session = storage.getSyncWithExpire("session")
  var url = getApp().globalData.websocketServer
  var header = {AccessToken: session.access_token, 'content-type': 'application/json'}

  wx.connectSocket({
    url: url + '?access_token=' + session.access_token,
    header: header,
    method:"GET"
  })


  wx.onSocketError(function(res){
    console.log('onSocketError')
  })

}

function close() {
  wx.closeSocket()
}

module.exports = {
  connect: connect,
  subscription: subscription,
  close: close
}
