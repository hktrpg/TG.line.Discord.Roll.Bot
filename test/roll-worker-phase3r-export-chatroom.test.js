"use strict";

/**
 * Phase 3r:
 * - Skip export history prefetch on GP cooldown / low userrole
 * - Chatroom ManageChannels checks the invoking user via guild.members.fetch
 */

describe('Phase 3r canPrefetchExportHistory', () => {
	const prevMongo = process.env.mongoURL;

	afterEach(() => {
		if (prevMongo === undefined) delete process.env.mongoURL;
		else process.env.mongoURL = prevMongo;
		jest.resetModules();
		jest.clearAllMocks();
	});

	it('blocks prefetch when userrole < 2', async () => {
		await jest.isolateModulesAsync(async () => {
			process.env.mongoURL = 'mongodb://localhost/test';
			const { canPrefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');
			const gate = await canPrefetchExportHistory({
				userid: 'u1',
				groupid: 'g1',
				userrole: 1,
			});
			expect(gate.allow).toBe(false);
			expect(gate.reason).toBe('userrole');
		});
	});

	it('blocks prefetch when GP is on cooldown', async () => {
		await jest.isolateModulesAsync(async () => {
			process.env.mongoURL = 'mongodb://localhost/test';
			jest.doMock('../modules/patreon/veryImportantPerson', () => ({
				viplevelCheckUser: jest.fn(async () => 0),
				viplevelCheckGroup: jest.fn(async () => 0),
			}));
			jest.doMock('../modules/db/schema.js', () => ({
				exportUser: { findOne: jest.fn(async () => null) },
				exportGp: {
					findOne: jest.fn(async () => ({
						lastActiveAt: new Date(),
					})),
				},
			}));
			const { canPrefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');
			const gate = await canPrefetchExportHistory({
				userid: 'u1',
				groupid: 'g1',
				userrole: 3,
			});
			expect(gate.allow).toBe(false);
			expect(gate.reason).toBe('gp_cooldown');
		});
	});

	it('allows prefetch and sets demoMode when user weekly quota exceeded', async () => {
		await jest.isolateModulesAsync(async () => {
			process.env.mongoURL = 'mongodb://localhost/test';
			delete process.env.DEBUG;
			jest.doMock('../modules/patreon/veryImportantPerson', () => ({
				viplevelCheckUser: jest.fn(async () => 0),
				viplevelCheckGroup: jest.fn(async () => 0),
			}));
			jest.doMock('../modules/db/schema.js', () => ({
				exportUser: {
					findOne: jest.fn(async () => ({
						lastActiveAt: new Date(Date.now() - 1000),
						times: 99,
					})),
				},
				exportGp: { findOne: jest.fn(async () => null) },
			}));
			const { canPrefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');
			const gate = await canPrefetchExportHistory({
				userid: 'u1',
				groupid: 'g1',
				userrole: 3,
			});
			expect(gate.allow).toBe(true);
			expect(gate.demoMode).toBe(true);
		});
	});
});

describe('Phase 3r enrichParamsForRemote skips export prefetch on gate deny', () => {
	it('does not call prefetchExportHistory when GP cooldown', async () => {
		await jest.isolateModulesAsync(async () => {
			const prefetchExportHistory = jest.fn(async () => ({
				exportHistoryMeta: { sum_messages: [{}], totalSize: 1 },
			}));
			jest.doMock('../modules/roll-worker/discord-prefetch', () => ({
				prefetchExportHistory,
				canPrefetchExportHistory: jest.fn(async () => ({
					allow: false,
					demoMode: false,
					reason: 'gp_cooldown',
				})),
				resolveExportDemoMode: jest.fn(async () => false),
				prefetchChatroomChannel: jest.fn(),
				prefetchOpenAiDiscordContext: jest.fn(),
				prefetchStoryAttachment: jest.fn(),
				prefetchForwardSource: jest.fn(),
				prefetchStoryGroupNames: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({ text: 'ok', type: 'text', _rollWorker: true })),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(() => 'export'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (key) => key,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.discord html',
				botname: 'Discord',
				userid: 'u1',
				groupid: 'g1',
				channelid: 'c1',
				userrole: 3,
				discordClient: { channels: { fetch: jest.fn() } },
				discordMessage: { channel: { name: 'x' } },
				locale: 'zh-tw',
			}, { keepProof: true });

			expect(prefetchExportHistory).not.toHaveBeenCalled();
			expect(result._rollWorker).toBe(true);
			expect(result.text).toBe('ok');
		});
	});
});

describe('Phase 3r prefetchChatroomChannel uses guild.members.fetch', () => {
	it('checks ManageChannels for the invoking userid', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.unmock('../modules/roll-worker/discord-prefetch');
			const { PermissionsBitField } = require('discord.js');
			const invokingMember = { id: 'user-invoker' };
			const otherMember = { id: 'user-other' };
			const permissionsFor = jest.fn((member) => ({
				has: (flag) => member === invokingMember && flag === PermissionsBitField.Flags.ManageChannels,
			}));
			const membersFetch = jest.fn(async (id) => {
				if (String(id) === 'user-invoker') return invokingMember;
				return otherMember;
			});
			const channelFetch = jest.fn(async () => {
				throw new Error('GuildChannel.fetch must not be used with userid');
			});
			const discordClient = {
				channels: {
					fetch: jest.fn(async () => ({
						guildId: 'g1',
						name: 'room',
						guild: {
							name: 'Guild',
							members: { fetch: membersFetch },
						},
						fetch: channelFetch,
						permissionsFor,
					})),
				},
			};

			const { prefetchChatroomChannel } = require('../modules/roll-worker/discord-prefetch');
			const out = await prefetchChatroomChannel(discordClient, {
				channelId: 'c1',
				userid: 'user-invoker',
			});

			expect(channelFetch).not.toHaveBeenCalled();
			expect(membersFetch).toHaveBeenCalledWith('user-invoker');
			expect(permissionsFor).toHaveBeenCalledWith(invokingMember);
			expect(out).toEqual({
				allowed: true,
				channelId: 'c1',
				guildId: 'g1',
				guildName: 'Guild',
				channelName: 'room',
			});
		});
	});

	it('returns allowed false when invoking user lacks ManageChannels', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.unmock('../modules/roll-worker/discord-prefetch');
			const { PermissionsBitField } = require('discord.js');
			const invokingMember = { id: 'user-no-perm' };
			const discordClient = {
				channels: {
					fetch: jest.fn(async () => ({
						guildId: 'g1',
						name: 'room',
						guild: {
							name: 'Guild',
							members: {
								fetch: jest.fn(async () => invokingMember),
							},
						},
						permissionsFor: jest.fn(() => ({
							has: (flag) => flag !== PermissionsBitField.Flags.ManageChannels,
						})),
					})),
				},
			};

			const { prefetchChatroomChannel } = require('../modules/roll-worker/discord-prefetch');
			const out = await prefetchChatroomChannel(discordClient, {
				channelId: 'c1',
				userid: 'user-no-perm',
			});
			expect(out.allowed).toBe(false);
		});
	});
});
