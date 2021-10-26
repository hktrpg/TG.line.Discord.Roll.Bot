"use strict";
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [2, 5, 10, 20, 30, 99, 99, 99];
const limitCronArr = [1, 5, 10, 20, 30, 99, 99, 99];
const moment = require('moment');
const agenda = require('../modules/core-schedule')

var gameName = function () {
    return '【定時發訊功能】.at .cron delete'
}

var gameType = function () {
    return 'funny:schedule:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.at$|^\.cron$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【定時任務功能】
    兩種模式
    【at】  指定一個時間
    如 20220604 1900 < 年月日 時間
    5mins  (五分鐘後)
    5hours (五小時後)
    會發佈指定一個信息

    【cron】 每天指定一個時間可以發佈一個信息(24小時制)
    如 1230  2200 
    
    .at 5mins
    五分鐘後叫吧!
    
    .cron 0831
    每天八時三十一分`
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
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        case /^\.at+$/i.test(mainMsg[0]) && /^check$/i.test(mainMsg[1]): {
            const jobs = await agenda.agenda.jobs(
                {
                    name: "scheduleAtMessage",
                    "data.channelid": channelid
                }
            );
            console.log(jobs)
            rply.text = showJobs(jobs);
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]): {
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let check = await schema.eventList.find({
                userID: userid
            });
            let levelLv = await findMaxLv(userid);


            let checkTime = checkAtTime(mainMsg[1], mainMsg[2]);
            if (!checkTime) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            let text = (checkTime.threeColum) ? inputStr.replace(/^\s?\S+\s+\S+\s+\S+\s+/, '') : inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            let date = checkTime.time;
            //  rply.schedule.switch = true;
            //   rply.schedule.style = 'at';
            //  rply.schedule.text = text;
            //  rply.schedule.date = date;
            //schedule
            await agenda.agenda.schedule(date, "scheduleAtMessage", { replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid });
            await agenda.agenda.now("scheduleAtMessage", { replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid });
            //  console.log('jobs', jobs)
            rply.text = `已新增排定內容\n將於${date.toString().replace(/:\d+\s.*/, '')}運行`
            return rply;
        }
        case /^\.cron$/.test(mainMsg[0]): {
            rply.text = 'Demo'
            return rply;
        }
        case /^delete$/.test(mainMsg[0]): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
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
function checkCronTime(params) {
    //const date = {hour: 14, minute: 30}
}

async function findMaxLv(userid) {
    let maxLV = await schema.trpgLevelSystemMember.findOne({ userid: userid }).sort({ Level: -1 });
    if (!maxLV) return 1;
    return maxLV.Level;
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

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};