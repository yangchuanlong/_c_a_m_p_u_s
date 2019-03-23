// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();


// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database({
    env: event.env
  });
  const scanCollection = db.collection("scan");
  const wxContext = cloud.getWXContext()
  if(event.action == 'get') {//获取我浏览过的问题

  } else if (event.action == 'add') {
    return scanCollection.add({
      data: {
        openid: wxContext.OPENID,
        questionId: event.questionId
      }
    })
  }
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}