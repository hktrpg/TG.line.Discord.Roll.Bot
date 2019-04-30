const {
    EventEmitter
} = require("events");
const mongoose = require('mongoose');
const schema = require('./schema.js');
//const Message = mongoose.model('Message', schema);

let instance;
let data = [];
let MAX = 50000;

class Records extends EventEmitter {
    constructor() {
        super();
    }

    push(msg,dbbase) {
        //   data.push({ msg });
        //console.log('data: ', msg)
        if (data.length > MAX) {
            data.splice(0, 1);
        }
        // 將聊天資料轉成資料模型
        const m = new schema[dbbase](
            msg
        );
        // 存至資料庫
        console.log('m: ', msg)
        m.save();


        //  this.emit("new_message", msg);
    }

    get(callback) {
        // 取出所有資料
        schema.chattest.find({}, (err, msgs) => {
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