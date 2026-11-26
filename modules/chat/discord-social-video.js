'use strict';

const { readFile } = require('node:fs/promises');
const { ChannelType, MessageType, Routes } = require('discord.js');
const { formatSocialVideoSuccess } = require('./social-video');

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

    async function sendAttachments(attachments, { url }) {
        await client.rest.post(channelMessages, {
            body: {
                content: formatSocialVideoSuccess(`<@${author.id}>`, `<${url}>`),
                allowed_mentions: { parse: [], users: [author.id] },
            },
            files: await Promise.all(attachments.map(async ({ file, name, contentType }) => ({
                name, data: await readFile(file), contentType,
            }))),
            signal: AbortSignal.timeout(45_000),
        });
    }

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
        sendVideo: (file, delivery) => sendAttachments([
            { file, name: 'social-video.mp4', contentType: 'video/mp4' },
        ], delivery),
        sendImages: sendAttachments,
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
