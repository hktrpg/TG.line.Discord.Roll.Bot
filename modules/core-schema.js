if (process.env.mongoURL) {
    const mongoose = require('mongoose');
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
            StartTime: Date,
            //現在時間
            LogTime: Date,
            DiscordCountRoll: Number,
            DiscordCountText: Number,
            LineCountRoll: Number,
            LineCountText: Number,
            TelegramCountRoll: Number,
            TelegramCountText: Number
        },
        Sided: Array
    });
    const RollingLog = mongoose.model('RollingLog', {
        RollingLogfunction: {
            LogTime: Date,
            DiscordCountRoll: Number,
            DiscordCountText: Number,
            LineCountRoll: Number,
            LineCountText: Number,
            TelegramCountRoll: Number,
            TelegramCountText: Number
        }
    });


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
        RollingLog
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
}