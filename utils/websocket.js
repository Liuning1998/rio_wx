// 引入此包，调用 connect 方法将返回一个 WebSockect 实例
var storage = require('./storage.js')

class WebSocket {
  constructor() {
    this.task = this.connect()
    this.messageDispatch = {}
    this.state = null
  }

  subscription (channel, room_number, callback) {
    if (typeof(callback) == 'undefined' || callback == null) { return false }
    if (this.messageDispatch[channel] == null) {
      this.messageDispatch[channel] = {
        callback: callback,
        room_number: room_number,
        channel: channel,
        state: null
      }
    }

    if (this.state == 'open') {
      this.listen()
    } else {
      setTimeout(res => {
        this.listen()
      }, 1000)
    }
  }

  listen () {
    if (this.task == null) {
      console.error('rio error: no websocket connection, listen error')
      return
    }
    for(var key in this.messageDispatch) {
      var item = this.messageDispatch[key]
      let id =  JSON.stringify({channel: item.channel, room_number: item.room_number});
      if (item.state != 'subscribed' && this.task.readyState == 1) {
        this.task.send({
          data: JSON.stringify({command: "subscribe", identifier: id})
        })
        this.messageDispatch[key].state = 'subscribed'
      }
    }
  }

  reconnect () {
    if (this.state == 'open') { return }

    this.task = this.connect()
    this.listen()
  }

  connect () {
    var session = storage.getSyncWithExpire("session")
    var url = getApp().globalData.websocketServer
    var header = {AccessToken: session.access_token, 'content-type': 'application/json'}

    var socketTask = wx.connectSocket({
      url: url + '?access_token=' + session.access_token,
      header: header,
      method:"GET"
    })

    this.state = 'connect'

    socketTask.onOpen (res => {
      console.log('----------task open')
      console.log(res)
      this.state = 'open'

      if (this.messageDispatch != null) {
        this.listen()
      }

      socketTask.onMessage((res) => {
        var data = JSON.parse(res.data)
        // data.reconnect，重连
        // 这里不执行重连动作，需要重连则在外面调用 reconnect 重连

        if (data.identifier != null){
          var identifier = JSON.parse(data.identifier)
          var msgChannel = identifier.channel

          if (this.messageDispatch[msgChannel] != null) {
            this.messageDispatch[msgChannel].callback(data)
          }
        } else if (!data.reconnect) {
          for(var key in this.messageDispatch) {
            this.messageDispatch[key].callback(data)
          }
        }
      })
    })

    socketTask.onClose(res => {
      console.log('----------task close')
      console.log(res)
      this.task = null
      this.state = 'close'
      for(var key in this.messageDispatch) {
        this.messageDispatch[key].state = null
      }
    })

    return socketTask
  }

  close () {
    if (this.task == null || this.state == 'close') { return true }
    this.task.close()
    this.state = 'close'
  }
}


function connect() {
  return new WebSocket
}
module.exports = {
  connect: connect,
}
