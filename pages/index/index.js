//index.js
//获取应用实例
import config from '../../utils/config.js';
const util = require('../../utils/util.js');
const app = getApp(), globalData = app.globalData;
const defaultColumns = [{
  en_name: 'all',
  name: '全部'
},{
  en_name: 'interested',
  name: "关注"
}, {
  en_name: 'hotspot',
  name: '热点'
}];
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    questions: [],
    lastestQuestionTime: null,
    oldestQuestionTime: null,
    searchTxt: '',
    showLoading: false,
    activeTab: 0,
    haveMoreQuestion: true,
    myThumbups: {},
    touchStartX: 0,
    touchStartY: 0,
    tabs: defaultColumns,
    hotSearches: [],
    finishChecking: false,//完成check用户是否注册
    showOverlay: true,
    toColumn: 'all',
    tabIndex2ColId: {},
    colQuestions: {
      //all: [], 问题数组
      //interested: []
    },
    colLatestAndOldestTime: {},
    colHasMoreData: {},
    thumbupCount: {},
    replyCount: {},
    collegeColumns: [],
    chosenInterestedCols: {},
    setInterestedLoading: false,
    showInterestedSettingDlg: false,
    users: {},
    unreadNum: 0
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  gotoDetail(evt) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
        env: config.env
    });
    const questionId = evt.currentTarget.dataset.id, authorId = evt.currentTarget.dataset.authorId;
    const myThumbups = this.data.myThumbups;
    let action = '';
    if (evt.target.id === 'js-thumbup') {
      action = 'add';
    } else if(evt.target.id === 'js-thumbup-cancel') {
      action = 'cancel';
    }
    if(action) {
      const thumbupCollection = db.collection("thumbups");
      const myThumbups = {...this.data.myThumbups};
      const thumbupCount = {...this.data.thumbupCount};
      if(action === 'add') {
        myThumbups[questionId] = true;
        thumbupCount[questionId] = (thumbupCount[questionId] || 0) + 1;
        thumbupCollection.add({
            data: {
                openid: globalData.curUser.openid,
                questionOrReplyId: questionId,
                type: 'question'
            },
            success: function (resp) {
              _t.putMessage({ questionId, authorId });
            },
            fail(err) {
                console.log(err)
            }
        });
      } else {
        delete myThumbups[questionId];
        if(!isNaN(thumbupCount[questionId]) && (thumbupCount[questionId] >= 1)){
          thumbupCount[questionId] -= 1;
        } else {
          thumbupCount[questionId] = 0;
        }
        thumbupCollection.where({
            questionOrReplyId: questionId,
            openid: globalData.curUser.openid
        }).get().then(function (resp) {
            resp.data.forEach(item => {
                thumbupCollection.doc(item._id).remove();
            });
        })
      }
      this.setData({
        thumbupCount,
        myThumbups
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${questionId}&authorId=${authorId}`,
    })
  },
  putMessage({questionId, authorId}){
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'message',
      data: {
        env: config.env,
        actionType: 'add',
        type: 1, //1:点赞问题
        receiverId: authorId,
        questionId,
      },
      success(res) {
        console.log(res)
      },
      fail(err) {
        console.log(err)
      }
    })
  },
  gotoAsk() {
    console.log("gotoAsk")
    wx.navigateTo({
      url: '../ask/ask',
    })
  },
  gotoMine() {
    wx.navigateTo({
      url: '../mine/mine',
    })
  },
  gotoMsg() {
    wx.navigateTo({
      url: '../message/message',
    })
  },
  inputSearch(evt){
    this.setData({
      searchTxt: evt.detail.value
    });
  },
  startSearch(){
    let searchTxt = this.data.searchTxt;
    searchTxt = searchTxt.replace(/^\s|\s$/g, '');
    if(!searchTxt) {
      return;
    }
    wx.navigateTo({
        url: '../search/search?searchTxt=' + this.data.searchTxt
    })
  },
  onReady() {
    const tabIndex2ColId = {};
    defaultColumns.forEach((col, index) => {
      tabIndex2ColId[index] = col.en_name;
    });
    this.setData({tabIndex2ColId})
  },
  getThumbupNum(questionIds) {
    const _t = this;
    wx.cloud.callFunction({
      name: 'getThumbups',
      data: {
        env:config.env,
        ids: questionIds,
        type: 'question'
      },
      success: function ({result}) {
        if(!result) {
          return;
        }
        const thumbupCount = {..._t.data.thumbupCount, ...result};
        _t.setData({ thumbupCount });
      }
    })
  },
  getReplyNum(questionIds){ //获取回复数
    const _t = this;
    wx.cloud.callFunction({
      name: 'getReplyNum',
      data: {
        env:config.env,
        questionIds
      },
      success: function ({result}) { //result {[questionId]: Number, ...}
        if(!result) {
          return;
        }
        const replyCount = Object.assign({}, _t.data.replyCount, result);
        _t.setData({ replyCount });
      }
    });
  },
  getHotSpot() {
    wx.cloud.init();
    const _t = this;
    const now = Date.now();
    const timeLimit = new Date(now - 3 * 24 * 3600 * 1000); //3天内
    const db = wx.cloud.database({
      env: config.env
    });
    const _ = db.command;
    db.collection("hotRate")
    .where({
      createdTime: _.gt(timeLimit.toISOString())
    })
    .orderBy('hotVal', 'desc')
    .field({
      questionId: true
    })
    .get()
    .then(resp => {
      return resp.data.map(item => item.questionId);
    }).then(questionIds=> {
      db.collection("questions")
      .where({
        _id: _.in(questionIds)
      })
      .get()
      .then(resp => {
        const questions = resp.data;
        if(questions.length) {
          const colQuestions = _t.data.colQuestions, ids = [];
          questions.forEach(item => {
            item.formattedTime = util.timeFormattor(item.createdTime);
            ids.push(item._id);
          });
          colQuestions['hotspot'] = questions;
          _t.setData({
            colQuestions
          });
          _t.getThumbupNum(ids);
          _t.getReplyNum(ids);
          _t.getMyThumbups(ids);
        }
      })
    })
  },
  getQuestions: function(columnId) {
    let columns = columnId;
    if(columnId === 'hotspot') {
      this.getHotSpot();
      return;
    }
    if(columnId === 'interested'){
      columns = globalData.curUserInterestedColumns;
    }
    const _t  = this;
    wx.cloud.init();
    util.getQuestions({
      env: config.env,
      //commands: [ ['createdTime', 'lt', `value`]  ],
      orderBy: [
          ['createdTime', 'desc']
      ],
      limit: 20,
      equals: columnId !== 'all' ? {columns} : null,
      fields: ["_id", "createdTime", "images", "openid", "title", "abstract"]
    })
    .then(function (resp) {
      const result = resp.data;
      if(result.length) {
        const colQuestions = _t.data.colQuestions, colLatestAndOldestTime = _t.data.colLatestAndOldestTime, ids=[], openIdSet = new Set();
        result.forEach(item => {
          item.formattedTime = util.timeFormattor(item.createdTime);
          ids.push(item._id);
          openIdSet.add(item.openid);
        });
        colQuestions[columnId] = result;
        colLatestAndOldestTime[columnId] = {
          latest: result[0].createdTime,
          oldest: result[result.length - 1].createdTime
        };
        _t.setData({colQuestions, colLatestAndOldestTime});
        _t.getThumbupNum(ids);
        _t.getReplyNum(ids);
        _t.getMyThumbups(ids);
        util.getRegisteredUsers(Array.from(openIdSet)).then(usersObj => {
          _t.setData({
            users: usersObj
          });
        });
      }
    }).catch(e => {
      console.log(e)
    })
  },
  getMyThumbups: function(ids) {
      if(!ids.length) {
          return;
      }
      ids = ids.filter(id => !this.data.myThumbups[id]);
      if(!ids.length){
          return;
      }
      const _t = this;
      wx.cloud.init();
      const db = wx.cloud.database({
          env: config.env
      });
      const _ = db.command;
      db.collection("thumbups").where({
          questionOrReplyId: _.in(ids),
          openid: globalData.curUser.openid,
          type: 'question'
      }).get().then(function (resp) {
          const myThumbups = {..._t.data.myThumbups};
          resp.data.forEach(item => {
              myThumbups[item.questionOrReplyId] = true;
          });
          _t.setData({
              myThumbups
          });
      })
  },
  onLoad: function () {
    const _t = this;
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
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
    this.checkRegister().then(function (user) {
      if(user === false) {
        wx.redirectTo({
          url: "/pages/register/register"
        })
      } else if(user && user.collegeId){
        _t.setData({
          finishChecking: true,
          showOverlay: false
        });
        _t.getColumnsOfCollege(user.collegeId, !!user.interestedColumns); //send request to fetch columns by collegeId
        _t.getQuestions('all');//获取"全部"栏目的问题
        _t.getUnreadMsg();
      } else {
        //todo? error
      }
      // this.getMyThumbups();
    });

  },
  checkRegister: function() {
    wx.cloud.init();
    if(app.globalData.curUserCollegeId) {//从注册页面跳转过来的
      return new Promise(resolve => {
        resolve({
          collegeId: app.globalData.curUserCollegeId
        });
      });
    }
    return wx.cloud.callFunction({
      name: 'checkRegister',
      data: {
        env: config.env
      },
    }).then(function (resp) {
      if(Array.isArray(resp.result) && resp.result.length) {
        const curUser = resp.result[0];
        globalData.curUserCollegeId = curUser.collegeId;
        globalData.curUserInterestedColumns = curUser.interestedColumns;
        globalData.users = {...globalData.users, [curUser.openid]: curUser};
        globalData.curUser = resp.result[0];
        return resp.result[0];
      } else {
        return false;
      }
    }).catch(function (e) {
      return "error";
    })
  },
  getColumnsOfCollege(collegeId, interestedSetted) {
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection("college").where({
      collegeId
    }).field({
      columns: true
    }).get().then(function (resp) {
      let columns = [];
      if(resp.data.length) {
        columns = resp.data[0].columns.filter(column => !! column).sort((col1, col2) => col1.order - col2.order);
      }
      globalData.columns = columns;
      const tabs = defaultColumns.concat(columns), tabIndex2ColId = {};
      tabs.forEach((col, index) => {
        tabIndex2ColId[index] = col.en_name;
      });
      _t.setData({ tabs, tabIndex2ColId, collegeColumns: columns, showInterestedSettingDlg: !interestedSetted});
    })
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  onTabClick(evt){
    const _t = this, {colQuestions, tabIndex2ColId} = _t.data;
    const activeTab = evt.target.dataset.tabIndex;
    this.setData({
      activeTab
    });
    const tabId = tabIndex2ColId[activeTab];
    if(!colQuestions[tabId]) {
        _t.getQuestions(tabId)
    }
  },
  getLatestQuestions() {
    const _t = this;
    const {activeTab, tabIndex2ColId, colLatestAndOldestTime} = _t.data;
    const activeTabId = tabIndex2ColId[activeTab];
    if(activeTabId === 'hotspot') {
      _t.getHotSpot();
      return;
    }
    const latestTime = colLatestAndOldestTime[activeTabId] && colLatestAndOldestTime[activeTabId].latest;
    wx.cloud.init();
    util.getQuestions({
        env: config.env,
        commands: [
            ['createdTime', 'gt', latestTime || new Date().toISOString()]
        ],
        orderBy: [
            ['createdTime', 'desc']
        ],
        equals: activeTabId !== 'all' ? {columns: activeTabId} : null
    })
    .then(function (resp) {
      const result = resp.data;
      if(result.length) {
        const colQuestions = _t.data.colQuestions, colLatestAndOldestTime = _t.data.colLatestAndOldestTime, ids=[];
        result.forEach(item => {
            item.formattedTime = util.timeFormattor(item.createdTime);
            ids.push(item._id);
        });
        colQuestions[activeTabId] = result.concat(colQuestions[activeTabId] || []);
        colLatestAndOldestTime[activeTabId] = Object.assign({}, colLatestAndOldestTime[activeTabId], {latest: result[0].createdTime})
        _t.setData({colQuestions, colLatestAndOldestTime});
        _t.getThumbupNum(ids);
        _t.getReplyNum(ids);
      }
      wx.stopPullDownRefresh();
    }).catch(e => {
      wx.stopPullDownRefresh();
    })
  },
  onPullDownRefresh: function () {
    this.getLatestQuestions();
  },
  getMoreQuestions() {
    const _t = this;
    const {activeTab, tabIndex2ColId, colHasMoreData, colLatestAndOldestTime} = _t.data;
    const activeTabId = tabIndex2ColId[activeTab];
    if(activeTabId === 'hotspot') {//热点只下拉刷新
      return;
    }
    if(colHasMoreData[activeTabId] && colHasMoreData[activeTabId].hasMoreData === false) {
      return;
    }
    this.setData({
      showLoading: true
    });
    const oldestTime = colLatestAndOldestTime[activeTabId] && colLatestAndOldestTime[activeTabId].oldest;
    wx.cloud.init();
    util.getQuestions({
        env: config.env,
        commands: [
            ['createdTime', 'lt', oldestTime || new Date().toISOString()]
        ],
        orderBy: [
            ['createdTime', 'desc']
        ],
        limit: 10,
        equals: activeTabId !== 'all' ? {columns: activeTabId} : null,
        fields: ["_id", "createdTime", "images", "openid", "title", "abstract"]
    })
    .then(resp => {
      const result = resp.data;
      if(result.length) {
        const colQuestions = _t.data.colQuestions, colLatestAndOldestTime = _t.data.colLatestAndOldestTime, ids=[];
        result.forEach(item => {
            item.formattedTime = util.timeFormattor(item.createdTime);
            ids.push(item._id);
        });
        colQuestions[activeTabId] = (colQuestions[activeTabId] || []).concat(result);
        colLatestAndOldestTime[activeTabId] = {...colLatestAndOldestTime[activeTabId], oldest: result[result.length - 1].createdTime };
        _t.setData({colQuestions, colLatestAndOldestTime});
        _t.getThumbupNum(ids);
        _t.getReplyNum(ids);
      } else {
        colHasMoreData[activeTabId] = {hasMoreData: false};
        _t.setData({ colHasMoreData });
      }
      _t.setData({
          showLoading: false
      });
    }).catch(e => {
      _t.setData({
          showLoading: false
      });
    })
  },
  getUnreadMsg(){
    wx.cloud.init();
    const _t = this;
    const db = wx.cloud.database({
        env: config.env
    });
    const _ = db.command;
    db.collection("messages").where({
        receiverId: globalData.curUser.openid,
        unread: _.neq([])
    }).field({
        unread: true
    })
    .get()
    .then(function (resp) {
      let unreadNum = 0;
      resp.data.forEach(item => {
          unreadNum += item.unread.length;
      });
      _t.setData({
          unreadNum
      });
    })
  },
  onReachBottom(){
    this.getMoreQuestions();
  },

  onTouchStart(evt) {
    const touch = evt.touches[0];
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    });
  },
  onTouchEnd (evt){
    const _t = this;
    const {touchStartX, touchStartY, activeTab, tabs, tabIndex2ColId, colQuestions} = this.data;
    const touch = evt.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    let nextActiveTab;
    if(deltaX > 2 * deltaY) {
      if(touch.clientX > touchStartX) {
        nextActiveTab = activeTab == 0 ? tabs.length - 1 : activeTab - 1
      } else {
        console.log("左滑")
        nextActiveTab = (activeTab + 1) % tabs.length;
      }
    }
    if(!isNaN(nextActiveTab)) {
      console.log(nextActiveTab, '-->', this.data.tabIndex2ColId[nextActiveTab])
      this.setData({
        activeTab: nextActiveTab,
        toColumn: this.data.tabIndex2ColId[nextActiveTab]
      });
      const tabId = tabIndex2ColId[nextActiveTab];
      if(!colQuestions[tabId]) {
        _t.getQuestions(tabId)
      }
    }
  },
  onChooseCol(evt) {
    const chosenCol = evt.currentTarget.dataset.col;
    const chosenInterestedCols = {...this.data.chosenInterestedCols};
    if(chosenInterestedCols[chosenCol]){
      delete chosenInterestedCols[chosenCol]
    } else {
      chosenInterestedCols[chosenCol] = true;
    }
    this.setData({
        chosenInterestedCols
    })
  },
  setInterestedCols() {
    const _t = this, chosenInterestedCols = this.data.chosenInterestedCols;
    if(!Object.keys(chosenInterestedCols).length) {
      wx.showToast({
          title: '请至少选择一个关注的话题',
          icon: 'none'
      });
      return;
    }
    wx.cloud.init();
    _t.setData({
      setInterestedLoading: true
    });
    const interestedColumns = Object.keys(chosenInterestedCols);
    wx.cloud.callFunction({
        name: 'setInterestedColumns',
        data: {
          env: config.env,
          interestedColumns
        }
    }).then(() => {
        _t.setData({
            setInterestedLoading: false,
            showInterestedSettingDlg: false
        });
        globalData.curUserInterestedColumns = interestedColumns;
    }).catch(e => {
        wx.showToast({
            title: '设置失败',
            icon: 'none'
        });
    })
  }
});
