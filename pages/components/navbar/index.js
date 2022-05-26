// pages/components/navbar/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: "金色家园"
    },
    returnAble: {
      type: Boolean,
      value: true
    },
    navbarStyle: {
      type: String
    },
    appendStyle: {
      type: String
    },
    textStyle: {
      type: String
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    statusBarHeight: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    goback: function () {
      if (getCurrentPages().length > 1) {
        wx.navigateBack({})
      } else {
        wx.reLaunch({
          url: '/pages/index/index',
        })
      }
      
    },
  },

  attached: function () {
    console.log(this.data)
    this.setData({statusBarHeight: wx.getSystemInfoSync().statusBarHeight})
    console.log(this.data.title)
    this.setData({ title: decodeURI(this.data.title) })
  },
})
