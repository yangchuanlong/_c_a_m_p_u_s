
Page({
    data: {
        myQuestions: []
    },
    onLoad() {
      const _t = this;
      wx.cloud.init();
      wx.cloud.callFunction({
        name: 'myQuestions',
        success: function(resp) {
          _t.setData({
              myQuestions: resp.result.data
          })
        }
      })
    }
});