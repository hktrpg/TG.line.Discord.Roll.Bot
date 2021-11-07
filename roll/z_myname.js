"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [3, 20, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/core-schema.js');
const opt = {
    upsert: true,
    runValidators: true
}
var gameName = function () {
    return '【你的名字】.myname / .me .me1 .me泉心'
}

var gameType = function () {
    return 'Tool:myname:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^\.myname$|^\.me\S+/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【你的名字】Discord限定功能
TRPG扮演發言功能
你可以設定一個角色的名字及頭像，
然後你只要輸入指令和說話，
就會幫你使用該角色發言。

指令列表

1.設定角色
.myname "名字" 角色圖片網址 名字縮寫
*名字*是角色名字，會作為角色顯示的名字，但如果該名字有空格就需要用開引號"包著
如"則卷 小雲" 不然可以省去

圖片則是角色圖示，如果圖片出錯會變成最簡單的Discord圖示，
圖片可以直接上傳到DISCORD或IMGUR.COM上

名字縮寫是 是用來方便你啓動它
例如 .me小雲 「來玩吧」

2.刪除角色
.myname delete  序號 / 名字縮寫 / "名字" 
刪除方式是delete 後面接上序號或名字縮寫或名字


3.顯示角色
.myname show

4.使用角色
.me(序號/名字縮寫) 訊息
如
.me0 泉心慢慢的走到他們旁邊，伺機行動
.me泉心 「我接受你的挑戰」 
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
    if (botname !== "Discord") {
        rply.text = '此功能只能在Discord中使用'
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let myNames = await schema.myName.find({ userID: userid })
            rply.text = showNames(myNames);
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                return rply
            }
            if (mainMsg[2].match(/\d+/)) {
                try {
                    let myNames = await schema.myName.find({ userID: userid })
                    let result = await myNames[mainMsg[2] + 1].deleteOne();
                    if (result) {
                        rply.text = `移除成功，${result}`
                        return rply
                    } else {
                        rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                        return rply
                    }
                } catch (error) {
                    console.error("移除角色失敗", error);
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                    return rply
                }
            }

            try {
                let myNames = await schema.myName.findOneAndRemove({ userID: userid, shortName: mainMsg[2] })

                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                    return rply
                }
            } catch (error) {
                console.error("移除角色失敗", error);
                rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                return rply
            }
        }
        case /^\.myname$/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let myNames = await schema.myName.find({ userID: userid })
            if (myNames.length >= limit) {
                rply.text = '.myname 個人上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply;
            }

            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.name || !checkName.message) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }

            try {
                let myNames = await schema.myName.findOneAndUpdate({ userID: userid })
            } catch (error) {

            }

            rply.text = `已新增排定內容\n將於${date.toString().replace(/:\d+\s.*/, '')}運行`
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
function checkMyName(inputStr) {
    let name = inputStr.replace(/^\s?\S+\s+/, '');
    if (name.match(/^".*"/)) {
        let finalName = name.match(/"(.*)"\s+(.*)/)
        return { name: finalName[1], message: finalName[2] };
    } else {
        let finalName = name.match(/^(.S+)\s+(.*)/)
        return { name: finalName[1], message: finalName[2] };
    }
}
function checkCronTime(text) {
    //const date = {hour: 14, minute: 30}
    let hour = text.match(/^(\d\d)/) && text.match(/^(\d\d)/)[1];
    let min = text.match(/(\d\d)$/) && text.match(/(\d\d)$/)[1];
    if (hour == 24) {
        hour = "00";
    }
    if (min == 60) {
        min = "00";
    }

    if (min >= 0 && min <= 60 && hour >= 0 && hour <= 24)
        return { min, hour };
    else return;
}




function showNames(names) {
    let reply = '';
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply += `序號#${index + 1}  ${name.name}\n${name.shortName}\n${name.imageLink}`;
        }
    } else reply = "沒有找到角色"
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