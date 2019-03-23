// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()


// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const db = cloud.database({
        env: event.env
    });
    const result = await db.collection("replies").add({
        data: {
            content: event.content,
            questionId: event.questionId,
            user: event.user,
            subordinateTo: event.subordinateTo,

            openid: wxContext.OPENID,
            createdTime: new Date().toISOString(),
        },
        success: () => {
        },
        fail: () => {
        },
        complete: () => {
        }
    });
    return result._id;
    // return {
    //   event,
    //   openid: wxContext.OPENID,
    //   appid: wxContext.APPID,
    //   unionid: wxContext.UNIONID,
    // }
}