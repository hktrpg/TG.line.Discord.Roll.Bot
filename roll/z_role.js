"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [3, 10, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const emojiRegex = require('emoji-regex');
const { SlashCommandBuilder } = require('discord.js');
let regextemp = emojiRegex().toString();
const regex = regextemp.replace(/^\//, '').replace(/\/g$/, '')
//https://www.npmjs.com/package/emoji-regex
const roleReactRegixMessage = /\[\[message\]\](.*)/is;
const newRoleReactRegixMessageID = /\[\[messageID\]\]\s+(\d+)/is;
const roleReactRegixDetail = new RegExp(`(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d+>)?)`, 'g')
const roleReactRegixDetail2 = new RegExp(`^(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d+>)?)`,)
const gameName = function () {
    return '【身分組管理】.roleReact'
}

const gameType = function () {
    return 'Tool:role:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.roleReact$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【👥身分組管理】(Discord限定)
╭──── 📝系統簡介 ────
│ • 點擊表情符號自動分配身分組
│ • 需要管理者權限及相關授權
│ • 需開啟開發者模式複製ID
│
├──── ⚙️基本設定 ────
│ 1. 開啟開發者模式:
│    User Setting > Advanced > 
│    Developer Mode
│
│ 2. 準備身分組ID:
│    Server Setting > Roles > 
│    右鍵身分組 > Copy ID
│
│ 3. 準備訊息ID:
│    發佈訊息 > 右鍵 > Copy ID
│
├──── 💫指令列表 ────
│ ■ 新增反應配置:
.roleReact add
身分組ID 表情符號
[[messageID]]
訊息ID
│
│ 範例:
.roleReact add
232312882291231263 🎨
123123478897792323 😁
[[messageID]]
12312347889779233
├──── 🎯效果說明 ────
│ • 訊息12312347889779233出現🎨及😁
│ • 按下 🎨 獲得「畫家」身分組
│ • 按下 😁 獲得「大笑」身分組
├────
│ ■ 管理指令:
│ • .roleReact show
│   顯示現有配置
│
│ • .roleReact delete 序號
│   刪除指定配置
│
├──── ⚠️注意事項 ────
│ • 需要編輯身分組權限
│ • 需要增加Reaction權限
│ • 可重複輸入相同信息ID配置更多表情
╰──────────────`
}
const initialize = function () {
    return "";
}

const rollDiceCommand = async function ({
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
        //new Type role React
        case /^\.roleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid }).catch(error => console.error('role #188 mongoDB error: ', error.name, error.reason));
            rply.text = roleReactList(list);
            return rply;
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .roleReact delete (序號) \n 如 .roleReact delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error: ', error.name, error.reason));
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
rply.text = `輸入資料失敗，
本功能已改版，需要自行新增信息，並把信息ID填在下面

範例
.roleReact add
232312882291231263 🎨 
123123478897792323 😁 
[[messageID]]
946739512439073384

希望取得詳細使用說明請輸入.roleReact help 或到 https://bothelp.hktrpg.com`
                rply.quotes = true;
                return rply;
            }
            let checkName = checknewroleReact(inputStr);
            if (!checkName || !checkName.detail || !checkName.messageID || checkName.detail.length === 0) {
                rply.text = `輸入格式錯誤，請確保：
1. 每行格式為：身分組ID 表情符號
2. 最後必須包含 [[messageID]] 和訊息ID

正確範例：
.roleReact add
232312882291231263 🎨 
123123478897792323 😁 
[[messageID]]
946739512439073384

希望取得詳細使用說明請輸入.roleReact help 或到 https://bothelp.hktrpg.com`
                rply.quotes = true;
                return rply;
            }

            //已存在相同
            let list = await schema.roleReact.findOne({ groupid: groupid, messageID: checkName.messageID }).catch(error => console.error('role #240 mongoDB error: ', error.name, error.reason));
            if (list) {
                list.detail.push.apply(list.detail, checkName.detail);
                await list.save()
                    .catch(error => console.error('role #244 mongoDB error: ', error.name, error.reason));
                rply.text = `已成功更新。你現在可以試試role功能\n可以使用.roleReact show /  delete 操作 ${list.serial}`
                rply.newRoleReactFlag = true;
                rply.newRoleReactMessageId = checkName.messageID;
                rply.newRoleReactDetail = checkName.detail;
                return rply;
            }

            //新增新的
            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = FUNCTION_LIMIT[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid }).catch(error => console.error('role #141 mongoDB error: ', error.name, error.reason));
            if (myNamesLength >= limit) {
                rply.text = '.roleReact 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                rply.quotes = true;
                return rply;
            }
            const dateObj = new Date();
            let month = dateObj.getMonth() + 1; //months from 1-12
            let day = dateObj.getDate();
            let year = dateObj.getFullYear();
            let hour = dateObj.getHours()
            let minute = dateObj.getMinutes()
            let listSerial = await schema.roleReact.find({ groupid: groupid }, "serial").catch(error => console.error('role #268 mongoDB error: ', error.name, error.reason));
            let serial = findTheNextSerial(listSerial);
            let myName = new schema.roleReact({
                message: `${year}/${month}/${day}  ${hour}:${minute} - ID: ${checkName.messageID}`,
                groupid: groupid,
                messageID: checkName.messageID,
                serial: serial,
                detail: checkName.detail
            })
            try {
                await myName.save().catch(error => console.error('role #277 mongoDB error: ', error.name, error.reason));
                rply.text = `已成功增加。你現在可以試試role功能\n繼續用add 同樣的messageID 可以新增新的emoji 到同一信息\n刪除可以使用.roleReact delete ${serial}`
                rply.newRoleReactFlag = true;
                rply.newRoleReactMessageId = checkName.messageID;
                rply.newRoleReactDetail = checkName.detail;
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


/**
        case /^\.roleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid }).catch(error => console.error('role #100 mongoDB error: ', error.name, error.reason));
            rply.text = roleReactList(list);
            return rply;
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .roleReact delete (序號) \n 如 .roleReact delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error: ', error.name, error.reason));
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
            let limit = FUNCTION_LIMIT[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid }).catch(error => console.error('role #141 mongoDB error: ', error.name, error.reason));
            if (myNamesLength >= limit) {
                rply.text = '.roleReact 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
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
            let list = await schema.roleReact.find({ groupid: groupid }, 'serial').catch(error => console.error('role #161 mongoDB error: ', error.name, error.reason));
            let myName = new schema.roleReact({
                message: checkName.message,
                groupid: groupid,
                serial: findTheNextSerial(list),
                detail: checkName.detail
            })
            try {
                let data = await myName.save().catch(error => console.error('role #169 mongoDB error: ', error.name, error.reason));
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
 

*/

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
    
    // If no matches found, return null to indicate invalid format
    if (!detailTemp) {
        return null;
    }

    for (let index = 0; (index < detailTemp.length) && index < 20; index++) {
        const regDetail = detailTemp[index].match(roleReactRegixDetail2)
        if (!regDetail) continue; // Skip invalid matches
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
            reply += `\n序號#${item.serial} \n 新增日期: ${item.message}\n`;
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

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('rolereact')
            .setDescription('【身分組管理】點擊表情符號自動分配身分組')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示現有配置')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除指定配置')
                    .addStringOption(option => 
                        option.setName('serial')
                            .setDescription('要刪除的配置序號')
                            .setRequired(true)
                    )
            ),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            if (subcommand === 'show') {
                return `.roleReact show`;
            } else if (subcommand === 'delete') {
                const serial = interaction.options.getString('serial');
                return `.roleReact delete ${serial}`;
            }
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand
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
    const limit = FUNCTION_LIMIT[lv];
    const myNamesLength = await schema.roleInvites.countDocuments({ groupid: groupid })
    if (myNamesLength >= limit) {
        rply.text = '.roleInvites 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
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
        rply.text = '.roleInvites 群組上限為' + limit + '個\n一條邀請連結使用一個限額\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
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