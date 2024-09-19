"use strict";
async function getReplyContent(message) {
    let replyContent = "";
    if (message.reference) {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (referencedMessage.embeds.length > 0) {
            const embed = referencedMessage.embeds[0];

            if (embed.title) {
                replyContent += `${embed.title}\n`;
            }
            if (embed.description) {
                replyContent += `${embed.description}\n`;
            }

        }
        if (referencedMessage.content) {
            replyContent += `${referencedMessage.content}\n`;
        }
    }
}

module.exports = {
    getReplyContent,
};