const { globalData } = getApp();
Page({
  data: {
    title: "",
    types: [],
    content: "",
    loading: false,
    disabled: false
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
  }
});