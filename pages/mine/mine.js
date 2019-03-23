import config from '../../utils/config.js';
Page({
    data: {
        myQuestions: [],
        tabIndex: 0
    },
    onTabClick(evt) {
      const tabIndex = evt.target.dataset.tabIndex;
      this.setData({
        tabIndex
      });
    },
    onLoad() {
      const _t = this;
      wx.cloud.init();
      wx.cloud.callFunction({
        name: 'myQuestions',
        data: {
          env:config.env
        },
        success: function(resp) {
          _t.setData({
              myQuestions: resp.result.data
          })
        }
      });

      wx.cloud.callFunction({
        name: 'myReplies',
        data: {
          env: config.env
        },
        success: function(resp) {
          _t.setData({
            myReplies: resp.result.data
          })
        }
      })
    }
});