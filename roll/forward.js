"use strict";
if (!process.env.mongoURL) {
    return;
}
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const schema = require('../modules/schema.js');
const records = require('../modules/records.js');
const { SlashCommandBuilder } = require('discord.js');
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];

const gameName = function () {
    return '【Discord按鈕轉發功能】'
}

const gameType = function () {
    return 'Tool:forward:hktrpg'
}

const prefixs = function () {
    return [{
        first: /^\.forward$/i,
        second: null
    }]
}

const getHelpMessage = function () {
    return `【Discord按鈕轉發功能】
╭──── 📝功能說明 ────
│ 可以將角色卡按鈕或要求擲骰按鈕的結果
│ 轉發到指定的頻道
│
├──── 🔰基本指令 ────
│ .forward [Discord訊息連結]
│ 　指定按鈕訊息轉發到當前頻道
│
│ .forward show
│ 　顯示所有轉發設定
│
│ .forward delete [編號]
│ 　刪除指定編號的轉發設定
│
├──── 💡注意事項 ────
│ • 只能轉發自己的角色卡按鈕
│ • 每個按鈕只能指定一個轉發頻道
│ • 轉發數量有VIP等級限制
│ • 轉發設定會永久保存
│
├──── 🔍進階說明 ────
│ • 支援的按鈕類型:
│ 　- .ch button (角色卡狀態)
│ 　- .char button (角色卡擲骰)
│ 　- .re (要求擲骰/點擊)
│
├──── 📋指令範例 ────
│ .forward https://discord.com/...
│ .forward show
│ .forward delete 1
╰──────────────`;
}

const initialize = function () {
    return {};
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount,
    discordClient,
    discordMessage
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        case /^show$/i.test(mainMsg[1]): {
            try {
                // Explicitly clear the user's cached forwarded messages before fetching
                records.clearUserForwardedMessageCache(userid);

                const forwardedMessages = await records.findForwardedMessages({ userId: userid });
                if (forwardedMessages.length === 0) {
                    rply.text = `╭──── ℹ️ 按鈕轉發狀態 ────\n│ ❌ 你目前沒有轉發任何按鈕\n╰─────────────────`;
                    return rply;
                }

                let responseText = `╭──── 📋 按鈕轉發列表 ────\n`;
                for (let i = 0; i < forwardedMessages.length; i++) {
                    const forward = forwardedMessages[i];
                    const targetChannelLink = `https://discord.com/channels/${forward.guildId}/${forward.channelId}`;
                    const sourceMessageLink = `https://discord.com/channels/${forward.guildId}/${forward.sourceChannelId}/${forward.sourceMessageId}`;

                    responseText += `│ ${forward.fixedId}. 「${forward.characterName}」轉發至頻道: ${forward.channelId}\n`;
                    responseText += `│    ${targetChannelLink}\n`;
                    responseText += `│    來源按鈕連結: ${sourceMessageLink}\n`;
                    if (i < forwardedMessages.length - 1) responseText += `│\n`;
                }
                responseText += `│\n│ 💡 使用 .forward delete [編號] 可刪除轉發\n╰─────────────────`;
                rply.text = responseText;
                return rply;
            } catch (error) {
                console.error('顯示轉發訊息時發生錯誤', error);
                rply.text = '顯示轉發訊息時發生錯誤: ' + error.message;
                return rply;
            }
        }

        case /^delete$/i.test(mainMsg[1]): {
            try {
                // Recreate the forwardedMessage index before deletion
                await records.recreateForwardedMessageIndex();

                // Handle case where no ID is provided (show the list)
                if (!mainMsg[2]) {
                    // Explicitly clear the user's cached forwarded messages before fetching
                    records.clearUserForwardedMessageCache(userid);

                    const forwardedMessages = await records.findForwardedMessages({ userId: userid });
                    if (forwardedMessages.length === 0) {
                        rply.text = `╭──── ℹ️ 按鈕轉發狀態 ────\n│ ❌ 你目前沒有轉發任何按鈕\n╰─────────────────`;
                        return rply;
                    }

                    let responseText = `╭──── 📋 請選擇要刪除的轉發 ────\n`;
                    for (let i = 0; i < forwardedMessages.length; i++) {
                        const forward = forwardedMessages[i];
                        const targetChannelLink = `https://discord.com/channels/${forward.guildId}/${forward.channelId}`;

                        responseText += `│ ${forward.fixedId}. 「${forward.characterName}」轉發至頻道: ${forward.channelId}\n`;
                        responseText += `│    ${targetChannelLink}\n`;
                        if (i < forwardedMessages.length - 1) responseText += `│\n`;
                    }
                    responseText += `│\n│ 💡 使用 .forward delete [編號] 刪除特定轉發\n╰─────────────────`;
                    rply.text = responseText;
                    return rply;
                }

                // Extract the forward ID from the input
                let forwardId;
                if (mainMsg[2] && !isNaN(parseInt(mainMsg[2]))) {
                    forwardId = parseInt(mainMsg[2]);
                } else {
                    rply.text = '無效的指令格式，請使用 .forward delete 數字';
                    return rply;
                }

                const forwardToDelete = await records.deleteForwardedMessage({
                    userId: userid,
                    fixedId: forwardId
                });

                if (!forwardToDelete) {
                    rply.text = `╭──── ⚠️ 無效的編號 ────\n│ ❌ 找不到編號 ${forwardId} 的轉發\n╰─────────────────`;
                    return rply;
                }

                // Explicitly clear the user's cached forwarded messages
                records.clearUserForwardedMessageCache(userid);

                // Recreate the index after deletion to ensure cache is updated
                await records.recreateForwardedMessageIndex();

                rply.text = `╭──── ✅ 刪除成功 ────\n│ 已刪除編號 ${forwardId} 的「${forwardToDelete.characterName || '未知角色'}」轉發\n╰─────────────────`;
                return rply;
            } catch (error) {
                console.error('刪除轉發訊息時發生錯誤', error);
                rply.text = '刪除轉發訊息時發生錯誤: ' + error.message;
                return rply;
            }
        }

        case /^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用';
                return rply;
            }

            if (!discordMessage || !discordClient) {
                rply.text = '此功能只能在Discord中使用';
                return rply;
            }

            // Recreate the forwardedMessage index
            await records.recreateForwardedMessageIndex();

            // Check VIP level
            let userVipLevel = await VIP.viplevelCheckUser(userid);
            let groupVipLevel = await VIP.viplevelCheckGroup(groupid);
            let vipLevel = Math.max(userVipLevel, groupVipLevel);
            let limit = FUNCTION_LIMIT[vipLevel];

            // Check forwarded messages limit
            let existingForwardedMessages = await records.countForwardedMessages({ userId: userid });
            if (existingForwardedMessages >= limit) {
                rply.text = `╭──── ⚠️ 按鈕轉發上限 ────\n│ ❌ 你已達到按鈕轉發上限 (${limit}個)\n│\n│ 💎 如需增加上限，請升級VIP等級\n│ 🔗 支援及解鎖上限: https://www.patreon.com/HKTRPG\n╰─────────────────`;
                return rply;
            }

            const messageLink = mainMsg[1];
            const matches = messageLink.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
            const [, sourceGuildId, sourceChannelId, sourceMessageId] = matches;

            // Verify if current guild is the same as source guild
            if (discordMessage.guildId !== sourceGuildId) {
                rply.text = '無法轉發來自其他伺服器的訊息';
                return rply;
            }

            // Check if source channel is the same as current channel
            if (sourceChannelId === channelid) {
                rply.text = '無法轉發來自同一頻道的訊息';
                return rply;
            }

            try {
                // Fetch source channel and message
                const sourceChannel = await discordClient.channels.fetch(sourceChannelId);
                if (!sourceChannel) {
                    rply.text = '找不到指定的頻道';
                    return rply;
                }

                const sourceMessage = await sourceChannel.messages.fetch(sourceMessageId);
                if (!sourceMessage) {
                    rply.text = '找不到指定的訊息';
                    return rply;
                }


                // Get message content
                const messageContent = sourceMessage.content;
                if (!messageContent || messageContent.trim() === '') {
                    rply.text = '該訊息沒有按鈕';
                    return rply;
                }

                // Check if message is a valid button message
                if (!messageContent.endsWith('的角色') &&
                    !messageContent.endsWith('的角色卡') &&
                    !messageContent.match(/要求擲骰\/點擊/)) {
                    rply.text = '只能轉發角色卡按鈕或要求擲骰按鈕';
                    return rply;
                }

                // Check if user is mentioned or is interaction user
                let isMentioned = false;
                let isInteractionUser = false;

                if (sourceMessage.mentions && sourceMessage.mentions.users) {
                    isMentioned = Array.from(sourceMessage.mentions.users.entries())
                        .some(([userId]) => userId === userid);
                }

                if (sourceMessage.interaction && sourceMessage.interaction.user) {
                    isInteractionUser = (sourceMessage.interaction.user.id === userid);
                }

                if (!isMentioned && !isInteractionUser) {
                    if (sourceMessage.reference?.messageId) {
                        const refMessage = await sourceChannel.messages.fetch(sourceMessage.reference.messageId);
                        if (refMessage.author.id === userid) {
                            isMentioned = true;
                        }
                    } else {
                        rply.text = '你只能轉發你的按鈕';
                        return rply;
                    }
                }

                // Get character/button name
                let buttonName = '';
                if (messageContent.endsWith('的角色')) {
                    buttonName = messageContent.replace(/的角色$/, '').trim();
                } else if (messageContent.endsWith('的角色卡')) {
                    buttonName = messageContent.replace(/的角色卡$/, '').trim();
                } else {
                    buttonName = '要求擲骰按鈕';
                }

                if (!buttonName) {
                    rply.text = '無法識別按鈕名稱，請確認該按鈕訊息格式正確';
                    return rply;
                }

                // Check if button is already assigned
                let existingForward = await records.findForwardedMessage({
                    userId: userid,
                    sourceMessageId: sourceMessageId
                });

                if (existingForward) {
                    rply.text = `╭──── ⚠️ 按鈕已指定 ────\n│ ❌ 「${buttonName}」此按鈕已經被指定到其他頻道\n│\n│ ℹ️ 每個按鈕只能指定到一個頻道\n╰─────────────────`;
                    return rply;
                }

                // Get next available fixedId
                let nextFixedId = await records.getNextFixedIdForUser(userid);

                // Store forwarded message
                try {
                    await records.createForwardedMessage({
                        userId: userid,
                        guildId: groupid,
                        channelId: channelid,
                        sourceMessageId: sourceMessageId,
                        sourceChannelId: sourceChannelId,
                        characterName: buttonName,
                        forwardedAt: new Date(),
                        fixedId: nextFixedId
                    });
                } catch (error) {
                    console.error('儲存轉發按鈕時發生錯誤', error);
                    rply.text = '轉發按鈕時發生錯誤';
                    return rply;
                }

                const sourceMessageLink = `https://discord.com/channels/${groupid}/${sourceChannelId}/${sourceMessageId}`;
                rply.text = `╭──── ✨ 按鈕位置已儲存 ────\n│ ✅ 「${buttonName}」此按鈕位置已儲存\n│\n│ 📌 當你使用該按鈕後，所有訊息將在此頻道中發送\n│\n│ 🔢 編號: ${nextFixedId}\n│ 🔗 來源按鈕連結: ${sourceMessageLink}\n│\n│ 🗑️ 使用 .forward delete ${nextFixedId} 可刪除轉發\n╰─────────────────`;
                return rply;

            } catch (error) {
                console.error('處理訊息轉發時發生錯誤', error);
                rply.text = '轉發訊息時發生錯誤: ' + error.message;
                return rply;
            }
        }

        default:
            break;
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('forward')
            .setDescription('Discord按鈕轉發功能')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('設定按鈕轉發')
                    .addStringOption(option =>
                        option.setName('message_link')
                            .setDescription('Discord訊息連結')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示所有轉發設定'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除指定編號的轉發設定')
                    .addIntegerOption(option =>
                        option.setName('id')
                            .setDescription('轉發編號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            let command = null;

            switch (subcommand) {
                case 'set':
                    command = `.forward ${interaction.options.getString('message_link')}`;
                    return command;
                case 'show':
                    command = `.forward show`;
                    return command;
                case 'delete':
                    const id = interaction.options.getInteger('id');
                    if (id <= 0) {
                        await interaction.reply({ content: '請提供有效的轉發編號', ephemeral: true });
                        return null;
                    }
                    command = `.forward delete ${id}`;
                    return command;
            }
            return null;
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