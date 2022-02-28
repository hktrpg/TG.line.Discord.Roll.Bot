"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [5, 25, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema')
const limitCronArr = [2, 15, 30, 45, 99, 99, 99, 99];
const moment = require('moment');
const agenda = require('../modules/schedule')
const cronRegex = /^(\d\d)(\d\d)((?:-([1-9]?[1-9]|((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?))){0,1})/i;
const validDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];



var gameName = function () {
    return '【定時發訊功能】.at /.cron  mins hours delete show'
}


var gameType = function () {
    return 'funny:schedule:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^\.at$|^\.cron$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【定時任務功能】
    兩種模式
    【at】  指定一個時間
    如 20220604 1900  (年月日 時間)
    .at 5mins  (五分鐘後)
    .at 5hours (五小時後)
    會發佈指定一個信息
    可以擲骰 使用[[]]包著指令就可
    如.at 9mins [[CC 60]]

    【cron】 每天指定一個時間可以發佈一個信息
    如 1230  2200 (24小時制)
    或 1230-2 2200-Sun
    可運行六個月, 然後會自動刪除
    
    .cron 0831 每天八時三十一分 
    嚎叫吧!

    .cron 1921-2
    我將會每隔兩天的晚上7時21分發一次訊息

    .cron 1921-wed-mon
    我將會每個星期一和三發一次訊息

    .cron 1921-2-wed-sun
    我將會每隔二天，如果是星期三或星期日就發一次訊息

    .cron  每天晚上七時二十一分擲 
    [[CC 80 幸運]]

    星期代碼: Sun Mon Tue Wed thu fri Sat
    
    .cron / .at show 可以顯示已新增的定時訊息

    .cron / .at delete (序號) 可以刪除指定的定時訊息
    如 .at delete 1   請使用.at show 查詢序號
    `
}
var initialize = function () {
    return "";
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    //displayname,
    channelid,
    // displaynameDiscord,
    //membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if (!differentPeformAt(botname)) {
        rply.text = '此功能只能在Discord, Line, Telegram中使用'
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            let check = {}
            if (botname == "Discord") {
                check = {
                    name: differentPeformAt(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error: ', error.name, error.reson))
            rply.text = showJobs(jobs);
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除定時訊息指令為 .at delete (序號) \n 如 .at delete 1'
                return rply
            }
            let check = {}
            if (botname == "Discord") {
                check = {
                    name: differentPeformAt(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error: ', error.name, error.reson))
            try {
                let data = jobs[Number(mainMsg[2]) - 1];
                await jobs[Number(mainMsg[2]) - 1].remove();
                rply.text = `已刪除序號#${Number(mainMsg[2])} \n${data.attrs.data.replyText}`;

            } catch (e) {
                console.error("Remove at Error removing job from collection. input: ", inputStr);
                rply.text = "找不到該序號, 請使用.at show重新檢查"
                return rply;
            }
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            let limit = limitAtArr[lv];
            let check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule  #171 mongoDB error: ', error.name, error.reson));
            if (checkGroupid >= limit) {
                rply.text = '.at 整個群組上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply;
            }

            let checkTime = checkAtTime(mainMsg[1], mainMsg[2]);
            if (!checkTime || checkTime.time == "Invalid Date") {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            let text = (checkTime.threeColum) ? inputStr.replace(/^\s?\S+\s+\S+\s+\S+\s+/, '') : inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            let date = checkTime.time;

            let callBotname = differentPeformAt(botname);
            await agenda.agenda.schedule(date, callBotname, { replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid }).catch(error => console.error('agenda error: ', error.name, error.reson))
            rply.text = `已新增排定內容\n將於${date.toString().replace(/:\d+\s.*/, '')}運行`
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (userrole <= 1) {
                rply.text = '只有GM以上才可新增'
                return rply
            }
            let check = {}
            if (botname == "Discord") {
                check = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error: ', error.name, error.reson))
            rply.text = showCronJobs(jobs);
            return rply;
        }
        case /^\.cron$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (userrole <= 1) {
                rply.text = '只有GM以上才可新增'
                return rply
            }
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除定時訊息指令為 .cron delete (序號) \n 如 .cron delete 1'
                return rply
            }
            let check = {}
            if (botname == "Discord") {
                check = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            )
            try {
                let data = jobs[Number(mainMsg[2]) - 1];
                await jobs[Number(mainMsg[2]) - 1].remove();
                rply.text = `已刪除序號#${Number(mainMsg[2])} \n${data.attrs.data.replyText}`;

            } catch (e) {
                console.error("Remove Cron Error removing job from collection, input: ", inputStr);
                rply.text = "找不到該序號, 請使用.cron show 重新檢查"
                return rply;
            }
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (userrole <= 1) {
                rply.text = '只有GM以上才可新增'
                return rply
            }
            if (!mainMsg[2]) {
                rply.text = '未有內容'
                return rply
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            let limit = limitCronArr[lv];
            let check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule #278 mongoDB error: ', error.name, error.reson));
            if (checkGroupid >= limit) {
                rply.text = '.cron 整個群組上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply;
            }

            let checkTime = checkCronTime(mainMsg[1]);
            if (!checkTime || !checkTime.min || !checkTime.hour) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            let text = inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            // "0 6 * * *"
            let date = `${checkTime.min} ${checkTime.hour} *${checkTime.days ? `/${checkTime.days}` : ''} * ${(checkTime.weeks.length) ? checkTime.weeks : '*'}`;
            //  console.log('date', date)

            let callBotname = differentPeformCron(botname);
            const job = agenda.agenda.create(callBotname, { replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid, createAt: new Date(Date.now()) });
            job.repeatEvery(date);

            try {
                await job.save();
            } catch (error) {
                console.error("schedule #301 Error saving job to collection");
            }
     
            rply.text = `已新增排定內容\n將於${checkTime.days ? `每隔${checkTime.days}天` : ''}  ${checkTime.weeks.length ? `每個星期的${checkTime.weeks}` : ''}${!checkTime.weeks && !checkTime.days ? `每天` : ''} ${checkTime.hour}:${checkTime.min} (24小時制)運行`
            return rply;
        }
        default: {
            break;
        }
    }
}
function differentPeformAt(botname) {
    switch (botname) {
        case "Discord":
            return "scheduleAtMessageDiscord"

        case "Telegram":
            return "scheduleAtMessageTelegram"

        case "Line":
            return "scheduleAtMessageLine"

        default:
            break;
    }
}

function differentPeformCron(botname) {
    switch (botname) {
        case "Discord":
            return "scheduleCronMessageDiscord"

        case "Telegram":
            return "scheduleCronMessageTelegram"

        case "Line":
            return "scheduleCronMessageLine"

        default:
            break;
    }


}
function checkAtTime(first, second) {
    //const date = new Date(2012, 11, 21, 5, 30, 0);
    //const date = new Date(Date.now() + 5000);
    //   如 20220604 1900 < 年月日 時間
    //5mins  (五分鐘後)
    //5hours (五小時後)
    switch (true) {
        case /^\d+mins$/i.test(first): {
            let time = first.match(/^(\d+)mins$/i)[1];
            if (time > 44640) time = 44640;
            if (time < 1) time = 1;
            time = moment().add(time, 'minute').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+hours$/i.test(first): {
            let time = first.match(/^(\d+)hours$/i)[1];
            if (time > 744) time = 744;
            if (time < 1) time = 1;
            time = moment().add(time, 'hour').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+days$/i.test(first): {
            let time = first.match(/^(\d+)days$/i)[1];
            if (time > 31) time = 31;
            if (time < 1) time = 1;
            time = moment().add(time, 'day').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d{8}$/i.test(first) && /^\d{4}$/i.test(second): {
            let time = moment(`${first} ${second}`, "YYYYMMDD hhmm").toDate();
            return { time: time, threeColum: true };
        }
        default:
            break;
    }
}
function checkCronTime(text) {
    //const date = {hour: 14, minute: 30}
    //@{text} - 1133  / 1155-wed / 1125-(1-99)
    let hour = text.match(cronRegex) && text.match(cronRegex)[1];
    let min = text.match(cronRegex) && text.match(cronRegex)[2];
    let days = text.match(cronRegex) && !text.match(cronRegex)[6] && text.match(cronRegex)[4] || null;
    //let weeks = text.match(cronRegex) && text.match(cronRegex)[6] || null;
    let weeks = []
    if (hour == 24) {
        hour = "00";
    }
    if (min == 60) {
        min = "00";
    }
    for (let index = 0; index < validDays.length; index++) {
        text.toLowerCase().indexOf(validDays[index]) >= 0 ? weeks.push(index) : null

    }


    if (min >= 0 && min <= 60 && hour >= 0 && hour <= 24)
        return { min, hour, days, weeks };
    else return;
}




function showJobs(jobs) {
    let reply = '';
    if (jobs && jobs.length > 0) {
        for (let index = 0; index < jobs.length; index++) {
            let job = jobs[index];
            reply += `序號#${index + 1} 下次運行時間 ${job.attrs.nextRunAt.toString().replace(/:\d+\s.*/, '')}\n${job.attrs.data.replyText}\n`;
        }
    } else reply = "沒有找到定時任務"
    return reply;
}
function showCronJobs(jobs) {
    let reply = '';
    if (jobs && jobs.length > 0) {
        for (let index = 0; index < jobs.length; index++) {
            let job = jobs[index];
            let createAt = job.attrs.data.createAt;
            let time = job.attrs.repeatInterval.match(/^(\d+) (\d+)/);
            reply += `序號#${index + 1} 創建時間 ${createAt.toString().replace(/:\d+\s.*/, '')}\n每天運行時間 ${(time && time[2]) || 'error'} ${(time && time[1]) || 'error'}\n${job.attrs.data.replyText}\n`;
        }
    } else reply = "沒有找到定時任務"
    return reply;
}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};
