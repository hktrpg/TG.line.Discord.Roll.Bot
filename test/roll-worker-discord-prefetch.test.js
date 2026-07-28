"use strict";

const {
	serializeAttachment,
	serializeAttachmentCollection,
	fakeAttachmentCollection,
	prefetchOpenAiDiscordContext,
} = require('../modules/roll-worker/discord-prefetch');

describe('discord-prefetch (Phase 3d openai)', () => {
	it('serializeAttachment keeps url/name/size/contentType', () => {
		const out = serializeAttachment({
			url: 'https://cdn.example/a.txt',
			name: 'a.txt',
			size: 12,
			contentType: 'text/plain',
		});
		expect(out).toEqual({
			url: 'https://cdn.example/a.txt',
			name: 'a.txt',
			size: 12,
			contentType: 'text/plain',
		});
	});

	it('serializeAttachmentCollection maps Discord-like Collection', () => {
		const collection = {
			size: 1,
			values() {
				return [{ url: 'https://cdn.example/b.png', name: 'b.png', size: 3, contentType: 'image/png' }].values();
			},
		};
		expect(serializeAttachmentCollection(collection)).toHaveLength(1);
		expect(serializeAttachmentCollection(collection)[0].name).toBe('b.png');
	});

	it('fakeAttachmentCollection is readable by [...values()]', () => {
		const bag = fakeAttachmentCollection([
			{ url: 'https://cdn.example/c.txt', name: 'c.txt', size: 1, contentType: 'text/plain' },
		]);
		expect(bag.size).toBe(1);
		const items = [...bag.values()];
		expect(items[0].url).toContain('c.txt');
	});

	it('prefetchOpenAiDiscordContext reads current attachments', async () => {
		const discordMessage = {
			type: 0,
			attachments: {
				size: 1,
				values() {
					return [{ url: 'https://cdn.example/d.pdf', name: 'd.pdf', size: 9, contentType: 'application/pdf' }].values();
				},
			},
		};
		const ctx = await prefetchOpenAiDiscordContext(discordMessage, null);
		expect(ctx.attachmentsMeta).toHaveLength(1);
		expect(ctx.attachmentsMeta[0].name).toBe('d.pdf');
		expect(ctx.replyAttachmentsMeta).toEqual([]);
	});

	it('prefetchStoryAttachment reads first attachment', async () => {
		const {
			prefetchStoryAttachment,
		} = require('../modules/roll-worker/discord-prefetch');
		const att = await prefetchStoryAttachment({
			attachments: {
				size: 1,
				values() {
					return [{ url: 'https://cdn.example/story.json', name: 'story.json', size: 20, contentType: 'application/json' }].values();
				},
			},
		}, null);
		expect(att.url).toContain('story.json');
		expect(att.filename).toBe('story.json');
	});

	it('prefetchForwardSource returns null without client', async () => {
		const { prefetchForwardSource } = require('../modules/roll-worker/discord-prefetch');
		const out = await prefetchForwardSource(
			{ guildId: '1' },
			null,
			{ messageLink: 'https://discord.com/channels/1/2/3', userid: 'u', channelid: '9' }
		);
		expect(out).toBeNull();
	});

	it('prefetchExportHistory returns null without client', async () => {
		const { prefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');
		const out = await prefetchExportHistory(null, { channel: { name: 'x' } }, { channelid: '1' });
		expect(out).toBeNull();
	});

	it('prefetchExportHistory serializes fetched messages', async () => {
		const { prefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');
		const fakeMsg = {
			createdTimestamp: 1_700_000_000_000,
			content: 'hello',
			author: { username: 'alice', bot: false },
			attachments: { size: 0, map: () => [] },
			embeds: [],
			id: 'm1',
		};
		const discordClient = {
			channels: {
				async fetch() {
					return {
						messages: {
							async fetch() {
								return {
									size: 1,
									values() { return [fakeMsg].values(); },
									last() { return fakeMsg; },
								};
							},
						},
					};
				},
			},
		};
		const discordMessage = {
			channel: {
				name: 'proof',
				permissionsFor() {
					return { has: () => true };
				},
			},
			guild: {
				members: {
					me: {
						permissions: { has: () => false },
					},
				},
			},
		};
		const out = await prefetchExportHistory(discordClient, discordMessage, { channelid: 'c1' });
		expect(out.exportMeta.channelName).toBe('proof');
		expect(out.exportMeta.hasReadPermission).toBe(true);
		expect(out.exportHistoryMeta.sum_messages).toHaveLength(1);
		expect(out.exportHistoryMeta.sum_messages[0].contact).toBe('hello');
		expect(out.exportHistoryMeta.totalSize).toBe(1);
	});
});
