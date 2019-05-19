

import config from '../../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages: [],
    hasMoreMsg: true,
    showLoading: false,
    latestTime: new Date().toISOString(),
    oldestTime: new Date().toISOString(),
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.init();
    this.getMsgs();
  },
  getMsgs() {
      const _t = this;
      const db = wx.cloud.database({
          env: config.env
      });
      const _ = db.command;
      db.collection("messages").where({
          receiverId: globalData.curUser.openid
      })
      .orderBy("updatedTime", 'desc')
      .get()
      .then(resp => {
          const data = resp.data;
          if(data.length) {
              _t.data.latestTime = data[0].updatedTime;
              _t.data.oldestTime = data[data.length - 1].updatedTime;
              const questionIds = [], result = {};
              data.forEach(item => {
                  const time = new Date(item.updatedTime);
                  questionIds.push(item.questionId);
                  result[item.questionId] = {
                      questionId: item.questionId,
                      unreadNum: item.unread.length,
                      updatedTime: `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
                  }
              });
              _t.getQuestionTitleAbstract(questionIds, result);
          }
      }).catch(e => {
      });
  },
  getMoreMsgs() {
    if(!this.data.hasMoreMsg){
      return;
    }
    if(this.data.showLoading){
      return;
    }
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    _t.setData({showLoading: true});
    db.collection("messages").where({
      receiverId: globalData.curUser.openid,
      updatedTime: _.lt(_t.data.oldestTime)
    })
      .limit(10)
      .orderBy("updatedTime", 'desc')
      .get()
      .then(resp => {
        const data = resp.data;
        if(data.length) {
          _t.data.oldestTime = data[data.length - 1].updatedTime;
          const questionIds = [], result = {};
          data.forEach(item => {
            questionIds.push(item.questionId);
            const time = new Date(item.updatedTime);
            result[item.questionId] = {
              questionId: item.questionId,
              unreadNum: item.unread.length,
              updatedTime: `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
            }
          });
          _t.getQuestionTitleAbstract(questionIds, result);
        } else {
          _t.data.hasMoreMsg = false;
        }
        _t.setData({showLoading: false});
      }).catch(e => {
        _t.setData({showLoading: false});
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
          messages: _t.data.messages.concat(messages)
      });
    })
  },

  gotoMsgDetail(evt) {
    const questionId = evt.currentTarget.dataset.questionId;
    const messages = this.data.messages.slice();
    messages.some(msg => {
      if(msg.questionId === questionId){
        globalData.readMsgNum += msg.unreadNum;
        msg.unreadNum = 0;
        return true;
      }
    });
    this.setData({
        messages
    });
    wx.navigateTo({
        url: '/pages/message/MsgDetail/MsgDetail?questionId=' + questionId
    })
  },

  getLatestMsgs() {
      const _t = this;
      if(_t.data.getLatestLoading){
        return;
      }
      _t.data.getLatestLoading = true;
      const db = wx.cloud.database({
          env: config.env
      });
      const _ = db.command;
      db.collection("messages").where({
          receiverId: globalData.curUser.openid,
          updatedTime: _.gt(_t.data.latestTime)
      })
      .orderBy("updatedTime", 'desc')
      .get()
      .then(resp => {
          _t.data.getLatestLoading = false;
          const data = resp.data;
          if(data.length) {
              _t.data.oldestTime = data[data.length - 1].updatedTime;
              const questionIds = [], result = {};
              data.forEach(item => {
                  questionIds.push(item.questionId);
                  const time = new Date(item.updatedTime);
                  result[item.questionId] = {
                      questionId: item.questionId,
                      unreadNum: item.unread.length,
                      updatedTime: `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
                  }
              });
              _t.data.messages = _t.data.messages.filter(msg => questionIds.indexOf(msg.questionId) !== -1);//已经获取到的msg,可能又被回复， updatedTime被更新， 下拉刷新又被获取到
              _t.getQuestionTitleAbstract(questionIds, result);
          }
          _t.setData({showLoading: false});
      }).catch(e => {
          _t.data.getLatestLoading = false;
      });
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
    this.getLatestMsgs();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.getMoreMsgs();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
