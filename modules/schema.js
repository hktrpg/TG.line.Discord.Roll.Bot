"use strict";
if (!process.env.mongoURL) {
    return;
}
const mongoose = require('./db-connector.js').mongoose;

const chattest = mongoose.model('chattest', new mongoose.Schema({
    default: String,
    text: String,
    type: { type: String, index: true }
}));

const block = mongoose.model('block', new mongoose.Schema({
    groupid: { type: String, index: true },
    blockfunction: Array
}));

const randomAns = mongoose.model('randomAns', new mongoose.Schema({
    groupid: { type: String, index: true },
    randomAnsfunction: Array
}));

const randomAnsPersonal = mongoose.model('randomAnsPersonal', new mongoose.Schema({
    userid: { type: String, index: true },
    title: String,
    answer: Array,
    serial: { type: Number, index: true }
}));

const randomAnsAllgroup = mongoose.model('randomAnsAllgroup', new mongoose.Schema({
    randomAnsAllgroup: Array
}));

const randomAnsServer = mongoose.model('randomAnsServer', new mongoose.Schema({
    title: { type: String, index: true },
    answer: Array,
    serial: { type: Number, index: true }
}));

const trpgDatabase = mongoose.model('trpgDatabase', new mongoose.Schema({
    groupid: { type: String, index: true },
    trpgDatabasefunction: [{
        topic: { type: String, index: true },
        contact: String
    }]
}));

const trpgDatabaseAllgroup = mongoose.model('trpgDatabaseAllgroup', new mongoose.Schema({
    trpgDatabaseAllgroup: [{
        topic: String,
        contact: String
    }]
}));

const GroupSetting = mongoose.model('GroupSetting', new mongoose.Schema({
    groupid: { type: String, index: true },
    togm: Array,
    user: [{
        userid: {
            type: String,
            required: true,
            index: true
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
}));

const trpgCommand = mongoose.model('trpgCommand', new mongoose.Schema({
    groupid: { type: String, index: true },
    trpgCommandfunction: [{
        topic: { type: String, index: true },
        contact: String
    }]
}));

const trpgLevelSystem = mongoose.model('trpgLevelSystem', new mongoose.Schema({
    groupid: { type: String, index: true },
    LevelUpWord: String,
    RankWord: String,
    Switch: { type: String, index: true },
    Hidden: { type: String },
    SwitchV2: { type: Boolean, index: true },
    HiddenV2: { type: Boolean },
    Title: Array,
    trpgLevelSystemfunction: [{
        userid: { type: String, index: true },
        name: String,
        EXP: Number,
        Level: String,
        LastSpeakTime: {
            type: Date,
            default: Date.now,
            index: true
        }
    }]
}));

const trpgLevelSystemMember = mongoose.model('trpgLevelSystemMember', new mongoose.Schema({
    groupid: { type: String, index: true },
    userid: { type: String, index: true },
    name: { type: String, index: true },
    EXP: Number,
    TitleName: String,
    Level: Number,
    multiEXPTimes: Number,
    multiEXP: Number,
    stopExp: Number,
    decreaseEXP: Number,
    decreaseEXPTimes: Number,
    LastSpeakTime: {
        type: Date,
        default: Date.now,
        index: true
    }
}));

const trpgDarkRolling = mongoose.model('trpgDarkRolling', new mongoose.Schema({
    groupid: { type: String, index: true },
    trpgDarkRollingfunction: [{
        userid: { type: String, index: true },
        diyName: String,
        displayname: String
    }]
}));

const RealTimeRollingLog = mongoose.model('RealTimeRollingLog', new mongoose.Schema({
    RealTimeRollingLogfunction: {
        StartTime: String,
        LastTimeLog: { type: Date, index: true },
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
}));

const RollingLog = mongoose.model('RollingLog', new mongoose.Schema({
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
}));

const veryImportantPerson = mongoose.model('veryImportantPerson', new mongoose.Schema({
    gpid: { type: String, index: true },
    id: { type: String, index: true },
    level: Number,
    startDate: Date,
    endDate: { type: Date, index: true },
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
    name: {
        type: String,
        required: true,
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

const eventMember = mongoose.model('eventMember', new mongoose.Schema({
    userID: { type: String, index: true },
    userName: String,
    earnedEXP: Number,
    totailEarnedEXP: Number,
    energy: Number,
    lastActiveAt: { type: Date, index: true },
    eventList: [{
        title: String,
        eventID: { type: String, index: true }
    }],
    activityList: [{
        date: Date,
        activityDetail: String
    }]
}));

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

const developmentConductor = mongoose.model('developmentConductor', new mongoose.Schema({
    groupID: { type: String, index: true },
    switch: Boolean
}));

const developmentRollingRecord = mongoose.model('developmentRollingRecord', new mongoose.Schema({
    userID: { type: String, index: true },
    groupID: { type: String, index: true },
    date: { type: Date, index: true },
    skillName: String,
    skillPer: Number,
    skillResult: Number,
    skillPerStyle: String,
    userName: String
}));

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
    sessionData: { type: String, index: true }
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
}, {
    indexes: [
        { groupid: 1, channelid: 1 }
    ]
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
    channelid: { type: String, index: true },
    multiId: { type: String, index: true },
    guildName: String,
    channelName: String,
    guildID: { type: String, index: true },
    botname: String
}, {
    indexes: [
        { botname: 1, channelid: 1 }
    ]
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
    mongodbState
};