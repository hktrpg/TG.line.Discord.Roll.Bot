"use strict";
if (!process.env.mongoURL) {
    return;
}
// Load on Discord gateway (secret) or Roll Worker (remote help/show/delete + needsLocal for create).
if (!process.env.DISCORD_CHANNEL_SECRET && process.env.ROLL_WORKER_MODE !== 'true') {
    return;
}
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const records = require('../modules/db/records.js');
const VIP = require('../modules/patreon/veryImportantPerson');
const { getT, getInteractionT, resolveHelp, resolveGameName } = require('../modules/i18n/roll-i18n.js');
const {
    classifyForwardButtonContent,
    extractForwardButtonName,
} = require('../modules/roll-worker/forward-button-content.js');
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
    return resolveHelp(params, 'forward.help');
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
    forwardSourceMeta,
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

            const hasPrefetch = Boolean(forwardSourceMeta?.messageContent !== undefined
                && forwardSourceMeta?.sourceMessageId);
            if (!hasPrefetch && (!discordMessage || !discordClient)) {
                // Create path needs live Discord API or Gateway prefetch.
                if (process.env.ROLL_WORKER_MODE === 'true') {
                    return { needsLocal: true, moduleName: 'forward' };
                }
                rply.text = translate('forward.discord_only');
                return rply;
            }

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
            const [, sourceGuildIdFromLink, sourceChannelIdFromLink, sourceMessageIdFromLink] = matches;

            let sourceGuildId = sourceGuildIdFromLink;
            let sourceChannelId = sourceChannelIdFromLink;
            let sourceMessageId = sourceMessageIdFromLink;
            let messageContent = '';
            let isMentioned = false;
            let isInteractionUser = false;
            const guildId = forwardSourceMeta?.guildId || discordMessage?.guildId;

            if (hasPrefetch) {
                sourceGuildId = forwardSourceMeta.sourceGuildId || sourceGuildId;
                sourceChannelId = forwardSourceMeta.sourceChannelId || sourceChannelId;
                sourceMessageId = forwardSourceMeta.sourceMessageId || sourceMessageId;
                messageContent = forwardSourceMeta.messageContent || '';
                isMentioned = Boolean(forwardSourceMeta.isMentioned);
                isInteractionUser = Boolean(forwardSourceMeta.isInteractionUser);
            }

            if (guildId !== sourceGuildId) {
                rply.text = translate('forward.cross_guild');
                return rply;
            }

            if (sourceChannelId === channelid) {
                rply.text = translate('forward.same_channel');
                return rply;
            }

            try {
                const {
					shouldLiveResolveForwardOwnership,
					resolveForwardOwnershipLive,
				} = require('../modules/roll-worker/forward-ownership');
				const ownershipPlan = shouldLiveResolveForwardOwnership({
					hasPrefetch,
					isMentioned,
					isInteractionUser,
					discordClient,
					rollWorkerMode: process.env.ROLL_WORKER_MODE === 'true',
				});
				if (ownershipPlan.action === 'needsLocal') {
					return { needsLocal: true, moduleName: 'forward' };
				}
				if (ownershipPlan.action === 'error') {
					rply.text = translate(ownershipPlan.errorKey);
					return rply;
				}
				if (ownershipPlan.action === 'liveFetch') {
					const live = await resolveForwardOwnershipLive(discordClient, {
						sourceChannelId,
						sourceMessageId,
						userid,
					});
					if (!live.ok) {
						rply.text = translate(live.errorKey || 'forward.not_your_button');
						return rply;
					}
					messageContent = live.messageContent;
					isMentioned = live.isMentioned;
					isInteractionUser = live.isInteractionUser;
				}

                if (!messageContent || messageContent.trim() === '') {
                    rply.text = translate('forward.no_buttons');
                    return rply;
                }

                const buttonKind = classifyForwardButtonContent(messageContent);
                if (!buttonKind) {
                    rply.text = translate('forward.invalid_button_type');
                    return rply;
                }

                const buttonName = extractForwardButtonName(messageContent, buttonKind, translate);

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
                        const content = t('forward.invalid_id');
                        if (interaction.deferred && !interaction.replied) {
                            await interaction.editReply({ content });
                        } else if (!interaction.replied) {
                            await interaction.reply({ content, flags: MessageFlags.Ephemeral });
                        }
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
