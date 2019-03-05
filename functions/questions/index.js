// 云函数入口文件
const cloud = require('wx-server-sdk')
//目前未用该云函数
cloud.init()
const db = cloud.database({
  env: 'campus'
});
const questionCollection = db.collection("questions");
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  return questionCollection.orderBy('createdTime', 'desc')
      .get().then(resp => {
        return [];
      });
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}