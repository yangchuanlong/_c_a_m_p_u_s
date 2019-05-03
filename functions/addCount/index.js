// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database({
    env: event.env
  });
  const _ = db.command;
  const hotRateCollection = db.collection("hotRate");
  const ids = event.ids;
  const result = await hotRateCollection.where({
    questionId: _.in(ids)
  }).update({
    data: {
      [event.countType]: _.inc(1)
    }
  });
  const batchTimes = Math.ceil(ids.length / 20);
  const MAX_LIMIT = 20;
  for(let i=0; i<batchTimes; i++) {
    let {data} = await hotRateCollection.where({
      questionId: _.in(ids)
    })
    .skip(i * MAX_LIMIT)
    .limit(MAX_LIMIT)
    .get();

    for(let j=0; j<data.length; j++) {
      const {readCount, thumbupCount, replyCount, searchCount} = data[j];
      await hotRateCollection.where({
        _id: data[j]._id
      }).update({
        data: {
          hotVal: readCount * 0.3 + thumbupCount * 0.3 + replyCount * 0.3 + searchCount * 0.1
        }
      })
    }
  }
  // resp => {
  //   resp.data.forEach(item => {
  //     const {readCount, thumbupCount, replyCount, searchCount} = item;
  //     const hotVal = 10;
  //     hotRateCollection.where({
  //       _id: item._id
  //     }).update({
  //       data: {
  //         hotVal
  //       }
  //     })
  //   })
  // }
  //const wxContext = cloud.getWXContext();
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
