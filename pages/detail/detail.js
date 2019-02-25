const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: {},
    inputedComment: '',
    sendBtnDisabled: true,
    sendBtnLoading: false,
    replies: []
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
      env: 'campus'
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

    
    const replyCollection = db.collection("replies");
    replyCollection.where({
      questionId: options.id
    }).get().then(res => {
      let replies = res.data.map(reply => {
        const date = new Date(reply.createdTime);
        return {
          content: reply.content,
          createdTime: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
          user: reply.user
        }
      });
      _t.setData({
        replies
      })
    })
  },

  onInput(evt) {
    const inputedComment = evt.detail.value;
    const trimmedComment = inputedComment.replace(/^\s+|\s+$/g, "");
    if (trimmedComment.length) {
      this.setData({
        trimmedComment,
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
    wx.cloud.callFunction({
        name: 'reply',
        data: {
          content: this.data.trimmedComment,
          questionId: this.data.questionId,
          user: {
            avatar: globalData.userInfo.avatarUrl,
            nickName: globalData.userInfo.nickName
          }
        }
    }).then(function () {
        _t.setData({
            inputedComment: "",
            sendBtnDisabled: true,
            sendBtnLoading: false
        })
    }, function (err) {
        _t.setData({
            sendBtnLoading: false
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
