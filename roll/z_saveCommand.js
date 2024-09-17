"use strict";

if (!process.env.mongoURL) {
    return;
}

const checkTools = require('../modules/check.js');
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');

let trpgCommandData = {};

records.get('trpgCommand', (msgs) => {
    trpgCommandData.commands = msgs;
});

const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];

const gameName = () => '【儲存擲骰指令功能】 .cmd (add edit del show 自定關鍵字)';

const gameType = () => 'Tool:trpgCommand:hktrpg';

const prefixs = () => [{
    first: /(^[.]cmd$)/ig,
    second: null
}];

const getHelpMessage = async () => {
    return `【儲存擲骰指令功能】
這是根據關鍵字來再現擲骰指令

輸入.cmd add (關鍵字) (指令)即可增加關鍵字
輸入.cmd edit (關鍵字) (指令)即可修改指令
輸入.cmd show 顯示所有關鍵字及編號
輸入.cmd del(編號)或all 即可刪除
輸入.cmd  (關鍵字/編號) 即可執行 

例如輸入 .cmd add  pc1鬥毆 cc 80 鬥毆 
再輸入.cmd pc1鬥毆  就會執行後方的指令
add 後面第一個是關鍵字, 可以是符號或任何字
P.S.如果沒立即生效 用.cmd show 刷新一下`;
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
            return handleAddCommand(inputStr, mainMsg, groupid, response, permissionError, limit);

        case /^\.cmd$/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[2]):
            return handleEditCommand(mainMsg, groupid, response, permissionError, limit);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            return handleDeleteAllCommands(groupid, response, permissionError);

        case /^\.cmd$/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            return handleDeleteSpecificCommand(mainMsg, groupid, response, permissionError);

        case /^\.cmd$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            return handleShowCommands(groupid, response);

        case /^\.cmd$/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && !/^(add|edit|del|show)$/i.test(mainMsg[1]):
            return handleExecuteCommand(mainMsg, groupid, response);

        default:
            return response;
    }
}

const handleAddCommand = (inputStr, mainMsg, groupid, response, permissionError, limit) => {
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

    records.pushtrpgCommandfunction('trpgCommand', newCommand, () => {
        updateCommandData();
    });

    response.text = `新增成功: 可使用.cmd \n${mainMsg[2]}\n${newCommand.trpgCommandfunction[0].contact}`;
    return response;
}

const handleEditCommand = (mainMsg, groupid, response, permissionError, limit) => {
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

    if (existingCommand) {
        records.editSettrpgCommandfunction('trpgCommand', updatedCommand, () => {
            updateCommandData();
        });
        response.text = `編輯成功: ${mainMsg[2]}\n${newContact}`;
    } else {
        records.pushtrpgCommandfunction('trpgCommand', updatedCommand, () => {
            updateCommandData();
        });
        response.text = `新增成功: ${mainMsg[2]}\n${newContact}`;
    }

    return response;
}

const handleDeleteAllCommands = (groupid, response, permissionError) => {
    if (permissionError) {
        response.text = permissionError;
        return response;
    }

    trpgCommandData.commands.forEach((entry) => {
        if (entry.groupid === groupid) {
            entry.trpgCommandfunction = [];
            records.settrpgCommandfunction('trpgCommand', entry, () => {
                updateCommandData();
            });
            response.text = '已刪除所有關鍵字';
        }
    });
    return response;
}

const handleDeleteSpecificCommand = (mainMsg, groupid, response, permissionError) => {
    if (!mainMsg[2]) response.text += '沒有關鍵字. ';
    if (response.text || permissionError) {
        response.text += permissionError;
        return response;
    }

    trpgCommandData.commands.forEach((entry) => {
        if (entry.groupid === groupid) {
            const index = parseInt(mainMsg[2]);
            let target;
            if (index >= 0 && index < entry.trpgCommandfunction.length) {
                entry.trpgCommandfunction.splice(index, 1);
                target = entry.trpgCommandfunction[index];
                records.settrpgCommandfunction('trpgCommand', entry, () => {
                    updateCommandData();
                });
                response.text = `刪除成功: ${mainMsg[2]}: ${target.topic} \n ${target.contact}`;
            }
            else {
                response.text = '沒有相關關鍵字. \n請使用.cmd show 顯示列表\n\n';
            }
        }
    });
    return response;
}

const handleShowCommands = (groupid, response) => {
    if (!groupid) {
        response.text = '此功能必須在群組中使用. ';
        return response;
    }

    let found = false;
    trpgCommandData.commands.forEach((entry) => {
        if (entry.groupid === groupid) {
            response.text += '資料庫列表:';
            entry.trpgCommandfunction.forEach((cmd, index) => {
                found = true;
                response.text += `\n${index}: ${cmd.topic}\n${cmd.contact}\n`;
            });
        }
    });

    if (!found) response.text = '沒有已設定的關鍵字. ';
    return response;
}

const handleExecuteCommand = (mainMsg, groupid, response) => {
    if (!groupid) {
        response.text = '此功能必須在群組中使用.';
        return response;
    }

    let found = false;
    trpgCommandData.commands.forEach((entry) => {
        if (entry.groupid === groupid) {
            entry.trpgCommandfunction.forEach((cmd) => {
                if (cmd.topic.toLowerCase() === mainMsg[1].toLowerCase()) {
                    response.text = cmd.contact;
                    response.cmd = true;
                    found = true;
                }
            });

            if (!found && !isNaN(mainMsg[1])) {
                const index = parseInt(mainMsg[1]);
                if (index >= 0 && index < entry.trpgCommandfunction.length) {
                    response.text = entry.trpgCommandfunction[index].contact;
                    response.cmd = true;
                    found = true;
                }
            }
        }
    });

    if (!found) response.text = '沒有相關關鍵字. ';
    return response;
}



const isDuplicateCommand = (topic, groupid, limit) => {
    let isDuplicate = false;

    trpgCommandData.commands.forEach((entry) => {
        if (entry.groupid === groupid) {
            if (entry.trpgCommandfunction.some(cmd => cmd.topic.toLowerCase() === topic.toLowerCase())) {
                isDuplicate = true;
            }
        }
    });

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

const updateCommandData = () => {
    records.get('trpgCommand', (msgs) => {
        trpgCommandData.commands = msgs;
    });
}

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName
};