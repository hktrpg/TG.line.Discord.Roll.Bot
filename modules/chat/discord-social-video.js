'use strict';

const { readFile } = require('node:fs/promises');
const { ChannelType, MessageType, Routes } = require('discord.js');
const { formatSocialVideoSuccess } = require('./social-video');

const MAX_MESSAGE_LENGTH = 2000;

function createDiscordVideoRequest(message) {
    const { author, channelId, client, guildId, id } = message;
    if (message.webhookId || (!guildId && message.channel?.type !== ChannelType.DM)) return;
    const channelMessages = Routes.channelMessages(channelId);
    const reference = message.type === MessageType.Reply ? message.reference : null;
    const replyToId = (reference?.channelId ?? channelId) === channelId ? reference?.messageId : undefined;
    const reply = {
        message_reference: { message_id: id, fail_if_not_exists: false },
        allowed_mentions: { parse: [], replied_user: false },
    };

    return {
        platform: 'Discord',
        groupId: guildId,
        userId: author.id,
        text: message.content,
        messageContext: { id, replyToId },
        getRepliedMessage: replyToId ? async () => {
            const cached = message.channel?.messages?.cache.get(replyToId);
            const original = cached && !cached.partial ? cached
                : await client.rest.get(Routes.channelMessage(channelId, replyToId), { signal: AbortSignal.timeout(5000) });
            return { text: original.content, urls: original.embeds?.map(embed => embed.url).filter(Boolean) };
        } : undefined,
        async sendMedia({ attachments, url }) {
            const mention = `<@${author.id}>`;
            let content = formatSocialVideoSuccess(mention, `<${url}>`);
            const files = await Promise.all(attachments.map(async ({ file, name, contentType }) => ({
                name, data: await readFile(file), contentType,
            })));
            if (content.length > MAX_MESSAGE_LENGTH) {
                content = formatSocialVideoSuccess(mention, '原始連結');
                files.push({ name: 'source-link.txt', data: Buffer.from(url), contentType: 'text/plain' });
            }
            return client.rest.post(channelMessages, {
                body: { content, allowed_mentions: { parse: [], users: [author.id] } },
                files,
                signal: AbortSignal.timeout(45_000),
            });
        },
        sendText: content => client.rest.post(channelMessages, {
            body: { ...reply, content },
            signal: AbortSignal.timeout(5000),
        }),
        // Discord only permits deleting another user's message in a guild with Manage Messages.
        deleteCommand: guildId ? () => client.rest.delete(Routes.channelMessage(channelId, id), {
            signal: AbortSignal.timeout(5000),
        }) : undefined,
    };
}

module.exports = { createDiscordVideoRequest };
