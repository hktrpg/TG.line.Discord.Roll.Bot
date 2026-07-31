"use strict";

/**
 * Phase 3s: Gateway local fallback for .forward must live-retry ownership
 * when prefetch flags are false but discordClient is available (reply-ref).
 */

const {
	shouldLiveResolveForwardOwnership,
	resolveForwardOwnershipLive,
} = require('../modules/roll-worker/forward-ownership');

describe('Phase 3s shouldLiveResolveForwardOwnership', () => {
	it('uses prefetch when ownership already true', () => {
		expect(shouldLiveResolveForwardOwnership({
			hasPrefetch: true,
			isMentioned: true,
			isInteractionUser: false,
			discordClient: {},
			rollWorkerMode: true,
		})).toEqual({ action: 'usePrefetch' });
	});

	it('worker without client → needsLocal when prefetch ownership false', () => {
		expect(shouldLiveResolveForwardOwnership({
			hasPrefetch: true,
			isMentioned: false,
			isInteractionUser: false,
			discordClient: null,
			rollWorkerMode: true,
		})).toEqual({ action: 'needsLocal' });
	});

	it('Gateway with client → liveFetch when prefetch ownership false', () => {
		expect(shouldLiveResolveForwardOwnership({
			hasPrefetch: true,
			isMentioned: false,
			isInteractionUser: false,
			discordClient: { channels: {} },
			rollWorkerMode: true,
		})).toEqual({ action: 'liveFetch' });
	});

	it('no prefetch + client → liveFetch', () => {
		expect(shouldLiveResolveForwardOwnership({
			hasPrefetch: false,
			isMentioned: false,
			isInteractionUser: false,
			discordClient: { channels: {} },
			rollWorkerMode: false,
		})).toEqual({ action: 'liveFetch' });
	});
});

describe('Phase 3s resolveForwardOwnershipLive reply-ref', () => {
	it('accepts ownership via reply reference author', async () => {
		const messagesFetch = jest.fn(async (id) => {
			if (String(id) === 'msg-ref') {
				return { author: { id: 'user-owner' } };
			}
			return {
				content: 'Hero的角色',
				mentions: { users: new Map() },
				interaction: null,
				reference: { messageId: 'msg-ref' },
			};
		});
		const channelsFetch = jest.fn(async () => ({
			messages: { fetch: messagesFetch },
		}));
		const discordClient = { channels: { fetch: channelsFetch } };

		const live = await resolveForwardOwnershipLive(discordClient, {
			sourceChannelId: '2',
			sourceMessageId: '3',
			userid: 'user-owner',
		});

		expect(channelsFetch).toHaveBeenCalledWith('2');
		expect(messagesFetch).toHaveBeenCalledWith('3');
		expect(messagesFetch).toHaveBeenCalledWith('msg-ref');
		expect(live).toEqual({
			ok: true,
			messageContent: 'Hero的角色',
			isMentioned: true,
			isInteractionUser: false,
		});
	});

	it('rejects when reply-ref author is not the user', async () => {
		const messagesFetch = jest.fn(async (id) => {
			if (String(id) === 'msg-ref') {
				return { author: { id: 'someone-else' } };
			}
			return {
				content: 'Hero的角色',
				mentions: { users: new Map() },
				interaction: null,
				reference: { messageId: 'msg-ref' },
			};
		});
		const discordClient = {
			channels: {
				fetch: jest.fn(async () => ({
					messages: { fetch: messagesFetch },
				})),
			},
		};

		const live = await resolveForwardOwnershipLive(discordClient, {
			sourceChannelId: '2',
			sourceMessageId: '3',
			userid: 'user-owner',
		});
		expect(live.ok).toBe(false);
		expect(live.errorKey).toBe('forward.not_your_button');
	});
});
