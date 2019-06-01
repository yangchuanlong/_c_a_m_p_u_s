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
    myThumbups: {},
  },
  gotoDetail(evt) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const questionId = evt.currentTarget.dataset.id, authorId = evt.currentTarget.dataset.authorId;
    const myThumbups = this.data.myThumbups;
    let action = '';
    if (evt.target.id === 'js-thumbup') {
      action = 'add';
    } else if (evt.target.id === 'js-thumbup-cancel') {
      action = 'cancel';
    } else if (evt.target.id === 'js-delete') {
      action = 'delete'
    }
    if (action) {
      if (action === 'delete') {
        this.delQuestion(questionId, evt.target.dataset.questionTitle);
        return;
      }
      const thumbupCollection = db.collection("thumbups");
      const myThumbups = { ...this.data.myThumbups };
      const thumbupCount = { ...this.data.thumbupCount };
      if (action === 'add') {
        myThumbups[questionId] = true;
        thumbupCount[questionId] = (thumbupCount[questionId] || 0) + 1;
        thumbupCollection.add({
          data: {
            openid: globalData.curUser.openid,
            questionOrReplyId: questionId,
            type: 'question'
          },
          success: function (resp) {
            _t.putMessage({ questionId, authorId });
            wx.cloud.callFunction({
              name: 'addCount',
              data: {
                env: config.env,
                ids: [questionId],
                countType: 'thumbupCount'
              },
              // success(result) {
              //     console.log(result)
              // },
              // fail(error) {
              //     console.log(error)
              // }
            });
          },
          fail(err) {
            console.log(err)
          }
        });
      } else {
        delete myThumbups[questionId];
        if (!isNaN(thumbupCount[questionId]) && (thumbupCount[questionId] >= 1)) {
          thumbupCount[questionId] -= 1;
        } else {
          thumbupCount[questionId] = 0;
        }
        thumbupCollection.where({
          questionOrReplyId: questionId,
          openid: globalData.curUser.openid
        }).get().then(function (resp) {
          resp.data.forEach(item => {
            thumbupCollection.doc(item._id).remove();
          });
        })
      }
      this.setData({
        thumbupCount,
        myThumbups
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${questionId}&authorId=${authorId}`,
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
      .and({
        collegeId: globalData.curUser.collegeId
      })
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
      _t.getMyThumbups(data);
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

  getMyThumbups: function (data) {
    let _t = this, ids = data.map(item => item._id);
    if (!ids.length) {
      return;
    }
    ids = ids.filter(id => !this.data.myThumbups[id]);
    if (!ids.length) {
      return;
    }
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    db.collection("thumbups").where({
      questionOrReplyId: _.in(ids),
      openid: globalData.curUser.openid,
      type: 'question'
    }).get().then(function (resp) {
      const myThumbups = { ..._t.data.myThumbups };
      resp.data.forEach(item => {
        myThumbups[item.questionOrReplyId] = true;
      });
      _t.setData({
        myThumbups
      });
    })
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
