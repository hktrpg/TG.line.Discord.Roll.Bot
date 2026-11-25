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

module.exports = { socialVideoInput, telegramVideoReply };
