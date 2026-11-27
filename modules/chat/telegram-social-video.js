'use strict';

const { InputFile } = require('grammy');
const { findSocialVideoLink, formatSocialVideoSuccess } = require('./social-video');

function socialVideoInput(message) {
    const text = message.text ?? message.caption;
    const entities = message.entities ?? message.caption_entities ?? [];
    const urls = [];
    for (const { type, url, offset, length } of entities) {
        if (type === 'text_link') {
            urls.push(url);
        } else if (type === 'url' && typeof text === 'string') {
            urls.push(text.slice(offset, offset + length));
        }
    }
    return { text, urls };
}

const videoLinkPrompt = '請你回覆呢則訊息，貼上公開貼文連結。';
const videoLinkPromptMention = { type: 'text_mention', offset: 1, length: 1 };

function isTelegramVideoLinkReply(message, botId) {
    const prompt = message.reply_to_message;
    if (!message.from?.id || !prompt || prompt.from?.id !== botId || prompt.text !== videoLinkPrompt) return false;
    return prompt.entities?.some(entity => entity.type === videoLinkPromptMention.type
        && entity.offset === videoLinkPromptMention.offset && entity.length === videoLinkPromptMention.length
        && entity.user?.id === message.from.id) ?? false;
}

function telegramVideoReply(message) {
    const { reply_to_message: original, quote, external_reply: external } = message;
    if (!original && !quote && !external) return;

    return () => {
        if (original) {
            const input = socialVideoInput(original);
            if (findSocialVideoLink(input.text, input.urls)) return input;
        }

        return {
            text: quote?.text,
            urls: [original?.link_preview_options?.url, external?.link_preview_options?.url].filter(Boolean),
        };
    };
}

function createTelegramVideoRequest(ctx) {
    const { message, from, chat } = ctx;
    const group = chat.type === 'group' || chat.type === 'supergroup';
    if (!group && chat.type !== 'private') return;
    const topic = message.is_topic_message ? { message_thread_id: message.message_thread_id } : {};
    const reply = { ...topic, reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true } };
    const input = socialVideoInput(message);
    const linkPromptReply = /^[^./]/u.test(input.text?.trimStart() ?? '') && isTelegramVideoLinkReply(message, ctx.me.id);

    function mediaOptions(url) {
        const mention = `@${from.username || from.first_name}`;
        let caption = formatSocialVideoSuccess(mention, url);
        const caption_entities = [{ type: 'text_mention', offset: 0, length: mention.length, user: from }];
        if (caption.length > 1024) {
            const label = '原始連結';
            caption = formatSocialVideoSuccess(mention, label);
            caption_entities.push({ type: 'text_link', offset: caption.length - label.length, length: label.length, url });
        }
        return { ...topic, caption, caption_entities };
    }

    return {
        platform: 'Telegram',
        groupId: group ? chat.id : undefined,
        userId: from?.id,
        commandBotName: ctx.me.username,
        messageContext: { id: message.message_id, replyToId: message.reply_to_message?.message_id, linkPromptReply },
        ...input,
        getRepliedMessage: telegramVideoReply(message),
        promptForLink: () => ctx.reply(videoLinkPrompt, {
            ...reply,
            entities: [{ ...videoLinkPromptMention, user: from }],
            reply_markup: { force_reply: true, selective: true, input_field_placeholder: '貼上公開貼文連結' },
        }, AbortSignal.timeout(5000)),
        sendMedia({ attachments, url }) {
            const options = mediaOptions(url);
            const signal = AbortSignal.timeout(45_000);
            if (attachments.length === 1) {
                const [{ file, contentType, dimensions }] = attachments;
                const media = new InputFile(file);
                return contentType === 'video/mp4'
                    ? ctx.replyWithVideo(media, { ...options, ...dimensions, supports_streaming: true }, signal)
                    : ctx.replyWithPhoto(media, options, signal);
            }
            const { caption, caption_entities, ...albumOptions } = options;
            const album = attachments.map(({ file }, index) => ({
                type: 'photo',
                media: new InputFile(file),
                ...(index === 0 && { caption, caption_entities }),
            }));
            return ctx.replyWithMediaGroup(album, albumOptions, signal);
        },
        sendText: content => ctx.reply(content, reply, AbortSignal.timeout(5000)),
        deleteCommand: () => ctx.deleteMessage(AbortSignal.timeout(5000)),
    };
}

module.exports = {
    createTelegramVideoRequest, socialVideoInput, telegramVideoReply, isTelegramVideoLinkReply, videoLinkPrompt, videoLinkPromptMention,
};
