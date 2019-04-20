// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database({
    env: event.env
  });
  const userCollection = db.collection("users");
  const result = await userCollection.add({
    data: {
      openid: wxContext.OPENID,
      collegeId: event.collegeId,
      grade: event.grade,
      nickName: event.nickName,
      avatar: event.avatar,
      gender: event.gender
    }
  });
  return result;
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}