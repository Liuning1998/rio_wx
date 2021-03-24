// 在 app.js 文件中调用，context 传入 page
// app.js 中的 commonBeforeOnLoad 方法在每个页面中被调用

const Duration = 1500
const MaxDuration = 30 * 1000

function importApi(context) {
  (function () {

    // this.messageToast = function (message, duration = Duration, options) {
    //   this.setData({
    //     _msgData: {
    //       content: message,
    //       show: true,
    //       type: ""
    //     }
    //   })
    // }

    this.successToast = function (message, duration = Duration, options = {}) {
      this.setData({
        _msgData: {
          content: message,
          show: true,
          type: "success",
          hasClose: options.hasClose,
          size: options.size
        }
      })

      this.hideToastTimer(duration)
    }

    this.errorToast = function (message, duration = Duration, options = {}) {
      this.setData({
        _msgData: {
          content: message,
          show: true,
          type: "error",
          hasClose: options.hasClose,
          size: options.size
        }
      })

      this.hideToastTimer(duration)
    }

    this.warningToast = function (message, duration = Duration, options = {}) {
      this.setData({
        _msgData: {
          content: message,
          show: true,
          type: "warning",
          hasClose: options.hasClose,
          size: options.size
        }
      })

      this.hideToastTimer(duration)
    }

    this.hideToastTimer = function (duration = Duration) {
      if (duration == -1) {
        return
      }
      if (duration > MaxDuration) {
        duration = MaxDuration
      }
      setTimeout(() => {
        this.setData({ _msgData: {} })
      }, duration)
    }

  }).call(context)
}

module.exports = {
  importApi: importApi
}