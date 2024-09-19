"use strict";

async function getReplyContent(message) {
    if (!message.reference) return "";

    const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
    let replyContent = "";

    const embed = referencedMessage.embeds[0];
    if (embed) {
        if (embed.title) replyContent += `${embed.title}\n`;
        if (embed.description) replyContent += `${embed.description}\n`;
    }

    if (referencedMessage.content) {
        replyContent += `${referencedMessage.content}\n`;
    }

    return replyContent;
}

module.exports = {
    getReplyContent,
};