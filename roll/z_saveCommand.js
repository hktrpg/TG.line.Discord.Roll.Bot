"use strict";

if (!process.env.mongoURL) {
    return;
}

const { SlashCommandBuilder } = require('discord.js');
const checkTools = require('../modules/check.js');
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');

let trpgCommandData = {};

// Initialize data asynchronously
(async () => {
    try {
        trpgCommandData.commands = await records.get('trpgCommand');
    } catch (error) {
        console.error('[z_saveCommand] Failed to initialize trpgCommand data:', error);
        trpgCommandData.commands = [];
    }
})();

const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];

const gameName = (params = {}) => resolveGameName(params, 'cmd.game_name', '【儲存擲骰指令功能】 .cmd (add edit del show 自定關鍵字)');

const gameType = () => 'Tool:trpgCommand:hktrpg';

const prefixs = () => [{
    first: /(^[.]cmd$)/ig,
    second: null
}];

const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'cmd.help');
}
const initialize = () => trpgCommandData;

const rollDiceCommand = async ({ inputStr, mainMsg, groupid, userrole, locale, t }) => {
    const translate = getT({ locale, t });
    let response = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const permissionError = checkTools.permissionErrMsg({ locale,
        flag: checkTools.flag.ChkChannelManager,
        gid: groupid,
        role: userrole
    });

    const vipLevel = await VIP.viplevelCheckGroup(groupid);
    const limit = FUNCTION_LIMIT[vipLevel];

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            response.text = await getHelpMessage({ locale, t });
            response.quotes = true;
            return response;

        case /^\.cmd$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[2]):
            return await handleAddCommand(inputStr, mainMsg, groupid, response, permissionError, limit, translate);

        case /^\.cmd$/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[2]):
            return await handleEditCommand(mainMsg, groupid, response, permissionError, limit, translate);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            return await handleDeleteAllCommands(groupid, response, permissionError, translate);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            return await handleDeleteSpecificCommand(mainMsg, groupid, response, permissionError, translate);

        case /^\.cmd$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            return handleShowCommands(groupid, response, translate);

        case /^\.cmd$/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[1]):
            return handleExecuteCommand(mainMsg, groupid, response, translate);

        default:
            return response;
    }
}

const handleAddCommand = async (inputStr, mainMsg, groupid, response, permissionError, limit, translate) => {
    if (!mainMsg[2]) response.text += translate('cmd.no_title');
    if (!mainMsg[3]) response.text += translate('cmd.no_command');
    if (mainMsg[3] && mainMsg[3].toLowerCase() === ".cmd") response.text += translate('cmd.cannot_save_cmd');
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    if (isDuplicateCommand(mainMsg[2], groupid)) {
        response.text = translate('cmd.duplicate_keyword');
        return response;
    }
    if (isExceedingLimit(groupid, limit)) {
        response.text = translate('cmd.limit_reached', { limit });
        return response;
    }

    const newCommand = {
        groupid: groupid,
        trpgCommandfunction: [{
            topic: mainMsg[2],
            contact: inputStr.replace(/\.cmd\s+add\s+/i, '').replace(mainMsg[2], '').trim()
        }]
    };

    try {
        await records.pushTrpgCommandFunction('trpgCommand', newCommand);
        await updateCommandData();
    } catch (error) {
        console.error('[z_saveCommand] Failed to push command:', error);
        response.text = translate('cmd.add_failed');
        return response;
    }

    response.text = translate('cmd.add_success', {
        keyword: mainMsg[2],
        command: newCommand.trpgCommandfunction[0].contact
    });
    return response;
}

const handleEditCommand = async (mainMsg, groupid, response, permissionError, limit, translate) => {
    if (!mainMsg[2]) response.text += translate('cmd.no_title_edit');
    if (mainMsg.length < 4) response.text += translate('cmd.no_command_edit');
    if (mainMsg[3] && mainMsg[3].toLowerCase() === ".cmd") response.text += translate('cmd.cannot_save_cmd_edit');
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    const newContact = mainMsg.slice(3).join(' ').trim();
    const existingCommand = findCommandByTopic(mainMsg[2], groupid);

    if (!existingCommand && isExceedingLimit(groupid, limit)) {
        response.text = translate('cmd.limit_reached', { limit });
        return response;
    }

    const updatedCommand = {
        groupid: groupid,
        trpgCommandfunction: [{
            topic: mainMsg[2],
            contact: newContact
        }]
    };

    try {
    if (existingCommand) {
            await records.editsetTrpgCommandFunction('trpgCommand', updatedCommand);
        response.text = translate('cmd.edit_success', { keyword: mainMsg[2], command: newContact });
    } else {
            await records.pushTrpgCommandFunction('trpgCommand', updatedCommand);
        response.text = translate('cmd.add_via_edit_success', { keyword: mainMsg[2], command: newContact });
        }
        await updateCommandData();
    } catch (error) {
        console.error('[z_saveCommand] Failed to edit/push command:', error);
        response.text = translate('cmd.operation_failed');
        return response;
    }

    return response;
}

const handleDeleteAllCommands = async (groupid, response, permissionError, translate) => {
    if (permissionError) {
        response.text = permissionError;
        return response;
    }

    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            entry.trpgCommandfunction = [];
            try {
                await records.setTrpgCommandFunction('trpgCommand', entry);
                await updateCommandData();
            response.text = translate('cmd.delete_all_success');
            } catch (error) {
                console.error('[z_saveCommand] Failed to delete all commands:', error);
                response.text = translate('cmd.delete_failed');
            }
        }
    }
    return response;
}

const handleDeleteSpecificCommand = async (mainMsg, groupid, response, permissionError, translate) => {
    if (!mainMsg[2]) response.text += translate('cmd.no_keyword');
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            const index = Number.parseInt(mainMsg[2]);
            if (index >= 0 && index < entry.trpgCommandfunction.length) {
                const target = entry.trpgCommandfunction[index]; // get target before deletion
                entry.trpgCommandfunction.splice(index, 1);
                try {
                    await records.setTrpgCommandFunction('trpgCommand', entry);
                    await updateCommandData();
                response.text = translate('cmd.delete_success', {
                    index: mainMsg[2],
                    topic: target.topic,
                    command: target.contact
                });
                } catch (error) {
                    console.error('[z_saveCommand] Failed to delete command:', error);
                    response.text = translate('cmd.delete_failed');
                }
            } else {
                response.text = translate('cmd.keyword_not_found');
            }
        }
    }
    return response;
}

const handleShowCommands = (groupid, response, translate) => {
    if (!groupid) {
        response.text = translate('cmd.group_only');
        return response;
    }

    let found = false;
    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            response.text += translate('cmd.list_header');
            for (const [index, cmd] of entry.trpgCommandfunction.entries()) {
                found = true;
                response.text += translate('cmd.list_entry', {
                    index,
                    topic: cmd.topic,
                    command: cmd.contact
                });
            }
        }
    }

    if (!found) response.text = translate('cmd.no_keywords');
    return response;
}

const handleExecuteCommand = (mainMsg, groupid, response, translate) => {
    if (!groupid) {
        response.text = translate('cmd.group_only_dot');
        return response;
    }

    let found = false;
    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            for (const cmd of entry.trpgCommandfunction) {
                if (cmd.topic.toLowerCase() === mainMsg[1].toLowerCase()) {
                    response.text = cmd.contact;
                    response.cmd = true;
                    found = true;
                }
            }

            if (!found && !Number.isNaN(mainMsg[1])) {
                const index = Number.parseInt(mainMsg[1]);
                if (index >= 0 && index < entry.trpgCommandfunction.length) {
                    response.text = entry.trpgCommandfunction[index].contact;
                    response.cmd = true;
                    found = true;
                }
            }
        }
    }

    if (!found) response.text = translate('cmd.execute_not_found');
    return response;
}

const isDuplicateCommand = (topic, groupid) => {
    let isDuplicate = false;

    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            if (entry.trpgCommandfunction.some(cmd => cmd.topic.toLowerCase() === topic.toLowerCase())) {
                isDuplicate = true;
            }
        }
    }

    return isDuplicate;
}

const isExceedingLimit = (groupid, limit) => {
    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            return entry.trpgCommandfunction.length >= limit;
        }
    }
    return false;
}

const findCommandByTopic = (topic, groupid) => {
    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            return entry.trpgCommandfunction.find(cmd => cmd.topic.toLowerCase() === topic.toLowerCase());
        }
    }
    return null;
}

const updateCommandData = async () => {
    try {
        trpgCommandData.commands = await records.get('trpgCommand');
    } catch (error) {
        console.error('[z_saveCommand] Failed to update command data:', error);
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('cmd')
            .setDescription('【儲存擲骰指令功能】')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('help')
                    .setDescription('顯示儲存擲骰指令功能的說明'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('增加新的指令組合')
                    .addStringOption(option => 
                        option.setName('keyword')
                            .setDescription('關鍵字')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('command')
                            .setDescription('指令內容')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('edit')
                    .setDescription('修改現有指令內容')
                    .addStringOption(option => 
                        option.setName('keyword')
                            .setDescription('關鍵字')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('command')
                            .setDescription('新的指令內容')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示所有關鍵字列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除指定/全部指令')
                    .addStringOption(option => 
                        option.setName('target')
                            .setDescription('編號或all')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('execute')
                    .setDescription('執行已儲存的指令')
                    .addStringOption(option => 
                        option.setName('keyword')
                            .setDescription('關鍵字或編號')
                            .setRequired(true))),
        async execute(interaction) {
            const translate = getT({ locale: interaction._hktrpgLocale, t: interaction._hktrpgT });
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'help': {
                    return `.cmd help`;
                }
                
                case 'add': {
                    const keyword = interaction.options.getString('keyword');
                    const command = interaction.options.getString('command');
                    if (keyword && command) {
                        return `.cmd add ${keyword} ${command}`;
                    } else {
                        return translate('cmd.slash_add_required');
                    }
                }
                
                case 'edit': {
                    const keyword = interaction.options.getString('keyword');
                    const command = interaction.options.getString('command');
                    if (keyword && command) {
                        return `.cmd edit ${keyword} ${command}`;
                    } else {
                        return translate('cmd.slash_edit_required');
                    }
                }
                
                case 'show':
                    return `.cmd show`;
                
                case 'del': {
                    const target = interaction.options.getString('target');
                    if (target) {
                        return `.cmd del ${target}`;
                    } else {
                        return translate('cmd.slash_del_required');
                    }
                }
                
                case 'execute': {
                    const keyword = interaction.options.getString('keyword');
                    if (keyword) {
                        return `.cmd ${keyword}`;
                    } else {
                        return translate('cmd.slash_execute_required');
                    }
                }
                
                default:
                    return translate('cmd.unknown_subcommand');
            }
        }
    }
];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};