"use strict";
if (!process.env.mongoURL) {
    return;
}
const mongoose = require('./core-db-connector.js').mongoose;
//const Schema = mongoose.Schema;
//const Message = mongoose.model('Message', schema);

const chattest = mongoose.model('chattest', {
    default: String,
    text: String,
    type: String
});
const block = mongoose.model('block', {
    groupid: String,
    blockfunction: Array
});

const randomAns = mongoose.model('randomAns', {
    groupid: String,
    randomAnsfunction: Array
});

const randomAnsAllgroup = mongoose.model('randomAnsAllgroup', {
    randomAnsAllgroup: Array
});


const trpgDatabase = mongoose.model('trpgDatabase', {
    groupid: String,
    trpgDatabasefunction: [{
        topic: String,
        contact: String
    }]
});

const trpgDatabaseAllgroup = mongoose.model('trpgDatabaseAllgroup', {
    trpgDatabaseAllgroup: [{
        topic: String,
        contact: String
    }]
});
const GroupSetting = mongoose.model('GroupSetting', {
    groupid: String,
    togm: Array,
    user: [{
        userid: {
            type: String,
            required: true
        },
        name: String,
        date: {
            type: Date,
            default: Date.now
        },
        limit: Number,
        Permission: String,
        Abiliy: Array
    }]
});
const trpgCommand = mongoose.model('trpgCommand', {
    groupid: String,
    trpgCommandfunction: [{
        topic: String,
        contact: String
    }]
});
const trpgLevelSystem = mongoose.model('trpgLevelSystem', {
    groupid: String,
    LevelUpWord: String,
    //在這群組升級時的升級語
    RankWord: String,
    //在這群組查詢等級時的回應
    Switch: {
        type: String,
        default: "0"
    },
    //是否啓動功能 config 1X 則1
    Hidden: {
        type: String,
        default: "0"
    },
    //大於此Lvl即為稱號.
    Title: Array,
    //是否顯示升級語 config X1 則1
    trpgLevelSystemfunction: [{
        userid: String,
        name: String,
        EXP: Number,
        //現在經驗值
        Level: String,
        //等級
        LastSpeakTime: {
            type: Date,
            default: Date.now
            //最後說話時間, 間隔一分鐘才提升經驗
        }
    }]
});
const trpgDarkRolling = mongoose.model('trpgDarkRolling', {
    groupid: String,
    trpgDarkRollingfunction: [{
        userid: String,
        diyName: String,
        displayname: String
    }]
});
//
//目的: 記錄發言數量及擲骰數量
//紀錄擲骰結果
//每日上傳一次
//同時每500次顯示一次
//
const RealTimeRollingLog = mongoose.model('RealTimeRollingLog', {
    RealTimeRollingLogfunction: {
        //第一次運行紀錄RollingLogfunction的時間
        StartTime: String,
        //一小時一次
        LastTimeLog: Date,
        //RealTimeLog
        LogTime: String,
        DiscordCountRoll: Number,
        DiscordCountText: Number,
        LineCountRoll: Number,
        LineCountText: Number,
        TelegramCountRoll: Number,
        TelegramCountText: Number,
        WWWCountRoll: Number,
        WWWCountText: Number,
        WhatsappCountRoll: Number,
        WhatsappCountText: Number,
        PlurkCountRoll: Number,
        PlurkCountText: Number
    }
});

const RollingLog = mongoose.model('RollingLog', {
    RollingLogfunction: {
        LogTime: String,
        DiscordCountRoll: Number,
        DiscordCountText: Number,
        LineCountRoll: Number,
        LineCountText: Number,
        TelegramCountRoll: Number,
        TelegramCountText: Number,
        WWWCountRoll: Number,
        WWWCountText: Number,
        WhatsappCountRoll: Number,
        WhatsappCountText: Number,
        PlurkCountRoll: Number,
        PlurkCountText: Number
    }
});
const veryImportantPerson = mongoose.model('veryImportantPerson', new mongoose.Schema({
    gpid: String,
    id: String,
    level: Number,
    startDate: Date,
    endDate: Date,
    name: String,
    notes: String,
    code: String,
    switch: Boolean
}));
const codelist = mongoose.model('codelist', new mongoose.Schema({
    code: String,
    level: Number,
    endDate: Date,
    renew: Number,
    allowTime: Number,
    usedTime: Number,
    usedGpid: Array,
    usedId: Array,
    name: String,
    notes: String,
}));


const characterGpSwitch = mongoose.model('characterGpSwitch', new mongoose.Schema({
    gpid: Array,
    id: String,
    name: String,
    cardId: String
}));
const accountPW = mongoose.model('accountPW', new mongoose.Schema({
    id: String,
    userName: String,
    password: String,
    channel: [{
        id: String,
        botname: String,
        titleName: String
    }]
}));

const allowRolling = mongoose.model('allowRolling', new mongoose.Schema({
    id: String,
    botname: String,
    titleName: String
}));


const chatRoom = mongoose.model('chatRoom', new mongoose.Schema({
    name: { // 欄位名稱
        type: String, // 欄位資料型別
        required: true, // 必須要有值
        maxlength: 50
    },
    msg: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    roomNumber: {
        type: String,
        required: true,
        maxlength: 50
    }
}));

const characterCard = mongoose.model('characterCard', new mongoose.Schema({
    id: String,
    public: Boolean,
    name: {
        type: String,
        maxlength: 50
    },
    nameShow: Boolean,
    state: [{
        name: {
            type: String,
            maxlength: 50
        },
        itemA: {
            type: String,
            maxlength: 50
        },
        itemB: {
            type: String,
            maxlength: 50
        }
    }],
    roll: [{
        name: {
            type: String,
            maxlength: 50
        },
        itemA: {
            type: String,
            maxlength: 150
        }
    }],
    notes: [{
        name: {
            type: String,
            maxlength: 50
        },
        itemA: {
            type: String,
            maxlength: 1500
        }
    }]
}));

const exportGp = mongoose.model('exportGp', new mongoose.Schema({
    groupID: String,
    lastActiveAt: Date
}));

const exportUser = mongoose.model('exportUser', new mongoose.Schema({
    userID: String,
    lastActiveAt: Date,
    times: Number
}));
const init = mongoose.model('init', new mongoose.Schema({
    groupID: String,
    list: [{
        name: String,
        result: Number,
        formula: String
    }]
}));

module.exports = {
    randomAns,
    block,
    chattest,
    randomAnsAllgroup,
    GroupSetting,
    trpgDatabaseAllgroup,
    trpgDatabase,
    trpgCommand,
    trpgLevelSystem,
    trpgDarkRolling,
    RealTimeRollingLog,
    RollingLog,
    characterCard,
    veryImportantPerson,
    characterGpSwitch,
    codelist,
    chatRoom,
    exportGp,
    exportUser,
    accountPW,
    allowRolling,
    init
}
//const Cat = mongoose.model('Cat', { name: String });
//const kitty = new Cat({ name: 'Zildjian' });
/*
module.exports = new Schema({
    default: String,
    text: String,
    type: String

});
*/