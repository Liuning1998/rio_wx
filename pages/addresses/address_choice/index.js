var city = require('./method.js')
var http = require("../../../utils/http.js")

Component({
 
  properties: {
    // locationArr: {
    //   type: Array,
    //   value: '',
    //   observer: function(newVal, oldVal) {
    //     console.log('我是传递进入的省', newVal)
    //   }
    // },
    address:{
      type:Object,
      value:'',
      observer:function(newVal, oldVal){
        console.log('我是传递进入的地址id', newVal)
      }
    }
  },
 
  data: {
    // 弹窗显示控制
    isShowToast: true,
    nameArr: ['请选择', '', '',''],
    currentTab: 0, // tab切换 
    provinceArr: [],
    provinceIndex: 0,
    cityArr: [],
    loading:false,
    cityIndex: 0,
    // countryArr: [],
    // countryIndex: 0,
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
      console.log(this.data.provinceArr)
      if(this.data.provinceArr.length == 0){
        this.setData({loading:true})
        http.get({
          url: '/api/china_regions/fetch_address',
          data:{
            type:'province'
          },
          success: (res) => {
            if (res.data != null && res.data.constructor.name == 'Array') {
              console.log(res.data)
              this.setData({
                provinceArr: res.data,
                loading:false
              });
            }
          },
          fail: (res) => {
            console.error('获取地址数据失败')
          }
        })
      }
      
    },

    //显示
    showsGoodsDetail: function() {
      var that = this
      // var tempLocalArr = that.properties.locationArr //传入的省市区
      var address = that.properties.address //传入的省市区id
      console.log(address)
      var tempNameArr = that.data.nameArr //顶部省市区
 
      that.setData({
        isShowToast: false
      })
 
      this.getProvince();
      //是否传入地址 传入则显示当前地址   为传入则显示之前地址
      // if (tempLocalArr[0] == '' || tempLocalArr[1] == '' || tempLocalArr[2] == '' || tempLocalArr[3] == '') {
      //   console.log('我是未传入地址')
      // } else {
      //   console.log('我是传入了地址')

      //   that.setData({
      //     nameArr: tempLocalArr,
      //   })
 
      // }
      if(address == null){
        console.log('我是未传入地址')
      }else{
        console.log('我是传入了地址')
        var nameArr = this.data.nameArr;
        nameArr[0] = address.province || '';
        nameArr[1] = address.city || '';
        nameArr[2] = address.district || '';
        nameArr[3] = address.town || '';
        this.getAddress('city',address.province_id)
        this.getAddress('district',address.city_id)
        this.getAddress('town',address.district_id)
        var currentTab = this.data.currentTab;
        if(address.town_id){
          currentTab = 3
        }else if(address.district_id){
          currentTab = 2
        }else if(address.city_id){
          currentTab = 1
        }else if(address.province_id){
          currentTab = 0
        }
        this.setData({
          nameArr:nameArr,
          province_id:address.province_id,
          city_id:address.city_id,
          district_id:address.district_id,
          town_id:address.town_id,
          currentTab:currentTab
        })
      }
    },
    // 统一获取省市区
    getAddress:function(type,id){
      console.log(type,id)
      if(id!=null){
        var key = `${type}Arr`
        http.get({
          url: '/api/china_regions/fetch_address',
          data:{
            type:type,
            id:id
          },
          success: res => {
              this.setData({
                [key]:res.data
              })
          },
          fail: res => {
            console.error('获取地址数据失败')
          }
        })
      }
    },
    //改变省
    provinceChange: function(e) {
      var tempNameArr = this.data.nameArr;
      tempNameArr[0] = this.data.provinceArr[e.currentTarget.dataset.index].name
      tempNameArr[2] = ''
      tempNameArr[3] = ''
      var key = `nameArr[1]`;
      this.setData({
        provinceIndex: e.currentTarget.dataset.index,
        province_id: e.currentTarget.dataset.item.id,
        loading:true
      })
      http.get({
        url: '/api/china_regions/fetch_address',
        data:{
          type:'city',
          id:this.data.province_id
        },
        success: res => {
          if(res.data.length <= 0){
            this.setData({
              nameArr: tempNameArr,
              [key]:'',
              loading:false
            })
            this.exit();
          }else{
            this.setData({
              nameArr: tempNameArr,
              cityArr: res.data,
              currentTab: 1,
              [key]:'请选择',
              loading:false
            });
            console.log(res.data)
          }
            
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
      console.log(this.data);
    },
 
    //改变市
    cityChange: function(e) {
      var tempNameArr = this.data.nameArr;
      tempNameArr[1] = this.data.cityArr[e.currentTarget.dataset.index].name
      tempNameArr[3] = ''
      var key = `nameArr[2]`;
      this.setData({
        cityIndex: e.currentTarget.dataset.index,
        city_id: e.currentTarget.dataset.item.id,
        loading:true
      })
      http.get({
        url: '/api/china_regions/fetch_address',
        data:{
          type:'district',
          id:this.data.city_id
        },
        success: res => {
          if(res.data.length <= 0){
            this.setData({
              [key]:'',
              loading:false,
              nameArr: tempNameArr,
            })
            this.exit();
          }else{
            this.setData({
              districtArr: res.data,
              currentTab: 2,
              [key]:'请选择',
              loading:false,
              nameArr: tempNameArr,
            });
          }
            
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
      console.log(this.data);
    },
 
    //改变区县
    districtChange:function(e){
      var tempNameArr = this.data.nameArr;
      tempNameArr[2] = this.data.districtArr[e.currentTarget.dataset.index].name
      var key = `nameArr[3]`
      this.setData({
        districtIndex: e.currentTarget.dataset.index,
        district_id: e.currentTarget.dataset.item.id,
        loading:true
      })
      http.get({
        url: '/api/china_regions/fetch_address',
        data:{
          type:'town',
          id:this.data.district_id
        },
        success: res => {
          if(res.data.length <= 0){
            this.setData({
              [key]:'',
              nameArr: tempNameArr,
              loading:false
            })
            this.exit();
          }else{
            this.setData({
              townArr: res.data,
              currentTab: 3,
              nameArr: tempNameArr,
              [key]:'请选择',
              loading:false
            });
          }
            
        },
        fail: res => {
          console.error('获取地址数据失败')
        }
      })
      console.log(this.data);
    },
    //改变街道
    townChange:function(e){
      var tempNameArr = this.data.nameArr;
      tempNameArr[3] = this.data.townArr[e.currentTarget.dataset.index].name
      this.setData({
        townIndex: e.currentTarget.dataset.index,
        town_id: e.currentTarget.dataset.item.id,
        nameArr: tempNameArr,
      })
      console.log(this.data);
      this.exit()
    },

    //修改地址并退出弹框
    exit:function(e){
      setTimeout(res=>{
        this.setData({
          isShowToast: true,
        })
      },300)
      //关闭并返回
      console.log(this.data)
      this.triggerEvent('resultEvent', {
        nameArr: this.properties.nameArr,
        province_id:this.data.province_id,
        city_id:this.data.city_id,
        district_id:this.data.district_id,
        town_id:this.data.town_id
      })
    },

    // 截获竖向滑动  
    catchTouchMove: function(res) {
      return false
    },
 
    // 点击tab切换   
    navbarTap: function(e) {
      this.setData({
        currentTab: e.currentTarget.dataset.index,
      })
    },
  }
})