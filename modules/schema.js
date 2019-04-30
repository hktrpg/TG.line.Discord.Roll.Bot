const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
    default: { // 欄位名稱
        type: String // 必須要有值
    },
    text: {
        type: String
    },
    type: {
        type: Date
    }
});