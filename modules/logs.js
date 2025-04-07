"use strict";
if (!process.env.mongoURL) return;
//Log everyday 01:00
const debugMode = (process.env.DEBUG) ? true : false;
const schema = require('./schema.js');
const checkMongodb = require('./dbWatchdog.js');
//50次 多少條訊息會上傳一次LOG
const ONE_HOUR = 1 * 60 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
let shardid = 0;
//每一小時 24 * 60 * 60 * 1000 多久會上傳一次LOG紀錄 
const RollingLog = {
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
    PlurkCountText: 0,
    ApiCountRoll: 0,
    ApiCountText: 0
};

//Log 開始
(async () => {
    try {
        await getRecords();
    } catch (e) {
        console.error(`log error #35 ${e}`)
        setTimeout(async () => {
            await getRecords();
        }, 100)

    }
    try {
        const loopLogFiveMinutes = setInterval(saveLog, FIVE_MINUTES);
    } catch (e) {
        console.error(`log error #35 ${e}`)
    }
})();




const getState = async function () {
    // Get real-time data
    let theNewData = await schema.RealTimeRollingLog.findOne({}).catch(error => console.error('log # 52 mongoDB error: ', error.name, error.reason));
    if (!theNewData) return;
    
    // Clean up time strings
    theNewData.RealTimeRollingLogfunction.LogTime = theNewData.RealTimeRollingLogfunction.LogTime.replace(/\s+GMT.*$/, '');
    theNewData.RealTimeRollingLogfunction.StartTime = theNewData.RealTimeRollingLogfunction.StartTime.replace(/\s+GMT.*$/, '');
    
    // Get historical data for analysis
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    
    // Get yearly data
    const yearlyData = await schema.RollingLog.aggregate([
        {
            $match: {
                "RollingLogfunction.LogTime": {
                    $regex: `^${currentYear}`
                }
            }
        },
        {
            $group: {
                _id: null,
                totalDiscordRoll: { $sum: "$RollingLogfunction.DiscordCountRoll" },
                totalDiscordText: { $sum: "$RollingLogfunction.DiscordCountText" },
                totalLineRoll: { $sum: "$RollingLogfunction.LineCountRoll" },
                totalLineText: { $sum: "$RollingLogfunction.LineCountText" },
                totalTelegramRoll: { $sum: "$RollingLogfunction.TelegramCountRoll" },
                totalTelegramText: { $sum: "$RollingLogfunction.TelegramCountText" },
                totalWWWRoll: { $sum: "$RollingLogfunction.WWWCountRoll" },
                totalWWWText: { $sum: "$RollingLogfunction.WWWCountText" },
                totalWhatsappRoll: { $sum: "$RollingLogfunction.WhatsappCountRoll" },
                totalWhatsappText: { $sum: "$RollingLogfunction.WhatsappCountText" },
                totalPlurkRoll: { $sum: "$RollingLogfunction.PlurkCountRoll" },
                totalPlurkText: { $sum: "$RollingLogfunction.PlurkCountText" }
            }
        }
    ]).catch(error => console.error('log # yearly aggregation error: ', error));

    // Get quarterly data
    const quarterlyData = await schema.RollingLog.aggregate([
        {
            $match: {
                "RollingLogfunction.LogTime": {
                    $regex: `^${currentYear}-(0[1-3]|1[0-2])`
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: {
                        $dateFromString: {
                            dateString: "$RollingLogfunction.LogTime",
                            format: "%Y-%m-%d %H:%M:%S"
                        }
                    }
                },
                discordRoll: { $sum: "$RollingLogfunction.DiscordCountRoll" },
                lineRoll: { $sum: "$RollingLogfunction.LineCountRoll" },
                telegramRoll: { $sum: "$RollingLogfunction.TelegramCountRoll" },
                wwwRoll: { $sum: "$RollingLogfunction.WWWCountRoll" },
                whatsappRoll: { $sum: "$RollingLogfunction.WhatsappCountRoll" },
                plurkRoll: { $sum: "$RollingLogfunction.PlurkCountRoll" }
            }
        },
        {
            $group: {
                _id: {
                    $ceil: { $divide: ["$_id", 3] }
                },
                totalDiscordRoll: { $sum: "$discordRoll" },
                totalLineRoll: { $sum: "$lineRoll" },
                totalTelegramRoll: { $sum: "$telegramRoll" },
                totalWWWRoll: { $sum: "$wwwRoll" },
                totalWhatsappRoll: { $sum: "$whatsappRoll" },
                totalPlurkRoll: { $sum: "$plurkRoll" }
            }
        }
    ]).catch(error => console.error('log # quarterly aggregation error: ', error));

    // Get previous year's data for comparison
    const previousYearData = await schema.RollingLog.aggregate([
        {
            $match: {
                "RollingLogfunction.LogTime": {
                    $regex: `^${currentYear - 1}`
                }
            }
        },
        {
            $group: {
                _id: null,
                totalDiscordRoll: { $sum: "$RollingLogfunction.DiscordCountRoll" },
                totalLineRoll: { $sum: "$RollingLogfunction.LineCountRoll" },
                totalTelegramRoll: { $sum: "$RollingLogfunction.TelegramCountRoll" },
                totalWWWRoll: { $sum: "$RollingLogfunction.WWWCountRoll" },
                totalWhatsappRoll: { $sum: "$RollingLogfunction.WhatsappCountRoll" },
                totalPlurkRoll: { $sum: "$RollingLogfunction.PlurkCountRoll" }
            }
        }
    ]).catch(error => console.error('log # previous year aggregation error: ', error));

    // Calculate growth rates and statistics
    const stats = {
        currentYear: {
            yearly: yearlyData[0] || {},
            quarterly: quarterlyData || [],
            growthRate: {}
        },
        previousYear: previousYearData[0] || {}
    };

    // Calculate growth rates
    if (stats.currentYear.yearly && stats.previousYear) {
        const platforms = ['Discord', 'Line', 'Telegram', 'WWW', 'Whatsapp', 'Plurk'];
        platforms.forEach(platform => {
            const currentTotal = stats.currentYear.yearly[`total${platform}Roll`] || 0;
            const previousTotal = stats.previousYear[`total${platform}Roll`] || 0;
            if (previousTotal > 0) {
                stats.currentYear.growthRate[`${platform.toLowerCase()}Growth`] = 
                    ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2);
            }
        });
    }

    // Add statistics to the real-time data
    const enhancedData = {
        ...theNewData.RealTimeRollingLogfunction,
        statistics: stats
    };

    return enhancedData;
}


//上傳用
async function saveLog() {
    //更新LogTime 然後上傳紀錄
    if (!checkMongodb.isDbOnline()) return;
    RollingLog.LogTime = Date(Date.now()).toLocaleString("en-US", {
        timeZone: "Asia/HongKong"
    });
    await schema.RealTimeRollingLog.findOneAndUpdate({}, {
        $set: {
            "RealTimeRollingLogfunction.LogTime": RollingLog.LogTime,
            "RealTimeRollingLogfunction.LastTimeLog": RollingLog.LastTimeLog,
            "RealTimeRollingLogfunction.StartTime": RollingLog.StartTime
        },
        $inc: {
            "RealTimeRollingLogfunction.DiscordCountRoll": RollingLog.DiscordCountRoll,
            "RealTimeRollingLogfunction.DiscordCountText": RollingLog.DiscordCountText,
            "RealTimeRollingLogfunction.LineCountRoll": RollingLog.LineCountRoll,
            "RealTimeRollingLogfunction.LineCountText": RollingLog.LineCountText,
            "RealTimeRollingLogfunction.TelegramCountRoll": RollingLog.TelegramCountRoll,
            "RealTimeRollingLogfunction.TelegramCountText": RollingLog.TelegramCountText,
            "RealTimeRollingLogfunction.WWWCountRoll": RollingLog.WWWCountRoll,
            "RealTimeRollingLogfunction.WWWCountText": RollingLog.WWWCountText,
            "RealTimeRollingLogfunction.WhatsappCountRoll": RollingLog.WhatsappCountRoll,
            "RealTimeRollingLogfunction.WhatsappCountText": RollingLog.WhatsappCountText,
            "RealTimeRollingLogfunction.PlurkCountRoll": RollingLog.PlurkCountRoll,
            "RealTimeRollingLogfunction.PlurkCountText": RollingLog.PlurkCountText,
            "RealTimeRollingLogfunction.ApiCountRoll": RollingLog.ApiCountRoll,
            "RealTimeRollingLogfunction.ApiCountText": RollingLog.ApiCountText
        }
    }, {
        upsert: true
    }).catch(error => {
        console.error('log #90 mongoDB error: ', error.name, error.reason)
        checkMongodb.dbErrOccurs();
    })
    //把擲骰的次數還原 為0
    resetLog();

    //假如過了一小時則上載中途紀錄RollingLog
    if (Date.now() - RollingLog.LastTimeLog >= (ONE_HOUR))
        pushToDefiniteLog();
    return null;
}

async function pushToDefiniteLog() {
    if (shardid !== 0) return;
    //更新最後的RollingLog 儲存時間
    RollingLog.LastTimeLog = Date.now();
    let theNewData = await schema.RealTimeRollingLog.findOne({}).catch(error => console.error('log #105 mongoDB error: ', error.name, error.reason));
    let temp = {
        RollingLogfunction:
        {
            LogTime: theNewData.RealTimeRollingLogfunction.LogTime,
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
            PlurkCountText: theNewData.RealTimeRollingLogfunction.PlurkCountText,
            ApiCountRoll: theNewData.RealTimeRollingLogfunction.ApiCountRoll,
            ApiCountText: theNewData.RealTimeRollingLogfunction.ApiCountText
        }
    }
    await schema.RollingLog.create(temp).catch(error => console.error('logs #126 mongoDB error: ', error.name, error.reason));
    return;
}

async function getRecords() {
    if (!checkMongodb.isDbOnline()) return;
    let theNewData = await schema.RealTimeRollingLog.findOne({}).catch(error => {
        console.error('log # 131 mongoDB error: ', error.name, error.reason)
        checkMongodb.dbErrOccurs();
    });

    if (!theNewData) {
        RollingLog.LastTimeLog = Date.now();
        RollingLog.StartTime = Date(Date.now()).toLocaleString("en-US", {
            timeZone: "Asia/HongKong"
        });
        RollingLog.LogTime = Date(Date.now()).toLocaleString("en-US", {
            timeZone: "Asia/HongKong"
        });
        return;
    }

    RollingLog.LastTimeLog = theNewData.RealTimeRollingLogfunction.LastTimeLog || Date.now();
    RollingLog.StartTime = theNewData.RealTimeRollingLogfunction.StartTime || Date(Date.now()).toLocaleString("en-US", {
        timeZone: "Asia/HongKong"
    });
    RollingLog.LogTime = theNewData.RealTimeRollingLogfunction.LogTime || Date(Date.now()).toLocaleString("en-US", {
        timeZone: "Asia/HongKong"
    });

    console.log('Rolling Log is Ready')
    return;
}


function resetLog() {
    RollingLog.DiscordCountRoll = 0;
    RollingLog.DiscordCountText = 0;
    RollingLog.LineCountRoll = 0;
    RollingLog.LineCountText = 0;
    RollingLog.TelegramCountRoll = 0;
    RollingLog.TelegramCountText = 0;
    RollingLog.WWWCountRoll = 0;
    RollingLog.WWWCountText = 0;
    RollingLog.WhatsappCountRoll = 0;
    RollingLog.WhatsappCountText = 0;
    RollingLog.PlurkCountRoll = 0;
    RollingLog.PlurkCountText = 0;
    RollingLog.ApiCountRoll = 0;
    RollingLog.ApiCountText = 0;
}


async function courtMessage({ result, botname, inputStr, shardids = 0 }) {
    if (shardids !== 0) shardid = shardids;
    if (result && result.text) {
        //SAVE THE LOG
        switch (botname) {
            case "Line":
                (debugMode) ? console.log('   Line \'s inputStr: ', inputStr) : '';
                RollingLog.LineCountRoll++;
                break;
            case "Telegram":
                (debugMode) ? console.log('Telegram\'s inputStr: ', inputStr) : '';
                RollingLog.TelegramCountRoll++;
                break;
            case "Whatsapp":
                (debugMode) ? console.log('Whatsapp\'s inputStr: ', inputStr) : '';
                RollingLog.WhatsappCountRoll++;
                break;
            case "WWW":
                (debugMode) ? console.log('     WWW\'s inputStr: ', inputStr) : '';
                RollingLog.WWWCountRoll++;
                break;
            case "Discord":
                (debugMode) ? console.log('Discord \'s inputStr: ', inputStr) : '';
                RollingLog.DiscordCountRoll++;
                break;
            case "Plurk":
                (debugMode) ? console.log('Plurk \'s inputStr: ', inputStr) : '';
                RollingLog.PlurkCountRoll++;
                break;
            case "Api":
                (debugMode) ? console.log('Api \'s inputStr: ', inputStr) : '';
                RollingLog.ApiCountRoll++;
                break;
            default:
                break;
        }

        //await saveLog();
        return null;
    } else {
        switch (botname) {
            case "Line":
                RollingLog.LineCountText++;
                break;
            case "Telegram":
                RollingLog.TelegramCountText++;
                break;
            case "Whatsapp":
                RollingLog.WhatsappCountText++;
                break;
            case "WWW":
                RollingLog.WWWCountText++;
                break;
            case "Discord":
                RollingLog.DiscordCountText++;
                break;
            case "Plurk":
                RollingLog.PlurkCountText++;
                break;
            case "Api":
                RollingLog.ApiCountText++;
                break;
            default:
                break;
        }
    }
    return null;
}




module.exports = {
    courtMessage,
    getState
};