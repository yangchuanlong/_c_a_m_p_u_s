
import config from '../../utils/config.js';
const util = require('../../utils/util.js');
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    author: {},
    subReplies: [],
    users: {},
    subReplyTotal: 0,
    comment: '',
    trimmedComment: '',
    placeholder: '',
    chosenReply: null,
    mainReply: {},
    autofocus: false,
    sending: false,
    myThumbups: {},
    thumbupCountMap: {}
  },

  onSend() {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const replyCollection = db.collection("replies");
    const data = {
      content: _t.data.trimmedComment,
      questionId: _t.data.mainReply.questionId,
      createdTime: new Date().toISOString(),  
      repliedOpenId: _t.data.chosenReply ? _t.data.chosenReply.openid : _t.data.mainReply.openid,
      subordinateTo: _t.data.mainReply._id
    };
    this.setData({
      sending: true
    })
    replyCollection.add({
      data
    }).then(function (resp) {
      data._id = resp._id;
      data.thumbupCount = 0;
      data.openid = globalData.curUser.openid;
      data._openid = globalData.curUser.openid;
      data.createdTime = util.dateDiff(data.createdTime);
      _t.setData({
        sending: false,
        comment: '',
        trimmedComment: ''
      });
      globalData.reply = globalData.reply || [];
      globalData.reply.push(data);
      return data;
    }).then(function(reply) {
      const subReplies = _t.data.subReplies.slice();
      subReplies.push(reply);
      _t.setData({ subReplies });
    }).catch(err => {
      _t.setData({
        sending: false
      });
    });
  },

  getTotalOfSubReplies(mainReply) {
    wx.cloud.init();
    const _t = this;
    const { questionId, _id } = mainReply;
    const db = wx.cloud.database({
      env: config.env
    });
    const replyCollection = db.collection("replies");
    replyCollection.where({
      questionId,
      subordinateTo: _id
    }).count().then(resp => {
        console.log('total resp: ', resp)
        _t.setData({
          subReplyTotal: resp.total
        })
    });
  },

  getSubReplies(mainReply) {
    wx.cloud.init();
    const _t = this;
    const {questionId, _id} = mainReply;
    console.log(questionId, _id);
    const db = wx.cloud.database({
      env: config.env
    });
    const replyCollection = db.collection("replies");
    replyCollection.where({
      questionId,
      subordinateTo: _id
    }).get().then(resp => {
      const openidSet = new Set(), replyIds = [];
      const subReplies = resp.data.map(reply => {
        reply.createdTime = util.dateDiff(reply.createdTime);
        openidSet.add(reply._openid || reply.openid);
        openidSet.add(reply.repliedOpenId);
        replyIds.push(reply._id);
        return reply;
      })
      _t.setData({
        subReplies
      });
      util.getRegisteredUsers(Array.from(openidSet)).then(usersObj => {
        _t.setData({
          users: usersObj
        })
      });
      _t.getMyThumbupOfReplies(replyIds);
      _t.getThumbupCountOfReplies(replyIds);
    });
  },

  getThumbupCountOfReplies(replyIds) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const thumbupCollection = db.collection("thumbups");
    replyIds.forEach(replyId => {
      thumbupCollection.where({
        type: 'reply',
        questionOrReplyId: replyId,
      }).count().then(resp => {
        const thumbupCountMap = _t.data.thumbupCountMap;
        thumbupCountMap[replyId] = (thumbupCountMap[replyId] || 0) + resp.total;
        _t.setData({ thumbupCountMap });
      })
    })
  },

  getMyThumbupOfReplies(replyIds) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    const thumbupCollection = db.collection("thumbups");
    thumbupCollection.where({
      questionOrReplyId: _.in(replyIds),
      openid: globalData.curUser.openid
    }).get().then(resp => {
      const myThumbups = {..._t.data.myThumbups};
      resp.data.forEach(item => {
        myThumbups[item.questionOrReplyId] = true;
      });
      _t.setData({ myThumbups });
    });
  },

  onInput(evt) {
    const value = evt.detail.value;
    const comment = value.replace(/^\s|\s$/g, '');
    this.setData({
      comment: value,
      trimmedComment: comment
    });
  },

  onFocus() {
    if(!this.data.chosenReply) {
      const mainReplyOpenId = this.data.mainReply.openid;
      const placeholder = '回复:' + this.data.users[mainReplyOpenId].nickName;
      this.setData({placeholder});
    }
  },

  onBlur() {
    this.setData({
      placeholder: '',      
    })
  },

  onChooseReply(evt) {
    if (evt.target.id === 'thumbupBtn') {
      return;
    }
    const openid = evt.currentTarget.dataset.openid;
    const id = evt.currentTarget.dataset.replyId;
    this.setData({
      chosenReply: {openid, id}
    });
    const placeholder = '回复:' + this.data.users[openid].nickName;   
    this.setData({
      placeholder,
      autofocus: true
    }); 
  },
  onContainerClick() {
    console.log('onContainerClick is invoked');
    this.setData({
      chosenReply: null
    });
  },

  onThumbup(evt) {
    console.log(evt.currentTarget.dataset);
    const _t = this;
    const { actionType, id, openid} = evt.currentTarget.dataset;
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const thumbupCollection = db.collection('thumbups');
    if ('add' === actionType) {
      thumbupCollection.add({
        data: {
          type: 'reply',
          questionOrReplyId: id,
          openid: globalData.curUser.openid,
          createdTime: new Date().toISOString()
        }
      }).then(resp => {
        const myThumbups = { ..._t.data.myThumbups };
        const thumbupCountMap = _t.data.thumbupCountMap;
        myThumbups[id] = true;       
        if (isNaN(thumbupCountMap[id])) {
          thumbupCountMap[id] = 1;
        } else {
          thumbupCountMap[id] += 1;
        }
        _t.setData({ myThumbups, thumbupCountMap });
      });
    } else {
      thumbupCollection.where({
        type: 'reply',
        questionOrReplyId: id,
        openid: globalData.curUser.openid
      }).field({_id: true}).get().then(resp => {
        Promise.all(
          resp.data.map(item => thumbupCollection.doc(item._id).remove())
        ).then(() => {
          const myThumbups = {..._t.data.myThumbups};
          const thumbupCountMap = {..._t.data.thumbupCountMap};
          delete myThumbups[id];
          if (thumbupCountMap[id] >= 1) {
            thumbupCountMap[id] -= 1;
          }
          _t.setData({ myThumbups, thumbupCountMap });
        });
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    try{
      const mainReply = JSON.parse(options.mainReply);
      mainReply.openid = mainReply.openid || mainReply._openid;
      const author = globalData.users[mainReply.openid];
      mainReply.content = decodeURIComponent(mainReply.content);      
      this.setData({
        mainReply,
        author
      });
      if(mainReply) {
        this.getSubReplies(mainReply);
        this.getTotalOfSubReplies(mainReply);
      }
    }catch(e) {
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
