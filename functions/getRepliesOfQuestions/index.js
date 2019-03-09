// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database({
  env: "campus"
});
const _ = db.command;
// 云函数入口函数
exports.main = async (event, context) => {
  //const wxContext = cloud.getWXContext()

  return db.collection("replies").where({
    questionId: _.in(event.questionIds)
  }).get().then(function (resp) {    
    const countMap = {};
    resp.data.forEach(item => {
      if (isNaN(countMap[item.questionId])) {
        countMap[item.questionId] = 1;
      } else {
        countMap[item.questionId] += 1;
      }
    });    
    return countMap;
  });
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}