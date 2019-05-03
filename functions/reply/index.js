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
            subordinateTo: event.subordinateTo,
            repliedOpenId: event.repliedOpenId,

            openid: wxContext.OPENID,
            createdTime: event.createdTime || new Date().toISOString(),
        },
        success: () => {
        },
        fail: () => {
        },
        complete: () => {
        }
    });
    return {_id: result._id, openid: wxContext.OPENID};
    // return {
    //   event,
    //   openid: wxContext.OPENID,
    //   appid: wxContext.APPID,
    //   unionid: wxContext.UNIONID,
    // }
}
