const { EventEmitter } = require("events");
const mongoose = require('./db-connector.js');
const schema = require('./schema.js');
const Message = mongoose.model('Message', schema);

let instance;
let data = [];
let MAX = 50000;

class Records extends EventEmitter {
    constructor() {
        super();
    }

    push(msg) {
        data.push(msg);
        console.log(data)
        if (data.length > MAX) {
            data.splice(0, 1);

        }
        // 將聊天資料轉成資料模型
        const m = new Message(msg);
        // 存至資料庫
        m.save();


        //  this.emit("new_message", msg);
    }

    get(callback) {
        // 取出所有資料
        Message.find((err, msgs) => {
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