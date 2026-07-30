"use strict";

const {
	toSerializableContext,
	isEnabled,
	isLocalEnabled,
	normalizeWorkerBaseUrl,
	getConfig,
	getLocalConfig,
} = require('../modules/roll-worker/client');

describe('roll-worker client', () => {
	const originalUrl = process.env.ROLL_WORKER_URL;
	const originalLocal = process.env.ROLL_STANDBY_URL;

	afterEach(() => {
		if (originalUrl === undefined) {
			delete process.env.ROLL_WORKER_URL;
		} else {
			process.env.ROLL_WORKER_URL = originalUrl;
		}
		if (originalLocal === undefined) {
			delete process.env.ROLL_STANDBY_URL;
		} else {
			process.env.ROLL_STANDBY_URL = originalLocal;
		}
	});

	it('isEnabled only when ROLL_WORKER_URL is set', () => {
		delete process.env.ROLL_WORKER_URL;
		expect(isEnabled()).toBe(false);
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		expect(isEnabled()).toBe(true);
	});

	it('isLocalEnabled / getLocalConfig for ROLL_STANDBY_URL', () => {
		delete process.env.ROLL_STANDBY_URL;
		expect(isLocalEnabled()).toBe(false);
		expect(getLocalConfig().url).toBe('');
		process.env.ROLL_STANDBY_URL = 'http://127.0.0.1:3951/';
		expect(isLocalEnabled()).toBe(true);
		expect(getLocalConfig().url).toBe('http://127.0.0.1:3951');
	});

	it('isLocalEnabled false when local URL equals primary URL', () => {
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		process.env.ROLL_STANDBY_URL = 'http://127.0.0.1:3950/';
		expect(isLocalEnabled()).toBe(false);
		process.env.ROLL_STANDBY_URL = 'http://127.0.0.1:3951';
		expect(isLocalEnabled()).toBe(true);
	});

	it('isLocalEnabled treats URL case as equal', () => {
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		process.env.ROLL_STANDBY_URL = 'HTTP://127.0.0.1:3950';
		expect(isLocalEnabled()).toBe(false);
	});

	it('normalizeWorkerBaseUrl strips trailing slash and lowercases', () => {
		expect(normalizeWorkerBaseUrl('HTTP://127.0.0.1:3951/')).toBe('http://127.0.0.1:3951');
		expect(normalizeWorkerBaseUrl('')).toBe('');
	});

	it('strips non-serializable fields from context', () => {
		const ctx = toSerializableContext({
			inputStr: '1d100',
			botname: 'Discord',
			locale: 'en',
			discordClient: { fake: true },
			discordMessage: { channel: { type: 0 } },
			t: () => 'nope',
			channelType: 0,
		});
		expect(ctx.inputStr).toBe('1d100');
		expect(ctx.botname).toBe('Discord');
		expect(ctx.channelType).toBe(0);
		expect(ctx.discordClient).toBeUndefined();
		expect(ctx.discordMessage).toBeUndefined();
		expect(ctx.t).toBeUndefined();
	});

	it('attaches gatewayBuildInfo on Gateway; keeps provided meta on Worker', () => {
		const savedMode = process.env.ROLL_WORKER_MODE;
		delete process.env.ROLL_WORKER_MODE;
		require('../modules/runtime/build-info').resetCache();
		const fromGateway = toSerializableContext({ inputStr: '.admin state' });
		expect(fromGateway.gatewayBuildInfo).toBeTruthy();
		expect(typeof fromGateway.gatewayBuildInfo.display).toBe('string');

		process.env.ROLL_WORKER_MODE = 'true';
		const fromWorker = toSerializableContext({
			inputStr: '.admin state',
			gatewayBuildInfo: { display: 'master · 2026-01-01 · abcdef1', role: 'gateway' },
		});
		expect(fromWorker.gatewayBuildInfo.display).toBe('master · 2026-01-01 · abcdef1');

		const missing = toSerializableContext({ inputStr: '.admin state' });
		expect(missing.gatewayBuildInfo).toBeNull();

		if (savedMode === undefined) delete process.env.ROLL_WORKER_MODE;
		else process.env.ROLL_WORKER_MODE = savedMode;
		require('../modules/runtime/build-info').resetCache();
	});

	it('reads channelType from discordMessage when not provided', () => {
		const ctx = toSerializableContext({
			inputStr: 'x',
			discordMessage: { channel: { type: 1 } },
		});
		expect(ctx.channelType).toBe(1);
	});

	it('includes avatarUrl and attachmentsMeta in serializable context', () => {
		const ctx = toSerializableContext({
			inputStr: '.ait',
			botname: 'Discord',
			avatarUrl: 'https://cdn.example/a.png',
			attachmentsMeta: [{ url: 'https://cdn.example/f.txt', name: 'f.txt', size: 1 }],
			replyContent: 'quoted',
			discordClient: { fake: true },
		});
		expect(ctx.avatarUrl).toBe('https://cdn.example/a.png');
		expect(ctx.attachmentsMeta).toHaveLength(1);
		expect(ctx.replyContent).toBe('quoted');
		expect(ctx.discordClient).toBeUndefined();
	});

	it('serializes story/forward/chatroom/export/admin meta fields', () => {
		const ctx = toSerializableContext({
			inputStr: '.chatroom create 1',
			storyAttachmentMeta: { url: 'https://cdn.example/s.json', filename: 's.json' },
			storyGroupNamesMeta: { '1': 'general' },
			forwardSourceMeta: { sourceMessageId: '3', messageContent: 'x的角色' },
			chatroomChannelMeta: { allowed: true, channelId: '1', guildId: 'g' },
			exportMeta: { hasReadPermission: true, channelName: 'general' },
			exportHistoryMeta: { sum_messages: [{ contact: 'hi' }], totalSize: 1 },
			clusterHealthMeta: { healthReport: { clusters: [] } },
			clusterMemMeta: { rows: [{ clusterId: 0 }] },
			csvAttachmentMeta: { url: 'https://cdn.example/a.csv', name: 'a.csv' },
			fixShardMeta: { action: 'check', report: { totalShards: 1 } },
			slashDeployMeta: { text: 'deployed' },
			discordClient: {},
		});
		expect(ctx.storyAttachmentMeta.filename).toBe('s.json');
		expect(ctx.storyGroupNamesMeta['1']).toBe('general');
		expect(ctx.forwardSourceMeta.sourceMessageId).toBe('3');
		expect(ctx.chatroomChannelMeta.guildId).toBe('g');
		expect(ctx.exportMeta.channelName).toBe('general');
		expect(ctx.exportHistoryMeta.totalSize).toBe(1);
		expect(ctx.clusterHealthMeta.healthReport.clusters).toEqual([]);
		expect(ctx.clusterMemMeta.rows[0].clusterId).toBe(0);
		expect(ctx.csvAttachmentMeta.name).toBe('a.csv');
		expect(ctx.fixShardMeta.action).toBe('check');
		expect(ctx.slashDeployMeta.text).toBe('deployed');
		expect(ctx.discordClient).toBeUndefined();
	});

	it('getConfig uses defaults', () => {
		delete process.env.ROLL_WORKER_URL;
		delete process.env.ROLL_WORKER_TOKEN;
		delete process.env.ROLL_WORKER_TIMEOUT_MS;
		const cfg = getConfig();
		expect(cfg.url).toContain('127.0.0.1:3950');
		expect(cfg.timeoutMs).toBe(120_000);
	});
});
