import config from "../../utils/config";

const {globalData} = getApp();
Page({
    data: {
        columns: [],
        title: '',
        chosenColumns: []
    },
    onNextStep(){
        if(!this.data.title) {
            wx.showToast({
                title: '请输入标题',
                icon: 'none',
                duration: 500
            });
            return;
        }
        if(!this.data.chosenColumns.length) {
            wx.showToast({
                title: '请选择分类',
                icon: 'none',
                duration: 500
            })
            return;
        }
        const data = this.data;
        wx.navigateTo({
          url: '../questionEdit/questionEdit' + `?title=${data.title}&columns=${data.chosenColumns.join(",")}`,
        })
        console.log(this.data.title, this.data.chosenColumns)
    },
    checkboxChange(evt) {
        this.setData({
            chosenColumns: evt.detail.value
        })
    },
    onInput(evt) {
        this.setData({
            title: evt.detail.value
        })
    },
    onLoad() {
        const _t = this;
        this.getColumns().then(columns => {
            _t.setData({
                columns
            });
        })
    },
    getColumns() {
        wx.cloud.init();
        const _t = this;
        const db = wx.cloud.database({
            env: config.env
        });
        if(globalData.columns) {
            return new Promise(resolve => {
                resolve(globalData.columns);
            });
        } else {
            return db.collection("college").where({
                collegeId: globalData.curUserCollegeId
            }).field({
                columns: true
            }).get().then(function (resp) {
                let columns = [];
                if(resp.data.length) {
                    columns = resp.data[0].columns.filter(column => !! column).sort((col1, col2) => col1.order - col2.order);
                }
                globalData.columns = columns;
                return columns;
            })
        }
    }
});