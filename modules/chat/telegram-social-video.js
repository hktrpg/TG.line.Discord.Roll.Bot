'use strict';

const { findSocialVideoLink } = require('./social-video');

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

module.exports = {
    socialVideoInput, telegramVideoReply, isTelegramVideoLinkReply, videoLinkPrompt, videoLinkPromptMention,
};
