
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
      grade: true,
      gender: true,
      _id: false,
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
    const app = getApp(), globalData = app.globalData;
    const db = wx.cloud.database({
        env: params.env
    });
    const _ = db.command;
    delete params.env;
    let conditions = {}, fields = {}, limit, orderBy = [];
    params.equals = Object.assign({}, params.equals, {collegeId: globalData.curUser.collegeId}); //只获取本校的内容
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
                        delete params.equals.columns;
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
    if(Object.keys(fields).length) {
        return subCollection.field(fields).get();
    }
    return subCollection.get()
}

const dateDiff = function (dateStr) {
  const timestamp = new Date(dateStr).getTime();
  let minute = 1000 * 60;
  let hour = minute * 60;
  let day = hour * 24;
  let halfamonth = day * 15;
  let month = day * 30;
  let now = new Date().getTime();
  let diffValue = now - timestamp;

  // 如果本地时间反而小于变量时间
  if (diffValue < 0) {
    return '刚刚';
  }

  // 计算差异时间的量级
  let monthC = diffValue / month;
  let weekC = diffValue / (7 * day);
  let dayC = diffValue / day;
  let hourC = diffValue / hour;
  let minC = diffValue / minute;

  // 数值补0方法
  const zero = function (value) {
    if (value < 10) {
      return '0' + value;
    }
    return value;
  };

  // 使用
  if (monthC > 12) {
    // 超过1年，直接显示年月日
    return (function () {
      let date = new Date(timestamp);
      return date.getFullYear() + '年' + zero(date.getMonth() + 1) + '月' + zero(date.getDate()) + '日';
    })();
  } else if (monthC >= 1) {
    return parseInt(monthC) + "月前";
  } else if (weekC >= 1) {
    return parseInt(weekC) + "周前";
  } else if (dayC >= 1) {
    return parseInt(dayC) + "天前";
  } else if (hourC >= 1) {
    return parseInt(hourC) + "小时前";
  } else if (minC >= 1) {
    return parseInt(minC) + "分钟前";
  }
  return '刚刚';
};

module.exports = {
  formatTime: formatTime,
  timeFormattor: timeFormattor,
  getRegisteredUsers,
  getQuestions,
  dateDiff
};


