if (!process.env.mongoURL) return;
//Log everyday 01:00
const moment = require("moment");
const debugMode = (process.env.DEBUG) ? true : false;
const schema = require('./core-schema.js');
//50次 多少條訊息會上傳一次LOG
const oneHour = 1 * 60 * 60 * 1000;
const fiveMinutes = 1 * 20 * 1000;

//每一小時 24 * 60 * 60 * 1000 多久會上傳一次LOG紀錄 
const RollingLog = {
    RealTimeRollingLogfunction: {
        LastTimeLog: "",
        StartTime: "",
        LogTime: "",
        DiscordCountRoll: 0,
        DiscordCountText: 0,
        LineCountRoll: 0,
        LineCountText: 0,
        TelegramCountRoll: 0,
        TelegramCountText: 0,
        WWWCountRoll: 0,
        WWWCountText: 0,
        WhatsappCountRoll: 0,
        WhatsappCountText: 0,
        PlurkCountRoll: 0,
        PlurkCountText: 0
    }
};

getRecords();
//loopLogFiveMinutes
setInterval(saveLog, fiveMinutes);

var getState = async function () {
    let theNewData = await schema.RealTimeRollingLog.findOne({});
    return theNewData.RealTimeRollingLogfunction;
}


async function courtMessage(result, botname, inputStr) {
    if (result && result.text) {
        //SAVE THE LOG
        switch (botname) {
            case "Line":
                (debugMode) ? console.log('   Line \'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.LineCountRoll++;
                break;
            case "Telegram":
                (debugMode) ? console.log('Telegram\'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.TelegramCountRoll++;
                break;
            case "Whatsapp":
                (debugMode) ? console.log('Whatsapp\'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll++;
                break;
            case "WWW":
                (debugMode) ? console.log('     WWW\'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.WWWCountRoll++;
                break;
            case "Discord":
                (debugMode) ? console.log('Discord \'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.DiscordCountRoll++;
                break;
            case "Plurk":
                (debugMode) ? console.log('Plurk \'s inputStr: ', inputStr) : '';
                RollingLog.RealTimeRollingLogfunction.PlurkCountRoll++;
                break;
            default:
                break;
        }

        //await saveLog();
        return null;
    } else {
        switch (botname) {
            case "Line":
                RollingLog.RealTimeRollingLogfunction.LineCountText++;
                break;
            case "Telegram":
                RollingLog.RealTimeRollingLogfunction.TelegramCountText++;
                break;
            case "Whatsapp":
                RollingLog.RealTimeRollingLogfunction.WhatsappCountText++;
                break;
            case "WWW":
                RollingLog.RealTimeRollingLogfunction.WWWCountText++;
                break;
            case "Discord":
                RollingLog.RealTimeRollingLogfunction.DiscordCountText++;
                break;
            case "Plurk":
                RollingLog.RealTimeRollingLogfunction.PlurkCountText++;
                break;
            default:
                break;
        }
    }
    console.log(' RollingLog.RealTimeRollingLogfunction', RollingLog.RealTimeRollingLogfunction)
    return null;
}


//上傳用
async function saveLog() {
    console.log('SAVE')
    //假如沒有StartTime 或過了一天則上載中途紀錄到MLAB
    //每50次上傳即時紀錄到MLAB
    //simpleCourt % 50 == 0 || simpleCourt == 1
    //MLAB
    //RealTimeRollingLogfunction
    //SET 紀錄
    let result = await schema.RealTimeRollingLog.findOneAndUpdate({}, {
        $set: {
            LogTime: Date(Date.now()).toLocaleString("en-US", {
                timeZone: "Asia/HongKong"
            })
        },
        $inc: {
            "RealTimeRollingLogfunction.DiscordCountRoll": RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
            "RealTimeRollingLogfunction.DiscordCountText": RollingLog.RealTimeRollingLogfunction.DiscordCountText,
            "RealTimeRollingLogfunction.LineCountRoll": RollingLog.RealTimeRollingLogfunction.LineCountRoll,
            "RealTimeRollingLogfunction.LineCountText": RollingLog.RealTimeRollingLogfunction.LineCountText,
            "RealTimeRollingLogfunction.TelegramCountRoll": RollingLog.RealTimeRollingLogfunction.TelegramCountRoll,
            "RealTimeRollingLogfunction.TelegramCountText": RollingLog.RealTimeRollingLogfunction.TelegramCountText,
            "RealTimeRollingLogfunction.WWWCountRoll": RollingLog.RealTimeRollingLogfunction.WWWCountRoll,
            "RealTimeRollingLogfunction.WWWCountText": RollingLog.RealTimeRollingLogfunction.WWWCountText,
            "RealTimeRollingLogfunction.WhatsappCountRoll": RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll,
            "RealTimeRollingLogfunction.WhatsappCountText": RollingLog.RealTimeRollingLogfunction.WhatsappCountText,
            "RealTimeRollingLogfunction.PlurkCountRoll": RollingLog.RealTimeRollingLogfunction.PlurkCountRoll,
            "RealTimeRollingLogfunction.PlurkCountText": RollingLog.RealTimeRollingLogfunction.PlurkCountText
        }
    })
    console.log('result', result)
    resetLog();
    pushToDefiniteLog();
    //console.log("RollingLog: ", RollingLog)
    return null;
}

async function pushToDefiniteLog() {
    if (!RollingLog.RealTimeRollingLogfunction.LastTimeLog || Date.now() - RollingLog.RealTimeRollingLogfunction.LastTimeLog >= (oneHour)) {
        RollingLog.RealTimeRollingLogfunction.LastTimeLog = Date.now();
        //上傳中途紀錄MLAB
        // start today
        //PUSH 推送
        let theNewData = await schema.RealTimeRollingLog.findOne({});
        let temp = {
            RollingLogfunction:
            {
                LogTime: Date(Date.now()).toLocaleString("en-US", {
                    timeZone: "Asia/HongKong"
                }),
                DiscordCountRoll: theNewData.RealTimeRollingLogfunction.DiscordCountRoll,
                DiscordCountText: theNewData.RealTimeRollingLogfunction.DiscordCountText,
                LineCountRoll: theNewData.RealTimeRollingLogfunction.LineCountRoll,
                LineCountText: theNewData.RealTimeRollingLogfunction.LineCountText,
                TelegramCountRoll: theNewData.RealTimeRollingLogfunction.TelegramCountRoll,
                TelegramCountText: theNewData.RealTimeRollingLogfunction.TelegramCountText,
                WWWCountRoll: theNewData.RealTimeRollingLogfunction.WWWCountRoll,
                WWWCountText: theNewData.RealTimeRollingLogfunction.WWWCountText,
                WhatsappCountRoll: theNewData.RealTimeRollingLogfunction.WhatsappCountRoll,
                WhatsappCountText: theNewData.RealTimeRollingLogfunction.WhatsappCountText,
                PlurkCountRoll: theNewData.RealTimeRollingLogfunction.PlurkCountRoll,
                PlurkCountText: theNewData.RealTimeRollingLogfunction.PlurkCountText
            }
        }
        await schema.RollingLog.create(temp);
    }
    return;
}

async function getRecords() {
    let theNewData = await schema.RealTimeRollingLog.findOne({});
    if (!theNewData) return;

    RollingLog.RealTimeRollingLogfunction = {
        LastTimeLog: theNewData.RealTimeRollingLogfunction.LastTimeLog || "",
        StartTime: theNewData.RealTimeRollingLogfunction.StartTime || Date(Date.now()).toLocaleString("en-US", {
            timeZone: "Asia/HongKong"
        }),
        LogTime: theNewData.RealTimeRollingLogfunction.LogTime || ""
    };
    //console.log('RollingLog', RollingLog)

    return;
}

function resetLog() {
    RollingLog.RealTimeRollingLogfunction =
    {
        DiscordCountRoll: 0,
        DiscordCountText: 0,
        LineCountRoll: 0,
        LineCountText: 0,
        TelegramCountRoll: 0,
        TelegramCountText: 0,
        WWWCountRoll: 0,
        WWWCountText: 0,
        WhatsappCountRoll: 0,
        WhatsappCountText: 0,
        PlurkCountRoll: 0,
        PlurkCountText: 0
    }
}



module.exports = {
    courtMessage,
    getState
};