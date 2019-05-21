
import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    curUser: globalData.curUser,
    gradeMap: {
      1: '大一',
      2: '大二',
      3: '大三',
      4: '大四'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const _t = this;
    if(!globalData.curUser.collegeName) {
      wx.cloud.init();
      wx.cloud.database({
        env: config.env
      })
      .collection("college")
      .where({
          collegeId: globalData.curUser.collegeId
      })
      .field({
        _id: false,
        collegeName: true
      })
      .get()
      .then(({data}) => {
        const collegeName = data[0].collegeName;
        globalData.curUser.collegeName = collegeName;
        _t.setData({
            curUser: globalData.curUser
        })
      })
    } else {
      this.setData({
          curUser: globalData.curUser
      })
    }
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