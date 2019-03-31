import config from '../../utils/config.js';
Page({
    data: {
        myQuestions: [],
        activeTab: 0,
        touchStartX: 0,
        touchStartY: 0,
        tabs: ["我的问题", "我的回答", "我的收藏"]
    },
    onTabClick(evt) {
      const activeTab = evt.target.dataset.activeTab;
      this.setData({
          activeTab
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
    },
    onTouchStart(evt) {
        const touch = evt.touches[0];
        this.setData({
            touchStartX: touch.clientX,
            touchStartY: touch.clientY
        });
    },
    onTouchEnd (evt){
        const {touchStartX, touchStartY, activeTab, tabs} = this.data;
        const touch = evt.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        if(deltaX > 2 * deltaY) {
            if(touch.clientX > touchStartX) {
                this.setData({
                    activeTab: activeTab == 0 ? tabs.length - 1 : activeTab - 1
                })
            } else {
                console.log("左滑")
                this.setData({
                    activeTab: (activeTab + 1) % tabs.length
                })
            }
        }
    }
});