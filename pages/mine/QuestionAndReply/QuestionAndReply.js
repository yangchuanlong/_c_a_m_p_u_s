import config from '../../../utils/config.js';
import util from '../../../utils/util.js'
const app = getApp(), globalData = app.globalData;
const now = new Date().toISOString();
Page({
    data: {
        myQuestions: [],   
        myReplies: [],    
        hasMoreQuestion: true,
        hasMoreReply: true,
        showLoading: true,
        qLatestTime: now,//question
        qOldestTime: now,
        rLatestTime: now,//rpley
        rOldestTime: now
    },  
    gotoQuestion(evt) {
      const dataset = evt.currentTarget.dataset;
      const {questionId, authorId} = dataset;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${questionId}&authorId=${authorId}`,
      })
    },
    onLoad() {
      const _t = this;
      wx.cloud.init(); 
      const dbQ = wx.cloud.database({
        env: config.env
      });
      const co = dbQ.collection("questions");
      dbQ.collection("questions").where({
        openid: globalData.curUser.openid
      })
      .orderBy('createdTime', 'desc')
      .field({
          createdTime: true,
          title: true,
          abstract: true
      }).get().then(resp => {
        _t.setData({
          showLoading: false
        });
        if (resp.data && resp.data.length) {          
          const myQuestions = resp.data.map(item => {
            return {
              ...item,
              formattedTime: util.dateDiff(item.createdTime),              
              openid: globalData.curUser.openid
            }
          });
           _t.setData({
             myQuestions,
             qLatestTime: myQuestions[0].createdTime,
             qOldestTime: myQuestions[myQuestions.length - 1].createdTime
           });
           if(resp.data.length < 20) {
             _t.setData({
               hasMoreQuestion: false,
             });
             _t.getMyReplies();
           }
         }
      })
    },    
    getMyReplies(){
      const _t = this;
      wx.cloud.init();
      const db = wx.cloud.database({
        env: config.env
      });
      db.collection("replies").where({
        openid: globalData.curUser.openid
      })
      .field({
        questionId: true,
        createdTime: true
      })    
      .orderBy('createdTime', 'desc')  
      .get()
      .then(resp => {
          if(resp.data.length) {
              const qSet = new Set();
              const existedQuestions = {};
              _t.data.myQuestions.forEach(item => {
                existedQuestions[item._id] = true
              });
              resp.data.forEach(item => {
                if (!existedQuestions[item._id]) {
                  qSet.add(item._id);
                }
              });
              _t.setData({
                rLatestTime: resp.data[0].createdTime,
                rOldestTime: resp.data[resp.data.length - 1].createdTime
              })
              const qIds = Array.from(qSet);
              qIds.length && _t.getQuestionOfReplies(qIds);
          } else {
            _t.setData({
              hasMoreReply: false
            })
          }
      })
    },
    getQuestionOfReplies(qIds){
      const _t = this;
      const dbQ = wx.cloud.database({
        env: config.env
      });
      const _ = dbQ.command;
      const co = dbQ.collection("questions");
      co.where({        
        _id: _.in(qIds)
      }).field({//回复别人或自己
        openid: true,
        createdTime: true,
        title: true,
        abstract: true
      })
      .get()
      .then(resp => {
        const questions = resp.data;
        questions.forEach(item => {
          item.formattedTime = util.dateDiff(item.createdTime);          
        });
        const myQuestions = _t.data.myQuestions.concat(questions);
        _t.setData({
          myQuestions
        })
      })
    },
    getMoreQuestionOfMine() {
      if(!this.data.hasMoreQuestion) {
        return;
      }      
      const _t = this;
      wx.cloud.init();
      const dbQ = wx.cloud.database({
        env: config.env
      });
      const _ = dbQ.command;
      const co = dbQ.collection("questions");
      _t.setData({
        showLoading: true
      })
      dbQ.collection("questions").where({
        openid: globalData.curUser.openid,
        createdTime: _.lt(_t.data.qOldestTime)
      })
      .orderBy('createdTime', 'desc')
      .field({
        createdTime: true,
        title: true,
        abstract: true
      })
      .limit(10)
      .get()
      .then(resp => {
        if(resp.data.length) {
          const myQuestions = _t.data.myQuestions;
          const questions = resp.data.map(item => {
            return {
              ...item,
              formattedTime: util.dateDiff(item.createdTime),             
              openid: globalData.curUser.openid
            }
          });
          _t.setData({
            myQuestions: myQuestions.concat(questions),            
            qOldestTime: questions[questions.length - 1].createdTime
          })
        } else {
          _t.setData({
            hasMoreQuestion: false
          })
        }
        _t.setData({
          showLoading: false
        })
      }).catch(err => {
        console.log(err);
        _t.setData({
          showLoading: false
        });
      })
    },
    getMoreReplies() {
      const _t = this;
      wx.cloud.init();
      const db = wx.cloud.database({
        env: config.env
      });
      const _ = db.command;
      db.collection("replies").where({
        openid: globalData.curUser.openid,
        createdTime: _.lt(_t.data.rOldestTime)
      })
      .field({
        questionId: true,
        createdTime: true
      })
      .orderBy('createdTime', 'desc')
      .get()
      .then(resp => {
        if (resp.data.length) {
          const qSet = new Set();
          const existedQuestions = {};
          _t.data.myQuestions.forEach(item => {
            existedQuestions[item.questionId] = true
          });
          resp.data.forEach(item => {
            if (!existedQuestions[item.questionId]) {
              qSet.add(item.questionId);
            }
          });
          _t.setData({
            rLatestTime: resp.data[0].createdTime,
            rOldestTime: resp.data[resp.data.length - 1].createdTime
          })
          const qIds = Array.from(qSet);
          qIds.length && _t.getQuestionOfReplies(qIds);
        } else {
          _t.setData({
            hasMoreReply: false
          })
        }
      })
    },
    getMoreData() {
      const _t = this;
      if(!_t.data.hasMoreQuestion && !_t.data.hasMoreReply) {
        return;
      }
      if(_t.data.hasMoreQuestion) {
        _t.getMoreQuestionOfMine();
      } else {
        _t.getMoreReplies();
      }
    },
    onReachBottom() {
      this.getMoreData();
    },
});