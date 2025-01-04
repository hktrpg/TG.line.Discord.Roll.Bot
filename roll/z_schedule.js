"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const checkMongodb = require('../modules/dbWatchdog.js');
const FUNCTION_AT_LIMIT = [5, 25, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema')
const FUNCTION_CRON_LIMIT = [2, 15, 30, 45, 99, 99, 99, 99];
const moment = require('moment');
const agenda = require('../modules/schedule')
const CRON_REGEX = /^(\d\d)(\d\d)((?:-([1-9]?[1-9]|((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?))){0,1})/i;
const VALID_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const checkTools = require('../modules/check.js');



const gameName = function () {
    return '【定時發訊功能】.at /.cron  mins hours delete show'
}

const gameType = function () {
    return 'funny:schedule:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.at$|^\.cron$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【⏰定時任務功能】
╭──── 📅單次定時 [at] ────
│ • 指定時間: .at 20220604 1900 
│ • 計時模式: .at 5mins / 5hours 
│ • 加入訊息及骰子: .at 9mins 五分鐘後擲骰 [[CC 60]]
│
╭──── ⌛循環定時 [cron] ────
│ • 每天定時: .cron 1230 
│ • 間隔天數: .cron 1921-2
│ • 指定星期: .cron 1921-wed-mon
│ • 進階組合: .cron 1921-2-wed-sun
│ • 加入訊息: .cron 1921 每天七時二十一分
│ • 加入骰子: .cron 1921 [[CC 80 幸運]]
│
├──── 🎲格式說明 ────
│ • 時間格式: YYYYMMDD HHMM (24小時制)
│ • 計時單位: mins(分鐘), hours(小時)
│ • 星期代碼: Sun Mon Tue Wed Thu Fri Sat
│ • 骰子指令: 使用[[]]包覆
│
├──── ⚙️管理指令 ────
│ • 查看列表: .at show / .cron show
│ • 刪除任務: .at delete 序號
│             .cron delete 序號
│
├──── 👑贊助功能 ────
│ patreoner可自訂發送者:
│ .cron 2258
│ name=發送者名稱
│ link=頭像連結網址
│ 要發送的訊息內容
│ [[骰子指令]]
│
├──── 📝範例 ────
.cron 2258 
name=Sad
link=https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png
wwwww
[[2d3]]
hello world
╰──────────────`
}
const initialize = function () {
    return "";
}

const rollDiceCommand = async function ({
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
        rply.text = '此功能只能在Discord, Telegram中使用'
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
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
            if (userrole == 3 && botname == "Discord") {
                rply.text = `\n本頻道列表\n\n${rply.text}`
                check = {
                    name: differentPeformAt(botname),
                    "data.groupid": groupid
                }
                const jobs = await agenda.agenda.jobs(
                    check
                ).catch(error => console.error('agenda error: ', error.name, error.reson))
                rply.text = `本群組列表\n\n${showJobs(jobs)} \n\n${rply.text
                    } `;
            }
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除定時訊息指令為 .at delete (序號) \n 如 .at delete 1'
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
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
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            let limit = FUNCTION_AT_LIMIT[lv];
            let check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule  #171 mongoDB error: ', error.name, error.reson));
            if (checkGroupid >= limit) {
                rply.text = '.at 整個群組上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                return rply;
            }
            let roleName = getAndRemoveRoleNameAndLink(inputStr);
            inputStr = roleName.newText;

            let checkTime = checkAtTime(mainMsg[1], mainMsg[2]);
            if (!checkTime || checkTime.time == "Invalid Date") {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            let text = (checkTime.threeColum) ? inputStr.replace(/^\s?\S+\s+\S+\s+\S+\s+/, '') : inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            let date = checkTime.time;
            if (roleName.roleName || roleName.imageLink) {
                if (lv === 0) {
                    rply.text = `.at裡的角色發言功能只供Patreoner使用，請支持伺服器運作，或自建Server\nhttps://www.patreon.com/HKTRPG`;
                    return rply;
                }
                if (!roleName.roleName || !roleName.imageLink) {
                    rply.text = `請完整設定名字和圖片網址
                    格式為
                    .at 時間
                    name=名字
                    link=www.sample.com/sample.jpg
                    XXXXXX信息一堆`;
                    return rply;
                }

            }

            let callBotname = differentPeformAt(botname);
            await agenda.agenda.schedule(date, callBotname, { imageLink: roleName.imageLink, roleName: roleName.roleName, replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid }).catch(error => console.error('agenda error: ', error.name, error.reson))
            rply.text = `已新增排定內容\n將於${date.toString().replace(/:\d+\s.*/, '')}運行`
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let check = {}
            if (botname == "Discord" && userrole < 3) {
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
            if (userrole == 3 && botname == "Discord") {
                rply.text = `\n本頻道列表\n\n${rply.text}`
                check = {
                    name: differentPeformCron(botname),
                    "data.groupid": groupid
                }
                const jobs = await agenda.agenda.jobs(
                    check
                ).catch(error => console.error('agenda error: ', error.name, error.reson))
                rply.text = `本群組列表\n\n${showCronJobs(jobs)} \n\n${rply.text
                    } `;
            }
            return rply;
        }
        case /^\.cron$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除定時訊息指令為 .cron delete (序號) \n 如 .cron delete 1'
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
                check = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            }
            else check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            )
            try {
                let data = jobs[Number(mainMsg[2]) - 1];
                await jobs[Number(mainMsg[2]) - 1].remove();
                rply.text = `已刪除序號#${Number(mainMsg[2])} \n${data.attrs.data.replyText} `;

            } catch (e) {
                console.error("Remove Cron Error removing job from collection, input: ", inputStr);
                rply.text = "找不到該序號, 請使用.cron show 重新檢查"
                return rply;
            }
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (!mainMsg[2]) rply.text += '未有內容'
            if (rply.text) return rply;

            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            let limit = FUNCTION_CRON_LIMIT[lv];
            let check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule #278 mongoDB error: ', error.name, error.reson));
            if (checkGroupid >= limit) {
                rply.text = '.cron 整個群組上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                return rply;
            }
            let roleName = getAndRemoveRoleNameAndLink(inputStr);
            inputStr = roleName.newText;

            let checkTime = checkCronTime(mainMsg[1]);
            if (!checkTime || !checkTime.min || !checkTime.hour) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()} `;
                return rply;
            }
            if (roleName.roleName || roleName.imageLink) {
                if (lv === 0) {
                    rply.text = `.cron裡的角色發言功能只供Patreoner使用，請支持伺服器運作，或自建Server\nhttps://www.patreon.com/HKTRPG`;
                    return rply;
                }
                if (!roleName.roleName || !roleName.imageLink) {
                    rply.text = `請完整設定名字和圖片網址
                    格式為
                    .cron 時間
                    name=名字
                    link=www.sample.com/sample.jpg
                    XXXXXX信息一堆`;
                    return rply;
                }

            }


            let text = inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            // "0 6 * * *"
            let date = `${checkTime.min} ${checkTime.hour} *${checkTime.days ? `/${checkTime.days}` : ''} * ${(checkTime.weeks.length) ? checkTime.weeks : '*'}`;

            let callBotname = differentPeformCron(botname);
            const job = agenda.agenda.create(callBotname, { imageLink: roleName.imageLink, roleName: roleName.roleName, replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid, createAt: new Date(Date.now()) });
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

        case "Whatsapp":
            return "scheduleAtMessageWhatsapp"

        default:
            break;
    }
}
function getAndRemoveRoleNameAndLink(input) {
    let roleName = input.match(/^name=(.*)\n/mi) ? input.match(/^name=(.*)\n/mi)[1] : null;
    let imageLink = input.match(/^link=(.*)\n/mi) ? input.match(/^link=(.*)\n/mi)[1] : null;
    return { newText: input.replace(/^link=.*\n/mi, "").replace(/^name=.*\n/im, ""), roleName, imageLink };
}

function differentPeformCron(botname) {
    switch (botname) {
        case "Discord":
            return "scheduleCronMessageDiscord"

        case "Telegram":
            return "scheduleCronMessageTelegram"

        case "Whatsapp":
            return "scheduleCronMessageWhatsapp"

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
    let hour = text.match(CRON_REGEX) && text.match(CRON_REGEX)[1];
    let min = text.match(CRON_REGEX) && text.match(CRON_REGEX)[2];
    let days = text.match(CRON_REGEX) && !text.match(CRON_REGEX)[6] && text.match(CRON_REGEX)[4] || null;
    //let weeks = text.match(CRON_REGEX) && text.match(CRON_REGEX)[6] || null;
    let weeks = []
    if (hour == 24) {
        hour = "00";
    }
    if (min == 60) {
        min = "00";
    }
    for (let index = 0; index < VALID_DAYS.length; index++) {
        text.toLowerCase().indexOf(VALID_DAYS[index]) >= 0 ? weeks.push(index) : null

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