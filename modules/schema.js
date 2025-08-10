"use strict";
if (!process.env.mongoURL) {
    return;
}

const mongoose = require('./db-connector.js').mongoose;
const { Schema } = mongoose;

// Chat related schemas
const chatTestSchema = mongoose.model('chattest', {
    default: String,
    text: String,
    type: { type: String, index: true }
});

const blockSchema = mongoose.model('block', {
    groupid: { type: String, index: true },
    blockfunction: Array
});

// Random answer related schemas
const randomAnswerSchema = mongoose.model('randomAns', {
    groupid: { type: String, index: true },
    randomAnsfunction: Array
});

const randomAnswerPersonalSchema = mongoose.model('randomAnsPersonal', {
    userid: { type: String, index: true },
    title: String,
    answer: Array,
    serial: { type: Number, index: true }
});

const randomAnswerAllGroupSchema = mongoose.model('randomAnsAllgroup', {
    randomAnsAllgroup: Array
});

const randomAnswerServerSchema = mongoose.model('randomAnsServer', {
    title: { type: String, index: true },
    answer: Array,
    serial: { type: Number, index: true }
});

// TRPG related schemas
const trpgDatabaseSchema = mongoose.model('trpgDatabase', {
    groupid: { type: String, index: true },
    trpgDatabasefunction: [{
        topic: { type: String, index: true },
        contact: String
    }]
});

const trpgDatabaseAllGroupSchema = mongoose.model('trpgDatabaseAllgroup', {
    trpgDatabaseAllgroup: [{
        topic: String,
        contact: String
    }]
});

// Group settings schema
const groupSettingsSchema = mongoose.model('GroupSetting', {
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

const trpgCommandSchema = mongoose.model('trpgCommand', {
    groupid: { type: String, index: true },
    trpgCommandfunction: [{
        topic: { type: String, index: true },
        contact: String
    }]
});

// Level system schemas
const trpgLevelSystemSchema = mongoose.model('trpgLevelSystem', {
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
            default: Date.now
        }
    }]
});

const trpgLevelSystemMemberSchema = mongoose.model('trpgLevelSystemMember', {
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
        default: Date.now
    }
});

const trpgDarkRollingSchema = mongoose.model('trpgDarkRolling', {
    groupid: { type: String, index: true },
    trpgDarkRollingfunction: [{
        userid: { type: String, index: true },
        diyName: String,
        displayname: String
    }]
});

// Logging schemas
const realTimeRollingLogSchema = mongoose.model('RealTimeRollingLog', {
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
});

const rollingLogSchema = mongoose.model('RollingLog', {
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

// Character and user related schemas
const veryImportantPersonSchema = mongoose.model('veryImportantPerson', new mongoose.Schema({
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

const codeListSchema = mongoose.model('codelist', new mongoose.Schema({
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

const characterGroupSwitchSchema = mongoose.model('characterGpSwitch', new mongoose.Schema({
    gpid: Array,
    id: { type: String, index: true },
    name: String,
    cardId: { type: String, index: true }
}));

const accountPasswordSchema = mongoose.model('accountPW', new mongoose.Schema({
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

const allowRollingSchema = mongoose.model('allowRolling', new mongoose.Schema({
    id: String,
    botname: String,
    titleName: String
}, {
    indexes: [
        { id: 1, botname: 1 }
    ]
}));

const chatRoomSchema = mongoose.model('chatRoom', new mongoose.Schema({
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

const characterCardSchema = mongoose.model('characterCard', new mongoose.Schema({
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

// Export related schemas
const exportGroupSchema = mongoose.model('exportGp', new mongoose.Schema({
    groupID: { type: String, index: true },
    lastActiveAt: { type: Date, index: true }
}));

const exportUserSchema = mongoose.model('exportUser', new mongoose.Schema({
    userID: { type: String, index: true },
    lastActiveAt: { type: Date, index: true },
    times: Number
}));

const initSchema = mongoose.model('init', new mongoose.Schema({
    groupID: { type: String, index: true },
    active: { type: Boolean, default: false },
    turn: { type: Number, default: 0 },
    round: { type: Number, default: 0 },
    list: [{
        name: String,
        result: Number,
        formula: String,
        status: String
    }]
}));

// Event related schemas
const eventMemberSchema = mongoose.model('eventMember', new mongoose.Schema({
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

const eventListSchema = mongoose.model('eventList', new mongoose.Schema({
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

// Development related schemas
const developmentConductorSchema = mongoose.model('developmentConductor', new mongoose.Schema({
    groupID: { type: String, index: true },
    switch: Boolean
}));

const developmentRollingRecordSchema = mongoose.model('developmentRollingRecord', new mongoose.Schema({
    userID: { type: String, index: true },
    groupID: { type: String, index: true },
    date: Date,
    skillName: String,
    skillPer: Number,
    skillResult: Number,
    skillPerStyle: String,
    userName: String
}));

// Schedule related schemas
const agendaAtHKTRPGSchema = mongoose.model('agendaAtHKTRPG', new mongoose.Schema({
    name: { type: String, index: true },
    data: Object,
    priority: Number,
    type: String,
    nextRunAt: { type: Date, index: true },
    lastModifiedBy: String,
    roleName: String,
    imageLink: String
}, { collection: "agendaAtHKTRPG" }));

// Message related schemas
const firstTimeMessageSchema = mongoose.model('firstTimeMessage', new mongoose.Schema({
    userID: String,
    botname: String
}, {
    indexes: [
        { userID: 1, botname: 1 }
    ]
}));

const newsMessageSchema = mongoose.model('theNewsMessage', new mongoose.Schema({
    userID: { type: String, index: true },
    botname: String,
    switch: Boolean
}));

const userNameSchema = mongoose.model('myName', new mongoose.Schema({
    userID: { type: String, index: true },
    name: String,
    shortName: String,
    imageLink: String
}));

const whatsappSchema = mongoose.model('whatsapp', new mongoose.Schema({
    sessionData: { type: String, index: true },
}));

// Role related schemas
const roleReactSchema = mongoose.model('roleReact', new mongoose.Schema({
    message: String,
    messageID: { type: String, index: true },
    groupid: { type: String, index: true },
    serial: { type: Number, index: true },
    detail: [{
        roleID: String,
        emoji: String,
    }]
}));

const roleInvitesSchema = mongoose.model('roleInvites', new mongoose.Schema({
    roleID: { type: String, index: true },
    invitesLink: String,
    groupid: { type: String, index: true },
    serial: { type: Number, index: true }
}));

// Channel related schemas
const translateChannelSchema = mongoose.model('translateChannel', new mongoose.Schema({
    groupid: String,
    channelid: String,
    switch: Boolean
}));

const bcdiceRegeditSchema = mongoose.model('bcdiceRegedit', new mongoose.Schema({
    botname: String,
    channelid: { type: String, index: true },
    trpgId: String
}, {
    indexes: [
        { botname: 1, channelid: 1 }
    ]
}));

const multiServerSchema = mongoose.model('multiServer', new mongoose.Schema({
    channelid: String,
    multiId: String,
    guildName: String,
    channelName: String,
    guildID: String,
    botname: String
}));

// Schema for forwarded messages in character cards
const forwardedMessageSchema = mongoose.model('forwardedMessage', new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    sourceMessageId: { type: String, required: true, index: true },
    sourceChannelId: { type: String, required: true, index: true },
    characterName: { type: String, required: true },
    forwardedAt: { type: Date, default: Date.now },
    fixedId: { type: Number, required: true }
}, {
    // Create a compound index to ensure fixedId is unique per user
    indexes: [
        { userId: 1, fixedId: 1, unique: true },
        { userId: 1, sourceMessageId: 1 }
    ]
}));

// Schema for tracking last 20 myName usage records per group
const myNameRecordSchema = new Schema({
    groupID: { type: String, required: true, index: true },
    botname: { type: String, required: true },
    records: [{
        userID: { type: String, required: true },
        myNameID: { type: Schema.Types.ObjectId, ref: 'UserName' },
        name: { type: String, required: true },
        imageLink: { type: String, required: true },
        content: { type: String, required: true },
        displayname: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// First check if model already exists (to avoid model overwrite warning)
const MyNameRecord = mongoose.models.MyNameRecord || mongoose.model('MyNameRecord', myNameRecordSchema);

// MongoDB state check function
const getMongoDBState = async () => {
    try {
        // Instead of using serverStatus, we'll do a simple ping to check connection
        await mongoose.connection.db.command({ ping: 1 });
        return { ok: 1, status: 'connected' };
    } catch (error) {
        console.error('Failed to get MongoDB state:', error);
        return null;
    }
};

const storyTellerRoundSchema = mongoose.model('storyTellerRound', new mongoose.Schema({
    groupID: { type: String, index: true },
    roundNumber: { type: Number, index: true },
    story: String,
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
}));
const storyTellerScriptSchema = mongoose.model('storyTellerScript', new mongoose.Schema({
    groupID: { type: String, index: true },
    story: String,
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
}));

const storyTellerScriptCollectionSchema = mongoose.model('storyTellerScriptCollection', new mongoose.Schema({
    groupID: { type: String, index: true },
    script: String,
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
}));




module.exports = {
    mongodbState: getMongoDBState,
    randomAns: randomAnswerSchema,
    multiServer: multiServerSchema,
    block: blockSchema,
    chattest: chatTestSchema,
    randomAnsAllgroup: randomAnswerAllGroupSchema,
    GroupSetting: groupSettingsSchema,
    trpgDatabaseAllgroup: trpgDatabaseAllGroupSchema,
    trpgDatabase: trpgDatabaseSchema,
    trpgCommand: trpgCommandSchema,
    trpgLevelSystem: trpgLevelSystemSchema,
    trpgLevelSystemMember: trpgLevelSystemMemberSchema,
    trpgDarkRolling: trpgDarkRollingSchema,
    RealTimeRollingLog: realTimeRollingLogSchema,
    RollingLog: rollingLogSchema,
    characterCard: characterCardSchema,
    veryImportantPerson: veryImportantPersonSchema,
    characterGpSwitch: characterGroupSwitchSchema,
    codelist: codeListSchema,
    chatRoom: chatRoomSchema,
    exportGp: exportGroupSchema,
    exportUser: exportUserSchema,
    accountPW: accountPasswordSchema,
    allowRolling: allowRollingSchema,
    init: initSchema,
    eventMember: eventMemberSchema,
    eventList: eventListSchema,
    developmentConductor: developmentConductorSchema,
    developmentRollingRecord: developmentRollingRecordSchema,
    agendaAtHKTRPG: agendaAtHKTRPGSchema,
    firstTimeMessage: firstTimeMessageSchema,
    theNewsMessage: newsMessageSchema,
    myName: userNameSchema,
    whatsapp: whatsappSchema,
    roleInvites: roleInvitesSchema,
    roleReact: roleReactSchema,
    randomAnsServer: randomAnswerServerSchema,
    randomAnsPersonal: randomAnswerPersonalSchema,
    translateChannel: translateChannelSchema,
    bcdiceRegedit: bcdiceRegeditSchema,
    myNameRecord: MyNameRecord,
    forwardedMessage: forwardedMessageSchema
};