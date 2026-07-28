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

/**
 * Story-teller import: first attachment (message or reply).
 * @returns {Promise<{ url, size, filename, contentType }|null>}
 */
async function prefetchStoryAttachment(discordMessage, discordClient) {
	if (!discordMessage) return null;

	try {
		if (discordMessage.attachments?.size > 0) {
			const a = [...discordMessage.attachments.values()][0];
			return serializeAttachment(a)
				? {
					url: a.url || a.proxyURL,
					size: a.size || 0,
					filename: a.name || '',
					contentType: a.contentType || '',
				}
				: null;
		}
	} catch {
		// ignore
	}

	try {
		if (discordMessage.reference && discordClient?.channels?.fetch) {
			const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
			const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId);
			if (referenceMessage?.attachments?.size > 0) {
				const a = [...referenceMessage.attachments.values()][0];
				return {
					url: a.url || a.proxyURL,
					size: a.size || 0,
					filename: a.name || '',
					contentType: a.contentType || '',
				};
			}
		}
	} catch (error) {
		console.warn('[Prefetch] story attachment failed:', error?.message || error);
	}
	return null;
}

/**
 * Forward create: fetch source message + ownership flags (no Mongo writes).
 * @returns {Promise<object|null>}
 */
async function prefetchForwardSource(discordMessage, discordClient, {
	messageLink,
	userid,
	channelid,
} = {}) {
	if (!discordMessage || !discordClient || !messageLink) return null;
	const matches = String(messageLink).match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
	if (!matches) return null;
	const [, sourceGuildId, sourceChannelId, sourceMessageId] = matches;

	try {
		const sourceChannel = await discordClient.channels.fetch(sourceChannelId);
		if (!sourceChannel) return null;
		const sourceMessage = await sourceChannel.messages.fetch(sourceMessageId);
		if (!sourceMessage) return null;

		const messageContent = sourceMessage.content || '';
		let isMentioned = false;
		let isInteractionUser = false;

		if (sourceMessage.mentions?.users) {
			isMentioned = [...sourceMessage.mentions.users.entries()]
				.some(([userId]) => userId === userid);
		}
		if (sourceMessage.interaction?.user) {
			isInteractionUser = (sourceMessage.interaction.user.id === userid);
		}
		if (!isMentioned && !isInteractionUser && sourceMessage.reference?.messageId) {
			try {
				const refMessage = await sourceChannel.messages.fetch(sourceMessage.reference.messageId);
				if (refMessage.author?.id === userid) {
					isMentioned = true;
				}
			} catch {
				// ignore
			}
		}

		return {
			sourceGuildId,
			sourceChannelId,
			sourceMessageId,
			guildId: String(discordMessage.guildId || ''),
			channelId: String(channelid || discordMessage.channelId || ''),
			messageContent,
			isMentioned,
			isInteractionUser,
		};
	} catch (error) {
		console.warn('[Prefetch] forward source failed:', error?.message || error);
		return null;
	}
}

/**
 * Chatroom (.chatroom create|join|exit): verify ManageChannels + collect channel meta.
 * @returns {Promise<{ allowed: boolean, channelId, guildId, guildName, channelName }|null>}
 */
async function prefetchChatroomChannel(discordClient, { channelId, userid } = {}) {
	if (!discordClient || !channelId || !userid) return null;
	try {
		const { PermissionsBitField } = require('discord.js');
		const channel = await discordClient.channels.fetch(channelId);
		if (!channel) {
			return { allowed: false, channelId, guildId: '', guildName: '', channelName: '' };
		}
		const memberBag = await channel.fetch(userid);
		let member;
		try {
			member = (memberBag.members && memberBag.members.find(Boolean)) || memberBag;
		} catch {
			member = memberBag;
		}
		const allowed = Boolean(
			channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageChannels)
		);
		return {
			allowed,
			channelId: String(channelId),
			guildId: String(channel.guildId || ''),
			guildName: channel.guild?.name || '',
			channelName: channel.name || '',
		};
	} catch (error) {
		console.warn('[Prefetch] chatroom channel failed:', error?.message || error);
		return null;
	}
}

/**
 * Export (.discord html|txt): prefetch channel permission + serialized history.
 * Gateway still talks to Discord API; Worker generates HTML/TXT from the payload.
 */
async function prefetchExportHistory(discordClient, discordMessage, {
	channelid,
	messageLimit = null,
	demoMode = false,
} = {}) {
	if (!discordClient || !channelid) return null;
	try {
		const { PermissionFlagsBits } = require('discord.js');
		let hasReadPermission = false;
		if (discordMessage?.channel?.permissionsFor && discordMessage?.guild?.members?.me) {
			hasReadPermission = discordMessage.channel.permissionsFor(discordMessage.guild.members.me)
				.has(PermissionFlagsBits.ReadMessageHistory)
				|| discordMessage.guild.members.me.permissions.has(PermissionFlagsBits.Administrator);
		}
		const channelName = discordMessage?.channel?.name || '';
		const channel = await discordClient.channels.fetch(channelid);
		if (!channel?.messages?.fetch) {
			return {
				exportMeta: { hasReadPermission, channelName },
				exportHistoryMeta: { sum_messages: [], totalSize: 0 },
			};
		}

		const sum_messages = [];
		let last_id;
		let totalSize = 0;
		while (true) {
			const options = { limit: 100 };
			if (last_id) options.before = last_id;
			const messages = await channel.messages.fetch(options);
			totalSize += Math.max(messages.size, 0);
			for (const element of messages.values()) {
				const attachments = (element.attachments && element.attachments.size > 0)
					? element.attachments.map((a) => (typeof a.toJSON === 'function' ? a.toJSON() : { url: a.url, name: a.name }))
					: [];
				const embeds = (element.embeds && element.embeds.length > 0)
					? element.embeds.map((e) => (typeof e.toJSON === 'function' ? e.toJSON() : e))
					: [];
				sum_messages.push({
					timestamp: element.createdTimestamp,
					contact: element.content || '',
					userName: element.author?.username || 'unknown',
					isbot: Boolean(element.author?.bot),
					attachments,
					embeds,
					reply_to: null,
				});
			}
			const lastMessage = messages.last();
			if (!lastMessage) break;
			last_id = lastMessage.id;
			if (messages.size !== 100) break;
			if (demoMode && totalSize >= 500) break;
			if (messageLimit && totalSize >= messageLimit) break;
		}

		return {
			exportMeta: { hasReadPermission, channelName },
			exportHistoryMeta: { sum_messages, totalSize },
		};
	} catch (error) {
		console.warn('[Prefetch] export history failed:', error?.message || error);
		return null;
	}
}

/**
 * Story (.st mylist): resolve GROUP_ONLY allowedGroups → display names on Gateway.
 * @returns {Promise<{ storyGroupNamesMeta: Record<string, string> }|null>}
 */
async function prefetchStoryGroupNames(discordClient, { userid } = {}) {
	if (!discordClient || !userid) return null;
	try {
		let schema;
		try {
			schema = require('../db/schema.js');
		} catch {
			return null;
		}
		if (!schema?.story?.find) return null;

		const stories = await schema.story.find({
			ownerID: userid,
			startPermission: 'GROUP_ONLY',
		}).select('allowedGroups').lean();

		const gids = new Set();
		for (const story of stories || []) {
			for (const gid of (story.allowedGroups || [])) {
				if (gid) gids.add(String(gid));
			}
		}

		const storyGroupNamesMeta = {};
		for (const gid of gids) {
			let name = '';
			try {
				const channel = await discordClient.channels.fetch(gid);
				if (channel?.name) name = channel.name;
			} catch {
				// ignore
			}
			if (!name && typeof discordClient.guilds?.fetch === 'function') {
				try {
					const guild = await discordClient.guilds.fetch(gid);
					if (guild?.name) name = guild.name;
				} catch {
					// ignore
				}
			}
			if (name) storyGroupNamesMeta[gid] = name;
		}
		return { storyGroupNamesMeta };
	} catch (error) {
		console.warn('[Prefetch] story group names failed:', error?.message || error);
		return null;
	}
}

/**
 * Resolve a group/channel display name from prefetched meta or live Discord client.
 */
async function resolveStoryGroupName(gid, { discordClient = null, storyGroupNamesMeta = null } = {}) {
	const id = String(gid || '');
	if (!id) return '';
	if (storyGroupNamesMeta && storyGroupNamesMeta[id]) {
		return String(storyGroupNamesMeta[id]);
	}
	if (!discordClient) return '';
	try {
		const channel = await discordClient.channels.fetch(id);
		if (channel?.name) return channel.name;
	} catch {
		// ignore
	}
	if (typeof discordClient.guilds?.fetch === 'function') {
		try {
			const guild = await discordClient.guilds.fetch(id);
			if (guild?.name) return guild.name;
		} catch {
			// ignore
		}
	}
	return '';
}

module.exports = {
	serializeAttachment,
	serializeAttachmentCollection,
	prefetchOpenAiDiscordContext,
	fakeAttachmentCollection,
	prefetchStoryAttachment,
	prefetchForwardSource,
	prefetchChatroomChannel,
	prefetchExportHistory,
	prefetchStoryGroupNames,
	resolveStoryGroupName,
};
