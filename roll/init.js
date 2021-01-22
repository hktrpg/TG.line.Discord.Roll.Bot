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
------------\n\
.in remove (名字) - 移除該角色\n\
.in reroll - 重擲內容\n\
.in 清除整個先攻表 - 重擲內容\n\
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
    displaynameDiscord,
    botname,
    displayname,
    channelid
}) {
    let temp;
    let result;
    let objIndex;
    let name = inputStr.replace(/^[.]in\s+([+-])?\w+([.])?(\w+)?(\s+)?/i, '') || displaynameDiscord || displayname;
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if ((/^help$/i.test(mainMsg[1])) && /^[.]in|[.]init$/i.test(mainMsg[0])) {
        rply.text = this.getHelpMessage();
        if (botname == "Line")
            rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
        return rply;
    }
    if (!groupid && mainMsg[1]) {
        rply.text = "這是群組功能，請於群組使用。"
        return rply;
    }
    switch (true) {
        case /(^[.]in$)/i.test(mainMsg[0]) && /^remove$/i.test(mainMsg[1]):
            temp = await schema.init.updateOne({
                "groupID": channelid || groupid
            }, {
                $pull: {
                    "list": {
                        "name": {
                            $regex: new RegExp(name, "i")
                        }
                    }
                }
            }, {
                safe: true
            })
            rply.text = (temp && temp.nModified) ? '已移除 ' + name + ' 的先攻值' : '找不到' + name + '的先攻值';
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^clear$/i.test(mainMsg[1]):
            temp = await schema.init.remove({
                "groupID": channelid || groupid
            })
            rply.text = (temp) ? '已移除這群組的先攻值' : '找不到這群組的先攻表';
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^reroll$/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表"
                return rply;
            }
            for (let i = 0; i < temp.list.length; i++) {
                temp.list[i].result = await countInit(temp.list[i].formula);
            }
            try {
                await temp.save();
            } catch (error) {
                rply.text = "先攻表更新失敗，\n" + error;
                return rply;
            }
            rply.text = await showInit(temp)
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^[+-]\d+/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表"
                return rply;
            }
            objIndex = temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase()));
            if (objIndex == -1) {
                rply.text = "找不到該角色"
                return rply;
            }
            temp.list[objIndex].result = temp.list[objIndex].result + Number(mainMsg[1]);
            try {
                await temp.save();
            } catch (error) {
                rply.text = "先攻表更新失敗，\n" + error;
                return rply;
            }
            rply.text = temp.list[objIndex].name + '已經 ' + mainMsg[1] + ' 先攻值'
            rply.text += '\n現在的先攻值:  ' + temp.list[objIndex].result;
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^\w+/i.test(mainMsg[1]):
            result = await countInit(mainMsg[1]);
            if (!result) return;
            temp = await schema.init.findOne({
                "groupID": channelid || groupid,
            });
            if (!temp) {
                temp = new schema.init({
                    "groupID": channelid || groupid,
                    list: [{
                        name: name,
                        result: Number(result),
                        formula: mainMsg[1]
                    }]
                });
                try {
                    await temp.save();
                } catch (error) {
                    rply.text = "先攻表更新失敗，\n" + error;
                    return rply;
                }
                rply.text = name + ' 的先攻值是 ' + Number(result);
                return rply;
            }
            objIndex = temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase())) >= 0 ? temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase())) : temp.list.length || 0;
            temp.list.set(Number(objIndex), {
                name: (temp.list[objIndex] && temp.list[objIndex].name) || name,
                result: Number(result),
                formula: mainMsg[1]
            });
            try {
                await temp.save();
            } catch (error) {
                rply.text = "先攻表更新失敗，\n" + error;
                return rply;
            }
            rply.text = temp.list[objIndex].name + ' 的先攻值是 ' + Number(result);
            return rply;

        case /(^[.]init$)/i.test(mainMsg[0]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表"
                return rply;
            }
            rply.text = await showInit(temp)
            return rply;
        case /(^[.]initn$)/i.test(mainMsg[0]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表"
                return rply;
            }
            rply.text = await showInitn(temp)
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

async function showInit(doc) {
    let result = '┌──────先攻表──────┐\n';
    doc.list.sort(function (a, b) {
        return b.result - a.result;
    });

    for (let i = 0; i < doc.list.length; i++) {
        if (i == doc.list.length - 1) {
            result += "└";
        } else
        if (i == 0) {
            result += "┌";
        } else {
            result += "├";
        }
        result += doc.list[i].name + ' - ' + doc.list[i].result + '\n';
    }
    return result;
}
async function showInitn(doc) {
    let result = '┌─────先攻表─────┐\n';
    doc.list.sort(function (a, b) {
        return a.result - b.result;
    });
    for (let i = 0; i < doc.list.length; i++) {
        if (i == doc.list.length - 1) {
            result += "└";
        } else
        if (i == 0) {
            result += "┌";
        } else {
            result += "├";
        }

        result += doc.list[i].name + ' - ' + doc.list[i].result + '\n';
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