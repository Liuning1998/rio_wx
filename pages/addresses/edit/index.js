// pages/address/edit/index.js
var http = require('../../../utils/http.js')
var helper = require('../../../utils/helper.js')
var storage = require("../../../utils/storage.js")
var cityData  = []

Page({

  /**
   * 页面的初始数据
   */
  data: {
    provinces: [],
    cities: [],
    countys: [],
    towns: [],
    pickerValues: [],
    pickerDisplayValue: [0, 0, 0],
    pickerShow: false,
    cityString: '',
    ableSubmit: true,
    newObject: true,
    address: null,
    referrer: null,
    default_address: false,
    phone: '',
    address_info: '',
    real_name: '',
    textareaLine: 1
  },

  onLoad: function (options) {
    getApp().commonBeforeOnLoad(this)
    
    var address = this.getParamsFromGlobal(options.paramId)
    if (address != null ) {
      this.setData({ 
        newObject: false, 
        address: address, 
        default_address: address.default_address,
        real_name: address.real_name,
        phone: address.phone,
        address_info: address.address_info,
        title: '编辑收货地址'
      })
      this.initPickerDisplayValuesForEdit(address)
    } else {
      this.setData({ title: '新增收货地址' })
    }

    if (options.referrer != null && options.referrer != '') {
      this.setData({ referrer: options.referrer })
    }

    // this.initCityData()
    this.fetchProvinceData()
  },

  formSubmit: function () {
    if (!this.data.ableSubmit) return false

    var formValue = {
      real_name: this.data.real_name,
      phone: this.data.phone,
      address_info: this.data.address_info
    }
    var pickerValues = this.data.pickerValues
    formValue['province'] = this.data.provinces[pickerValues[0]]

    var province = this.data.provinces[pickerValues[0]]
    if (province != null) {
      formValue['province_id'] = province.id

      var city = this.data.cities[pickerValues[1]]
      if (city != null) {
        formValue['city_id'] = city.id
      } else {
        formValue['city_id'] = null
      }

      var county = this.data.countys[pickerValues[2]]
      if (county != null) {
        formValue['district_id'] = county.id
      } else {
        formValue['district_id'] = null
      }

      var town = this.data.towns[pickerValues[3]]
      if (town != null) {
        formValue['town_id'] = town.id
      } else {
        formValue['town_id'] = null
      }
    } else {
      if (this.data.address != null) {
        formValue['province_id'] = this.data.address.province_id
        formValue['city_id'] = this.data.address.city_id
        formValue['county_id'] = this.data.address.county_id
        formValue['town_id'] = this.data.address.town_id
      }
    }

    formValue.default_address = this.data.default_address

    if (!this.validate(formValue)) {
      return false
    }

    if (this.data.newObject) {
      this.createAddress(formValue)
    } else {
      this.editAddress(formValue)
    }
  },

  createAddress: function (data) {
    http.post({
      url: 'api/ship_addresses',
      data: data,
      success: (res) => {
        this.successToast('创建地址成功', 1000)
        helper.cacheShipAddress(res.data)

        setTimeout(res => {
          this.redirect()
        }, 1000)
        
      },
      fail: (res) => {
        this.errorToast('创建地址失败', 1000)
        this.setData({ ableSubmit: true })
      }
    })
  },

  switchDefaultAddress: function (e) {
    this.setData({ default_address: e.detail.value })
  },

  editAddress: function (data) {
    http.put({
      url: 'api/ship_addresses/' + this.data.address.id,
      data: data,
      success: (res) => {
        this.successToast('修改地址成功', 1000)
        helper.cacheShipAddress(res.data)
        
        setTimeout(res => {
          this.redirect()
        }, 1000)
      },
      fail: (res) => {
        this.errorToast('修改地址失败', 1000)
        this.setData({ ableSubmit: true })
      }
    })
  },

  validate: function (data) {
    if (data.real_name == null || data.real_name.length <= 0) {
      this.errorToast('请输入正确的联系人')
      return false
    }

    if (!getApp().globalData.phoneReg.test(data.phone)) {
      this.errorToast('请输入正确的手机号码')
      return false
    }

    if (data.province_id == null || data.province_id.length <= 0) {
      this.errorToast('请选择地区')
      return false
    }

    if (data.address_info == null || data.address_info.length <= 0) {
      this.errorToast('请输入详细地址')
      return false
    }

    return true
  },

  redirect: function () {
    wx.navigateBack()
    // if (this.data.referrer == 'confirm_order') {
    //   wx.navigateBack()
    // } else {
    //   wx.redirectTo({
    //     url: '/pages/address/index/index',
    //   })
    // }
  },

  bindChange: function (e) {
    var oldPicker = this.data.pickerDisplayValue
    var newPicker = e.detail.value
    
    if (oldPicker[0] != newPicker[0]) {
      // this.setData({ pickerDisplayValue: [newPicker[0], 0, 0, 0] })
      // this.setCityData(newPicker[0])
      // this.setCountyData(0)
      // this.setTownData(0)
      
      this.changeProvince(newPicker)
    } else if (oldPicker[1] != newPicker[1]) {
      this.setData({ pickerDisplayValue: [newPicker[0], newPicker[1], 0, 0] })
      this.setCountyData(newPicker[1])
      this.setTownData(0)
    }else if (oldPicker[2] != newPicker[2]) {
      this.setData({ pickerDisplayValue: [newPicker[0], newPicker[1], newPicker[2], 0] })
      this.setTownData(newPicker[2])
    } else {
      this.setData({ pickerDisplayValue: newPicker })
    }


  },

  changeProvince: function (picker=null) {
    var province
    if (picker == null) {
      if (this.data.address != null) {
        for(var i in cityData) {
          if (cityData[i].id == this.data.address.province_id) {
            province = cityData[i]
            break
          }
        }
      } else {
        province = cityData[0]
      }
    } else {
      province = cityData[picker[0]]
    }
    if (province == null) { return false }

    if (province.cities == null || province.cities.length <= 0) {
      http.get({
        url: "api/china_regions/fetch_province_info?id=" + province.id,
        success: res => {
          var _province = res.data
          if (_province != null && _province.id != null) {
            for(var i in cityData) {
              if (cityData[i].id == _province.id) {
                cityData[i].cities = _province.cities
                break
              }
            }
            if (picker == null) {
              this.initPickerDisplayValuesForEdit(this.data.address)
              this.setCityData(0)
              this.setCountyData(0)
              this.setTownData(0)
            } else {
              this.setData({ pickerDisplayValue: [picker[0], 0, 0, 0] })
              this.setCityData(picker[0])
              this.setCountyData(0)
              this.setTownData(0)
            }
          } else {
            console.error('获取地址数据失败')
          }
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
    } else {
      if (picker == null) {
        this.initPickerDisplayValuesForEdit()
      } else {
        this.setData({ pickerDisplayValue: [picker[0], 0, 0, 0] })
        this.setCityData(picker[0])
        this.setCountyData(0)
        this.setTownData(0)
      }
    }
  },

  setProvinceData: function () {
    var result = []
    for(var i = 0; i < cityData.length; i ++) {
      result.push({id: cityData[i].id, name: cityData[i].name})
    }
    this.setData({ provinces: result })
    return result
  },

  setCityData: function (index) {
    var result = []
    var province = this.data.provinces[index || this.data.pickerDisplayValue[0]]
    if (province != null){
      var _province = cityData.filter(item => item.id == province.id)[0]
      if (_province != null && _province.cities != null && _province.cities.constructor.name == 'Array') {
        result = _province.cities
      }
    }

    this.setData({ cities: result })
    return result
  },

  setCountyData: function (index) {
    var result = []
    var city = this.data.cities[index || this.data.pickerDisplayValue[1]]
    if (city != null && city.districts != null && city.districts.constructor.name == 'Array') {
      result = city.districts
    }

    this.setData({ countys: result })
    return result
  },

  setTownData: function (index) {
    var result = []
    var county = this.data.countys[index || this.data.pickerDisplayValue[2]]
    if (county != null && county.towns != null && county.towns.constructor.name == 'Array') {
      result = county.towns
    }

    this.setData({ towns: result })
    return result
  },

  selectCity: function () {
    this.setData({ pickerShow: true })
  },

  cancelSelectCity: function () {
    this.setData({ pickerShow: false } )
  },

  okSelectCity: function () {
    this.setData({ pickerShow: false, pickerValues: this.data.pickerDisplayValue } )
    this.setCityString()
  },

  setCityString: function () {
    var picker = this.data.pickerValues
    var province = this.data.provinces[picker[0]]
    var city = this.data.cities[picker[1]]
    var county = this.data.countys[picker[2]]
    var town = this.data.towns[picker[3]]

    var result = province.name

    if (city != null) {
      result += city.name
    }

    if (county != null) {
      result += county.name
    }

    if (town != null) {
      result += town.name
    }
    
    this.setData( { cityString: result } )
  },

  initPickerDisplayValuesForEdit: function (address) {
    var provinces = this.setProvinceData()
    var displayValues = [0, 0, 0, 0]
    var province
    var city
    var county
    var town
    var addressString = ''
    var cities = this.setCityData(displayValues[0])
    var countys = this.setCountyData(displayValues[1])
    var towns = this.setTownData(displayValues[2])



    
    if (address != null) {
      for (var i in provinces) {
        if (provinces[i].name == address.province) {
          displayValues[0] = i
          province = provinces[i]
        }
      }

      for (var i in cities) {
        if (cities[i].name == address.city) {
          displayValues[1] = i
          city = cities[i]
        }
      }
  
  
      for (var i in countys) {
        if (countys[i].name == address.district) {
          displayValues[2] = i
          county = countys[i]
        }
      }
  
  
      for (var i in towns) {
        if (towns[i].name == address.town) {
          displayValues[3] = i
          town = towns[i]
        }
      }

      if (address.province != null) { addressString += address.province }
      if (address.city != null) { addressString += address.city }
      if (address.district != null) { addressString += address.district }
      if (address.town != null) { addressString += address.town }
    } else {
      province = provinces[0]
      city = cities[0]
      county = countys[0]
      town = towns[0]
    }

    this.setData({ pickerDisplayValue: displayValues, cityString: addressString })
    
  },

  inputChange: function (e) {
    var options = {}
    options[e.currentTarget.dataset.name] = e.detail.value
    this.setData(options)
  },

  deleteAddress: function (e) {
    var address = e.currentTarget.dataset.address

    wx.showModal({
      title: '删除地址',
      content: '您确定删除该收货地址吗？',
      success: (res) => {

        if (res.confirm) {
          http.delete({
            url: 'api/ship_addresses/' + address.id,
            success: (res) => {
              this.successToast('删除地址成功', 1000)

              var cacheAddress = storage.getSync('ship_address')
              if(cacheAddress.id == address.id) {
                storage.delSync('ship_address')
              }

              // wx.redirectTo ({
              //   url: '/pages/addresses/index/index',
              // })
              setTimeout(res => {
                wx.navigateBack({})
              }, 1000)
            },
            fail: (res) => {
              this.errorToast('删除地址失败', 1000)
              this.setData({ ableSubmit: true })
            }
          })
        }
        
      }
    })
  },
  initCityData: function (e) {
    http.get({
      url: 'api/china_regions',
      success: (res) => {
        // console.log(res)
        if (res.data != null && res.data.constructor.name == 'Array') {
          cityData = res.data
          if (this.data.address != null) {
            this.initPickerDisplayValuesForEdit(this.data.address)
          }
          this.setProvinceData()
          this.setCityData()
          this.setCountyData()
          this.setTownData()
        }
      },
      fail: (res) => {
        console.error('获取地址数据失败')
      }
    })
  },

  fetchProvinceData: function () {
    http.get({
      url: 'api/china_regions/fetch_province',
      success: (res) => {
        // console.log(res)
        if (res.data != null && res.data.constructor.name == 'Array') {
          cityData = res.data
          // if (this.data.address != null) {
          //   this.initPickerDisplayValuesForEdit(this.data.address)
          // }
          // this.setProvinceData()
          // this.setCityData()
          // this.setCountyData()
          // this.setTownData()
          this.setProvinceData()
          this.changeProvince()
        }
      },
      fail: (res) => {
        console.error('获取地址数据失败')
      }
    })
  },

  changeTextareaLine: function (e) {
    console.log(e.detail)
    let line = e.detail.lineCount
    if (line == null || line <= 0) { line = 1 }
    this.setData({ textareaLine: line })
  },
  
})

