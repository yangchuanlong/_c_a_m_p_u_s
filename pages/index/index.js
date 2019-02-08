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
    showLoading: false
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  gotoDetail(evt) {
    const questionId = evt.currentTarget.dataset.id;
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
  getQuestions: function() {
      wx.cloud.init();
      const db = wx.cloud.database({
          env: "campus"
      });
      const _ = db.command, _t = this;
      const questionCollection = db.collection("questions");
    questionCollection.orderBy('createdTime', 'desc').limit(10).get().then(function(resp){
          const data = resp.data;
          data.forEach(item => {
              const createdTime = item.createdTime || new Date().toISOString();
              const date = new Date(createdTime);
              item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
              item.shortContent = item.content.substr(0, 40)
          });
          _t.setData({
              questions: data,
              lastestQuestionTime: data.length ? data[0].createdTime : new Date().toISOString(),
              oldestQuestionTime: data.length ? data[data.length - 1].createdTime : new Date(0, 0, 0).toISOString()
          });
      })
  },
  onLoad: function () {
    this.getQuestions();
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
      const data = resp.data;
      if (data.length) {
        data.forEach(item => {
          const createdTime = item.createdTime || new Date().toISOString();
          const date = new Date(createdTime);
          item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
          item.shortContent = item.content.substr(0, 40)
        });
        _t.setData({
          questions: data.concat(_t.data.questions),
          lastestQuestionTime: data[0].createdTime,
        });
      }
      wx.stopPullDownRefresh();
    })
  },
  onReachBottom(){
    const _t = this;
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
      const data = resp.data;
      if (data.length) {
        data.forEach(item => {
          const createdTime = item.createdTime || new Date().toISOString();
          const date = new Date(createdTime);
          item.formatedTime = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
          item.shortContent = item.content.substr(0, 40)
        });
        _t.setData({
          questions: _t.data.questions.concat(data),
          oldestQuestionTime: data[data.length - 1].createdTime,
        });
      }   
      _t.setData({
        showLoading: false
      });     
      console.log(resp)
    })
  }
})
