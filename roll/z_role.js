"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [3, 10, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const emojiRegex = require('emoji-regex');
var regextemp = emojiRegex().toString();
const regex = regextemp.replace(/^\//, '').replace(/\/g$/, '')
//console.log('regex', regex)
//https://www.npmjs.com/package/emoji-regex
const roleReactRegixMessage = /\[\[message\]\](.*)/is;
const newRoleReactRegixMessageID = /\[\[messageID\]\]\s+(\d+)/is;
const roleReactRegixDetail = new RegExp(`(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d{18}>)?)`, 'g')
const roleReactRegixDetail2 = new RegExp(`(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d{18}>)?)`,)
var gameName = function () {
    return '【身分組管理】.roleReact'
}

var gameType = function () {
    return 'Tool:role:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^\.roleReact$|^\.newroleReact$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【身分組管理】Discord限定功能
讓對指定訊息的Reaction Emoji(😀😃😄)進行點擊的用家
分配指定的身分組別

示範
https://i.imgur.com/kuZHA3m.gif

注意: 此功能需求【編輯身分組】及【增加Reaction】的權限，請確定授權。
另外，使用者需要【管理者】權限。

指令列表

1.設定Reaction給予身份組
首先去User Setting=>Advanced=>開啓Developer Mode
再去Server Setting=>Roles=>新增或設定希望分配的身分組
然後對該身分組按右鍵並按COPY ID，把該ID記下來

接著，在你想要發佈該信息的地方按以下格式輸入

.roleReact add
身份組ID Emoji
[[message]]
發佈的訊息

範例
.roleReact add
232312882291231263 🎨 
123123478897792323 😁 
[[message]]
按🎨可得身分組-畫家
按😁可得身分組-大笑

2.顯示列表
.roleReact show

3.刪除
.roleReact delete 序號
刪除方式是 delete 後面接上序號
範例
.roleReact delete 1


    `
}
var initialize = function () {
    return "";
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    botname,
    userrole,
    groupid
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
        case (!groupid || userrole < 3): {
            rply.text = rejectUser((!groupid) ? 'notInGroup' : (userrole < 3) ? 'notAdmin' : '');
            return rply;
        }
        case /^\.roleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid }).catch(error => console.error('role #100 mongoDB error: ', error.name, error.reson));
            rply.text = roleReactList(list);
            return rply;
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .roleReact delete (序號) \n 如 .roleReact delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error: ', error.name, error.reson));
                if (myNames) {
                    rply.text = `移除成功，#${myNames.serial}\n${myNames.message}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除指令為 .roleReact delete (序號) \n 如 .roleReact delete 1 \n序號請使用.roleReact show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除指令為 .roleReact delete (序號) \n 如 .roleReact delete 1 \n序號請使用.roleReact show 查詢'
                return rply
            }
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]): {
            if (!mainMsg[5]) {
                rply.text = `輸入資料失敗，範例
                .roleReact add
                232312882291231263 🎨 
                123123478897792323 😁 
                [[message]]
                按🎨可得身分組-畫家
                按😁可得身分組-大笑
                希望取得詳細使用說明請輸入.roleReact help`
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid }).catch(error => console.error('role #141 mongoDB error: ', error.name, error.reson));
            if (myNamesLength >= limit) {
                rply.text = '.roleReact 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                rply.quotes = true;
                return rply;
            }
            let checkName = checkRoleReact(inputStr);
            if (!checkName || !checkName.message || !checkName.detail || checkName.detail.length === 0) {
                rply.text = `輸入資料失敗，範例
                .roleReact add
                232312882291231263 🎨 
                123123478897792323 😁 
                [[message]]
                按🎨可得身分組-畫家
                按😁可得身分組-大笑
                希望取得詳細使用說明請輸入.roleReact help`
                rply.quotes = true;
                return rply;
            }
            let list = await schema.roleReact.find({ groupid: groupid }, 'serial').catch(error => console.error('role #161 mongoDB error: ', error.name, error.reson));
            let myName = new schema.roleReact({
                message: checkName.message,
                groupid: groupid,
                serial: findTheNextSerial(list),
                detail: checkName.detail
            })
            try {
                let data = await myName.save().catch(error => console.error('role #169 mongoDB error: ', error.name, error.reson));
                rply.roleReactFlag = true;
                rply.roleReactMongooseId = data.id;
                rply.roleReactMessage = checkName.message;
                rply.roleReactDetail = checkName.detail;
                return rply;
            } catch (error) {
                console.error('role save error:', error)
                rply.text = `儲存失敗\n請重新再試，或聯絡HKTRPG作者`;
                return rply;
            }
        }

        //new Type role React
        case /^\.newroleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid }).catch(error => console.error('role #100 mongoDB error: ', error.name, error.reson));
            rply.text = roleReactList(list);
            return rply;
        }

        case /^\.newroleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .newroleReact delete (序號) \n 如 .newroleReact delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error: ', error.name, error.reson));
                if (myNames) {
                    rply.text = `移除成功，#${myNames.serial}\n${myNames.message}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除指令為 .newroleReact delete (序號) \n 如 .newroleReact delete 1 \n序號請使用.newroleReact show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除指令為 .newroleReact delete (序號) \n 如 .newroleReact delete 1 \n序號請使用.newroleReact show 查詢'
                return rply
            }
        }

        case /^\.newroleReact$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]): {
            if (!mainMsg[5]) {
                rply.text = `輸入資料失敗，範例
                .newroleReact add
                232312882291231263 🎨 
                123123478897792323 😁 
                [[messageID]]
                946739512439073384
                希望取得詳細使用說明請輸入.newroleReact help`
                rply.quotes = true;
                return rply;
            }
            let checkName = checknewroleReact(inputStr);
            console.log(checkName)
            if (!checkName || !checkName.detail || !checkName.messageID || checkName.detail.length === 0) {
                rply.text = `輸入資料失敗，範例
                .newroleReact add
                232312882291231263 🎨 
                123123478897792323 😁 
                [[messageID]]
                946739512439073384
                希望取得詳細使用說明請輸入.newroleReact help`
                rply.quotes = true;
                return rply;
            }
            //已存在相同
            let list = await schema.roleReact.findOne({ groupid: groupid, messageID: checkName.messageID }).catch(error => console.error('role #240 mongoDB error: ', error.name, error.reson));
            if (list) {
                list.detail.push.apply(list.detail, checkName.detail);
                await list.save()
                    .catch(error => console.error('role #244 mongoDB error: ', error.name, error.reson));
                rply.text = `已成功更新。你現在可以試試role功能\n可以使用.newrolereact show /  delete 操作 ${list.serial}`
                return rply;
            }

            //新增新的

            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid }).catch(error => console.error('role #141 mongoDB error: ', error.name, error.reson));
            if (myNamesLength >= limit) {
                rply.text = '.newroleReact 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                rply.quotes = true;
                return rply;
            }

            var dateObj = new Date();
            var month = dateObj.getMonth() + 1; //months from 1-12
            var day = dateObj.getDate();
            var year = dateObj.getFullYear();
            var hour = dateObj.getHours()
            var minute = dateObj.getMinutes()
            let serial = findTheNextSerial(list);
            let listSerial = await schema.roleReact.find({ groupid: groupid }, "serial").catch(error => console.error('role #240 mongoDB error: ', error.name, error.reson));
            let myName = new schema.roleReact({
                message: year + "/" + month + "/" + day + ' ' + hour + ':' + minute,
                groupid: groupid,
                messageID: checkName.messageID,
                serial: listSerial,
                detail: checkName.detail
            })
            try {
                await myName.save().catch(error => console.error('role #169 mongoDB error: ', error.name, error.reson));
                rply.text = `已成功增加。你現在可以試試role功能\n刪除可以使用.newrolereact delete ${serial}`
                return rply;
            } catch (error) {
                console.error('role save error:', error)
                rply.text = `儲存失敗\n請重新再試，或聯絡HKTRPG作者`;
                return rply;
            }
        }

        default: {
            break;
        }
    }
}




function checkRoleReact(inputStr) {
    let message = inputStr.match(roleReactRegixMessage)
    inputStr = inputStr.replace(roleReactRegixMessage)
    let detail = []
    let detailTemp = inputStr.match(roleReactRegixDetail);
    for (let index = 0; (index < detailTemp.length) && index < 20; index++) {
        const regDetail = detailTemp[index].match(roleReactRegixDetail2)
        detail.push({
            roleID: regDetail[1],
            emoji: regDetail[2]
        })
    }
    return { message: message && message[1].replace(/^\n/, ''), detail };
}


function checknewroleReact(inputStr) {
    let messageID = inputStr.match(newRoleReactRegixMessageID)
    inputStr = inputStr.replace(newRoleReactRegixMessageID)
    let detail = []
    let detailTemp = inputStr.match(roleReactRegixDetail);
    for (let index = 0; (index < detailTemp.length) && index < 20; index++) {
        const regDetail = detailTemp[index].match(roleReactRegixDetail2)
        detail.push({
            roleID: regDetail[1],
            emoji: regDetail[2]
        })
    }
    return { messageID: messageID && messageID[1].replace(/^\n/, ''), detail };
}



const rejectUser = (reason) => {
    switch (reason) {
        case 'notInGroup':
            return "這功能只可以在頻道中使用"
        case 'notAdmin':
            return "這功能只可以由伺服器管理員使用"
        default:
            return "這功能未能使用"
    }

}




function roleReactList(list) {
    let reply = '';
    if (list && list.length > 0) {
        list.sort(compareSerial);
        for (let index = 0; index < list.length; index++) {
            let item = list[index];
            reply += `序號#${item.serial} \n 訊息: ${item.message}\n`;
            for (let index = 0; index < item.detail.length; index++) {
                const role = item.detail[index];
                reply += `身分ID#${role.roleID} emoji: ${role.emoji}\n`;

            }
        }
    }
    else reply = "沒有找到已設定的react 資料。"
    return reply;
}


function compareSerial(a, b) {
    if (a.serial < b.serial) {
        return -1;
    }
    if (a.serial > b.serial) {
        return 1;
    }
    return 0;
}

function findTheNextSerial(list) {
    if (list.length === 0) return 1;
    let serialList = []
    for (let index = 0; index < list.length; index++) {
        serialList.push(list[index].serial);
    }
    serialList.sort(function (a, b) {
        return a - b;
    });
    //[1,2,4,5]
    for (let index = 0; index < serialList.length - 1; index++) {
        if (serialList[index] !== (index + 1)) {
            return index + 1
        }
    }
    return serialList[list.length - 1] + 1;
}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};

/**
 * const roleInvitesRegixMessage = /(\d+)\s+(\S+)/g;
case /^\.roleInvites$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]): {
    if (!mainMsg[3]) {
        rply.text = '輸入資料失敗，請仔細檢查說明及範例\n希望取得使用說明請輸入.roleInvites help'
        rply.quotes = true;
        return rply;
    }
    const lv = await VIP.viplevelCheckGroup(groupid);
    const limit = limitAtArr[lv];
    const myNamesLength = await schema.roleInvites.countDocuments({ groupid: groupid })
    if (myNamesLength >= limit) {
        rply.text = '.roleInvites 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
        rply.quotes = true;
        return rply;
    }

    let checkName = checkroleInvites(inputStr);
    if (!checkName || checkName.length == 0) {
        rply.text = `輸入資料失敗，請仔細檢查說明及範例
.roleInvites add
(身份組) (邀請連結/邀請碼)
希望取得使用說明請輸入.roleInvites help`;
        rply.quotes = true;
        return rply;
    }
    if (myNamesLength + checkName.length >= limit) {
        rply.text = '.roleInvites 群組上限為' + limit + '個\n一條邀請連結使用一個限額\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
        rply.quotes = true;
        return rply;
    }
    for (let index = 0; index < checkName.length; index++) {
        let list = await schema.roleInvites.find({ groupid: groupid }, 'serial');
        const myName = new schema.roleInvites({
            groupid: groupid,
            serial: findTheNextSerial(list),
            roleID: checkName[index].roleID,
            invitesLink: checkName[index].invitesLink
        })
        console.log('myName', myName)
        try {
            await myName.save();
            rply.text += `序號#${myName.serial}     ID: ${myName.roleID}       ${myName.invitesLink}\n`;

        } catch (error) {
            console.error('error', error)
            rply.text = `儲存失敗\n請重新再試，或聯絡HKTRPG作者}`;
            return rply;
        }
    }
    return rply;
}
function checkroleInvites(inputStr) {
    inputStr = inputStr.replace(/^\s?\.roleInvites\s+add\s?\S?/i, '').replace(/https:\/\/discord.gg\/qUacvzUz/i, '')
    let detail = []
    let detailTemp = inputStr.match(roleInvitesRegixMessage);
    for (let index = 0; index < detailTemp.length; index++) {
        const regDetail = detailTemp[index].match((/(\S+)\s+(\S+)/u))
        detail.push({
            roleID: regDetail[1],
            invitesLink: regDetail[2]
        })
    }
    return detail;
}

  case /^\.roleInvites$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleInvites.find({ groupid: groupid });
            rply.text = roleInvitesList(list);
            return rply;
        }

 case /^\.roleInvites$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleInvites.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] })
                if (myNames) {
                    rply.text = `移除成功，#${myNames.serial}\n${myNames.invitesLink}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1 \n序號請使用.roleInvites show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1 \n序號請使用.roleInvites show 查詢'
                return rply
            }
        }
        function roleInvitesList(list) {
    let reply = '';
    if (list && list.length > 0) {
        list.sort(compareSerial);
        for (let index = 0; index < list.length; index++) {
            let item = list[index];
            reply += `序號#${item.serial} \n身分ID#: ${item.roleID} 邀請連結: ${item.invitesLink}\n`;
        }
    }
    else reply = "沒有找到序號。"
    return reply;
}

 */