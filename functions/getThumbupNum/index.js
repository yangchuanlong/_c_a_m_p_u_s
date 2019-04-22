// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database({
    env: event.env
  });
  const _ = db.command;
  //const wxContext = cloud.getWXContext()
  return db.collection("thumbups").where({
    questionOrReplyId: _.in(event.ids),
    type: event.type
  }).get().then(function (resp) {
    const countMap = {};
    resp.data.forEach(item => {
      if (isNaN(countMap[item.questionOrReplyId])) {
        countMap[item.questionOrReplyId] = 1;
      } else {
        countMap[item.questionOrReplyId] += 1;
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