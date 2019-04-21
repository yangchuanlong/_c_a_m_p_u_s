// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database({
      env: event.env
  });
  return db.collection("users").where({
    openid: wxContext.OPENID
  }).update({
    data: {
      interestedColumns: event.interestedColumns
    }
  });
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}