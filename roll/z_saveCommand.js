"use strict";

if (!process.env.mongoURL) {
    return;
}

const { SlashCommandBuilder } = require('discord.js');
const checkTools = require('../modules/check.js');
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');

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

const gameName = () => '【儲存擲骰指令功能】 .cmd (add edit del show 自定關鍵字)';

const gameType = () => 'Tool:trpgCommand:hktrpg';

const prefixs = () => [{
    first: /(^[.]cmd$)/ig,
    second: null
}];

const getHelpMessage = async function () {
    return `【💾儲存擲骰指令】
╭──── 📝指令列表 ────
│ ■ 基本指令:
│ • .cmd add 關鍵字 指令
│   增加新的指令組合
│ • .cmd edit 關鍵字 指令
│   修改現有指令內容
│ • .cmd show
│   顯示所有關鍵字列表
│ • .cmd del 編號/all
│   刪除指定/全部指令
│
│ ■ 使用方式:
│ • .cmd 關鍵字/編號
│   執行已儲存的指令
│
│ ■ 範例說明:
│ • 儲存: .cmd add pc1鬥毆 cc 80 鬥毆
│ • 使用: .cmd pc1鬥毆
│
│ ■ 注意事項:
│ • 關鍵字可使用任意字元
│ • 如未生效請用show重整
╰──────────────`
}
const initialize = () => trpgCommandData;

const rollDiceCommand = async ({ inputStr, mainMsg, groupid, userrole }) => {
    let response = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const permissionError = checkTools.permissionErrMsg({
        flag: checkTools.flag.ChkChannelManager,
        gid: groupid,
        role: userrole
    });

    const vipLevel = await VIP.viplevelCheckGroup(groupid);
    const limit = FUNCTION_LIMIT[vipLevel];

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            response.text = await getHelpMessage();
            response.quotes = true;
            return response;

        case /^\.cmd$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[2]):
            return await handleAddCommand(inputStr, mainMsg, groupid, response, permissionError, limit);

        case /^\.cmd$/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[2]):
            return await handleEditCommand(mainMsg, groupid, response, permissionError, limit);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            return await handleDeleteAllCommands(groupid, response, permissionError);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            return await handleDeleteSpecificCommand(mainMsg, groupid, response, permissionError);

        case /^\.cmd$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            return handleShowCommands(groupid, response);

        case /^\.cmd$/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[1]):
            return handleExecuteCommand(mainMsg, groupid, response);

        default:
            return response;
    }
}

const handleAddCommand = async (inputStr, mainMsg, groupid, response, permissionError, limit) => {
    if (!mainMsg[2]) response.text += ' 沒有標題.\n\n';
    if (!mainMsg[3]) response.text += ' 沒有擲骰指令\n格式為\n.cmd add (關鍵字) (指令)\n';
    if (mainMsg[3] && mainMsg[3].toLowerCase() === ".cmd") response.text += '指令不可以儲存.cmd\n\n';
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    if (isDuplicateCommand(mainMsg[2], groupid)) {
        response.text = '已有該關鍵字\n請使用.cmd edit 來編輯或.cmd show 顯示列表\n\n';
        return response;
    }
    if (isExceedingLimit(groupid, limit)) {
        response.text = `關鍵字上限${limit}個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n`;
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
        response.text = '新增失敗，請稍後再試';
        return response;
    }

    response.text = `新增成功: 可使用.cmd \n${mainMsg[2]}\n${newCommand.trpgCommandfunction[0].contact}`;
    return response;
}

const handleEditCommand = async (mainMsg, groupid, response, permissionError, limit) => {
    if (!mainMsg[2]) response.text += '沒有標題。\n\n';
    if (mainMsg.length < 4) response.text += '沒有擲骰指令\n格式為\n.cmd edit (關鍵字) (指令)\n\n\n';
    if (mainMsg[3] && mainMsg[3].toLowerCase() === ".cmd") response.text += '指令不可以儲存.cmd。\n\n';
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    const newContact = mainMsg.slice(3).join(' ').trim();
    const existingCommand = findCommandByTopic(mainMsg[2], groupid);

    if (!existingCommand && isExceedingLimit(groupid, limit)) {
        response.text = `關鍵字上限${limit}個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n`;
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
            response.text = `編輯成功: ${mainMsg[2]}\n${newContact}`;
        } else {
            await records.pushTrpgCommandFunction('trpgCommand', updatedCommand);
            response.text = `新增成功: ${mainMsg[2]}\n${newContact}`;
        }
        await updateCommandData();
    } catch (error) {
        console.error('[z_saveCommand] Failed to edit/push command:', error);
        response.text = '操作失敗，請稍後再試';
        return response;
    }

    return response;
}

const handleDeleteAllCommands = async (groupid, response, permissionError) => {
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
                response.text = '已刪除所有關鍵字';
            } catch (error) {
                console.error('[z_saveCommand] Failed to delete all commands:', error);
                response.text = '刪除失敗，請稍後再試';
            }
        }
    }
    return response;
}

const handleDeleteSpecificCommand = async (mainMsg, groupid, response, permissionError) => {
    if (!mainMsg[2]) response.text += '沒有關鍵字. ';
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
                    response.text = `刪除成功: ${mainMsg[2]}: ${target.topic} \n ${target.contact}`;
                } catch (error) {
                    console.error('[z_saveCommand] Failed to delete command:', error);
                    response.text = '刪除失敗，請稍後再試';
                }
            } else {
                response.text = '沒有相關關鍵字. \n請使用.cmd show 顯示列表\n\n';
            }
        }
    }
    return response;
}

const handleShowCommands = (groupid, response) => {
    if (!groupid) {
        response.text = '此功能必須在群組中使用. ';
        return response;
    }

    let found = false;
    for (const entry of trpgCommandData.commands) {
        if (entry.groupid === groupid) {
            response.text += '資料庫列表:';
            for (const [index, cmd] of entry.trpgCommandfunction.entries()) {
                found = true;
                response.text += `\n${index}: ${cmd.topic}\n${cmd.contact}\n`;
            }
        }
    }

    if (!found) response.text = '沒有已設定的關鍵字. ';
    return response;
}

const handleExecuteCommand = (mainMsg, groupid, response) => {
    if (!groupid) {
        response.text = '此功能必須在群組中使用.';
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

    if (!found) response.text = '沒有相關關鍵字. ';
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
                        return '需要輸入關鍵字和指令內容\n例如: .cmd add pc1鬥毆 cc 80 鬥毆';
                    }
                }
                
                case 'edit': {
                    const keyword = interaction.options.getString('keyword');
                    const command = interaction.options.getString('command');
                    if (keyword && command) {
                        return `.cmd edit ${keyword} ${command}`;
                    } else {
                        return '需要輸入關鍵字和新的指令內容\n例如: .cmd edit pc1鬥毆 cc 85 鬥毆';
                    }
                }
                
                case 'show':
                    return `.cmd show`;
                
                case 'del': {
                    const target = interaction.options.getString('target');
                    if (target) {
                        return `.cmd del ${target}`;
                    } else {
                        return '需要輸入編號或all\n例如: .cmd del 1 或 .cmd del all';
                    }
                }
                
                case 'execute': {
                    const keyword = interaction.options.getString('keyword');
                    if (keyword) {
                        return `.cmd ${keyword}`;
                    } else {
                        return '需要輸入關鍵字或編號\n例如: .cmd pc1鬥毆';
                    }
                }
                
                default:
                    return '未知的子命令';
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