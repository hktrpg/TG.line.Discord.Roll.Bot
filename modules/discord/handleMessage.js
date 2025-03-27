"use strict";

async function getReplyContent(message) {
    if (!message.reference) return "";

    try {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
        let replyContent = "";

        if (referencedMessage.embeds && referencedMessage.embeds.length > 0) {
            const embed = referencedMessage.embeds[0];
            if (embed.title) replyContent += `${embed.title}\n`;
            if (embed.description) replyContent += `${embed.description}\n`;
        }

        if (referencedMessage.content) {
            replyContent += `${referencedMessage.content}\n`;
        }

        return replyContent;
    } catch (error) {
        return "";
    }
}

module.exports = {
    getReplyContent,
};