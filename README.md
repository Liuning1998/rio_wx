// 余额支付部分，按照订单 discount_total 计算
// 微信支付折扣api可以控制goods_tag处理
// brcb 支付api 可以处理

// 重要，支付
// 取消支付后再次支付时，余额支付部分数据不可重新选择，否则会导致预支付出问题
// 重要