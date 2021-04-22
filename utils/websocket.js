var storage = require('./storage.js')
// const reConnectTime = [1, 5, 20, 60, 120]

function subscription(channel, room_number, times=0, callback) {
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
      if (times > 30) {
        console.error(`websockt reconnect error, ${times} times`)
        callback({type: 'reconnect_error', times: times})
      } else {
        times = times + 1
        setTimeout(res => {
          subscription(channel, room_number, times, callback)
        }, 5*1000)
      }
    } else if(data.type != 'ping'){
      if (data.type == 'confirm_subscription') {
        times = 0
      }
      callback(data)
    }
  })

  task.onClose(res => {
    console.log('----------task close')
    console.log(res)
    // 1006 服务器关闭
    if(res.code == 1006) {
      if (times > 30) {
        console.error(`websockt reconnect error, ${times} times`)
        callback({type: 'reconnect_error', times: times})
      } else {
        times = times + 1
        setTimeout(res => {
          subscription(channel, room_number, times, callback)
        }, 5*1000)
      }
    }
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
