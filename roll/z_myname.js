"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [10, 20, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const opt = {
    upsert: true,
    runValidators: true,
    new: true
}
const gameName = function () {
    return '【你的名字】.myname / .me .me1 .me泉心'
}
const convertRegex = function (str) {
    return str.toString().replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};
const gameType = function () {
    return 'Tool:myname:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.myname$|^\.me\S+/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【👥角色扮演系統】(Discord限定)
╭──── 📝系統簡介 ────
│ • 可設定角色名字和頭像
│ • 快速切換角色進行對話
│ • 支援擲骰指令整合
│
├──── ⚙️角色管理 ────
│ ■ 新增角色:
│ • .myname "名字" 圖片網址 簡稱
│   範例: 
.myname "泉心 造史" 
https://imgur.com/xxx.jpg 造
│   *有空格的名字需要用""包住
│
│ ■ 管理指令:
│ • .myname show
│   顯示角色列表
│ • .myname delete 序號/簡稱
│   刪除指定角色
│
├──── 🎭扮演發言 ────
│ ■ 基本發言:
│ • .me序號 訊息內容
│   例: .me1 「早安！」
│
│ ■ 使用簡稱:
│ • .me簡稱 訊息內容
│   例: .me造 「來玩吧」
│
│ ■ 整合擲骰:
│ • 在訊息中使用[[指令]]
│   範例: 
.me造 「我試試看！」
[[CC 80]] [[立FLAG]]
│
├──── ⚠️注意事項 ────
│ • 需要Webhook與訊息權限
│ • 圖片可使用Discord或Imgur連結
│ • 圖片無效時會用預設頭像
╰──────────────`
}
const errorMessage = `輸入出錯\n留意各個資料前要有空格分隔\n 
範例
.myname "泉心 造史" https://example.com/example.jpg 造史
.myname 泉心造史 https://example.com/example.jpg 1
.myname 泉心造史 https://example.com/example.jpg
`
const initialize = function () {
    return "";
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userid,
    botname,
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
        case /^\.myname+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let myNames = await schema.myName.find({ userID: userid });
            if (groupid) {
                let result = showNames(myNames);
                if (typeof result == 'string') rply.text = result;
                else rply.myNames = result;
            }

            else {
                rply.text = showNamesInText(myNames);
            }
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
                    let result = await myNames[mainMsg[2] - 1].deleteOne();
                    if (result) {
                        rply.text = `移除成功，${result.name} 已被移除`
                        return rply
                    } else {
                        rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                        return rply
                    }
                } catch (error) {
                    //   console.error("移除角色失敗, inputStr: ", inputStr);
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    return rply
                }
            }

            try {
                let myNames = await schema.myName.findOneAndRemove({ userID: userid, shortName: mainMsg[2] })

                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    rply.quotes = true;
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    rply.quotes = true;
                    return rply
                }
            } catch (error) {
                //   console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                rply.quotes = true;
                return rply
            }
        }
        case /^\.myname$/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = errorMessage;
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.myName.countDocuments({ userID: userid })
            if (myNamesLength >= limit) {
                rply.text = '.myname 個人上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.name || !checkName.imageLink) {
                rply.text = errorMessage;
                rply.quotes = true;
                return rply;
            }
            if (!checkName.imageLink.match(/^http/i)) {
                rply.text = `輸入出錯\n 圖示link 必須符合 http/https 開頭`;
                rply.quotes = true;
                return rply;
            }
            let myName = {};
            try {
                myName = await schema.myName.findOneAndUpdate({ userID: userid, name: checkName.name }, { imageLink: checkName.imageLink, shortName: checkName.shortName }, opt)
            } catch (error) {
                rply.text = `發生了一點錯誤，請稍後再試`;
                return rply;
            }
            rply.text = `已新增角色 - ${myName.name}`;
            let myNames = await schema.myName.find({ userID: userid })

            if (groupid) { rply.myNames = [showName(myNames, myName.name)]; }
            else {
                rply.text += showName(myNames, myName.name).content;
            }
            return rply;
        }
        case /^\.me\S+/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[1]) {
                return;
            }
            if (!groupid) {
                rply.text = ".me(X) 這功能只可以在頻道中使用"
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMeName(mainMsg[0]);
            let myName;
            if (typeof checkName == 'number') {
                let myNameFind = await schema.myName.find({ userID: userid }).skip(((checkName - 1) < 0 ? 1 : (checkName - 1))).limit(1);
                if (myNameFind) {
                    myName = myNameFind[0];
                }
            }
            if (!myName) {
                try {
                    myName = await schema.myName.findOne({ userID: userid, shortName: new RegExp('^' + convertRegex(checkName) + '$', 'i') });
                } catch (error) {
                    // rply.text = `找不到角色 - ${checkName} \n可能是序號或名字不對`;
                    // rply.quotes = true;
                    return rply;
                }
            }
            if (!myName) {
                //   rply.text = `找不到角色 - ${checkName} \n可能是序號或名字不對`;
                // rply.quotes = true;
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
    try {
        let name = inputStr.replace(/^\s?\S+\s+/, '');
        let finalName = {}
        if (name.match(/^".*"/)) {
            finalName = name.match(/"(.*)"\s+(\S+)\s*(\S*)/)
        } else {
            finalName = name.match(/^(\S+)\s+(\S+)\s*(\S*)/)
        }
        return { name: finalName[1], imageLink: finalName[2], shortName: finalName[3] };
    } catch (err) {
        return {}
    }
}

function checkMeName(inputStr) {
    let name = inputStr.replace(/^\.me/i, '');
    if (name.match(/^\d+$/)) {
        name = Number(name)
    }
    return name;
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

function showNamesInText(names) {
    let reply = '';
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply += `序號#${index + 1} \n${(name.shortName) ? `安安，我是${name.name}，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`} \n${name.imageLink} \n
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `
        }
    }
    else reply = "沒有找到角色"
    return reply;
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



module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};