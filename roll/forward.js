"use strict";
if (!process.env.mongoURL) {
    return;
}
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');
const { getT, getInteractionT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];

const gameName = function (params = {}) {
    return resolveGameName(params, 'forward.game_name', '【Discord按鈕轉發功能】');
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

const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'forward.help', () => getT({ locale: 'zh-tw' })('forward.help'));
}

function buildForwardList(forwardedMessages, translate, mode) {
    if (forwardedMessages.length === 0) {
        return translate('forward.show_empty');
    }
    const headerKey = mode === 'delete' ? 'forward.delete_pick_header' : 'forward.show_list_header';
    let responseText = translate(headerKey);
    for (let i = 0; i < forwardedMessages.length; i++) {
        const forward = forwardedMessages[i];
        const targetChannelLink = `https://discord.com/channels/${forward.guildId}/${forward.channelId}`;
        const sourceMessageLink = `https://discord.com/channels/${forward.guildId}/${forward.sourceChannelId}/${forward.sourceMessageId}`;
        responseText += translate('forward.list_entry', {
            id: forward.fixedId,
            name: forward.characterName,
            channelId: forward.channelId,
            channelLink: targetChannelLink
        });
        if (mode !== 'delete') {
            responseText += translate('forward.list_source', { link: sourceMessageLink });
        }
        if (i < forwardedMessages.length - 1) responseText += '│\n';
    }
    const footerKey = mode === 'delete' ? 'forward.delete_pick_footer' : 'forward.show_list_footer';
    responseText += translate(footerKey);
    return responseText;
}

const initialize = function () {
    return {};
}

const rollDiceCommand = async function ({
    mainMsg,
    groupid,
    userid,
    channelid,
    discordClient,
    discordMessage,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage(i18nParams);
            rply.quotes = true;
            return rply;
        }

        case /^show$/i.test(mainMsg[1]): {
            try {
                records.clearUserForwardedMessageCache(userid);

                const forwardedMessages = await records.findForwardedMessages({ userId: userid });
                rply.text = buildForwardList(forwardedMessages, translate, 'show');
                return rply;
            } catch (error) {
                console.error('顯示轉發訊息時發生錯誤', error);
                rply.text = translate('forward.show_error', { message: error.message });
                return rply;
            }
        }

        case /^delete$/i.test(mainMsg[1]): {
            try {
                await records.recreateForwardedMessageIndex();

                if (!mainMsg[2]) {
                    records.clearUserForwardedMessageCache(userid);

                    const forwardedMessages = await records.findForwardedMessages({ userId: userid });
                    rply.text = buildForwardList(forwardedMessages, translate, 'delete');
                    return rply;
                }

                let forwardId;
                if (mainMsg[2] && !Number.isNaN(Number.parseInt(mainMsg[2]))) {
                    forwardId = Number.parseInt(mainMsg[2]);
                } else {
                    rply.text = translate('forward.delete_invalid_format');
                    return rply;
                }

                const forwardToDelete = await records.deleteForwardedMessage({
                    userId: userid,
                    fixedId: forwardId
                });

                if (!forwardToDelete) {
                    rply.text = translate('forward.delete_not_found', { id: forwardId });
                    return rply;
                }

                records.clearUserForwardedMessageCache(userid);
                await records.recreateForwardedMessageIndex();

                rply.text = translate('forward.delete_success', {
                    id: forwardId,
                    name: forwardToDelete.characterName || translate('forward.unknown_character')
                });
                return rply;
            } catch (error) {
                console.error('刪除轉發訊息時發生錯誤', error);
                rply.text = translate('forward.delete_error', { message: error.message });
                return rply;
            }
        }

        case /^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = translate('forward.group_only');
                return rply;
            }

            if (!discordMessage || !discordClient) {
                rply.text = translate('forward.discord_only');
                return rply;
            }

            await records.recreateForwardedMessageIndex();

            let userVipLevel = await VIP.viplevelCheckUser(userid);
            let groupVipLevel = await VIP.viplevelCheckGroup(groupid);
            let vipLevel = Math.max(userVipLevel, groupVipLevel);
            let limit = FUNCTION_LIMIT[vipLevel];

            let existingForwardedMessages = await records.countForwardedMessages({ userId: userid });
            if (existingForwardedMessages >= limit) {
                rply.text = translate('forward.limit_reached', { limit });
                return rply;
            }

            const messageLink = mainMsg[1];
            const matches = messageLink.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
            const [, sourceGuildId, sourceChannelId, sourceMessageId] = matches;

            if (discordMessage.guildId !== sourceGuildId) {
                rply.text = translate('forward.cross_guild');
                return rply;
            }

            if (sourceChannelId === channelid) {
                rply.text = translate('forward.same_channel');
                return rply;
            }

            try {
                const sourceChannel = await discordClient.channels.fetch(sourceChannelId);
                if (!sourceChannel) {
                    rply.text = translate('forward.channel_not_found');
                    return rply;
                }

                const sourceMessage = await sourceChannel.messages.fetch(sourceMessageId);
                if (!sourceMessage) {
                    rply.text = translate('forward.message_not_found');
                    return rply;
                }

                const messageContent = sourceMessage.content;
                if (!messageContent || messageContent.trim() === '') {
                    rply.text = translate('forward.no_buttons');
                    return rply;
                }

                if (!messageContent.endsWith('的角色') &&
                    !messageContent.endsWith('的角色卡') &&
                    !/要求擲骰\/點擊/.test(messageContent)) {
                    rply.text = translate('forward.invalid_button_type');
                    return rply;
                }

                let isMentioned = false;
                let isInteractionUser = false;

                if (sourceMessage.mentions && sourceMessage.mentions.users) {
                    isMentioned = [...sourceMessage.mentions.users.entries()]
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
                        rply.text = translate('forward.not_your_button');
                        return rply;
                    }
                }

                let buttonName = '';
                if (messageContent.endsWith('的角色')) {
                    buttonName = messageContent.replace(/的角色$/, '').trim();
                } else if (messageContent.endsWith('的角色卡')) {
                    buttonName = messageContent.replace(/的角色卡$/, '').trim();
                } else {
                    buttonName = translate('forward.request_roll_button');
                }

                if (!buttonName) {
                    rply.text = translate('forward.button_name_unknown');
                    return rply;
                }

                let existingForward = await records.findForwardedMessage({
                    userId: userid,
                    sourceMessageId: sourceMessageId
                });

                if (existingForward) {
                    rply.text = translate('forward.button_already_assigned', { name: buttonName });
                    return rply;
                }

                let nextFixedId = await records.getNextFixedIdForUser(userid);

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
                    rply.text = translate('forward.save_error');
                    return rply;
                }

                const sourceMessageLink = `https://discord.com/channels/${groupid}/${sourceChannelId}/${sourceMessageId}`;
                rply.text = translate('forward.save_success', {
                    name: buttonName,
                    id: nextFixedId,
                    link: sourceMessageLink
                });
                return rply;

            } catch (error) {
                console.error('處理訊息轉發時發生錯誤', error);
                rply.text = translate('forward.forward_error', { message: error.message });
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
                case 'delete': {
                    const id = interaction.options.getInteger('id');
                    const t = getInteractionT(interaction);
                    if (id <= 0) {
                        await interaction.reply({ content: t('forward.invalid_id'), flags: MessageFlags.Ephemeral });
                        return null;
                    }
                    command = `.forward delete ${id}`;
                    return command;
                }
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
