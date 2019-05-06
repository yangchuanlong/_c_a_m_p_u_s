import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: {},
    inputedComment: '',
    sendBtnDisabled: true,
    sendBtnLoading: false,
    replyMap: {},
    chosenReply: null,
    placeholder: "说点什么...",
    myThumbups: {},//对回复的点赞,
    scanCount: 0, //浏览量
    lastTime: new Date().toISOString(),
    mainReplies: [],
    users: globalData.users,
    chosenMainReplyId: "",
    chosenSubReplyId: "",
    repliedOpenId: "",
    expandedReply: null,//点击子回复后展示的回复列表
    thumbups: {}
  },

  scan(id){//把问题的浏览数加1
    const _t = this;
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'scan',
      data:{
        env:config.env,
        action: 'add',
        questionId: id,
      },
      success() {
        _t.getScanNum(id);
      }
    });
    wx.cloud.callFunction({
      name: 'addCount',
      data: {
        env: config.env,
        ids: [id],
        countType: 'readCount'
      },
      success(result) {
        console.log(result)
      },
      fail(error) {
        console.log(error)
      }
    })
  },
  getScanNum(questionId){//获取浏览数
    const _t = this;
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'getScan',
      data: {
        env:config.env,
        ids: [questionId]
      },
      success: function ({result}) {
        const scanCount = result[questionId];
        _t.setData({ scanCount });
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.id);
    this.data.questionId = options.id;
    const _t = this;
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const dbCollection = db.collection("questions");
    dbCollection.where({
      _id: options.id
    }).get().then(res => {
      const detail = res.data[0];
      const createdTime = detail.createdTime ? new Date(detail.createdTime) : new Date();
      detail.createdTime = `${createdTime.getFullYear()}.${createdTime.getMonth()+1}.${createdTime.getDate()}`;
      _t.setData({
        detail
      })
    });
    _t.data.lastTime = new Date().toISOString();
    _t.data.questionId = options.id;
    _t.scan(options.id);
    _t.getReplies(options.id);
  },
  getSubReplies(questionId, mainReplyIds) {
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command, _t = this;
    const replyCollection = db.collection("replies");
    const mainReplies = _t.data.mainReplies.slice();
    const replyMap = {..._t.data.replyMap};
    const openIdSet = new Set();
    Promise.all(
      mainReplyIds.map(mainReplyId => { //获取每条主评价的两个子评论
        return replyCollection.where({
          questionId,
          subordinateTo: mainReplyId
        })
        .limit(2)
        .get()
        .then(resp => {
          const data = resp.data;
          if(data.length) {
            mainReplies.some(mainReply => {
              if(mainReply._id === mainReplyId) {
                mainReply.subReplies = resp.data;
                return true;
              }
            });
            data.forEach(item => {
              replyMap[item._id] = item;
              openIdSet.add(item.openid);
              item.createdTime = util.timeFormattor(item.createdTime);
            });
          }
          console.log('get sub reply:', resp)
        })
      })
    ).then(() => {
      _t.setData({mainReplies, replyMap});
      util.getRegisteredUsers(Array.from(openIdSet)).then(usersObj => {
        _t.setData({ users: usersObj });
        console.log(usersObj)
      });
    });
  },
  getMainReplies(questionId) {
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command, _t = this;
    db.collection("replies").where({
      questionId,
      subordinateTo: null,
      createdTime: _.lt(_t.data.lastTime),
    })
    .orderBy("createdTime", "desc")
    .limit(10)
    .get()
    .then(resp => {
      const data = resp.data, ids = [], openIdSet = new Set(), replyMap = {..._t.data.replyMap};
      if(data.length){
        _t.data.lastTime = data[data.length - 1].createdTime;
        data.forEach(item => {
          ids.push(item._id);
          openIdSet.add(item.openid);
          replyMap[item._id] = item;
          item.createdTime = util.timeFormattor(item.createdTime);
        });
        const mainReplies = _t.data.mainReplies.concat(data);
        _t.setData({mainReplies, replyMap});
        _t.getSubReplies(questionId, ids);
        _t.getMyThumbupsForReplies(ids);
        util.getRegisteredUsers(Array.from(openIdSet)).then(usersObj => {
          _t.setData({ users: usersObj });
        });
      }
    })
  },
  onMainReplyClick(evt) {
    const mainReplyId = evt.currentTarget.dataset.replyId;
    const authorId = evt.currentTarget.dataset.author;
    if(evt.target.id == 'js-thumbup' || evt.target.id == 'js-thumbup-cancel') {
      return;
    }
    const { users } = this.data;
    this.setData({
      chosenMainReplyId: mainReplyId,
      placeholder: `回复${users[authorId].nickName}:`,
      repliedOpenId: authorId
    });
  },
  onExpandedMainReplyClick(evt) {
    this.onMainReplyClick(evt);
  },
  onSubReplyClick(evt) {
    const _t = this;
    const chosenSubReplyId = evt.currentTarget.dataset.replyId;
    const authorId = evt.currentTarget.dataset.author;
    const chosenMainReplyId = evt.currentTarget.dataset.mainReplyId;
    const { users, mainReplies } = this.data;
    this.setData({
      chosenMainReplyId,
      chosenSubReplyId,
      placeholder: `回复${users[authorId].nickName}:`,
      repliedOpenId: authorId
    });
    mainReplies.some(mainReply => {
      if(mainReply._id === chosenMainReplyId) {
        _t.setData({
          expandedReply: mainReply
        });
        _t.getAllSubRepliesOfExpanded(chosenMainReplyId);
        return true;
      }
    });
  },
  onExpandedSubReplyClick(evt) {
    const authorId = evt.currentTarget.dataset.author;
    const { users } = this.data;
    this.setData({
      placeholder: `回复${users[authorId].nickName}:`,
      repliedOpenId: authorId
    });
  },
  getAllSubRepliesOfExpanded(mainId) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection("replies")
      .where({
        questionId: _t.data.questionId,
        subordinateTo: mainId
      })
      .get()
      .then(resp => {
        const expandedReply = _t.data.expandedReply || {};
        const openIdSet = new Set();
        expandedReply.subReplies = resp.data.map(item => {
          openIdSet.add(item.openid);
          return {
            ...item,
            createdTime: util.timeFormattor(item.createdTime)
          }
        });
        _t.setData({
          expandedReply
        });
        util.getRegisteredUsers(Array.from(openIdSet)).then(usersObj => {
          _t.setData({ users: usersObj });
        });
      })
  },
  getReplies(questionId) {
    this.getMainReplies(questionId);
    //   _t.getMyThumbupsForReplies(ids);
    //   _t.getThumbupOfReplies(ids);
  },
  getMyThumbupsForReplies: function(ids) {//获取'我'对回复的点赞
    if(!ids.length) {
      return;
    }
    const _t = this;
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    db.collection("thumbups").where({
      questionOrReplyId: _.in(ids),
      openid: globalData.curUser.openid,
      type: 'reply'
    }).get().then(function (resp) {
      const myThumbups = {..._t.data.myThumbups};
      resp.data.forEach(item => {
        myThumbups[item.questionOrReplyId] = true;
      });
      _t.setData({
        myThumbups
      });
    })
  },
  getThumbupOfReplies(ids){
      const _t = this;
      wx.cloud.callFunction({
          name: 'getThumbups',
          data: {
              env:config.env,
              ids,
              type: 'reply'
          },
          success: function ({result}) {
              if(!result) {
                  return;
              }
              const replyMap = _t.data.replyMap;
              for(let _id in replyMap) {
                  if(_id in result) {
                      replyMap[_id].thumbupCount = result[_id];
                  } else if(isNaN(replyMap[_id].thumbupCount)){
                      replyMap[_id].thumbupCount = 0;
                  }
              }
              _t.setData({
                  replyMap
              });
          }
      })
  },
  thumbup: function(evt) {
    wx.cloud.init();
    const _t = this;
    const id = evt.currentTarget.dataset.id;
    const db = wx.cloud.database({
      env: config.env
    });
    const myThumbups = {..._t.data.myThumbups};
    db.collection("thumbups").add({
      data: {
        openid: globalData.curUser.openid,
        questionOrReplyId: id,
        type: 'reply'
      },
      success: function (resp) {
        console.log(resp)
      },
      fail(err) {
        console.log(err)
      }
    });
    myThumbups[id] = true;
    _t.setData({
      myThumbups
    });
  },
  cancelThumbup: function(evt) {
    const _t = this;
    const id = evt.currentTarget.dataset.id;
    const db = wx.cloud.database({
      env: config.env
    });
    const thumbupCollection = db.collection("thumbups");
    const myThumbups = {..._t.data.myThumbups};
    thumbupCollection.where({
      questionOrReplyId: id,
      openid: globalData.curUser.openid
    }).get().then(function (resp) {
      resp.data.forEach(item => {
        thumbupCollection.doc(item._id).remove();
      });
    })
    delete myThumbups[id];
    _t.setData({
      myThumbups
    });
  },
  onInput(evt) {
    const inputedReply = evt.detail.value;
    const trimmedReply = inputedReply.replace(/^\s+|\s+$/g, "");
    if (trimmedReply.length) {
      this.setData({
        trimmedReply,
        sendBtnDisabled: false
      })
    }
  },

  onSend() {
    console.log('send button is clicked:' ,this.data.questionId);
    const _t = this;
    wx.cloud.init();
    this.setData({
      sendBtnLoading: true
    });
    const { trimmedReply, questionId, chosenMainReplyId, repliedOpenId} = this.data;
    const data = {
      env:config.env,
      content: trimmedReply,
      questionId: questionId,
      subordinateTo: chosenMainReplyId || undefined,
      repliedOpenId: repliedOpenId || undefined,
      createdTime: new Date().toISOString()
    };
    wx.cloud.callFunction({
      name: 'reply',
      data
    }).then(function (resp) {
        const {_id, openid } = resp.result;
        _t.setData({
          inputedComment: "",
          sendBtnDisabled: true,
          sendBtnLoading: false
        });
        data._id = _id; //添加到评论区
        data.thumbupCount = 0;
        data.questionId = questionId;
        data.createdTime = util.timeFormattor(data.createdTime);
        data.openid = openid;
        const {chosenMainReplyId} = _t.data;
        const mainReplies = _t.data.mainReplies.slice();
        if(!chosenMainReplyId) {//主回复
          mainReplies.unshift(data);
          _t.setData({ mainReplies });
        } else { //子回复
          mainReplies.some(reply => {
            if(reply._id === chosenMainReplyId) {
              const subReplies = reply.subReplies || [];
              subReplies.push(data);
              reply.subReplies = subReplies.slice(-2);
              return;
            }
          });
          _t.setData({
            mainReplies
          });
        }
        let expandedReply = _t.data.expandedReply;
        if(expandedReply) {
          expandedReply = {...expandedReply};
          const subReplies = expandedReply.subReplies || [];
          subReplies.push(data);
          expandedReply.subReplies = subReplies.slice();
          _t.setData({
            expandedReply
          });
        }
    }, function (err) {
        _t.setData({
            sendBtnLoading: false
        })
    })
  },

  onCloseDlg() {
    this.setData({
      chosenMainReplyId: '',
      expandedReply: null,
      repliedOpenId: '',
      placeholder: '说点什么...'
    })
  },
  getMoreReplies() {

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
    this.getMoreReplies();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
