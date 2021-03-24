// pages/components/message/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    msgData: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    closeToast: function() {
      this.setData({ 'msgData.show': false })
    }
  }
})