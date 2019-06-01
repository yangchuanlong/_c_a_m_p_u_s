import config from '../../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({
    data: {
        myQuestions: [],   
        myReplies: [],    
    },   
    onLoad() {
      const _t = this;
      wx.cloud.init(); 
      const dbQ = wx.cloud.database({
        env: config.env
      });
      dbQ.collection("questions").where({
        
      })
    },    
});