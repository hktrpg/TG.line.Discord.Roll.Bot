"use strict";

/**
 * Prefetch Discord assets into serializable fields for Roll Worker.
 */

function serializeAttachment(attachment) {
	if (!attachment) return null;
	const url = attachment.url || attachment.proxyURL || null;
	if (!url) return null;
	return {
		url,
		name: attachment.name || attachment.filename || 'unknown',
		size: attachment.size || 0,
		contentType: attachment.contentType || attachment.content_type || '',
	};
}

function serializeAttachmentCollection(collection) {
	if (!collection || !collection.size) return [];
	return [...collection.values()]
		.map((item) => serializeAttachment(item))
		.filter(Boolean);
}

/**
 * @returns {Promise<{ attachmentsMeta: object[], replyAttachmentsMeta: object[], replyContent: string }>}
 */
async function prefetchOpenAiDiscordContext(discordMessage, discordClient) {
	const result = {
		attachmentsMeta: [],
		replyAttachmentsMeta: [],
		replyContent: '',
	};
	if (!discordMessage) return result;

	try {
		if (discordMessage.attachments?.size > 0) {
			result.attachmentsMeta = serializeAttachmentCollection(discordMessage.attachments);
		}
	} catch {
		// ignore
	}

	try {
		if (discordMessage.type === 19 && discordMessage.reference && discordClient?.channels?.fetch) {
			const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
			const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId);
			if (referenceMessage?.attachments?.size > 0) {
				result.replyAttachmentsMeta = serializeAttachmentCollection(referenceMessage.attachments);
			}
			if (referenceMessage?.content) {
				result.replyContent = String(referenceMessage.content);
			}
		}
	} catch (error) {
		console.warn('[Prefetch] openai reply fetch failed:', error?.message || error);
	}

	// Prefer dedicated reply helper when available (mentions / embeds).
	if (!result.replyContent) {
		try {
			const handleMessage = require('../discord/handleMessage');
			if (typeof handleMessage.getReplyContent === 'function') {
				result.replyContent = await handleMessage.getReplyContent(discordMessage) || '';
			}
		} catch {
			// ignore
		}
	}

	return result;
}

/**
 * Build a minimal attachment bag compatible with openai getText loops.
 */
function fakeAttachmentCollection(metaList = []) {
	const items = (metaList || [])
		.map((a) => ({
			url: a.url,
			name: a.name || a.filename || 'unknown',
			size: a.size || 0,
			contentType: a.contentType || '',
		}))
		.filter((a) => a.url);
	return {
		size: items.length,
		values() {
			return items.values();
		},
	};
}

module.exports = {
	serializeAttachment,
	serializeAttachmentCollection,
	prefetchOpenAiDiscordContext,
	fakeAttachmentCollection,
};
