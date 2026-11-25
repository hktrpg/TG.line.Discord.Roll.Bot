'use strict';

const { findSocialVideoLink } = require('./social-video');

function socialVideoInput(message) {
    return {
        text: message.text ?? message.caption,
        urls: (message.entities ?? message.caption_entities)?.filter(entity => entity.type === 'text_link').map(entity => entity.url),
    };
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
