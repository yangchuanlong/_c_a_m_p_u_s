
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

module.exports = {
  formatTime: formatTime,
  timeFormattor: timeFormattor,
  getRegisteredUsers
}


