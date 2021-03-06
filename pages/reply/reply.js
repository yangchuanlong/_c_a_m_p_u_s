
import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholder: "说点什么...",
    replyType: 'mainReply', //回复类型， 主回复
    trimedInput: '',
    sending: false
  },

  onInput(evt) {
      const {value} = evt.detail;
      const trimedValue = value.trim();
      this.setData({
        trimedInput: trimedValue
      });
  },

  onSend() {
    const _t = this;
    const { trimedInput} = this.data;
    if(!trimedInput.length) {
      wx.showToast({
        title: '请输入要回复的内容',
        icon: 'none'
      });
      return;
    }
    this.setData({
      sending: true
    });
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const data = {
      content: trimedInput,
      questionId: _t.data.questionId,
      createdTime: new Date().toISOString(),
      openid: globalData.curUser.openid
    };
    db.collection('replies').add({
      data
    }).then(resp => {
      console.log(resp)
      _t.setData({
        sending: false
      });
      data._id = resp._id;
      data.thumbupCount = 0;      
      data.createdTime = util.dateDiff(data.createdTime);
      globalData.reply = data;
      wx.cloud.callFunction({
        name: 'addCount',
        data: {
          env: config.env,
          ids: [data.questionId],
          countType: 'replyCount'
        },       
      });
      const msgData = {
        env: config.env,
        actionType: 'add',
        questionId: data.questionId,
        abstract: data.content.substr(0, 40),
        type: 2,   
        receiverId: _t.data.authorId     
      };     
      wx.cloud.callFunction({
        name: 'message',
        data: msgData
      })
      wx.navigateBack({
        delta: 1
      });
    }).catch(err => {
      _t.setData({
        sending: false
      });
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {    
    this.data.questionId = options.questionId;    
    this.data.authorId = options.authorId
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
