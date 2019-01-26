
Page({
  chooseImg: function() {
    wx.chooseImage({
      success: function(res) {        
        wx.cloud.uploadFile({
          cloudPath: 'my-photo.png',
          filePath: res.tempFilePaths[0],
          success: res => {
            console.log("上传成功", res)
          }
        })
      },
    })
  },
  onLoad() {
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'add',
      data: {
        a: 1,
        b: 2
      },
      success(res) {
        console.log(res.result)
      },
      fail(e) {
        console.log(e)
      }
    })
  }
})