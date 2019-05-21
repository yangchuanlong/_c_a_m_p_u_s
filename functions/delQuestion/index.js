// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database({
    env: event.env
  });
  const _ = db.command;
  const collection = db.collection('questions');
  const questionId = event.questionId;
  const ret = await collection.where({
    _id: questionId
  }).get().then(result => {
    const question = result.data[0];
    if(!question) {
      return;
    }
    if(question.images.length) {
        return cloud.deleteFile({
            fileList: question.images,
        }).then(function () {
            return collection.doc(questionId).remove();
        }) ;
    } else {
        return collection.doc(questionId).remove();
    }
  });
  return ret;
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}