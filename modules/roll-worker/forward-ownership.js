"use strict";

/**
 * Live Discord ownership check for .forward create.
 * Used when prefetch flags are missing/false (reply-reference often needs a live fetch).
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   messageContent?: string,
 *   isMentioned?: boolean,
 *   isInteractionUser?: boolean,
 *   errorKey?: string,
 * }>}
 */
async function resolveForwardOwnershipLive(discordClient, {
	sourceChannelId,
	sourceMessageId,
	userid,
} = {}) {
	if (!discordClient || !sourceChannelId || !sourceMessageId || !userid) {
		return { ok: false, errorKey: 'forward.discord_only' };
	}
	const sourceChannel = await discordClient.channels.fetch(sourceChannelId);
	if (!sourceChannel) {
		return { ok: false, errorKey: 'forward.channel_not_found' };
	}
	const sourceMessage = await sourceChannel.messages.fetch(sourceMessageId);
	if (!sourceMessage) {
		return { ok: false, errorKey: 'forward.message_not_found' };
	}

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
			if (refMessage?.author?.id === userid) {
				isMentioned = true;
			}
		} catch {
			// Deleted/missing reply reference — treat as ownership not verified.
		}
	}
	if (!isMentioned && !isInteractionUser) {
		return {
			ok: false,
			errorKey: 'forward.not_your_button',
			messageContent: sourceMessage.content || '',
			isMentioned: false,
			isInteractionUser: false,
		};
	}
	return {
		ok: true,
		messageContent: sourceMessage.content || '',
		isMentioned,
		isInteractionUser,
	};
}

/**
 * Decide whether Gateway/Worker must live-check ownership.
 * Prefetch ownership false + no client → needsLocal on worker; + client → live retry.
 */
function shouldLiveResolveForwardOwnership({
	hasPrefetch,
	isMentioned,
	isInteractionUser,
	discordClient,
	rollWorkerMode,
} = {}) {
	const needLive = !hasPrefetch || (!isMentioned && !isInteractionUser);
	if (!needLive) {
		return { action: 'usePrefetch' };
	}
	if (!discordClient) {
		if (rollWorkerMode) {
			return { action: 'needsLocal' };
		}
		return {
			action: 'error',
			errorKey: hasPrefetch ? 'forward.not_your_button' : 'forward.discord_only',
		};
	}
	return { action: 'liveFetch' };
}

module.exports = {
	resolveForwardOwnershipLive,
	shouldLiveResolveForwardOwnership,
};
