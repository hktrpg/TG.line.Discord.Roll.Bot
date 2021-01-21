"use strict";
if (!process.env.mongoURL) {
    return;
}
const schema = require('../modules/core-schema.js');
const rollDice = require('./rollbase').rollDiceCommand;
var gameName = function () {
    return '先攻表功能 .in (remove clear reroll) .init'
}
var gameType = function () {
    return 'Tool:trpgInit:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]init$)|(^[.]initn$)|(^[.]in$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【先攻表功能】.in (remove clear reroll) .init" + "\n\
這是讓你快速自定義先攻表的功能\n\
.in (擲骰或數字) (名字)  - 樣式\n\
.in 1d20+3 名字  \n\
.in 1d3 (如沒有輸入, 會用該玩家的名字)\n\
.in 80  - 直接取代\n\
.in -3  - 加減\n\
.in remove (名字) - 移除該角色\n\
.in reroll - 重擲內容\n\
.init - 顯示先攻表，由大到小\n\
.initn - 顯示先攻表，由小到大\n\
"
}
var initialize = function () {
    return;
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    displaynameDiscord,
    botname,
    displayname,
    channelid
}) {
    let temp;
    let result;
    let name = inputStr.replace(/^[.]in\s+\w+(\s+)?/i, '') || displaynameDiscord || displayname;
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if (/^help$/i.test(mainMsg[1]) || !mainMsg[1]) {
        rply.text = this.getHelpMessage();
        if (botname == "Line")
            rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
        return rply;
    }
    if (!groupid) {
        rply.text = "這是群組功能，請於群組使用。"
        return rply;
    }
    switch (true) {
        case /(^[.]in$)/i.test(mainMsg[0]) && /^remove$/i.test(mainMsg[1]):
            temp = schema.init.updateOne({
                groupID: groupid
            }, {
                $pullAll: {
                    name: name
                }
            })
            console.log(temp);
            if (temp) rply.text = '移除成功'
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^reroll$/i.test(mainMsg[1]):
            //
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^[+-]\d+/i.test(mainMsg[1]):

            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^\w+/i.test(mainMsg[1]):
            result = await countInit(mainMsg[1]);
            if (!result) return;
            temp = await schema.init.findOne({
                "groupID": groupid,
            });
            if (!temp) {
                temp = new schema.init({
                    "groupID": groupid,
                    list: [{
                        name: name,
                        result: Number(result),
                        formula: mainMsg[1]
                    }]
                });
                await temp.save();
                rply.text = "DONE";
                return rply;
            }
            temp = await temp.updateOne({
                "list.name": name
            }, {
                "$set": {
                    "list.$.result": Number(result),
                    "list.$.formula": mainMsg[1]
                }
            }, {
                upsert: true,
                returnNewDocument: true
            })
            rply.text = temp;
            return rply;

        case /(^[.]init$)/i.test(mainMsg[0]):
            //
            return rply;

        case /(^[.]initn$)/i.test(mainMsg[0]):
            //
            return rply;

        default:
            break;
    }
}


async function countInit(num) {
    let result;
    let temp = await rollDice({
        mainMsg: [num]
    })
    if (temp && temp.text) {
        result = temp.text.match(/[+-]?([0-9]*[.])?[0-9]+$/)[0];
    } else if (num.match(/^[+-]?([0-9]*[.])?[0-9]+$/)) {
        result = num;
    }
    return result;
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};