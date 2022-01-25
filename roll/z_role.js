"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [3, 10, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const roleReactRegixDetail = /(\d+)\s+([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}])/gu;
const roleReactRegixMessage = /\[\[message\]\](.*)/s;
const opt = {
    upsert: true,
    runValidators: true,
    new: true
}
var gameName = function () {
    return '【身分管理】.roleReact .roleInvites'
}

var gameType = function () {
    return 'Tool:role:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^\.roleInvites$|^\.roleReact$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【身分管理】Discord限定功能
讓使用指定的邀請連結進入群組的受邀者
或
對指定訊息的Reaction進行點擊
就會分配指定的身分組別

示範
https://i.imgur.com/

注意: 此功能需求【編輯身分組】的權限，請確定授權。
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

2.設定指定邀請連結給予身份組
如步驟1，記下身份組ID，
在你群組內的任意的地方(建議開一個只有你看到的群組)按以下格式輸入

.roleInvites add
身份組ID 邀請連結

範例
.roleInvites add
719562323951463 https://discord.gg/BnXsXYEs72t4


3.刪除
.roleReact delete 序號
.roleInvites delete 序號
刪除方式是delete 後面接上序號


4.顯示列表
.roleReact show
.roleInvites show
    `
}
var initialize = function () {
    return "";
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userid,
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
        case (!groupid || userrole < 2): {
            rply.text = rejectUser((!groupid) ? 'notInGroup' : (userrole < 2) ? 'notAdmin' : '');
            return rply;
        }
        case /^\.roleReact$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleReact.find({ groupid: groupid });
            rply.text = roleReactList(list);
            return rply;
        }
        case /^\.roleInvites$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let list = await schema.roleInvites.find({ groupid: groupid });
            rply.text = roleInvitesList(list);
            return rply;
        }
        case /^\.roleReact$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除角色指令為 .roleReact delete (序號/名字縮寫) \n 如 .roleReact delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleReact.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] })
                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .roleReact delete (序號) \n 如 .roleReact delete 1 \n序號請使用.roleReact show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除角色指令為 .roleReact delete (序號) \n 如 .roleReact delete 1 \n序號請使用.roleReact show 查詢'
                return rply
            }
        }
        case /^\.roleInvites$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除角色指令為 .roleInvites delete (序號/名字縮寫) \n 如 .roleInvites delete 1'
                return rply
            }
            try {
                let myNames = await schema.roleInvites.findOneAndRemove({ groupid: groupid, serial: mainMsg[2] })
                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1 \n序號請使用.roleInvites show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除角色指令為 .roleInvites delete (序號) \n 如 .roleInvites delete 1 \n序號請使用.roleInvites show 查詢'
                return rply
            }
        }
        case /^\.roleReact$/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.roleReact.countDocuments({ groupid: groupid })
            if (myNamesLength >= limit) {
                rply.text = '.roleReact 群組上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                rply.quotes = true;
                return rply;
            }

            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.message || !checkName.detail || checkName.detail.length == 0) {
                rply.text = `輸入資料失敗，請仔細檢查說明及範例\n ${this.getHelpMessage()}`;
                return rply;
            }
            let list = await schema.roleReact.find({ groupid: groupid }, 'serial')
            let myName = new schema.roleReact({
                message: checkName.message,
                groupid: groupid,
                serial: findTheNextSerial(list),
                detail: checkName.detail
            })
            try {
                let data = await myName.save();
                rply.roleReactFlag = true;
                rply.roleReactId = data.id;
                rply.roleReactMessage = checkName.message;
                rply.roleReactDetail = checkName.detail;
                return rply;
            } catch (error) {
                console.log('error', error)
                rply.text = `儲存失敗\n請重新再試，或聯絡HKTRPG作者}`;
                return rply;
            }
        }
        case /^\.me\S+/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[1]) {
                rply.text = this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }
            if (!groupid) {
                rply.text = "這功能只可以在頻道中使用"
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMeName(mainMsg[0]);
            if (!checkName) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()} `;
                return rply;
            }
            let myName;
            if (typeof checkName == 'number') {
                let myNameFind = await schema.myName.find({ userID: userid }).skip(checkName - 1).limit(1);
                if (myNameFind) {
                    myName = myNameFind[0];
                }
            }
            if (!myName) {
                try {
                    myName = await schema.myName.findOne({ userID: userid, shortName: new RegExp(checkName, 'i') });
                } catch (error) {
                    rply.text = `輸入出錯\n ${this.getHelpMessage()} `;
                    return rply;
                }
            }
            if (!myName) {
                rply.text = `找不到角色 - ${checkName} `;
                return rply;
            }
            rply.myName = showMessage(myName, inputStr);
            return rply;
        }
        default: {
            break;
        }
    }
}

function showMessage(myName, inputStr) {
    let result = {
        content: inputStr.replace(/^\s?\S+\s+/, ''),
        username: myName.name,
        avatarURL: myName.imageLink
    }
    return result;

}


function checkMyName(inputStr) {
    let message = inputStr.match(roleReactRegixMessage)
    inputStr = inputStr.replace(roleReactRegixMessage)
    let detail = []
    let detailTemp = inputStr.match(roleReactRegixDetail);
    for (let index = 0; index < detailTemp.length; index++) {
        const regDetail = detailTemp[index].match((/(\S+)\s+(\S)/u))
        detail.push({
            roleID: regDetail[1],
            emoji: regDetail[2]
        })
    }


    return { message: message && message[1].replace(/^\n/, ''), detail };
}

function checkMeName(inputStr) {
    let name = inputStr.replace(/^\.me/i, '');
    if (name.match(/^\d+$/)) {
        name = Number(name)
    }
    return name;
}


const rejectUser = (reason) => {
    switch (reason) {
        case 'notInGroup':
            return "這功能只可以在頻道中使用"
        case 'notAdmin':
            return "這功能只可以管理員使用"
        default:
            return "這功能未能使用"
    }

}




function showNames(names) {
    let reply = [];
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply[index] = {
                content: `序號#${index + 1} \n${(name.shortName) ? `安安，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`}
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                username: name.name,
                avatarURL: name.imageLink
            }
        }
    } else reply = "沒有找到角色"
    return reply;
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
    else reply = "沒有找到"
    return reply;
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
    else reply = "沒有找到"
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

function showName(names, targetName) {
    let reply = {};
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            if (names[index].name == targetName)
                reply = {
                    content: `序號#${index + 1} \n${(name.shortName) ? `Hello, 我的別名是${name.shortName}` : `你好，我的名字是${name.name}`} \n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                    username: name.name,
                    avatarURL: name.imageLink
                }
        }
    } else reply = "沒有找到角色"
    return reply;
}

function findTheNextSerial(list) {
    let serialList = []
    for (let index = 0; index < list.length; index++) {
        serialList.push(list[index].serial);
    }
    serialList.sort(function (a, b) {
        return a - b;
    });
    //[1,2,4,5]
    for (let index = 0; index < serialList.length - 1; index++) {
        if (serialList[index + 1] - serialList[index] !== 1) {
            return serialList[index] + 1;
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