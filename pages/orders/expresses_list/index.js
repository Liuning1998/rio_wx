// pages/orders/expresses/show.js
var http = require('../../../utils/http.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    expressesArr: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    getApp().commonBeforeOnLoad(this)

    let expresses = JSON.parse(options.expresses)
    let order_number = options.order_number;
    // let number = "52458266670949159508"
    // let number = "547950549556"

    this.setData({ expresses: expresses, order_number: order_number })

    for (const item of expresses) {
      await this.getExpress(item.express_number,order_number)
    }

  },

  getExpress: function (number, order_number) {
    let expressesIndex = this.data.expressesArr.length;
    let key = `expressesArr[${expressesIndex}]`
    return new Promise((resolve,reject)=>{
      http.get({
        url: `/api/expresses/${number}/search_express`,
        data: { order_number: order_number },
        success: res => {
          if (res.statusCode == 200 && res.data != null) {
            this.setData({
              [key]: res.data
            })
            resolve()
          }
        },
        fail: res => {
          reject()
        }
      })
    })
  },

  gotoExpress: function (e) {
    let item = e.currentTarget.dataset.item
    if (item == null) {
      this.errorToast('获取快递信息出错')
      return
    }
    this.navigateTo(`/pages/orders/expresses/show?id=${item.express_number}&order_number=${this.data.order_number}`)
  },

})