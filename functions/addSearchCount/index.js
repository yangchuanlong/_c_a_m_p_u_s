// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database({
    env: event.env
  });
  const _ = db.command;
  const questionCollection = db.collection("questions");   
  await questionCollection.where({
    _id: _.in(event.addOneIds)
  }).update({
    data: {
      searchCount: _.inc(1)
    }
  });
  
  await questionCollection.where({
    _id: _.in(event.setOneIds)
  }).update({
    data: {
      searchCount: 1
    }
  });
  //const wxContext = cloud.getWXContext();
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}