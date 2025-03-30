"use strict";
if (!process.env.mongoURL) {
    return;
}
const mongoose = require('./db-connector.js').mongoose;
//const Schema = mongoose.Schema;
//const Message = mongoose.model('Message', schema);

const chattest = mongoose.model('chattest', {
    default: String,
    text: String,
    type: { type: String, index: true }
});
const block = mongoose.model('block', {
    groupid: { type: String, index: true },
    blockfunction: Array
});

const randomAns = mongoose.model('randomAns', {
    groupid: { type: String, index: true },
    randomAnsfunction: Array
});

const randomAnsPersonal = mongoose.model('randomAnsPersonal', {
    userid: { type: String, index: true },
    title: String,
    answer: Array,
    serial: { type: Number, index: true }
});

//cancel
const randomAnsAllgroup = mongoose.model('randomAnsAllgroup', {
    randomAnsAllgroup: Array
});

const randomAnsServer = mongoose.model('randomAnsServer', {
    title: { type: String, index: true },
    answer: Array,
    serial: { type: Number, index: true }
});


const trpgDatabase = mongoose.model('trpgDatabase', {
    groupid: { type: String, index: true },
    trpgDatabasefunction: [{
        topic: { type: String, index: true },
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
    groupid: { type: String, index: true },
    togm: Array,
    user: [{
        userid: {
            type: String, index: true,
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
    groupid: { type: String, index: true },
    trpgCommandfunction: [{
        topic: { type: String, index: true },
        contact: String
    }]
});
const trpgLevelSystem = mongoose.model('trpgLevelSystem', {
    groupid: { type: String, index: true },
    LevelUpWord: String,
    //在這群組升級時的升級語
    RankWord: String,
    //在這群組查詢等級時的回應
    Switch: { type: String, index: true },
    //是否啓動功能 config 1X 則1
    Hidden: {
        type: String
    },
    SwitchV2: {
        type: Boolean, index: true
    },
    //是否啓動功能 config 1X 則1
    HiddenV2: {
        type: Boolean
    },
    //大於此Lvl即為稱號.
    Title: Array,
    //是否顯示升級語 config X1 則1
    trpgLevelSystemfunction: [{
        userid: { type: String, index: true },
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
const trpgLevelSystemMember = mongoose.model('trpgLevelSystemMember', {
    groupid: { type: String, index: true },
    userid: { type: String, index: true },
    name: { type: String, index: true },
    EXP: Number,
    TitleName: String,
    //現在經驗值
    Level: Number,
    //等級
    multiEXPTimes: Number,
    multiEXP: Number,
    stopExp: Number,
    decreaseEXP: Number,
    decreaseEXPTimes: Number,
    //EVENT事件
    /**
     * 4. 停止得到經驗(X分鐘內)
     * 5. 發言經驗減少X(X分鐘內)
     * 6. 發言經驗增加X(X分鐘內)
    7. 吸收對方經驗(X分鐘內)
    8. 對方得到經驗值 X 倍(X分鐘內)
     */
    LastSpeakTime: {
        type: Date,
        default: Date.now
        //最後說話時間, 間隔一分鐘才提升經驗
    }
});
const trpgDarkRolling = mongoose.model('trpgDarkRolling', {
    groupid: { type: String, index: true },
    trpgDarkRollingfunction: [{
        userid: { type: String, index: true },
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
        LastTimeLog: { type: Date, index: true },
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
        PlurkCountText: Number,
        ApiCountRoll: Number,
        ApiCountText: Number
    }
});

const RollingLog = mongoose.model('RollingLog', {
    RollingLogfunction: {
        LogTime: { type: String, index: true },
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
    gpid: { type: String, index: true },
    id: { type: String, index: true },
    level: Number,
    startDate: Date,
    endDate: Date,
    name: String,
    notes: String,
    code: String,
    switch: Boolean
}));
const codelist = mongoose.model('codelist', new mongoose.Schema({
    code: { type: String, index: true },
    level: Number,
    endDate: { type: Date, index: true },
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
    id: { type: String, index: true },
    name: String,
    cardId: { type: String, index: true }
}));
const accountPW = mongoose.model('accountPW', new mongoose.Schema({
    id: { type: String, index: true },
    userName: { type: String, index: true },
    password: String,
    channel: [{
        id: String,
        botname: String,
        titleName: String
    }]
}, {
    indexes: [
        { 'channel.id': 1, 'channel.botname': 1 }
    ]
}));

const allowRolling = mongoose.model('allowRolling', new mongoose.Schema({
    id: String,
    botname: String,
    titleName: String
}, {
    indexes: [
        { id: 1, botname: 1 }
    ]
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
        required: true,
        index: true
    },
    roomNumber: {
        type: String,
        required: true,
        maxlength: 50,
        index: true
    }
}));

const characterCard = mongoose.model('characterCard', new mongoose.Schema({
    id: { type: String, index: true },
    public: { type: Boolean, index: true },
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
    groupID: { type: String, index: true },
    lastActiveAt: { type: Date, index: true }
}));

const exportUser = mongoose.model('exportUser', new mongoose.Schema({
    userID: { type: String, index: true },
    lastActiveAt: { type: Date, index: true },
    times: Number
}));
const init = mongoose.model('init', new mongoose.Schema({
    groupID: { type: String, index: true },
    list: [{
        name: String,
        result: Number,
        formula: String
    }]
}));

//個人新增event 時的紀錄。eventList會使用ID 來紀錄
const eventMember = mongoose.model('eventMember', new mongoose.Schema({
    userID: { type: String, index: true },
    userName: String,
    earnedEXP: Number,
    totailEarnedEXP: Number,
    energy: Number,
    lastActiveAt: { type: Date, index: true },
    eventList: [{
        title: String,
        eventID: { type: String, index: true },
    }],
    activityList: [{
        date: Date,
        activityDetail: String
    }]
}));

//整個event 列表，會從這裡進行抽取
const eventList = mongoose.model('eventList', new mongoose.Schema({
    title: String,
    chainTitle: { type: String, index: true },
    userID: { type: String, index: true },
    userName: String,
    expName: String,
    detail: [{
        event: String,
        result: Number
    }]
}));


//成長的開關控制
const developmentConductor = mongoose.model('developmentConductor', new mongoose.Schema({
    groupID: { type: String, index: true },
    switch: Boolean
}));

//成長的每一個擲骰結果
const developmentRollingRecord = mongoose.model('developmentRollingRecord', new mongoose.Schema({
    userID: { type: String, index: true },
    groupID: { type: String, index: true },
    date: Date,
    skillName: String,
    skillPer: Number,
    skillResult: Number,
    skillPerStyle: String,
    userName: String
    //成功,失敗,大成功,大失敗
}));

//.schedule Cron
//限制30次?
const agendaAtHKTRPG = mongoose.model('agendaAtHKTRPG', new mongoose.Schema({
    name: { type: String, index: true },
    data: Object,
    priority: Number,
    type: String,
    nextRunAt: { type: Date, index: true },
    lastModifiedBy: String,
    roleName: String,
    imageLink: String

}, { collection: "agendaAtHKTRPG" }));
const firstTimeMessage = mongoose.model('firstTimeMessage', new mongoose.Schema({
    userID: String,
    botname: String
}, {
    indexes: [
        { userID: 1, botname: 1 }
    ]
}));

const theNewsMessage = mongoose.model('theNewsMessage', new mongoose.Schema({
    userID: { type: String, index: true },
    botname: String,
    switch: Boolean
}));

const myName = mongoose.model('myName', new mongoose.Schema({
    userID: { type: String, index: true },
    name: String,
    shortName: String,
    imageLink: String
}));

const whatsapp = mongoose.model('whatsapp', new mongoose.Schema({
    sessionData: { type: String, index: true },
}));

const roleReact = mongoose.model('roleReact', new mongoose.Schema({
    message: String,
    messageID: { type: String, index: true },
    groupid: { type: String, index: true },
    serial: { type: Number, index: true },
    detail: [{
        roleID: String,
        emoji: String,
    }]

}));

const roleInvites = mongoose.model('roleInvites', new mongoose.Schema({
    roleID: { type: String, index: true },
    invitesLink: String,
    groupid: { type: String, index: true },
    serial: { type: Number, index: true }
}));

const translateChannel = mongoose.model('translateChannel', new mongoose.Schema({
    groupid: String,
    channelid: String,
    switch: Boolean
}));

const bcdiceRegedit = mongoose.model('bcdiceRegedit', new mongoose.Schema({
    botname: String,
    channelid: { type: String, index: true },
    trpgId: String
}, {
    indexes: [
        { botname: 1, channelid: 1 }
    ]
}));

const multiServer = mongoose.model('multiServer', new mongoose.Schema({
    channelid: String,
    multiId: String,
    guildName: String,
    channelName: String,
    guildID: String,
    botname: String
}));

// 修改 storyScript 的定義，從 schema 改為 model
const storyScript = mongoose.model('storyScript', new mongoose.Schema({
    id: String,
    title: String,
    content: Array,
    variables: {
        type: Map,
        of: String,
        default: new Map()
    },
    labels: {
        type: Map,
        of: Number,
        default: new Map()
    },
    createdAt: Date,
    updatedAt: Date
}));

// 遊戲日誌
const storyLog = mongoose.model('storyLog', new mongoose.Schema({
    sessionId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now },
    type: String, // debug, action, error
    content: mongoose.Schema.Types.Mixed
}));

const storyProgress = mongoose.model('storyProgress', new mongoose.Schema({
    sessionId: { type: String, index: true }, // 遊戲session ID
    storyId: { type: String, index: true }, // 故事ID
    userId: { type: String, index: true }, // 玩家ID
    groupId: String, // 群組ID
    channelId: String, // 頻道ID
    currentNode: String, // 當前節點
    variables: mongoose.Schema.Types.Mixed, // 變數狀態
    stats: mongoose.Schema.Types.Mixed, // 能力值
    inventory: [{ // 物品欄
        itemId: String,
        quantity: Number
    }],
    savePoints: [{ // 存檔點
        label: String,
        state: mongoose.Schema.Types.Mixed,
        timestamp: Date
    }],
    startedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false }
}));

const mongodbState = async () => {
    try {
        let ans = await mongoose.connection.db.command({ serverStatus: 1 });
        return ans;
    } catch (error) { }
}


module.exports = {
    mongodbState,
    randomAns,
    multiServer,
    block,
    chattest,
    randomAnsAllgroup,
    GroupSetting,
    trpgDatabaseAllgroup,
    trpgDatabase,
    trpgCommand,
    trpgLevelSystem,
    trpgLevelSystemMember,
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
    init,
    eventMember,
    eventList,
    developmentConductor,
    developmentRollingRecord,
    agendaAtHKTRPG,
    firstTimeMessage,
    theNewsMessage,
    myName,
    whatsapp,
    roleInvites,
    roleReact,
    randomAnsServer,
    randomAnsPersonal,
    translateChannel,
    bcdiceRegedit,
    storyScript,
    storyProgress,
    storyLog
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