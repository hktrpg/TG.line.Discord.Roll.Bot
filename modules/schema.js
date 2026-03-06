"use strict";

const models = {};

if (process.env.mongoURL) {
    const mongoose = require('./db-connector.js').mongoose;
    const { Schema } = mongoose;

    // Chat related schemas
    models.chattest = mongoose.model('chattest', new Schema({
        default: String,
        text: String,
        type: { type: String, index: true }
    }));

    models.block = mongoose.model('block', new Schema({
        groupid: { type: String, index: true },
        blockfunction: Array
    }));

    // Random answer related schemas
    models.randomAns = mongoose.model('randomAns', new Schema({
        groupid: { type: String, index: true },
        randomAnsfunction: Array
    }));

    models.randomAnsPersonal = mongoose.model('randomAnsPersonal', new Schema({
        userid: { type: String, index: true },
        title: String,
        answer: Array,
        serial: { type: Number, index: true }
    }));

    models.randomAnsAllgroup = mongoose.model('randomAnsAllgroup', new Schema({
        randomAnsAllgroup: Array
    }));

    models.randomAnsServer = mongoose.model('randomAnsServer', new Schema({
        title: { type: String, index: true },
        answer: Array,
        serial: { type: Number, index: true }
    }));

    // TRPG related schemas
    models.trpgDatabase = mongoose.model('trpgDatabase', new Schema({
        groupid: { type: String, index: true },
        trpgDatabasefunction: [{
            topic: { type: String, index: true },
            contact: String
        }]
    }));

    models.trpgDatabaseAllgroup = mongoose.model('trpgDatabaseAllgroup', new Schema({
        trpgDatabaseAllgroup: [{
            topic: String,
            contact: String
        }]
    }));

    // Group settings schema
    models.GroupSetting = mongoose.model('GroupSetting', new Schema({
        groupid: { type: String, index: true },
        togm: Array,
        GroupSettingfunction: Array,
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
    }));

    models.trpgCommand = mongoose.model('trpgCommand', new Schema({
        groupid: { type: String, index: true },
        trpgCommandfunction: [{
            topic: { type: String, index: true },
            contact: String
        }]
    }));

    // Level system schemas
    models.trpgLevelSystem = mongoose.model('trpgLevelSystem', new Schema({
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
    }, {
        indexes: [
            { groupid: 1, SwitchV2: 1 }
        ]
    }));

    models.trpgLevelSystemMember = mongoose.model('trpgLevelSystemMember', new Schema({
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
    }, {
        indexes: [
            { groupid: 1, userid: 1 }
        ]
    }));

    models.trpgDarkRolling = mongoose.model('trpgDarkRolling', new Schema({
        groupid: { type: String, index: true },
        trpgDarkRollingfunction: [{
            userid: { type: String, index: true },
            diyName: String,
            displayname: String
        }]
    }));

    // Logging schemas
    models.RealTimeRollingLog = mongoose.model('RealTimeRollingLog', new Schema({
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

    const rollingLogSchemaDef = new Schema({
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
    }, { timestamps: true });
    rollingLogSchemaDef.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
    models.RollingLog = mongoose.model('RollingLog', rollingLogSchemaDef);

    // Character and user related schemas
    models.veryImportantPerson = mongoose.model('veryImportantPerson', new Schema({
        gpid: { type: String, index: true },
        id: { type: String, index: true },
        level: Number,
        startDate: Date,
        endDate: Date,
        name: String,
        notes: String,
        code: String,
        switch: Boolean
    }, {
        indexes: [
            { gpid: 1, id: 1 },
            { id: 1, gpid: 1 }
        ]
    }));

    models.codelist = mongoose.model('codelist', new Schema({
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

    models.patreonMember = mongoose.model('patreonMember', new Schema({
        patreonName: { type: String, required: true, unique: true, index: true },
        key: { type: String },
        keyHash: { type: String, required: true, unique: true, index: true },
        keyEncrypted: { type: String, required: true },
        level: { type: Number, required: true },
        name: String,
        notes: String,
        switch: { type: Boolean, default: true },
        startDate: { type: Date, default: Date.now },
        emailEncrypted: String,
        discordEncrypted: String,
        lastUpdatedFromPatreon: Date,
        history: [{
            at: { type: Date, default: Date.now },
            action: { type: String, enum: ['on', 'off', 'add', 'remove', 'update'] },
            source: String,
            reason: String,
            detail: String
        }],
        slots: [{
            targetId: String,
            targetType: { type: String, enum: ['user', 'channel'], default: 'user' },
            platform: String,
            name: String,
            switch: { type: Boolean, default: true }
        }]
    }, {
        indexes: [
            { keyHash: 1 },
            { patreonName: 1 }
        ]
    }));

    models.characterGpSwitch = mongoose.model('characterGpSwitch', new Schema({
        gpid: Array,
        id: { type: String, index: true },
        name: String,
        cardId: { type: String, index: true }
    }, {
        indexes: [
            { id: 1, cardId: 1 }
        ]
    }));

    models.accountPW = mongoose.model('accountPW', new Schema({
        id: { type: String, index: true },
        userName: { type: String, index: true },
        password: String,
        legacyPassword: { type: String, default: null },
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

    models.allowRolling = mongoose.model('allowRolling', new Schema({
        id: String,
        botname: String,
        titleName: String
    }, {
        indexes: [
            { id: 1, botname: 1 }
        ]
    }));

    models.chatRoom = mongoose.model('chatRoom', new Schema({
        name: { type: String, required: true, maxlength: 50, trim: true },
        msg: { type: String, required: true, trim: true },
        time: { type: Date, required: true, index: true, default: Date.now },
        roomNumber: { type: String, required: true, maxlength: 50, trim: true, index: true }
    }));

    models.characterCard = mongoose.model('characterCard', new Schema({
        id: { type: String, index: true },
        public: { type: Boolean, index: true },
        name: { type: String, maxlength: 50 },
        image: { type: String },
        nameShow: Boolean,
        state: [{
            name: { type: String, maxlength: 50 },
            itemA: { type: String, maxlength: 50 },
            itemB: { type: String, maxlength: 50 }
        }],
        roll: [{
            name: { type: String, maxlength: 50 },
            itemA: { type: String, maxlength: 150 }
        }],
        notes: [{
            name: { type: String, maxlength: 50 },
            itemA: { type: String, maxlength: 1500 }
        }]
    }));

    models.exportGp = mongoose.model('exportGp', new Schema({
        groupID: { type: String, index: true },
        lastActiveAt: { type: Date, index: true }
    }));

    models.exportUser = mongoose.model('exportUser', new Schema({
        userID: { type: String, index: true },
        lastActiveAt: { type: Date, index: true },
        times: Number
    }));

    models.init = mongoose.model('init', new Schema({
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

    models.eventMember = mongoose.model('eventMember', new Schema({
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

    models.eventList = mongoose.model('eventList', new Schema({
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

    models.developmentConductor = mongoose.model('developmentConductor', new Schema({
        groupID: { type: String, index: true },
        switch: Boolean
    }));

    models.developmentRollingRecord = mongoose.model('developmentRollingRecord', new Schema({
        userID: { type: String, index: true },
        groupID: { type: String, index: true },
        date: Date,
        skillName: String,
        skillPer: Number,
        skillResult: Number,
        skillPerStyle: String,
        userName: String
    }, {
        indexes: [
            { groupID: 1, userID: 1 },
            { userID: 1, date: -1 }
        ]
    }));

    models.agendaAtHKTRPG = mongoose.model('agendaAtHKTRPG', new Schema({
        name: { type: String, index: true },
        data: Object,
        priority: Number,
        type: String,
        nextRunAt: { type: Date, index: true },
        lastModifiedBy: String,
        roleName: String,
        imageLink: String
    }, { 
        collection: "agendaAtHKTRPG",
        indexes: [
            { name: 1, nextRunAt: 1, priority: -1, lockedAt: 1, disabled: 1 },
            { nextRunAt: 1, lockedAt: 1, disabled: 1 },
            { name: 1, disabled: 1, lockedAt: 1 }
        ]
    }));

    models.firstTimeMessage = mongoose.model('firstTimeMessage', new Schema({
        userID: String,
        botname: String
    }, {
        indexes: [
            { userID: 1, botname: 1 }
        ]
    }));

    models.theNewsMessage = mongoose.model('theNewsMessage', new Schema({
        userID: { type: String, index: true },
        botname: { type: String, index: true },
        switch: Boolean
    }, {
        indexes: [
            { userID: 1, botname: 1 }
        ]
    }));

    models.myName = mongoose.model('myName', new Schema({
        userID: { type: String, index: true },
        name: String,
        shortName: String,
        imageLink: String
    }));

    models.whatsapp = mongoose.model('whatsapp', new Schema({
        sessionData: { type: String, index: true },
    }));

    models.roleReact = mongoose.model('roleReact', new Schema({
        message: String,
        messageID: { type: String, index: true },
        groupid: { type: String, index: true },
        serial: { type: Number, index: true },
        detail: [{
            roleID: String,
            emoji: String,
        }]
    }, {
        indexes: [
            { groupid: 1, messageID: 1 }
        ]
    }));

    models.roleInvites = mongoose.model('roleInvites', new Schema({
        roleID: { type: String, index: true },
        invitesLink: String,
        groupid: { type: String, index: true },
        serial: { type: Number, index: true }
    }, {
        indexes: [
            { groupid: 1, roleID: 1 }
        ]
    }));

    models.translateChannel = mongoose.model('translateChannel', new Schema({
        groupid: { type: String, index: true },
        channelid: { type: String, index: true },
        switch: Boolean
    }, {
        indexes: [
            { groupid: 1, channelid: 1 }
        ]
    }));

    models.bcdiceRegedit = mongoose.model('bcdiceRegedit', new Schema({
        botname: String,
        channelid: { type: String, index: true },
        trpgId: String
    }, {
        indexes: [
            { botname: 1, channelid: 1 }
        ]
    }));

    models.multiServer = mongoose.model('multiServer', new Schema({
        channelid: { type: String, index: true },
        multiId: String,
        guildName: String,
        channelName: String,
        guildID: { type: String, index: true },
        botname: { type: String, index: true }
    }, {
        indexes: [
            { channelid: 1, botname: 1 },
            { guildID: 1, channelid: 1 }
        ]
    }));

    models.story = mongoose.model('story', new Schema({
        ownerID: { type: String, required: true, index: true },
        ownerName: String,
        alias: { type: String, required: true },
        title: String,
        type: { type: String, default: 'story', index: true },
        payload: Schema.Types.Mixed,
        startPermission: { type: String, enum: ['AUTHOR_ONLY', 'GROUP_ONLY', 'ANYONE'], default: 'AUTHOR_ONLY', index: true },
        allowedGroups: [String],
        isActive: { type: Boolean, default: true },
    }, {
        timestamps: true,
        indexes: [
            { ownerID: 1, alias: 1, unique: true }
        ]
    }));

    models.storyRun = mongoose.model('storyRun', new Schema({
        story: { type: Schema.Types.ObjectId, ref: 'story', index: true },
        storyOwnerID: { type: String, index: true },
        storyAlias: String,
        starterID: { type: String, required: true, index: true },
        starterName: String,
        botname: String,
        groupID: { type: String, index: true },
        channelID: { type: String, index: true },
        startPermissionAtRun: { type: String, enum: ['AUTHOR_ONLY', 'GROUP_ONLY', 'ANYONE'], index: true },
        participantPolicy: { type: String, enum: ['AUTHOR_ONLY', 'SPECIFIED', 'ANYONE'], default: 'ANYONE', index: true },
        allowedUserIDs: [String],
        variables: Schema.Types.Mixed,
        stats: Schema.Types.Mixed,
        playerVariables: Schema.Types.Mixed,
        currentPageId: String,
        history: [{
            pageId: String,
            choiceText: String,
            choiceAction: String,
            variables: Schema.Types.Mixed,
            stats: Schema.Types.Mixed,
            timestamp: { type: Date, default: Date.now }
        }],
        isEnded: { type: Boolean, default: false, index: true },
        isPaused: { type: Boolean, default: false, index: true },
        pausedAt: { type: Date, index: true },
        endingId: String,
        endingText: String,
        endedAt: { type: Date, index: true },
        stPollLastMessageId: { type: String, index: true },
        stPollLastStartedAt: { type: Date, index: true },
        stPollNoVoteStreak: { type: Number, default: 0 },
    }, {
        timestamps: true,
        indexes: [
            { story: 1, createdAt: -1 },
            { groupID: 1, createdAt: -1 },
            { starterID: 1, createdAt: -1 },
            { channelID: 1, isEnded: 1 }
        ]
    }));

    models.forwardedMessage = mongoose.model('forwardedMessage', new Schema({
        userId: { type: String, required: true, index: true },
        guildId: { type: String, required: true, index: true },
        channelId: { type: String, required: true, index: true },
        sourceMessageId: { type: String, required: true, index: true },
        sourceChannelId: { type: String, required: true, index: true },
        characterName: { type: String, required: true },
        forwardedAt: { type: Date, default: Date.now },
        fixedId: { type: Number, required: true }
    }, {
        indexes: [
            { userId: 1, fixedId: 1, unique: true },
            { userId: 1, sourceMessageId: 1 }
        ]
    }));

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

    models.myNameRecord = mongoose.models.MyNameRecord || mongoose.model('MyNameRecord', myNameRecordSchema);

    const mongodbStateSchema = new mongoose.Schema({
        errorDate: { type: Date, default: Date.now },
        lastCheck: { type: Date, default: Date.now },
        status: { type: String, default: 'unknown' },
        consecutiveErrors: { type: Number, default: 0 },
        totalErrors: { type: Number, default: 0 },
        lastError: { type: String, default: '' }
    }, { collection: 'mongodbstate' });

    models.mongodbState = mongoose.model('MongodbState', mongodbStateSchema);

    models.mongodbStateCheck = async () => {
        try {
            await mongoose.connection.db.command({ ping: 1 });
            const client = mongoose.connection.getClient();
            let connections = {
                readyState: mongoose.connection.readyState,
                name: mongoose.connection.name,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                db: mongoose.connection.db ? mongoose.connection.db.databaseName : null
            };
            if (client?.topology) {
                try {
                    const pools = client.topology.s?.description?.servers || [];
                    let totalConnections = 0;
                    let poolDetails = [];
                    for (const server of pools) {
                        const pool = server.s?.pool;
                        if (pool) {
                            totalConnections += pool.totalConnectionCount || 0;
                            poolDetails.push({
                                address: server.address,
                                totalConnectionCount: pool.totalConnectionCount || 0,
                                availableConnectionCount: pool.availableConnectionCount || 0,
                                pendingConnectionCount: pool.pendingConnectionCount || 0,
                                borrowedConnectionCount: pool.borrowedConnectionCount || 0
                            });
                        }
                    }
                    connections.pool = { totalConnections, poolDetails };
                } catch {
                    connections.pool = { error: 'Unable to get pool details' };
                }
            }
            return { ok: 1, status: 'connected', connections };
        } catch (error) {
            console.error('[Schema] Failed to get MongoDB state:', error);
            return null;
        }
    };
}

module.exports = models;
