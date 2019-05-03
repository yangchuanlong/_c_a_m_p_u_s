
import config from './config.js';
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


const timeFormattor = function(time){
  time = time || new Date();
  const date = new Date(time);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${('0' + date.getMinutes()).substr(-2)}`
};

const getRegisteredUsers = function(openIds) {
  const app = getApp(), globalData = app.globalData;
  const users = (globalData.users = globalData.users || {});
  const ids = openIds.filter(openId => !users[openId]);//获取还未缓存的用户信息
  if(!ids.length) {
    return new Promise(resolve => {
      resolve(users);
    });
  }
  wx.cloud.init();
  const db = wx.cloud.database({ env: config.env });
  const _ = db.command;
  return db.collection("users")
    .where({
      openid: _.in(ids)
    })
    .field({
      openid: true,
      nickName: true,
      avatar: true,
      _id: false
    })
    .get()
    .then(resp => {
      resp.data.forEach(user => {
        users[user.openid] = user;
      });
      return users;
    });
};
/*
使用参数如下
1，获取大于,小于,包含... 某个条件的数据，可这样设置参数,如查询createdTime大于2019-04-21， commands: ['createdTime', 'gt', '2019-01-21']
2, 获取等于某个条件的数据，如_id等于XF7yud7E7L4w7YDU， 则可如下设置 equals: {_id:XF7yud7E7L4w7YDU}
3, 排序，可如下设置： orderBy: [['createdTime', 'desc'], ['id', 'asc']]
4, 设置一次获取多少条数据， limit: 10
5, 设置只获取某些字段的数据 fields: ['createdTime', '_id', 'content']
* */

const getQuestions = function(params) {
    wx.cloud.init();
    const db = wx.cloud.database({
        env: params.env
    });
    const _ = db.command;
    delete params.env;
    let conditions = {}, fields = {}, limit, orderBy = [];
    ["commands", "fields", "orderBy", "limit", "equals"].forEach(preDefinedParam => {
        switch (preDefinedParam) {
            case "commands":
                if(Array.isArray(params.commands) && params.commands.length){
                    params.commands.forEach(command => {
                        const [field, commandType, val] = command;
                        conditions[field] = _[commandType](val)
                    });
                }
                break;
            case "fields":
                if(Array.isArray(params.fields)) {
                    params.fields.forEach(fieldName => {
                        fields[fieldName] = true;
                    })
                }
                break;
            case "limit":
                if(!isNaN(params.limit)) {
                    limit = params.limit;
                }
                break;
            case "orderBy":
                if(Array.isArray(params.orderBy) && params.orderBy.length) {
                    orderBy = params.orderBy;
                }
                break;
            case "equals":
                if(params.equals) {
                    if(Array.isArray(params.equals.columns)) {
                        const orArr = params.equals.columns.map(col => {
                            return {
                                columns: col
                            };
                        });
                        delete event.equals.columns;
                        Object.assign(conditions, params.equals);
                        conditions = _.and(conditions, _.or(orArr));
                    } else {
                        Object.assign(conditions, params.equals);
                    }
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
    // const result = subCollection.get();
    // result.data.forEach(question => {
    //     if(question.content.length > 40) {
    //         question.content = question.content.substr(0, 40) + '...';
    //     }
    // });
    // return result.data;
    return subCollection.get()
}
module.exports = {
  formatTime: formatTime,
  timeFormattor: timeFormattor,
  getRegisteredUsers,
  getQuestions
}


