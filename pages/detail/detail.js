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
    thumbups: {},
    mainReplyCount: 0,
    thumbedUpByMe: false
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
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection('scan').where({
      questionId
    }).count().then(function(res) {
      if(res && res.total) {
        _t.setData({
          scanCount: res.total
        })
      }
    });
  },
  onThumbup(){
    console.log('thumbup', this.data.thumbedUpByMe)
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    const collection = db.collection('thumbups'); 
    if(_t.data.loading){
      return;
    }   
    _t.data.loading = true;
    if(!this.data.thumbedUpByMe) {
      const data = {
        questionOrReplyId: _t.data.questionId,
        openid: globalData.curUser.openid,
        type: 'question'
      }
      collection.add({
        data: data
      }).then(() => {
          _t.setData({
            thumbedUpByMe: true
          });
          globalData.thumbupedQid = _t.data.questionId;
          delete globalData.cancelThumbupQid;
          _t.data.loading = false;
      }).catch(err => {
        _t.data.loading = false;
        console.log('thumbup quesiton error: ', err)
      })
    } else {
      collection.where({
        openid: globalData.curUser.openid,
        questionOrReplyId: _t.data.questionId,
        type: 'question'
      }).field({_id: true}).get().then(resp => {
        return Promise.all(
          resp.data.map(item => collection.doc(item._id).remove())
        ).then(function(){
          _t.setData({
            thumbedUpByMe: false
          });
          globalData.cancelThumbupQid = _t.data.questionId;
          delete globalData.thumbupedQid;
          _t.data.loading = false;
        });
      }).catch(err => {
        _t.data.loading = false;
        console.log('cancel thumbup error: ', err);
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.id);
    this.data.questionId = options.id;
    this.data.authorId = options.authorId;
    this.setData({
      thumbedUpByMe: options.thumbedUpByMe == 1
    });
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
      detail.createdTime = util.dateDiff(detail.createdTime);
      _t.setData({
        detail,
        authorId: detail.openid,
        users: globalData.users
      });
    });
    _t.data.lastTime = new Date().toISOString();
    _t.scan(options.id);
    _t.getReplies(options.id);
    _t.getMainReplyCount(options.id);
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
    const ids = [];
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
              ids.push(item._id);
              openIdSet.add(item.openid);
              item.createdTime = util.dateDiff(item.createdTime);
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
      _t.getMyThumbupsForReplies(ids);
    });
  },
  getMainReplyCount(questionId) {
    const _t = this;
    wx.cloud.init();
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection('replies').where({
      questionId,
      subordinateTo: null,
    }).count().then(resp => {
      if(resp && resp.total) {
        _t.setData({
          mainReplyCount: resp.total
        })
      }
    })
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
          item.createdTime = util.dateDiff(item.createdTime);
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
      repliedOpenId: authorId
    });
    let clickedMainReply = null;
    this.data.mainReplies.some(function(reply){
      if(reply._id === mainReplyId) {
        clickedMainReply = reply;
        return true;
      }
    });
    const mainReply = JSON.stringify({ ...clickedMainReply, content: encodeURIComponent(clickedMainReply.content)});    
    wx.navigateTo({
      url: `/pages/subReplyList/subReplyList?mainReply=${mainReply}`,
    });
  },
  
  getReplies(questionId) {
    this.getMainReplies(questionId);
  },
  getMyThumbupsForReplies: function(ids) {//获取'我'对回复的点赞
    if(!ids.length) {
      return;
    }
    ids = ids.filter(id => !this.data.myThumbups[id]);
    if(!ids.length){
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

  thumbup: function(evt) {
    wx.cloud.init();
    const _t = this;
    const id = evt.currentTarget.dataset.id;
    const replyAuthor = evt.currentTarget.dataset.replyAuthor;
    console.log(replyAuthor);
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
        wx.cloud.callFunction({
          name: 'message',
          data: {
              env: config.env,
              actionType: 'add',
              type: 3, //3: 点赞回复
              receiverId: replyAuthor,
              questionId: _t.data.questionId
          }
        });        
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

  gotoReply() {
    const questionId = this.data.questionId;
    const authorId = this.data.authorId;
    wx.navigateTo({
      url: `/pages/reply/reply?questionId=${questionId}&authorId=${authorId}`,
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
    const _t = this;
    let reply = globalData.reply; //从回复页面跳转回来, 或者子回复列表页面跳转
    if (reply) {
      reply = Array.isArray(reply) ? reply : [reply];
      const mainReplies = _t.data.mainReplies.slice();
      reply.forEach(function(item) {
        if (!item.subordinateTo) {//主回复          
          mainReplies.unshift(item);          
        } else {//子回复
          let chosenMainReply = null;
          mainReplies.some(reply => {
            if(reply._id === _t.data.chosenMainReplyId) {
              chosenMainReply = reply;
              return true;
            }
          });
          if (chosenMainReply) {
            chosenMainReply.subReplies = (chosenMainReply.subReplies || []).concat(item);
            chosenMainReply.subReplies = chosenMainReply.subReplies.slice(0, 2);
          }
        }
      });
      _t.setData({ mainReplies });     
      delete globalData.reply;
    }
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
