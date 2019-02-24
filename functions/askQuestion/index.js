// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database({
  env: "campus"
});
const questionCollection = db.collection("questions");
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  await db.collection("questions").add({
    data: {
      title: event.title,
      content: event.content,
      types: event.types,
      createdTime: new Date().toISOString(),

      openid: wxContext.OPENID, //todo? put it in a userInfo object
      avatar: event.avatar,
      nickName: event.nickName
    },
    // success(){

    // },
    // fail() {

    // },
    // complete(){

    // }
  })  
  // const wxContext = cloud.getWXContext()

  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}