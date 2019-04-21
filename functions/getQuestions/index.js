// 云函数入口文件
const cloud = require('wx-server-sdk')
//目前未用该云函数
cloud.init()

// 云函数入口函数
//获取问题
/*
event即为调用该云函数时传入的data, 使用参数如下
1，获取大于,小于,包含... 某个条件的数据，可这样设置参数,如查询createdTime大于2019-04-21， commands: ['createdTime', 'gt', '2019-01-21']
2, 获取等于某个条件的数据，如_id等于XF7yud7E7L4w7YDU， 则可如下设置 equals: {_id:XF7yud7E7L4w7YDU}
3, 排序，可如下设置： orderBy: [['createdTime', 'desc'], ['id', 'asc']]
4, 设置一次获取多少条数据， limit: 10
5, 设置只获取某些字段的数据 fields: ['createdTime', '_id', 'content']
* */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database({
    env: event.env
  });
  const _ = db.command;
  delete event.env;
  let conditions = {}, fields = {}, limit, orderBy = [];
  ["commands", "fields", "orderBy", "limit", "equals"].forEach(preDefinedParam => {
    switch (preDefinedParam) {
      case "commands":
        if(Array.isArray(event.commands) && event.commands.length){
          event.commands.forEach(command => {
            const [field, commandType, val] = command;
            conditions[field] = _[commandType](val)
          });
        }
        break;
      case "fields":
        if(Array.isArray(event.fields)) {
          event.fields.forEach(fieldName => {
            fields[fieldName] = true;
          })
        }
        break;
      case "limit":
        if(!isNaN(event.limit)) {
          limit = event.limit;
        }
        break;
      case "orderBy":
        if(Array.isArray(event.orderBy) && event.orderBy.length) {
          orderBy = event.orderBy;
        }
        break;
      case "equals":
        if(event.equals) {
          Object.assign(conditions, event.equals);
        }
        break;
    }
  });
  let subCollection = db.collection("questions").where(conditions);
  if(Object.keys(fields).length) {
    subCollection = subCollection.field(fields);
  }
  orderBy.forEach(ob => {
    subCollection = subCollection.orderBy(ob[0], ob[1]);
  });
  if(!isNaN(limit)) {
    subCollection = subCollection.limit(limit);
  }
  const result = await subCollection.get();
  result.data.forEach(question => {
    if(question.content.length > 40) {
      question.content = question.content.substr(0, 40) + '...';
    }
  });
  return result.data;
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
