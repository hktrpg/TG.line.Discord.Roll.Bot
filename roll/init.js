"use strict";
if (!process.env.mongoURL) {
    return;
}
const math = require('mathjs')
const schema = require('../modules/schema.js');
const rollDice = require('./rollbase').rollDiceCommand;
const convertRegex = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};
const gameName = function () {
    return '【先攻表功能】 .in (remove clear reroll) .init'
}
const gameType = function () {
    return 'Tool:trpgInit:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]init$)|(^[.]initn$)|(^[.]in$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【⚔️先攻表系統】
╭────── 📋基本指令 ──────
│ • .in [擲骰/數值] [名稱]
│ • .init - 顯示先攻表(大→小)
│ • .initn - 顯示先攻表(小→大)
│
├────── 🎲新增角色 ──────
│ 擲骰格式:
│ 　• .in 1d20+3 角色A
│ 　• .in 1d3
│ 　  (無名稱時使用發言者名稱)
│
│ 直接指定數值:
│ 　• .in 80
│ 　• .in -3+6*3/2.1
│
├────── ⚙️管理功能 ──────
│ 重擲先攻:
│ 　• .in reroll
│ 　  (依原有算式重新擲骰)
│
│ 移除功能:
│ 　• .in remove [名稱]
│ 　  (移除特定角色)
│ 　• .in clear
│ 　  (清空整個先攻表)
│
╰──────────────`
}
const initialize = function () {
    return;
}

const rollDiceCommand = async function ({
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
    let name = inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '') || displaynameDiscord || displayname || 'Sad';
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if ((/^help$/i.test(mainMsg[1])) && /^[.]in|[.]init$/i.test(mainMsg[0])) {
        rply.text = await this.getHelpMessage();
        rply.quotes = true;
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
                            $regex: new RegExp('^' + convertRegex(name) + '$', "i")
                        }
                    }
                }
            }, {
                safe: true
            })
            rply.text = (temp && temp.nModified) ? '已移除 ' + name + ' 的先攻值' : '找不到' + name + '的先攻值';
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^clear$/i.test(mainMsg[1]):
            temp = await schema.init.deleteOne({
                "groupID": channelid || groupid
            })
            rply.text = (temp) ? '已移除這群組的先攻值' : '找不到這群組的先攻表';
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^reroll$/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
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
        case /(^[.]in$)/i.test(mainMsg[0]) && /^[+-/*]\d+/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                return rply;
            }
            objIndex = temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase()));
            if (objIndex == -1) {
                rply.text = "找不到該角色"
                return rply;
            }
            temp.list[objIndex].result = math.evaluate(temp.list[objIndex].result + mainMsg[1])
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
                    console.error('init #154 mongoDB error: ', error.name, error.reason)
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
                rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                return rply;
            }
            rply.text = await showInit(temp)
            return rply;
        case /(^[.]initn$)/i.test(mainMsg[0]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
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

const { SlashCommandBuilder } = require('discord.js');

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('in')
            .setDescription('先攻表系統')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增角色到先攻表')
                    .addStringOption(option => 
                        option.setName('roll')
                            .setDescription('擲骰或數值，如 1d20+3 或 15')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('角色名稱(選填)')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('remove')
                    .setDescription('從先攻表移除角色')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('要移除的角色名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('clear')
                    .setDescription('清空整個先攻表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reroll')
                    .setDescription('重擲所有角色的先攻'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('modify')
                    .setDescription('修改先攻值')
                    .addStringOption(option => 
                        option.setName('value')
                            .setDescription('修改值，如 +3 或 -2')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('要修改的角色名稱')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'add':
                    const roll = interaction.options.getString('roll');
                    const name = interaction.options.getString('name');
                    return `.in ${roll}${name ? ' ' + name : ''}`;
                case 'remove':
                    const removeName = interaction.options.getString('name');
                    return `.in remove ${removeName}`;
                case 'clear':
                    return '.in clear';
                case 'reroll':
                    return '.in reroll';
                case 'modify':
                    const value = interaction.options.getString('value');
                    const modifyName = interaction.options.getString('name');
                    return `.in ${value} ${modifyName}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('init')
            .setDescription('顯示先攻表(大到小排序)'),
        async execute() {
            return '.init';
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('initn')
            .setDescription('顯示先攻表(小到大排序)'),
        async execute() {
            return '.initn';
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
    discordCommand
};