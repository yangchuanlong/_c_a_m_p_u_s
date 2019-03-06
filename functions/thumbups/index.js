// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database({
  env: "campus"
});
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  if(event.type === 'get') {
    return db.collection("thumbups").get();
  } else if(event.type === 'add'){//添加对一个提问或回答的点赞
    
  } else if(event.type === 'cancel') {//取消对一个提问或回答的点赞

  }
  
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}