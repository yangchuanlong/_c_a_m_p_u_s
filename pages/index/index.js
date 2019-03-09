//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    questions: [],
    lastestQuestionTime: null,
    oldestQuestionTime: null,
    searchTxt: '',
    showLoading: false,
    tabIndex: 0,
    haveMoreData: true,
    myThumbups: {}
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  gotoDetail(evt) {
    const _t = this;
    const questionId = evt.currentTarget.dataset.id;
    const myThumbups = this.data.myThumbups;
    let action = '';
    if (evt.target.id === 'js-thumbup') {
      action = 'add';
    } else if(evt.target.id === 'js-thumbup-cancel') {
      action = 'cancel';
    }
    if(action) {
      const questions = _t.data.questions;
      questions.some(question => {
        if(question._id == questionId) {
          question.thumbupCount += (action == 'add' ? 1 : -1);
          return true;
        }
      });
      action == 'add' ? (myThumbups[questionId] = true) : (delete myThumbups[questionId]);
      this.setData({myThumbups, questions});
      wx.cloud.callFunction({
        name: 'thumbups',
        data: {
          action,
          questionOrReplyId: questionId,
          type: 'question'
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + questionId,
    })
  },
  gotoAsk() {
    console.log("gotoAsk")
    wx.navigateTo({
      url: '../ask/ask',
    })
  },
  gotoMine() {
    wx.navigateTo({
      url: '../mine/mine',
    })
  },
  gotoMsg() {
    wx.navigateTo({
      url: '../message/message',
    })
  },
  inputSearch(evt){
    this.setData({
      searchTxt: evt.detail.value
    });
  },
  startSearch(){
    let searchTxt = this.data.searchTxt;
    searchTxt = searchTxt.replace(/^\s|\s$/g, '');
    if(!searchTxt) {
      return;
    }
    wx.navigateTo({
        url: '../search/search?searchTxt=' + this.data.searchTxt
    })
  },
  onReady() {

  },
  getThumbupsOfQuestions(questionIds) {
    const _t = this;
    wx.cloud.callFunction({
      name: 'getThumbups',
      data: {
        ids: questionIds,
        type: 'question'
      },
      success: function ({result}) {
        if(!result) {
          return;
        }
        const questions = _t.data.questions;
        questions.forEach(question => {
          if(question._id in result) {
            question.thumbupCount = result[question._id];
          } else if(isNaN(question.thumbupCount)){
            question.thumbupCount = 0;
          }
        });
        _t.setData({
          questions
        });
      }
    })
  },
  getRepliesOfQuestions(questionIds){ //获取回复数
    const _t = this;
    wx.cloud.callFunction({
      name: 'getRepliesOfQuestions',
      data: {
        questionIds
      },
      success: function ({result}) { //result {[questionId]: Number, ...}
        if(!result) {
          return;
        }
        const questions = _t.data.questions;
        questions.forEach(question => {
          if(question._id in result) {
            question.replyCount = result[question._id];
          } else if(isNaN(question.replyCount)){
            question.replyCount = 0;
          }
        });
        _t.setData({
          questions
        });
      }
    });
  },
  getQuestions: function() {
      wx.cloud.init();
      const db = wx.cloud.database({
          env: "campus"
      });
      const _ = db.command, _t = this;
      const questionCollection = db.collection("questions");
      questionCollection.orderBy('createdTime', 'desc').limit(10).get().then(function(resp){
          const data = resp.data, ids = [];
          data.forEach(item => {
              const createdTime = item.createdTime || new Date().toISOString();
              const date = new Date(createdTime);
              item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
              item.shortContent = item.content.substr(0, 40);
              ids.push(item._id);
          });
          _t.setData({
              questions: data,
              lastestQuestionTime: data.length ? data[0].createdTime : new Date().toISOString(),
              oldestQuestionTime: data.length ? data[data.length - 1].createdTime : new Date(0, 0, 0).toISOString()
          });
          _t.getThumbupsOfQuestions(ids);
          _t.getRepliesOfQuestions(ids);
      })
  },
  getMyThumbups: function() {
    const _t = this;
    wx.cloud.callFunction({
      name: 'thumbups',
      data: {
        action: 'get',
        type: 'question'
      },
      success: function (resp) {
        const myThumbups = {};
        resp.result.data.forEach(item => {
          myThumbups[item.questionOrReplyId] = true;
        });
        _t.setData({
          myThumbups 
        });
        app.globalData.myQuestionThumbups = myThumbups;
      }
    })
  },
  onLoad: function () {
    this.getQuestions();
    this.getMyThumbups();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  onTabClick(evt){    
    const tabIndex = evt.target.dataset.tabIndex;
    this.setData({
      tabIndex
    });
  },
  onPullDownRefresh: function () {
    const _t = this;
    wx.cloud.init();
    const db = wx.cloud.database({
      env: "campus"
    });
    const _ = db.command;
    const questionCollection = db.collection("questions");
    questionCollection.where({
      createdTime: _.gt(_t.data.lastestQuestionTime instanceof Date ? _t.data.lastestQuestionTime.toISOString() : _t.data.lastestQuestionTime)
    }).orderBy('createdTime', 'desc').get().then(function(resp){
      const data = resp.data, ids = [];
      if (data.length) {
        data.forEach(item => {
          const createdTime = item.createdTime || new Date().toISOString();
          const date = new Date(createdTime);
          item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
          item.shortContent = item.content.substr(0, 40);
          ids.push(item._id);
        });
        _t.setData({
          questions: data.concat(_t.data.questions),
          lastestQuestionTime: data[0].createdTime,
        });
        _t.getThumbupsOfQuestions(ids);
        _t.getRepliesOfQuestions(ids);
      }
      wx.stopPullDownRefresh();
    })
  },
  onReachBottom(){
    const _t = this;
    if(!_t.data.haveMoreData) {
      return;
    }
    this.setData({
      showLoading: true
    });    
    wx.cloud.init();
    const db = wx.cloud.database({
      env: "campus"
    });
    const _ = db.command;
    const questionCollection = db.collection("questions");
    questionCollection.where({
      createdTime: _.lt(_t.data.oldestQuestionTime instanceof Date ? _t.data.oldestQuestionTime.toISOString() : _t.data.oldestQuestionTime)
    }).orderBy('createdTime', 'desc').limit(10).get().then(function (resp) {
      const data = resp.data, ids = [];
      if (data.length) {
        data.forEach(item => {
          const createdTime = item.createdTime || new Date().toISOString();
          const date = new Date(createdTime);
          item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
          item.shortContent = item.content.substr(0, 40);
          ids.push(item._id);
        });
        _t.setData({
          questions: _t.data.questions.concat(data),
          oldestQuestionTime: data[data.length - 1].createdTime,
        });
        _t.getThumbupsOfQuestions(ids);
        _t.getRepliesOfQuestions(ids);
      } else {
        _t.setData({
          haveMoreData: false
        })
      }  
      _t.setData({
        showLoading: false
      });     
      console.log(resp)
    })
  }
})
