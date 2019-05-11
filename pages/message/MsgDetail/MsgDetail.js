
import config from '../../../utils/config.js';
const util = require('../../../utils/util.js');
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    msgs: [],
    users: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.init();
    const _t = this;
    const questionId = options.questionId;
    const db = wx.cloud.database({
        env: config.env
    });
    db.collection("messages").where({
        questionId,
        receiverId: globalData.curUser.openid
    })
    .get()
    .then(resp => {
      const msgs = [];
      const message = resp.data[0];
      message.unread.reverse();
      message.unread.forEach(item => {
        const time = new Date(item.createdTime || Date.now());
        item.createdTime = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`;
        msgs.push(item);
      });
      message.read.reverse();
      message.read.forEach(item => {
          const time = new Date(item.createdTime || Date.now());
          item.createdTime = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`;
          msgs.push(item);
      });
      _t.setData({ msgs });
      _t.getSendersInfo(msgs);
      if(message.unread.length) {
        _t.setUnreadToRead(message._id);
      }
    })
  },

  getSendersInfo(msgs) {
    const openids = [], _t = this;
    msgs.forEach(item => {
      msgs.push(item.sender);
    });
    util.getRegisteredUsers(openids).then(users => {
      _t.setData({
          users
      });
    });
  },

  setUnreadToRead(id){//未读消息设置为已读
    wx.cloud.init();
    wx.cloud.callFunction({
        name: 'message',
        data: {
          actionType: 'read',
          id,
        }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  }
})