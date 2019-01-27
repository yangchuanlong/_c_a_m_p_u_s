
Page({
    data: {
        types: [
           {name: "情感", value: 1},
           {name: "新生", value: 2},
           {name: "社团", value: 3},
           {name: "食堂", value: 4},
           {name: "考试", value: 5},
           {name: "选课", value: 6}
        ],
        title: '',
        chosenType: []
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
        if(!this.data.chosenType.length) {
            wx.showToast({
                title: '请选择分类',
                icon: 'none',
                duration: 500
            })
            return;
        }
        const data = this.data;
        wx.navigateTo({
          url: '../questionEdit/questionEdit' + `?title=${data.title}&types=${data.chosenType.join(",")}`,
        })
        console.log(this.data.title, this.data.chosenType)
    },
    checkboxChange(evt) {
        this.setData({
            chosenType: evt.detail.value
        })
    },
    onInput(evt) {
        this.setData({
            title: evt.detail.value
        })
    }
});