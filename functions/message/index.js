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
         receiverId: event.receiverId,
       }).get().then(({data}) => {
         const msg = {
             type: event.type,  //1:点赞问题， 2: 回复问题 3: 点赞回复  4：回复别人的回复
             sender: wxContext.OPENID,
             abstract: event.abstract || '', //回复内容摘要
             createdTime: new Date().toISOString()
         };
         if(!data.length) {
           return collection.add({
             data: {
               questionId: event.questionId,
               receiverId: event.receiverId,
               read: [],
               unread: [msg],
               updatedTime: new Date().toISOString()
             }
           });
         } else {
           return collection.doc(data[0]._id).update({
             data: {
               unread: _.push(msg),
               updatedTime: new Date().toISOString()
             }
           })
         }
       });
      break;
    case 'read'://把未读设置为已读
      return collection.where({
          _id: event.id
      }).get().then(({data}) => {
        const message = data[0];
        const read = message.read.concat(message.unread);
        return collection.doc(message._id).update({// 未读消息添加到已读
            data: {
              unread: [],
              read
            }
        });
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
