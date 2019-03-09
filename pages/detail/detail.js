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
    mainReplies: [],
    replyMap: {},
    chosenReply: null,
    placeholder: "说点什么...",
    myThumbups: {},//对回复的点赞
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
      const replyMap = {}, mainReplies = [], subReplies = [], ids = [];
      res.data.forEach(reply => {
        const date = new Date(reply.createdTime);     
        const item = {
          content: reply.content,
          createdTime: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
          user: reply.user,
          _id: reply._id,
          subordinateTo: reply.subordinateTo
        };
        replyMap[reply._id] = item;
        if (!item.subordinateTo) {
          item.subordinates = [];//子评论
          mainReplies.push(item)
        } else {
          subReplies.push(item);
        }
        ids.push(reply._id);
      });
      subReplies.forEach(subReply => {
        replyMap[subReply.subordinateTo].subordinates.push(subReply);
      });
      _t.setData({
        mainReplies,
        replyMap
      });
      _t.getMyThumbupsForReplies(ids);
    });
  },
  getMyThumbupsForReplies: function(ids) {//获取'我'对回复的点赞
    wx.cloud.callFunction({
      name: 'thumbups',
      data: {
        ids,
        type: 'reply'
      },
      success: function (res) {
        console.log(res)
      }
    });
  },
  thumbup: function() {
    wx.cloud.callFunction({
      name: 'thumbups',
      data: {

      }
    })
  },
  cancelThumbup: function() {

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
   
    const data = {
      content: this.data.trimmedReply,
      questionId: this.data.questionId,
      subordinateTo: this.data.chosenReply && this.data.chosenReply._id,
      user: {
        avatar: globalData.userInfo.avatarUrl,
        nickName: globalData.userInfo.nickName
      }
    };
    wx.cloud.callFunction({
      name: 'reply',
      data
    }).then(function (resp) {
        const _id = resp.result;
        _t.setData({
          inputedComment: "",
          sendBtnDisabled: true,
          sendBtnLoading: false
        });
        data._id = _id; //添加到评论区
        _t.data.replyMap[_id] = data;
        if(!_t.data.chosenReply) {//主回复
          data.subordinates = [];
          const mainReplies = _t.data.mainReplies;          
          mainReplies.push(data);
          _t.setData({
            mainReplies,
          })
        } else { //子回复
          data.subordinateTo = _t.data.chosenReply._id;          
          _t.data.chosenReply.subordinates.push(data);
          _t.data.replyMap[data.subordinateTo].subordinates.push(data);
          _t.setData({
            chosenReply: _t.data.chosenReply,
            replyMap: _t.data.replyMap
          })
        }
    }, function (err) {
        _t.setData({
            sendBtnLoading: false
        })
    })
  },

  onCloseDlg() {
    this.setData({
      chosenReply: null,
      placeholder: '说点什么...'
    })
  },
  onMainReplyClick(evt) {
    const mainReplyId = evt.currentTarget.dataset.replyId;
    const mainReply = this.data.replyMap[mainReplyId];
    this.setData({
      chosenReply: mainReply,
      placeholder: `回复${mainReply.user.nickName}:`
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
