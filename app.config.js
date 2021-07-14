// 全局配置
// 供js调用
var errorMap = {
  100105: { msg: "phone_number need Authentication ", msg_t: '需要验证手机号码' },
  100106: { msg: "rucaptcha_wrong", msg_t: '图形验证码错误' },
  100108: { msg: "stock_not_enough not enough", msg_t: '该商品库存不足' },
  100142: { msg: "has_sended", msg_t: '短信验证码已发送' },
  100112: { msg: "phone exists", msg_t: '该手机号码已存在' },
  100113: { msg: "code_error", msg_t: '短信验证码错误' },
  100114: { msg: "parameter pay failed", msg_t: '参数错误' },
  100116: { msg: "pay_expired pay failed", msg_t: '该订单已过期' },
  100120: { msg: "product_sale_off created failed", msg_t: "该商品已下架" },
  100136: { msg: 'variant_sale_off', msg_t: '该商品已下架' },
  100137: { msg: 'coupon_no_found', msg_t: '找不到折扣券' },
  100139: { msg: 'activity_limit', msg_t: '超过活动期内购买张数限制' },
  100140: { msg: 'coupon_not_enough not enough', msg_t: '该卡券数量不足' },
  100115: { msg: 'order_payed pay failed', msg_t: '该订单已经支付' },
  100143: { msg: 'rush_failure', msg_t: '超过购买张数限制' },
  100209: { msg: 'coupon not found', msg_t: "换购码错误" },
  100138: { msg: 'coupon not use', msg_t: "换购码不能使用" }, // 已使用
  100147: { msg: 'coupon_expired', msg_t: '换购码已过期'},
  100146: { msg: 'order qunitity limit', msg_t: "超过订单数量限制" },
  100145: { msg: 'too more operate', msg_t: "操作太频繁，请稍后再试" },
  100149: { msg: 'order total more than 2000', msg_t: "单笔订单原价总金额超过2000元" },
  100150: { msg: 'order total more than 1200', msg_t: "单笔订单原价总金额超过1200元" },
  100157: { msg: 'member_limit_expend', msg_t: '团已满, 请参加下一个团购' },
  100158: { msg: 'group_not_exists_or_close', msg_t: '抱歉，团已满，请参加下一个团购' },
  100159: { msg: 'already_join_buy_group', msg_t: '您已参加过该活动' },
  100160: { msg: 'area_limit limit exceeded', msg_t: "订单中商品在所选地区不支持销售，请确认后再购买。" },
}

// 修改团购中专区跳转id, /group_buy/pages/join/index.js
const ENV = 'production'
// const ENV = 'development'

const ENV_CONFIG = {
  development: {
    serverDomain: "rio-dev.jhqli.com",
  },
  production: {
    serverDomain: "rio.jhqli.com"
  }
}

const CURRENT_ENV = ENV_CONFIG[ENV]

function config(options) {
  let serverDomain = CURRENT_ENV.serverDomain
 
  options = options || {}
  options = Object.assign(options, {
    errorMap: errorMap
  })

  return Object.assign(options, {
    apiServer: "https://" + serverDomain + "/",
    websocketServer: "wss://" + serverDomain + "/cable",
    cacheTime: 60,
    perPage: 10,
    phoneReg: /^[1][3456789][0-9]{9}$/,
    env: ENV
  })
}

module.exports = {
  config: config
}