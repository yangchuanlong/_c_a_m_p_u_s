// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database({
  env: "campus"
});
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return db.collection("questions").where({
    openid: wxContext.OPENID
  }).get()
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}