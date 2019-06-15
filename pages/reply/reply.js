
import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholder: "说点什么...",
    replyType: 'mainReply', //回复类型， 主回复和子回复
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
      data.openid = globalData.curUser.openid;
      data._openid = globalData.curUser.openid;
      data.createdTime = util.dateDiff(data.createdTime);
      globalData.reply = data;
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
    const questionId = options.questionId;
    this.data.questionId = questionId;
    if (options.replyType === "subReply") {
      this.setData({
        replyType: 'subReply'
      })
    }
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
