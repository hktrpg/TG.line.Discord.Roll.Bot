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
});
