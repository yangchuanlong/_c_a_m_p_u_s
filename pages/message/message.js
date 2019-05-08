

import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    db.collection("messages").where({
      receiverId: globalData.curUser.openid,
    })
    .orderBy("updatedTime", 'desc')
    .field({
      _id: false
    })
    .get()
    .then(resp => {
      const data = resp.data;
      if(data.length) {
        const questionIds = [], result = {};
        data.forEach(item => {
          questionIds.push(item.questionId);
          const time = new Date(item.updatedTime);
          result[item.questionId] = {
            unreadNum: item.unread.length,
            updatedTime: `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
          }
        });
        _t.getQuestionTitleAbstract(questionIds, result);
      }
    });
  },
  getQuestionTitleAbstract(questionIds, result) {
    const _t = this;
    const db = wx.cloud.database({
        env: config.env
    });
    const _ = db.command;
    db.collection("questions").where({
      _id: _.in(questionIds)
    })
    .field({
        title: true,
        abstract: true,
    })
    .get()
    .then(resp => {
      resp.data.forEach(question => {
        result[question._id].title = question.title;
        result[question._id].abstract = question.abstract;
      });
      const messages = Object.values(result);
      _t.setData({
          messages
      });
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
