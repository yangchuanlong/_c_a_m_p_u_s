//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    questions: []
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
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
  onReady() {
    wx.cloud.init();
    const db = wx.cloud.database({
      env: 'campus'
    });
    db.collection("questions").get({
      success(res){
        console.log(res)
      }
    })
  },
  getQuestions: function() {
    const _t = this;
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'questions'
    }).then(resp => {
      const data = resp.result.data;
      data.forEach(item => {
          const createdTime = item.createdTime || new Date().toISOString();
          const date = new Date(createdTime);
          item.formatedTime = `${date.getFullYear()}.${date.getMonth()}.${date.getDate()}`;
          item.shortContent = item.content.substr(0, 40)
      });
      _t.setData({
        questions: data
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
  }
})
