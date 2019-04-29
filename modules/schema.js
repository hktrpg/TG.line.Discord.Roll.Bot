const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
    name: { // 欄位名稱
        type: String, // 欄位資料型別
        required: true, // 必須要有值
    },
    msg: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true
    }
});