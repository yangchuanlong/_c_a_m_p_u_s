// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();


// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database({
    env: event.env
  });
  const wxContext = cloud.getWXContext();
  const result = await db.collection("questions").add({
    data: {
      title: event.title,
      content: event.content,
      columns: event.columns,
      images: event.images || [],
      anonymous: event.anonymous,
      createdTime: new Date().toISOString(),

      openid: wxContext.OPENID, //todo? put it in a userInfo object
      avatar: event.avatar,
      nickName: event.nickName
    },
  });
  await db.collection("hotRate").add({
    data: {
      questionId: result._id,
      collectNum: 0,
      readCount: 0,
      replyCount: 0,
      searchCount: 0,
      thumbupCount: 0,
      hotVal: 0,//热度

      createdTime: new Date().toISOString()
    }
  });
  return result;
  // const wxContext = cloud.getWXContext()

  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
