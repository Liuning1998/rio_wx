var city = require('./method.js')
var http = require("../../../utils/http.js")

Component({
 
  properties: {
    locationArr: {
      type: Array,
      value: '',
      observer: function(newVal, oldVal) {
        console.log('我是传递进入的省', newVal)
      }
    },
  },
 
  data: {
    // 弹窗显示控制
    isShowToast: true,
    nameArr: ['请选择', '', ''],
    currentTab: 0, // tab切换 
    provinceArr: [],
    provinceIndex: 0,
    cityArr: [],
    cityIndex: 0,
    countryArr: [],
    countryIndex: 0,
  },
 
  methods: {
 
    //隐藏
    hideGoodsDetail: function() {
      var that = this
 
      that.setData({
        isShowToast: true
      })
    },
    // 请求省
    getProvince() {
      // var provinceNames = [];
      // for (var i = 0; i < cityStr.length; i++) {
      //   provinceNames.push(cityStr[i].name);
      // }
      // return provinceNames;
      http.get({
        url: 'api/china_regions/fetch_province',
        success: (res) => {
          if (res.data != null && res.data.constructor.name == 'Array') {
            console.log(res.data)
            this.setData({
              provinceArr: res.data
            });
          }
        },
        fail: (res) => {
          console.error('获取地址数据失败')
        }
      })
    },
    // 请求市
    getCity(province) {
      http.get({
        url: "api/china_regions/fetch_province_info?id=" + province,
        success: res => {
            this.setData({
              cityArr: res.data.cities,
              currentTab: 1,
            });
            console.log(this.data.cityArr)
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
    },
    //请求区
    getArea(province, city) {
      http.get({
        url: "api/china_regions/fetch_province_info?id=" + 354,
        success: res => {
            this.setData({
              countryArr: res.data.cities,
              currentTab: 2,
            });
            console.log(this.data.countryArr)
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
    },
    //显示
    showsGoodsDetail: function() {
      var that = this
      var tempLocalArr = that.properties.locationArr //传入的省市区
      var tempNameArr = that.data.nameArr //顶部省市区
 
      that.setData({
        isShowToast: false
      })
      console.log('我是传入的值')
      console.log(tempLocalArr)
 
      // this.setData({
      //   provinceArr: this.getProvince()
      // });
      // console.log(city.getProvince())
      this.getProvince();
      //是否传入地址 传入则显示当前地址   为传入则显示之前地址
      if (tempLocalArr[0] == '' || tempLocalArr[1] == '' || tempLocalArr[2] == '') {
        console.log('我是未传入地址')
      } else {
        console.log('我是传入了地址')
        
        tempNameArr[0] = tempLocalArr[0]
        tempNameArr[1] = tempLocalArr[1]
        tempNameArr[2] = tempLocalArr[2]
        var tempProvinceIndex = that.data.provinceArr.indexOf(tempLocalArr[0]) //省索引
        //在这里对不存在的地址进行兼容
        if (tempProvinceIndex == -1){
          console.log('我是省没有 找到')
          tempProvinceIndex = 0
          tempNameArr[0] = that.data.provinceArr[0]
        }
        var tempCityArr = city.getCity(that.data.provinceArr[tempProvinceIndex]) //市
        var tempCityIndex = tempCityArr.indexOf(tempLocalArr[1]) //市索引
        //在这里对不存在的地址进行兼容
        if (tempCityIndex == -1) {
          console.log('我是市没有 找到')
          tempCityIndex = 0
          tempNameArr[1] = tempCityArr[0]
        }
        var tempCountryArr = city.getArea(that.data.provinceArr[tempProvinceIndex], tempCityArr[tempCityIndex]) //区
        var tempCountryIndex = tempCountryArr.indexOf(tempLocalArr[2]) //区索引
        //在这里对不存在的地址进行兼容
        if (tempCountryIndex == -1) {
          console.log('我是区没有 找到')
          tempCountryIndex = 0
          tempNameArr[2] = tempCountryArr[0]
        }
        that.setData({
          nameArr: tempNameArr,
          provinceIndex: tempProvinceIndex,
          cityArr: tempCityArr,
          cityIndex: tempCityIndex,
          countryArr: tempCountryArr,
          countryIndex: tempCountryIndex,
          currentTab: 0,
        })
 
      }
    },
 
    //改变省
    provinceChange: function(e) {
      var that = this
      // console.log(e.currentTarget.dataset.item)
      var key = `nameArr[0]`;
      var key1 = `nameArr[1]`;
      var key2 = `nameArr[2]`;
      that.setData({
        provinceId: e.currentTarget.dataset.item.id,
        [key]: e.currentTarget.dataset.item.name,
        [key1]:'请选择',
        [key2]:'',
        // countryArr: [],
        // countryIndex: 0,
      })
      //获取市
      // this.setData({
      //   cityArr: city.getCity(that.data.provinceArr[that.data.provinceIndex]),
      //   currentTab: 1,
      // });
      this.getCity(this.data.provinceId)
    },
 
    //改变市
    cityChange: function(e) {
      var that = this
      var key1 = `nameArr[1]`;
      var key2 = `nameArr[2]`;
      that.setData({
        cityId: e.currentTarget.dataset.item.id,
        [key1]:e.currentTarget.dataset.item.name,
        [key2]:'请选择'
      })
      //获取区
      this.getArea()
    },
 
 
    //改变区区/县
    districtChange: function(e) {
      var that = this
      var tempNameArr = that.data.nameArr
 
      tempNameArr[0] = that.data.provinceArr[that.data.provinceIndex]
      tempNameArr[1] = that.data.cityArr[that.data.cityIndex]
      tempNameArr[2] = that.data.countryArr[e.currentTarget.dataset.index]
      that.setData({
        countryIndex: e.currentTarget.dataset.index,
        nameArr: tempNameArr,
        isShowToast: true,
        currentTab: 0
      })
 
      //关闭并返回
      this.triggerEvent('resultEvent', {
        nameArr: that.properties.nameArr
      })
      console.log(that.data.provinceArr[that.data.provinceIndex])
      console.log(that.data.cityArr[that.data.cityIndex])
      console.log(that.data.countryArr[that.data.countryIndex])
      //关闭并返回  省市区
    },
 
    // 截获竖向滑动  2018年7月5日19:55:40  刘宣亮
    catchTouchMove: function(res) {
      return false
    },
 
    // 点击tab切换   2018年7月5日19:59:30 刘宣亮
    navbarTap: function(e) {
      var that = this
 
      that.setData({
        currentTab: e.currentTarget.dataset.index,
      })
      console.log(e.currentTarget.dataset.index)
    },
  }
})