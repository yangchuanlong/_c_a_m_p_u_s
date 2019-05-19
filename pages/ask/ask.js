import config from "../../utils/config";

const {globalData} = getApp();
Page({
    data: {
        columns: [],
        title: '',
        chosenColumns: [],
        chunkColumns: [],
        choseMap: {},
        disabled: false
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
            });
            return;
        }
        const data = this.data;
        wx.navigateTo({
          url: '../questionEdit/questionEdit' + `?title=${data.title}&columns=${data.chosenColumns.join(",")}`,
        });
        console.log(this.data.title, this.data.chosenColumns)
    },
    checkboxChange(evt) {
        const values = evt.detail.value;
        const choseMap = {};
        const disabled = values.length >=3;
        values.forEach(colId => {
            choseMap[colId] = true
        });
        this.setData({
            chosenColumns: values,
            choseMap,
            disabled
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
            const chunkColumns = [];
            columns.forEach((item, key) => {
               const chunkKey = Math.floor(key / 4);
                const tmp = (chunkColumns[chunkKey] = chunkColumns[chunkKey] || []);
                tmp.push(item);
            });
            chunkColumns.forEach((item, key) => {
               if(item.length < 4) {
                   chunkColumns[key] = item.concat(Array(4 - item.length).fill({}))
               }
            });
            console.log(chunkColumns)
            _t.setData({
                //columns,
                chunkColumns
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
    },
    labelClick(evt){
        if(evt.currentTarget.dataset.disabled){
            wx.showToast({
                title: '您最多只能选三个栏目',
                icon: 'none',
                duration: 1000
            });
        }
    }
});