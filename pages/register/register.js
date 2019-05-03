
import config from '../../utils/config.js';
const app = getApp(), globalData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    colleges: [],
    showCollegeList: false,
    showGradeList: false,
    selectedCollege: null,
    gradesVerifyQuestionCache: {},
    grades:[],
    verifyQuestions: [],

    selectedGrade: null,
    showToggleMap: {},
    curStep: 1,
    nickName: '',
    disabled: false,
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(!app.globalData.userInfo) {
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo;
        }
      })
    }
    wx.cloud.init();
    this.getCollegeList();
  },

  getCollegeList() {
    const _t = this;
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection("college").field({
      collegeId: true,
      collegeName: true
    }).get().then(function (resp) {
      const colleges = resp.data || [];
      _t.setData({ colleges });
    })
  },

  getGradeAndVerifyQuestion(collegeId) {
    const _t = this;
    const cached = _t.data.gradesVerifyQuestionCache[collegeId];
    if(cached) {
      _t.setData({
        grades: cached.grades,
        verifyQuestions: cached.verifyQuestions
      });
      return;
    }
    const db = wx.cloud.database({
      env: config.env
    });
    db.collection("college").where({
      collegeId
    }).field({
      grades: true,
      verifyQuestions: true
    }).get().then(function (resp) {
      const result = resp.data[0], questionValMap = {};
      const stateObj = {
        grades: result.grades,
        verifyQuestions: result.verifyQuestions
      };
      _t.setData(stateObj);
      _t.data.gradesVerifyQuestionCache[collegeId] = stateObj;
    });
  },

  togglePopup(evt) {
    const dataset = evt.target.dataset;
    const popup = dataset.popupSwitch;
    switch (popup) {
      case "college":
        this.setData({
          showCollegeList: !this.data.showCollegeList,
          showGradeList: false,
          showToggleMap: {}
        });
        break;
      case "grade":
        if(!this.data.selectedCollege){
          wx.showToast({
            title: "请先选择学校",
            icon: 'none'
          });
          return;
        }
        this.setData({
          showCollegeList: false,
          showGradeList: !this.data.showGradeList,
          showToggleMap: {}
        });
        break;
      case "verfiyQuestion":
        const questionIdx = dataset.questionIdx;
        const showToggleMap = {...this.data.showToggleMap};
        showToggleMap[questionIdx] = !showToggleMap[questionIdx];
        this.setData({
          showCollegeList: false,
          showGradeList: false,
          showToggleMap
        });
        break;
      default:
        this.setData({
          showCollegeList: false,
          showGradeList: false,
          showToggleMap: {}
        })
    }
  },

  chooseCollege(evt) {
    const _t = this, selectedCollegeId = evt.currentTarget.dataset.value;
    this.data.colleges.some(college => {
      if(college.collegeId === selectedCollegeId) {
        _t.setData({
          selectedCollege: college,
        });
        _t.getGradeAndVerifyQuestion(selectedCollegeId);
        return true;
      }
    });
  },

  chooseGrade(evt) {
    const _t = this, selectedGrade = evt.currentTarget.dataset.value;
    this.data.grades.some(grade => {
      if(grade.value === selectedGrade) {
        _t.setData({
          selectedGrade: grade,
        });
        return true;
      }
    });
  },

  chooseVerifyQuestionAnswer(evt){
    const dataset = evt.currentTarget.dataset;
    const questionIdx = dataset.questionIdx;
    const chosenAnswerValue = dataset.value;
    const verifyQuestions = this.data.verifyQuestions;
    let showToggleMap = this.data.showToggleMap;
    const answeredQuestion = JSON.parse(JSON.stringify(verifyQuestions[questionIdx]));
    if(chosenAnswerValue) {
      answeredQuestion.options.some(option => {
        if(option.value === chosenAnswerValue) {
          answeredQuestion.selectedOption = option;
          return true;
        }
      });
    } else {
      answeredQuestion.selectedOption = null;
    }
    const show = !showToggleMap[questionIdx];
    showToggleMap = {
      [questionIdx]: show
    };
    this.setData({
      [`verifyQuestions[${questionIdx}]`]: answeredQuestion,
      showToggleMap,
    });
  },

  onSubmit() {
    if(!this.data.selectedCollege) {
      wx.showToast({
        title: '请选择学校',
        icon: 'none'
      });
      return;
    }
    if(!this.data.selectedGrade) {
      wx.showToast({
        title: '请选择您的年级',
        icon: 'none'
      });
      return;
    }
    const hasNotRightAnswer = this.data.verifyQuestions.some(question => {
      if(!question.selectedOption || question.selectedOption.value !== question.answer) {
        return true;
      }
    });
    if(hasNotRightAnswer) {
      wx.showToast({
        title: '认证不通过,请认真回答问题',
        icon: 'none'
      });
      return;
    }
    this.setData({
      curStep: 2,
      nickName: app.globalData.userInfo.nickName
    })
  },
  onRegister() {
    const _t = this;
    const data = this.data, userInfo = app.globalData.userInfo;
    const nickName = data.nickName.replace(/!\s|\s$/, "");
    if(!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    this.setData({ disabled: true, loading: true });
    wx.cloud.init();
    wx.cloud.callFunction({
      name: 'register',
      data:{
        env: config.env,
        collegeId: data.selectedCollege.collegeId,
        grade: data.selectedGrade.value,

        nickName: this.data.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender
      }
    }).then(resp => {
      if(resp.result.errMsg === 'collection.add:ok') { //success
        globalData.curUserCollegeId = data.selectedCollege.collegeId;
        globalData.curUserGrade = data.selectedGrade.value;
        globalData.users = {...globalData.users, [resp.result.openid]: data};
        wx.redirectTo({
          url: "/pages/index/index"
        })
      } else {
        _t.setData({ disabled: false, loading: false });
      }
    }).catch(e => {
      _t.setData({ disabled: false, loading: false });
    });
  },

  onNicknameInput(evt){
    this.setData({
      nickName: evt.detail.value
    });
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
