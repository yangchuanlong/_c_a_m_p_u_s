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
  const collection = db.collection("messages");
  const actionType = event.actionType;
  switch(actionType){
    case 'add':
     return collection.where({
       questionId: event.questionId,
       receiverId: event.receiverId
     }).get().then(({data}) => {
       if(!data.length) {
         return collection.add({
           data: {
             questionId: event.questionId,
             receiverId: event.receiverId,
             read: [],
             unread: [{
               type: event.type,  //1:点赞问题， 2: 回复问题 3: 点赞回复  4：回复别人的回复
               sender: wxContext.OPENID
             }],
             updatedTime: new Date().toISOString()
           }
         });
       } else {
         return collection.doc(data[0]._id).update({
           data: {
             unread: _.push({
               type: event.type,
               sender: wxContext.OPENID
             }),
             updatedTime: new Date().toISOString()
           }
         })
       }
     });
    break;
  }

  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
