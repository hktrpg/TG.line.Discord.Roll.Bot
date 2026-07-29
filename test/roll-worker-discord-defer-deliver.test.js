'use strict';

/**
 * Discord defer drain: /mee (myNames) + /me (myspeck) must not editReply empty text.
 */

const { deliverDiscordDeferred } = require('../modules/roll-worker/discord-defer-deliver');

function makeHooks(overrides = {}) {
	return {
		repeatMessages: jest.fn(async () => true),
		sendMeMessage: jest.fn(async () => {}),
		sendToReplyChannel: jest.fn(async () => {}),
		clearInteraction: jest.fn(async () => {}),
		fetchChannel: jest.fn(async () => ({ id: 'ch1' })),
		...overrides,
	};
}

function makeInteraction(overrides = {}) {
	return {
		deferred: true,
		replied: false,
		channelId: 'ch1',
		editReply: jest.fn(async () => {}),
		reply: jest.fn(async () => {}),
		followUp: jest.fn(async () => {}),
		deleteReply: jest.fn(async () => {}),
		...overrides,
	};
}

describe('deliverDiscordDeferred', () => {
	it('/mee myNames → webhook + clear ephemeral (no editReply text)', async () => {
		const interaction = makeInteraction();
		const hooks = makeHooks();
		const result = {
			myNames: [{
				content: 'hello',
				username: 'Hero',
				avatarURL: 'https://example.com/a.png',
			}],
			text: '',
		};
		const out = await deliverDiscordDeferred({
			replyTarget: {
				botname: 'Discord',
				isInteraction: true,
				interaction,
				channelId: 'ch1',
				guildId: 'g1',
			},
		}, result, hooks);

		expect(out.mode).toBe('myNames');
		expect(hooks.repeatMessages).toHaveBeenCalledWith(interaction, result);
		expect(hooks.clearInteraction).toHaveBeenCalledWith(interaction);
		expect(interaction.editReply).not.toHaveBeenCalled();
		expect(hooks.sendToReplyChannel).not.toHaveBeenCalled();
	});

	it('/me myspeck → sendMeMessage + clear ephemeral', async () => {
		const interaction = makeInteraction();
		const hooks = makeHooks();
		const result = {
			myspeck: { content: 'hello me', username: 'u1', avatarURL: 'https://x' },
			text: '',
		};
		const out = await deliverDiscordDeferred({
			replyTarget: {
				botname: 'Discord',
				isInteraction: true,
				interaction,
				guildId: 'g1',
			},
		}, result, hooks);

		expect(out.mode).toBe('myspeck');
		expect(hooks.sendMeMessage).toHaveBeenCalledWith({
			message: interaction,
			rplyVal: result,
			groupid: 'g1',
		});
		expect(hooks.clearInteraction).toHaveBeenCalledWith(interaction);
		expect(interaction.editReply).not.toHaveBeenCalled();
	});

	it('myNames webhook failure throws (re-queue)', async () => {
		const hooks = makeHooks({
			repeatMessages: jest.fn(async () => false),
		});
		await expect(deliverDiscordDeferred({
			replyTarget: {
				isInteraction: true,
				interaction: makeInteraction(),
			},
		}, { myNames: [{ content: 'x', username: 'n', avatarURL: 'a' }] }, hooks))
			.rejects.toThrow(/myNames webhook failed/);
		expect(hooks.clearInteraction).toHaveBeenCalled();
	});

	it('plain interaction text uses editReply (not webhook)', async () => {
		const interaction = makeInteraction();
		const hooks = makeHooks();
		const out = await deliverDiscordDeferred({
			replyTarget: {
				isInteraction: true,
				interaction,
				channelId: 'ch1',
			},
		}, { text: '1d100 → 42', type: 'text' }, hooks);

		expect(out.mode).toBe('interaction-text');
		expect(interaction.editReply).toHaveBeenCalledWith({ content: '1d100 → 42' });
		expect(hooks.repeatMessages).not.toHaveBeenCalled();
		expect(hooks.clearInteraction).not.toHaveBeenCalled();
	});

	it('empty text interaction editReply uses zwsp placeholder', async () => {
		const interaction = makeInteraction();
		const hooks = makeHooks();
		await deliverDiscordDeferred({
			replyTarget: { isInteraction: true, interaction },
		}, { text: '' }, hooks);
		expect(interaction.editReply).toHaveBeenCalledWith({ content: '\u200b' });
	});

	it('channel message text (non-interaction) uses sendToReplyChannel', async () => {
		const hooks = makeHooks();
		const out = await deliverDiscordDeferred({
			replyTarget: { channelId: 'ch9', guildId: 'g9', userid: 'u9' },
			userid: 'u9',
		}, { text: 'cc 50', LevelUp: 'LV UP' }, hooks);

		expect(out.mode).toBe('channel-text');
		expect(hooks.sendToReplyChannel).toHaveBeenCalledTimes(2);
		expect(hooks.sendToReplyChannel.mock.calls[0][0].replyText).toContain('LV UP');
		expect(hooks.sendToReplyChannel.mock.calls[1][0].replyText).toBe('cc 50');
		expect(hooks.sendToReplyChannel.mock.calls[1][0].quotes).toBe(false);
	});

	it('ccrt quotes=true sends channel reply with quotes (embed path)', async () => {
		const hooks = makeHooks({
			formatDisplayPrefix: (_job, body) => `<@u1>\n${body}`,
		});
		const out = await deliverDiscordDeferred({
			replyTarget: { channelId: 'ch1', guildId: 'g1', userid: 'u1' },
			userid: 'u1',
		}, {
			text: '7) Flee in Panic: ...',
			quotes: true,
			type: 'text',
		}, hooks);

		expect(out.mode).toBe('channel-text');
		expect(hooks.sendToReplyChannel).toHaveBeenCalledWith({
			replyText: '<@u1>\n7) Flee in Panic: ...',
			channelid: 'ch1',
			groupid: 'g1',
			quotes: true,
		});
	});

	it('interaction with quotes uses replyInteraction hook (not plain content)', async () => {
		const interaction = makeInteraction();
		const hooks = makeHooks({
			replyInteraction: jest.fn(async () => {}),
		});
		await deliverDiscordDeferred({
			replyTarget: {
				isInteraction: true,
				interaction,
				channelId: 'ch1',
				userid: 'u1',
			},
		}, { text: 'ccrt result', quotes: true }, hooks);

		expect(hooks.replyInteraction).toHaveBeenCalledWith(interaction, {
			text: 'ccrt result',
			quotes: true,
		});
		expect(interaction.editReply).not.toHaveBeenCalled();
	});

	it('myNames without interaction fetches channel', async () => {
		const hooks = makeHooks();
		const channel = { id: 'ch2' };
		hooks.fetchChannel.mockResolvedValue(channel);
		await deliverDiscordDeferred({
			replyTarget: { channelId: 'ch2', isInteraction: false },
		}, { myNames: [{ content: 'hi', username: 'N', avatarURL: 'a' }] }, hooks);

		expect(hooks.fetchChannel).toHaveBeenCalledWith('ch2');
		expect(hooks.repeatMessages).toHaveBeenCalledWith(
			expect.objectContaining({ channelId: 'ch2', channel }),
			expect.any(Object),
		);
		expect(hooks.clearInteraction).not.toHaveBeenCalled();
	});
});
