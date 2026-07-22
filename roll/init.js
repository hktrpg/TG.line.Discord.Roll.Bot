"use strict";
if (!process.env.mongoURL) {
    return;
}
const math = require('mathjs')
const { SlashCommandBuilder } = require('discord.js');
const schema = require('../modules/schema.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const rollDice = require('./rollbase').rollDiceCommand;
const convertRegex = function (str) {
    return str.replaceAll(/([.?*+^$[\\]|(){}|-])/g, String.raw`\$1`);
};
const gameName = function (params = {}) {
    return resolveGameName(params, 'init.game_name', '【先攻表功能】 .in (remove clear reroll help) .init');
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
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'init.help');
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
    channelid,
    locale,
    t
}) {
    const i18nParams = { locale, t };
    const translate = getT(i18nParams);
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
        rply.text = await getHelpMessage(i18nParams);
        rply.quotes = true;
        if (botname == "Line")
            rply.text += translate('init.line_friend_hint');
        return rply;
    }
    if (!groupid && mainMsg[1]) {
        rply.text = translate('init.group_only');
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
            })
            rply.text = (temp && temp.modifiedCount)
                ? translate('init.remove_success', { name })
                : translate('init.remove_not_found', { name });
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^clear$/i.test(mainMsg[1]):
            temp = await schema.init.deleteOne({
                "groupID": channelid || groupid
            })
            rply.text = (temp) ? translate('init.clear_success') : translate('init.clear_not_found');
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^reroll$/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = translate('init.table_not_found');
                return rply;
            }
            for (let i = 0; i < temp.list.length; i++) {
                temp.list[i].result = await countInit(temp.list[i].formula);
            }
            try {
                await temp.save();
            } catch (error) {
                rply.text = translate('init.update_failed', { error });
                return rply;
            }
            rply.text = await showInit(temp, i18nParams)
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^[+-/*]\d+/i.test(mainMsg[1]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            });
            if (!temp) {
                rply.text = translate('init.table_not_found');
                return rply;
            }
            objIndex = temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase()));
            if (objIndex == -1) {
                rply.text = translate('init.char_not_found', { name });
                return rply;
            }
            temp.list[objIndex].result = math.evaluate(temp.list[objIndex].result + mainMsg[1])
            try {
                await temp.save();
            } catch (error) {
                rply.text = translate('init.update_failed', { error });
                return rply;
            }
            rply.text = translate('init.stat_updated', { name: temp.list[objIndex].name, action: mainMsg[1] });
            rply.text += '\n' + translate('init.current_init', { value: temp.list[objIndex].result });
            return rply;
        case /(^[.]in$)/i.test(mainMsg[0]) && /^\w+/i.test(mainMsg[1]):
            result = await countInit(mainMsg[1]);
            if (!result) {
                rply.text = translate('init.add_hint');
                return rply;
            }
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
                    rply.text = translate('init.update_failed', { error });
                    console.error('init #154 mongoDB error:', error.name, error.reason)
                    return rply;
                }
                rply.text = translate('init.init_value', { name, value: Number(result) });
                return rply;
            }
            objIndex = temp.list.some((obj => obj.name.toLowerCase() == name.toLowerCase())) ? temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase())) : temp.list.length || 0;
            temp.list.set(Number(objIndex), {
                name: (temp.list[objIndex] && temp.list[objIndex].name) || name,
                result: Number(result),
                formula: mainMsg[1]
            });
            try {
                await temp.save();
            } catch (error) {
                rply.text = translate('init.update_failed', { error });
                return rply;
            }
            rply.text = translate('init.init_value', { name: temp.list[objIndex].name, value: Number(result) });
            return rply;

        case /(^[.]init$)/i.test(mainMsg[0]):
            temp = await schema.init.findOne({ "groupID": channelid || groupid });
            if (!temp) {
                rply.text = translate('init.empty_table');
                return rply;
            }
            if (/^start$/i.test(mainMsg[1]) || /^next$/i.test(mainMsg[1]) && !temp.active) {
                temp.active = true;
                temp.turn = 0;
                temp.round = 1;
                await temp.save();
            } else if (/^next$/i.test(mainMsg[1]) && temp.active) {
                temp.turn++;
                if (temp.turn >= temp.list.length) {
                    temp.turn = 0;
                    temp.round++;
                }
                await temp.save();
            } else if (/^end$/i.test(mainMsg[1])) {
                temp.active = false;
                await temp.save();
                rply.text = translate('init.combat_end');
                return rply;
            } else if (/^round$/i.test(mainMsg[1])) {
                const newRound = Number.parseInt(mainMsg[2], 10);
                if (!Number.isNaN(newRound) && newRound > 0) {
                    temp.round = newRound;
                    await temp.save();
                    rply.text = translate('init.round_updated', {
                        round: newRound,
                        table: await showInit(temp, i18nParams)
                    });
                } else {
                    rply.text = translate('init.invalid_round');
                }
                return rply;
            } else if (/^stats$/i.test(mainMsg[1])) {
                const characterName = mainMsg[2];
                if (!characterName) {
                    rply.text = translate('init.name_required');
                    return rply;
                }
                const status = mainMsg[3];
                const charIndex = temp.list.findIndex(c => c.name === characterName);
                if (charIndex !== -1) {
                    temp.list[charIndex].status = status;
                    await temp.save();
                    const table = await showInit(temp, i18nParams);
                    if (status) {
                        rply.text = translate('init.status_updated', { name: characterName, status, table });
                    } else {
                        rply.text = translate('init.status_cleared', { name: characterName, table });
                    }
                } else {
                    rply.text = translate('init.char_not_found', { name: characterName });
                }
                return rply;
            } else if (mainMsg[1]) {
                const charIndex = temp.list.findIndex(c => c.name === mainMsg[1]);
                if (charIndex !== -1) {
                    temp.turn = charIndex;
                    await temp.save();
                } else {
                    rply.text = translate('init.char_not_found', { name: mainMsg[1] });
                    return rply;
                }
            }
            rply.text = await showInit(temp, i18nParams);
            return rply;
        case /(^[.]initn$)/i.test(mainMsg[0]):
            temp = await schema.init.findOne({
                "groupID": channelid || groupid
            }).lean();
            if (!temp) {
                rply.text = translate('init.table_not_found');
                return rply;
            }
            rply.text = await showInitn(temp, i18nParams)
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
    } else if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(num)) {
        result = num;
    }
    return result;
}

async function showInit(doc, i18nParams = {}) {
    const translate = getT(i18nParams);
    doc.list.sort(function (a, b) {
        return b.result - a.result;
    });

    if (!doc.active) {
        let result = translate('init.table_title') + '\n';
        for (let i = 0; i < doc.list.length; i++) {
            if (i == doc.list.length - 1) {
                result += "└ ";
            } else if (i == 0) {
                result += "┌ ";
            } else {
                result += "├ ";
            }
            result += doc.list[i].name + ' - ' + doc.list[i].result + '\n';
        }
        result += translate('init.table_start_hint');
        return result;
    }

    let result = translate('init.round_header', { round: doc.round }) + '\n';
    for (let i = 0; i < doc.list.length; i++) {
        let isCurrentTurn = i === doc.turn;
        if (i == doc.list.length - 1) {
            result += "└ ";
        } else if (i == 0) {
            result += "┌ ";
        } else {
            result += "├ ";
        }
        result += doc.list[i].name + ' - ' + doc.list[i].result;
        if (doc.list[i].status) {
            result += ` (${doc.list[i].status})`;
        }
        if (isCurrentTurn) {
            result += ' ◀';
        }
        result += '\n';
    }
    result += translate('init.command_hint');
    return result;
}
async function showInitn(doc, i18nParams = {}) {
    const translate = getT(i18nParams);
    let result = translate('init.table_title_asc') + '\n';
    doc.list.sort(function (a, b) {
        return a.result - b.result;
    });
    for (let i = 0; i < doc.list.length; i++) {
        if (i == doc.list.length - 1) {
            result += "└ ";
        } else
            if (i == 0) {
                result += "┌ ";
            } else {
                result += "├ ";
            }

        result += doc.list[i].name + ' - ' + doc.list[i].result + '\n';
    }
    return result;
}


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
                case 'add': {
                    const roll = interaction.options.getString('roll');
                    const name = interaction.options.getString('name');
                    return `.in ${roll}${name ? ' ' + name : ''}`;
                }
                case 'remove': {
                    const removeName = interaction.options.getString('name');
                    return `.in remove ${removeName}`;
                }
                case 'clear':
                    return '.in clear';
                case 'reroll':
                    return '.in reroll';
                case 'modify': {
                    const value = interaction.options.getString('value');
                    const modifyName = interaction.options.getString('name');
                    return `.in ${value} ${modifyName}`;
                }
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('init')
            .setDescription('先攻表相關指令')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示先攻表(大到小排序)'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('start')
                    .setDescription('開始戰鬥輪'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('next')
                    .setDescription('進入下一回合'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('end')
                    .setDescription('結束戰鬥輪'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('jump')
                    .setDescription('跳至指定角色')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('stats')
                    .setDescription('為角色附加狀態')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('status')
                            .setDescription('狀態內容 (留空以清除)')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('round')
                    .setDescription('設定當前回合數')
                    .addIntegerOption(option =>
                        option.setName('number')
                            .setDescription('回合數')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'show':
                    return '.init';
                case 'start':
                    return '.init start';
                case 'next':
                    return '.init next';
                case 'end':
                    return '.init end';
                case 'jump': {
                    const name = interaction.options.getString('name');
                    return `.init ${name}`;
                }
                case 'stats': {
                    const name = interaction.options.getString('name');
                    const status = interaction.options.getString('status');
                    return `.init stats ${name}${status ? ' ' + status : ''}`;
                }
                case 'round': {
                    const number = interaction.options.getInteger('number');
                    return `.init round ${number}`;
                }
            }
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
