"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const emojiRegex = require('emoji-regex');
const VIP = require('../modules/veryImportantPerson');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const FUNCTION_LIMIT = [3, 10, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
let regextemp = emojiRegex().toString();
const regex = regextemp.replace(/^\//, '').replace(/\/g$/, '')
//https://www.npmjs.com/package/emoji-regex
const newRoleReactRegixMessageID = /\[\[messageID\]\]\s+(\d+)/is;
const roleReactRegixDetail = new RegExp(`(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d+>)?)`, 'g')
const roleReactRegixDetail2 = new RegExp(`^(\\d+)\\s+(${regex}|(<a?)?:\\w+:(\\d+>)?)`,)
const gameName = function (params = {}) {
    return resolveGameName(params, 'role.game_name', '【身分組管理】.roleReact');
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
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'role.help');
}
const initialize = function () {
    return "";
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    botname,
    userrole,
    groupid,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if (botname !== "Discord") {
        rply.text = translate('role.discord_only');
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        }
        case (!groupid || userrole < 3): {
            rply.text = rejectUser((!groupid) ? 'notInGroup' : (userrole < 3) ? 'notAdmin' : '', translate);
            return rply;
        }
        //new Type role React
        case /^\.roleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid }).lean().catch(error => console.error('role #188 mongoDB error:', error.name, error.reason));
            rply.text = roleReactList(list, translate);
            return rply;
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = translate('role.delete_usage');
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndDelete({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error:', error.name, error.reason));
                if (myNames) {
                    rply.text = translate('role.delete_success', { serial: myNames.serial, message: myNames.message });
                    return rply
                } else {
                    rply.text = translate('role.delete_error');
                    return rply
                }
            } catch (error) {
                console.error("移除失敗, inputStr:", inputStr, error);
                rply.text = translate('role.delete_error');
                return rply
            }
        }

        case /^\.roleReact$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]): {
            if (!mainMsg[5]) {
                rply.text = translate('role.input_failed_upgrade');
                rply.quotes = true;
                return rply;
            }
            let checkName = checknewroleReact(inputStr);
            if (!checkName || !checkName.detail || !checkName.messageID || checkName.detail.length === 0) {
                rply.text = translate('role.format_error');
                rply.quotes = true;
                return rply;
            }

            //已存在相同
            let list = await schema.roleReact.findOne({ groupid: groupid, messageID: checkName.messageID }).catch(error => console.error('role #240 mongoDB error:', error.name, error.reason));
            if (list) {
                list.detail.push.apply(list.detail, checkName.detail);
                await list.save()
                    .catch(error => console.error('role #244 mongoDB error:', error.name, error.reason));
                rply.text = translate('role.update_success', { serial: list.serial });
                rply.newRoleReactFlag = true;
                rply.newRoleReactMessageId = checkName.messageID;
                rply.newRoleReactDetail = checkName.detail;
                return rply;
            }

            //新增新的
            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = FUNCTION_LIMIT[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid }).catch(error => console.error('role #141 mongoDB error:', error.name, error.reason));
            if (myNamesLength >= limit) {
                rply.text = translate('role.limit_reached', { limit });
                rply.quotes = true;
                return rply;
            }
            const dateObj = new Date();
            let month = dateObj.getMonth() + 1; //months from 1-12
            let day = dateObj.getDate();
            let year = dateObj.getFullYear();
            let hour = dateObj.getHours()
            let minute = dateObj.getMinutes()
            let listSerial = await schema.roleReact.find({ groupid: groupid }, "serial").lean().catch(error => console.error('role #268 mongoDB error:', error.name, error.reason));
            let serial = findTheNextSerial(listSerial);
            let myName = new schema.roleReact({
                message: `${year}/${month}/${day}  ${hour}:${minute} - ID: ${checkName.messageID}`,
                groupid: groupid,
                messageID: checkName.messageID,
                serial: serial,
                detail: checkName.detail
            })
            try {
                await myName.save().catch(error => console.error('role #277 mongoDB error:', error.name, error.reason));
                rply.text = translate('role.add_success', { serial });
                rply.newRoleReactFlag = true;
                rply.newRoleReactMessageId = checkName.messageID;
                rply.newRoleReactDetail = checkName.detail;
                return rply;
            } catch (error) {
                console.error('role save error:', error)
                rply.text = translate('role.save_failed');
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
                let myNames = await schema.roleReact.findOneAndDelete({ groupid: groupid, serial: mainMsg[2] }).catch(error => console.error('role #111 mongoDB error: ', error.name, error.reason));
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
            let list = await schema.roleReact.find({ groupid: groupid }, 'serial').lean().catch(error => console.error('role #161 mongoDB error: ', error.name, error.reason));
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



const rejectUser = (reason, translate) => {
    const t = translate || getT({});
    switch (reason) {
        case 'notInGroup':
            return t('role.not_in_group');
        case 'notAdmin':
            return t('role.not_admin');
        default:
            return t('role.unavailable');
    }

}




function roleReactList(list, translate) {
    const t = translate || getT({});
    let reply = '';
    if (list && list.length > 0) {
        list.sort(compareSerial);
        for (let index = 0; index < list.length; index++) {
            let item = list[index];
            reply += t('role.list_entry_header', { serial: item.serial, message: item.message });
            for (let index = 0; index < item.detail.length; index++) {
                const role = item.detail[index];
                reply += t('role.list_role_line', { roleId: role.roleID, emoji: role.emoji });

            }
        }
    }
    else reply = t('role.list_empty');
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
                    .setName('add')
                    .setDescription('新增反應配置')
                    .addStringOption(option =>
                        option.setName('details')
                            .setDescription('格式: 身分組ID 表情符號，可輸入多組（以空白或換行分隔）')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('message_id')
                            .setDescription('要綁定反應的訊息ID')
                            .setRequired(true)
                    )
            )
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

            switch (subcommand) {
            case 'add': {
                const details = interaction.options.getString('details');
                const messageId = interaction.options.getString('message_id');
                return `.roleReact add ${details} [[messageID]] ${messageId}`;
            }
            case 'show':
                return '.roleReact show';
            case 'delete': {
                const serial = interaction.options.getString('serial');
                return `.roleReact delete ${serial}`;
            }
            default:
                return;
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
        let list = await schema.roleInvites.find({ groupid: groupid }, 'serial').lean();
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
            let list = await schema.roleInvites.find({ groupid: groupid }).lean();
            rply.text = roleInvitesList(list);
            return rply;
        }

 case /^\.roleInvites$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleInvites.findOneAndDelete({ groupid: groupid, serial: mainMsg[2] })
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