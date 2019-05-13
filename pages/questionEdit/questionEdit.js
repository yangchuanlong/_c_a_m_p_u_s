import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({
  data: {
    userInfo: {},
    title: "",
    columns: [],
    content: "",
    loading: false,
    disabled: false,
    hasUserInfo: false,
    anonymous: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    tempFilePaths: []
  },
  onInput(evt) {
    this.setData({
      content: evt.detail.value.replace(/^\s|\s$/g, "")
    });
  },
  submit() {
    const _t = this, data = this.data;
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
    const uploadImgArr= _t.data.tempFilePaths.map(tmpFilePath => {
      const fileParts = tmpFilePath.split('.'); //图片扩展名
      const fileName = Date.now() + '-' + (Math.random() * 10000 | 0) + fileParts[fileParts.length - 1];
      return  wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: tmpFilePath,
      })
    });
    Promise.all(uploadImgArr).then(result => {
      const images = [];
      result.forEach(item => images.push(item.fileID));
      wx.cloud.callFunction({
        name: 'askQuestion',
        data: {
          env: config.env,
          title: data.title,
          content: data.content,
          columns: data.columns,
          anonymous: data.anonymous,
          images
        },
        success(res) {
          wx.redirectTo({
            url: '/pages/index/index',
          })
        },
        fail(e) {
          wx.showToast({title: '服务器开小差', icon: "none"});
          _t.setData({loading: false, disabled: false});
        }
      })
    }).catch(error => {
      wx.showToast({title: '服务器开小差', icon: "none"});
      _t.setData({loading: false, disabled: false});
    });
  },
  onToggle(evt) {
    this.setData({
      anonymous: !!evt.detail.value.length
    });
  },
  onChooseImg() {
    const _t = this;
    if(_t.data.loading){
      return;
    }
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = _t.data.tempFilePaths.concat(res.tempFilePaths);
        _t.setData({
          tempFilePaths
        });
      }
    })
  },
  deleteChosenImg(evt) {
    if(this.data.loading){
      return;
    }
    const index = evt.target.dataset.index;
    const tempFilePaths =  this.data.tempFilePaths;
    tempFilePaths.splice(index, 1);
    this.setData({
      tempFilePaths
    });
  },
  onShow() {

  },
  onLoad(query) {
    this.setData({
      title: query.title,
      columns: query.columns.split(",")
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
