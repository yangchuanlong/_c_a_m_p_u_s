import config from '../../utils/config.js';
import utils from '../../utils/util.js';
const enums = require("../../utils/enum");
const app = getApp(), globalData = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    results: [],
    users: {},
    gradeEnum: enums.gradeEnum,
    colId2Col: {},
    thumbupCount: {},
    replyCount: {},
  },
  gotoDetail(evt) {
    const questionId = evt.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + questionId,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {    
    const _t = this;
    const columns = globalData.columns, colId2Col = {};
    columns.forEach((col, index) => {      
      colId2Col[col.en_name] = col;
    });
    _t.setData({
      colId2Col
    })
    wx.cloud.init();
    const db = wx.cloud.database({
        env: config.env
    });
    const _ = db.command;
    const dbCollection = db.collection("questions");
    dbCollection.where(
      _.or([
        {
          content: new RegExp(options.searchTxt, 'i')
        },
        {
            title: new RegExp(options.searchTxt, 'i')
        }
      ])
    ).
    orderBy('searchCount', 'desc').
    get().then(({data}) => {
      console.log(data)
      _t.setData({
        results: data
      });
      console.log(data)
      _t.addSearchCount(data);
      _t.getThumbupNum(data);
      _t.getReplyNum(data);
    });
  },

  getThumbupNum(data) {
    const _t = this, ids = data.map(item => item._id);
    utils.getThumbupNum(ids, 'question').then(result => {
      const thumbupCount = { ..._t.data.thumbupCount, ...result};
      _t.setData({ thumbupCount });
    })
  },

  getReplyNum(data) {
    const _t = this, ids = data.map(item => item._id);
    utils.getReplyNum(ids).then(result => {
      const replyCount = { ..._t.data.replyCount, ...result};
      _t.setData({ replyCount });
    });
  },

  addSearchCount(data) {
    const _t = this, ids = [], openidSet = new Set();
    wx.cloud.init();
    data.forEach(item => {
      ids.push(item._id);
      openidSet.add(item.openid)
    });
    wx.cloud.callFunction({
      name: 'addCount',
      data: {
        env: config.env,
        ids,
        countType: 'searchCount'
      },
      success(result) {
         console.log(result)
      },
      fail(error) {
        console.log(error)
      }
    });
    utils.getRegisteredUsers(Array.from(openidSet)).then(usersObj => {
      _t.setData({
        users: usersObj
      })
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
