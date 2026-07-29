'use strict';

/**
 * Discord defer drain must keep a live message ref so finalizeDiscordParseResult
 * can run the same path as online (quotes/buttons/files/myNames/…).
 */

const deferQueue = require('../modules/roll-worker/defer-queue');
const fs = require('node:fs');
const path = require('node:path');

describe('Discord defer full-finalize wiring', () => {
	beforeEach(() => {
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		deferQueue.resetDeferQueue();
	});

	afterEach(() => {
		deferQueue.resetDeferQueue();
	});

	it('enqueue preserves live message + privatemsg + displaynameDiscord', () => {
		const fakeMessage = { id: 'm1', channelId: 'c1', guildId: 'g1', isInteraction: false };
		const enq = deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: 'ccrt', botname: 'Discord', userid: 'u1' },
			replyTarget: {
				botname: 'Discord',
				channelId: 'c1',
				userid: 'u1',
				message: fakeMessage,
				privatemsg: 0,
				displaynameDiscord: 'zzz',
			},
		});
		expect(enq.ok).toBe(true);
		expect(deferQueue.size()).toBe(1);
		// Drain with a deliverer that inspects the job.
		let seen = null;
		deferQueue.registerDeliverer('Discord', async (job) => {
			seen = job.replyTarget;
		});
		deferQueue.setReplayFn(async () => ({ text: 'ok', quotes: true }));
		return deferQueue.tryDrain({ batch: 1 }).then(() => {
			expect(seen.message).toBe(fakeMessage);
			expect(seen.privatemsg).toBe(0);
			expect(seen.displaynameDiscord).toBe('zzz');
		});
	});

	it('bot.js deliverer prefers finalizeDiscordParseResult over thin text path', () => {
		const src = fs.readFileSync(
			path.join(__dirname, '../modules/discord/bot.js'),
			'utf8'
		);
		expect(src).toMatch(/async function finalizeDiscordParseResult/);
		expect(src).toMatch(/finalizeDiscordParseResult\(message, result/);
		expect(src).toMatch(/handlingSendMessage\(sendResult\)/);
		expect(src).toMatch(/message,\s*privatemsg: checkPrivateMsg\.privatemsg/);
		expect(src).toMatch(/displaynameDiscord,/);
		// Empty finalize must clear slash thinking; /mee webhook fail must deleteReply.
		expect(src).toMatch(/if \(!sendResult\)[\s\S]*clearDeferredDiscordInteraction/);
		expect(src).toMatch(/interactionHandled[\s\S]*deleteReply/);
		// Channel .meN must not fall through to plain text after webhook.
		expect(src).toMatch(/Channel \.meN: webhook is the reply/);
	});

	it('documents side-effects covered by finalize (audit)', () => {
		const src = fs.readFileSync(
			path.join(__dirname, '../modules/discord/bot.js'),
			'utf8'
		);
		const start = src.indexOf('async function finalizeDiscordParseResult');
		const end = src.indexOf('async function applySlashDeployGatewayAction');
		const block = src.slice(start, end);
		for (const key of [
			'quotes',
			'myNames',
			'myspeck',
			'buttonCreate',
			'requestRolling',
			'fileLink',
			'dmFileLink',
			'sendImage',
			'discordExport',
			'discordExportHtml',
			'discordCreatePoll',
			'roleReactFlag',
			'gatewayAction',
			'adminDmChunks',
		]) {
			expect(block).toContain(key);
		}
	});
});
