"use strict";

const { Routes, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { createChatroomService, ChatroomError } = require('./chatroom-service');
const { createMongoStore, defineModels } = require('./chatroom-store');
const { createTranslator } = require('./chatroom-translation');

function makePayload(data) {
    const embeds = [{
        title: `${data.bridge ? '跨群聊天 / Bridged message' : '自動翻譯 / Auto translation'} · ${data.author}`.slice(0, 250),
        description: data.text,
        url: data.sourceUrl,
        footer: { text: data.sourceName.slice(0, 200) }
    }];
    if (data.translation) embeds.push({ title: '機器翻譯 / Machine translation', description: data.translation });
    if (data.translationError) embeds.push({
        description: '翻譯暫時不可用、正忙碌／限流冷卻中，或已達每日用量上限；沒有自動重試。\nTranslation unavailable, busy/rate-limited, or daily limit reached; no automatic retry.'
    });
    return { embeds, allowed_mentions: { parse: [], replied_user: false },
        nonce: data.nonce, enforce_nonce: true };
}

function createDiscordTransport(client) {
    const flags = PermissionsBitField.Flags;
    return {
        async managedChannel(interaction) {
            if (!interaction.guildId || !interaction.channelId) return null;
            const channel = await client.channels.fetch(interaction.channelId, { force: true });
            if (!channel || channel.type !== ChannelType.GuildText || channel.guildId !== interaction.guildId) return null;
            const member = await channel.guild.members.fetch({ user: interaction.user.id, force: true });
            const me = await channel.guild.members.fetchMe({ force: true });
            return { id: channel.id, guildId: channel.guildId,
                guildName: channel.guild.name, name: channel.name,
                nsfw: Boolean(channel.nsfw),
                canManage: Boolean(channel.permissionsFor(member)?.has(flags.ManageChannels)),
                canSend: Boolean(channel.permissionsFor(me)?.has([flags.ViewChannel, flags.SendMessages, flags.EmbedLinks])) };
        },
        async canRead(channelId) {
            const channel = client.channels.cache.get(channelId);
            return channel?.type === ChannelType.GuildText
                && !channel.nsfw
                && Boolean(channel.permissionsFor(client.user.id)?.has(flags.ViewChannel));
        },
        // REST works across shards without broadcasting text or creating webhooks.
        notice: (id, content) => client.rest.post(Routes.channelMessages(id), {
            body: { content, allowed_mentions: { parse: [] } }, signal: AbortSignal.timeout(10_000)
        }),
        async send(id, data) {
            const target = await client.rest.get(Routes.channel(id), { signal: AbortSignal.timeout(8000) });
            if (target.type !== ChannelType.GuildText || target.nsfw) throw new Error('destination_unavailable');
            return client.rest.post(Routes.channelMessages(id), {
                body: makePayload(data), signal: AbortSignal.timeout(10_000)
            });
        },
        async remove(channelId, messageId) {
            try {
                await client.rest.delete(Routes.channelMessage(channelId, messageId), { signal: AbortSignal.timeout(10_000) });
            } catch (error) {
                if (error.code !== 10_008) throw error;
            }
        }
    };
}

function snapshot(message) {
    return { id: message.id, channelId: message.channelId, guildId: message.guildId,
        content: message.content, editedTimestamp: message.editedTimestamp,
        author: message.author ? { id: message.author.id, username: message.author.username, bot: message.author.bot } : null,
        member: { displayName: message.member?.displayName },
        webhookId: message.webhookId, system: message.system, partial: message.partial };
}

function createChatroomRuntime(client, { isCommand, env = process.env } = {}) {
    const enabled = () => env.CHATROOM_ENABLED === 'true';
    const transport = createDiscordTransport(client);
    let service;
    let store;
    let configuredIds = new Set();
    let refreshedAt = 0;
    let refreshing;
    function getService() {
        if (!enabled() || !env.mongoURL) throw new ChatroomError('此部署未啟用同步聊天或資料庫。Chatroom/database is disabled.');
        if (!service) {
            const mongoose = require('../db/connector').mongoose;
            const limit = Number(env.CHATROOM_TRANSLATION_DAILY_CHARS || 10_000);
            const globalLimit = Number(env.CHATROOM_TRANSLATION_GLOBAL_DAILY_CHARS || 100_000);
            store = createMongoStore(defineModels(mongoose));
            service = createChatroomService({
                enabled, transport, isCommand, isConfigured: configured,
                store,
                translator: createTranslator({ env }),
                dailyLimit: Number.isSafeInteger(limit) && limit > 0 && limit <= 1_000_000 ? limit : 10_000,
                globalDailyLimit: Number.isSafeInteger(globalLimit) && globalLimit > 0 && globalLimit <= 10_000_000 ? globalLimit : 100_000,
                report: category => console.warn(`[Chatroom] ${category}`)
            });
        }
        return service;
    }
    async function configured(channelId) {
        if (Date.now() - refreshedAt >= 15_000) {
            refreshing ||= store.configuredChannelIds().then(ids => {
                configuredIds = new Set(ids);
                refreshedAt = Date.now();
            }).finally(() => { refreshing = null; });
            await refreshing;
        }
        return configuredIds.has(channelId);
    }
    async function event(method, message) {
        if (!enabled() || !env.mongoURL) return;
        const input = snapshot(message);
        try {
            const current = getService();
            // Service captures message version before awaiting ID discovery. This
            // prevents a later delete/edit overtaking a slow configuration lookup.
            await current[method](input);
        } catch { console.warn('[Chatroom] event_failed'); }
    }
    return {
        handleMessage: message => event('handleMessage', message),
        handleUpdate: message => event('handleUpdate', message),
        handleDelete: message => event('handleDelete', message),
        async handleInteraction(interaction) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            let content;
            try {
                const action = interaction.options.getSubcommand();
                const personal = action === 'optout' || action === 'optin';
                const channel = personal ? null : await transport.managedChannel(interaction);
                if (!personal && !channel) throw new ChatroomError('請在伺服器的一般文字頻道使用。Use this in a server text channel.');
                content = await getService().command({ action, channel, userId: interaction.user.id,
                    code: interaction.options.getString('code'), language: interaction.options.getString('language') });
                refreshedAt = 0;
            } catch (error) {
                content = error instanceof ChatroomError ? error.message
                    : '操作未完成，請查看 status 後重試；未確認成功前不會開始新連結。\nOperation failed; inspect status before retrying.';
            }
            await interaction.editReply({ content, allowedMentions: { parse: [] } });
        }
    };
}

module.exports = { createChatroomRuntime, createDiscordTransport, makePayload, snapshot };
