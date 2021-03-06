// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database({
    env: event.env
  });
  if(event.action === 'get') {
    return db.collection("thumbups").where({//获取我的点赞
      type: event.type,
      openid: wxContext.OPENID,
    }).get();
  } else if(event.action === 'add'){//添加对一个提问或回答的点赞
    return db.collection('thumbups').add({
      data: {
        questionOrReplyId: event.questionOrReplyId,
        openid: wxContext.OPENID,
        type: event.type
      }
    });
  } else if(event.action === 'cancel') {//取消对一个提问或回答的点赞
    return db.collection('thumbups').where({
      questionOrReplyId: event.questionOrReplyId,
      openid: wxContext.OPENID,
      type: event.type
    }).remove()
  }
  
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}