const app = getApp(), globalData = app.globalData;
Page({
  data: {
    userInfo: {},
    title: "",
    types: [],
    content: "",
    loading: false,
    disabled: false,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
  },
  onAddTxt(){
    globalData.inputedTxt = null;
    wx.navigateTo({
      url: '/pages/editor/editor',
    })
  },
  onInput(evt) {
    this.setData({
      content: evt.detail.value.replace(/^\s|\s$/g, "")
    });
  },
  submit() {
    const _t = this;
    if(!this.data.content) {
      wx.showToast({
        title: '请输入问题内容',
        duration: 500,
        icon: 'none'
      });
      return;
    }
    _t.setData({
      loading: true,
      disabled: true
    });
   
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'askQuestion',
      data: {
        ...this.data,
        avatar: globalData.userInfo.avatarUrl,
        nickName: globalData.userInfo.nickName
      },
      success(res) {
        wx.redirectTo({
         url: '/pages/mine/mine',
       })
      },
      fail(e) {
        wx.showToast({
          title: '服务器开小差',
          icon: "none"
        });
        _t.setData({
          loading: false,
          disabled: false
        })
      }
    })
  },
  onShow() {
    
  },
  onLoad(query) {
    this.setData({
      title: query.title,
      types: query.types.split(",")
    });
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
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
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
});