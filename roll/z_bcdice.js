"use strict";
if (!process.env.mongoURL) {
    return;
}
const {
    DynamicLoader
} = require('bcdice');
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const checkTools = require('../modules/check.js');
const schema = require('../modules/schema.js');
const { getT, getInteractionT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const gameName = function (params = {}) {
    return resolveGameName(params, 'bcdice.game_name', '【BcDice】.bc');
}

const gameType = function () {
    return 'Dice:bcdice:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.bc$|^\.al$|^\.kk$|^\.mk$|^\.ss$|^\.sg$|^\.UK$|^\.dx$|^\.nc$|^\.sw$/i,
        second: null
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'bcdice.help', () => getT({ locale: 'zh-tw' })('bcdice.help'));
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userrole,
    botname,
    channelid,
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
    let filter = {
        botname: botname,
        channelid: channelid,
        //    trpgId: String
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;

        }
        case /^\.kk$/i.test(mainMsg[0]): {
            let result = await calldice("Kamigakari", mainMsg[1], translate);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }
        case /^\.dx$/i.test(mainMsg[0]): {
            let result = await calldice("DoubleCross", mainMsg[1], translate);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }
        case /^\.sw$/i.test(mainMsg[0]): {
            let result = await calldice("SwordWorld2.5", mainMsg[1], translate);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }

        case /^dicehelp$/i.test(mainMsg[1]): {
            let doc = await schema.bcdiceRegedit.findOne(filter).catch(error => console.error(error))
            if (doc && doc.trpgId) {
                rply.text = await callHelp(doc.trpgId) || '';
                return rply;
            } else {
                rply.text = translate('bcdice.no_table_id');
                rply.quotes = true;
                return rply;
            }

        }
        case /^use+$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }
            if (!mainMsg[2]) {
                rply.text = translate('bcdice.enter_id');
                return rply;
            }
            let help = await callHelp(mainMsg[2]);
            if (!help) {
                rply.text = translate('bcdice.invalid_id');
                return rply;
            }
            let doc = await schema.bcdiceRegedit.findOneAndUpdate(filter, { trpgId: mainMsg[2] }, { upsert: true, returnDocument: 'after' }).catch(() => null)
            if (doc) rply.text = translate('bcdice.updated', { id: doc.trpgId, help });
            else rply.text = translate('bcdice.register_failed');
            return rply;
        }
        case /^delete+$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            let doc = await schema.bcdiceRegedit.findOneAndDelete(filter).catch(error => console.error(error))
            if (doc) rply.text = translate('bcdice.deleted');
            else rply.text = translate('bcdice.delete_failed');
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            let doc = await schema.bcdiceRegedit.findOne(filter).catch(error => console.error(error))
            if (doc && doc.trpgId) {
                rply.text = await calldice(doc.trpgId, inputStr.replace(/^\S+/, ''), translate)
                return rply;
            }
            else {
                rply.text = translate('bcdice.no_table_configured');
                return rply;
            }
        }
        default: {
            rply.text = translate('bcdice.default_help');
            return rply;
        }
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('bcdice')
            .setDescription('【BcDice日系擲骰系統】')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('roll')
                    .setDescription('進行BcDice擲骰')
                    .addStringOption(option => 
                        option.setName('command')
                            .setDescription('擲骰指令')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('use')
                    .setDescription('登記使用的骰表ID')
                    .addStringOption(option => 
                        option.setName('system_id')
                            .setDescription('系統ID (例如: Cthulhu, PathFinder)')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('dicehelp')
                    .setDescription('查看當前系統說明'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('移除使用的骰表ID')),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'roll': {
                    const command = interaction.options.getString('command');
                    return `.bc ${command}`;
                }
                    
                case 'use': {
                    const systemId = interaction.options.getString('system_id');
                    return `.bc use ${systemId}`;
                }
                    
                case 'dicehelp':
                    return `.bc dicehelp`;
                    
                case 'delete':
                    return `.bc delete`;
                    
                default: {
                    const t = getInteractionT(interaction);
                    return t('bcdice.unknown_subcommand');
                }
            }
        }
    }
];
async function calldice(gameType, message, translate) {
    const t = translate || getT({});
    try {
        const loader = new DynamicLoader();
        const GameSystem = await loader.dynamicLoad(gameType);
        const result = GameSystem.eval(message);
        return (result && result.text) ? result.text : null;
    } catch (error) {
        console.error(
            `[${new Date().toISOString()}] Error evaluating dice command for command "${message}" using gameType "${gameType}":`,
            error?.stack || 'no stack'
        );
        return t('bcdice.eval_error', {
            input: message,
            message: error?.message || t('bcdice.no_error_message')
        });
    }
}
async function callHelp(gameType) {
    try {
        const loader = new DynamicLoader();
        const GameSystem = await loader.dynamicLoad(gameType);
        const result = GameSystem.HELP_MESSAGE || '';
        return result;
    } catch {
        return
    }

}
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};