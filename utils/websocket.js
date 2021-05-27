var storage = require('./storage.js')
// const reConnectTime = [1, 5, 20, 60, 120]

function subscription(channel, room_number, callback) {
  var task = connect()
  let id =  JSON.stringify({channel: channel, room_number: room_number});
    
  task.onOpen(function() {
    task.send({
      data: JSON.stringify({command: "subscribe", identifier: id})
    })
  })

  task.onMessage((res) => {
    var data = JSON.parse(res.data)
    if(data.reconnect) {
      setTimeout(res => {
        subscription(channel, room_number, callback)
      }, 5*1000)
    } else {
      callback(data)
    }
  })

  task.onClose(res => {
    console.log('----------task close')
    console.log(res)
  })

  return task
}

function connect() {
  var session = storage.getSyncWithExpire("session")
  var url = getApp().globalData.websocketServer
  var header = {AccessToken: session.access_token, 'content-type': 'application/json'}

  var socketTask = wx.connectSocket({
    url: url + '?access_token=' + session.access_token,
    header: header,
    method:"GET"
  })


  // wx.onSocketError(function(res){
  //   console.log('onSocketError')
  // })

  // wx.onSocketClose((result) => {
  //   console.log(result)
  // })

  return socketTask
}

function closeAll() {
  wx.closeSocket()
}

module.exports = {
  connect: connect,
  subscription: subscription,
  closeAll: closeAll
}
