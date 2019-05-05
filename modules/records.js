const {
    EventEmitter
} = require("events");
const mongoose = require('mongoose');
const schema = require('./core-schema.js');
//const Message = mongoose.model('Message', schema);

let instance;
let data = [];
let MAX = 50000;

class Records extends EventEmitter {
    constructor() {
        super();
    }
    set(dbbase, msg) {
        schema[dbbase].findOneAndUpdate({ groupid: msg.groupid }, { $set: { blockfunction: msg.blockfunction } }, { upsert: true }, (err, doc) => {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            console.log(JSON.stringify(doc).toString());
            // return JSON.stringify(doc).toString();
        });
    }

    pushblockfunction(dbbase, msg) {
        //   data.push({ msg });
        //console.log('data: ', msg)
        // 將聊天資料轉成資料模型
        /* 
        if (data.length > MAX) {
            data.splice(0, 1);
        }
        
        const m = new schema[dbbase](
             msg
         );
         // 存至資料庫
         console.log('m: ', msg)
         //m.save();

            提醒:
            $push 加入新的
            $set  重置舊的

         */
        schema[dbbase].findOneAndUpdate({ groupid: msg.groupid }, { $push: { blockfunction: msg.blockfunction } }, { new: true, upsert: true }, (err, doc) => {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            console.log(JSON.stringify(doc).toString());
            // return JSON.stringify(doc).toString();
        });
        //  this.emit("new_message", msg);

    }

    get(target, callback) {
        // 取出所有資料
        schema[target].find({}, (err, msgs) => {
            callback(msgs);
        });
    }


    setMax(max) {
        MAX = max;
    }

    getMax() {
        return MAX;
    }
}

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }

    return instance;
})();