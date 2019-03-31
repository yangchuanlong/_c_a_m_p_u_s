import config from '../../utils/config.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    results: []
  },
  gotoDetail(evt) {
    const questionId = evt.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + questionId,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('search onload: ', options.searchTxt);
      const _t = this;
      wx.cloud.init();
      const db = wx.cloud.database({
          env: config.env
      });
      const _ = db.command;
      const dbCollection = db.collection("questions");
      dbCollection.where(
        _.or([
          {
            content: new RegExp(options.searchTxt, 'i')
          },
          {
              title: new RegExp(options.searchTxt, 'i')
          }
        ])
      ).
      orderBy('searchCount', 'desc').
      get().then(({data}) => {
        console.log(data)
        _t.setData({
          results: data
        });
        _t.addSearchCount(data);
      });
  },

  addSearchCount(data) {
    wx.cloud.init();
    const _t = this;   
    const addOneIds = [], setOneIds = [];
    data.forEach(item => {
      if(/\d+/.test(item.searchCount)) {
        addOneIds.push(item._id);
      } else {
        setOneIds.push(item._id);
      }
    });   
    wx.cloud.callFunction({
      name: 'addSearchCount',
      data: {
        addOneIds,
        setOneIds,
        env: config.env
      },
      success(result) {
          console.log(result)
      }
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