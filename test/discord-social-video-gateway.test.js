'use strict';

jest.mock('node:fs/promises', () => ({
    ...jest.requireActual('node:fs/promises'),
    readFile: jest.fn(async () => Buffer.from('media')),
}));

const { readFile } = require('node:fs/promises');
const { ChannelType, MessageType, Routes } = require('discord.js');
const { createDiscordVideoRequest } = require('../modules/chat/discord-social-video');
const { VideoAttachmentReadError } = require('../modules/chat/social-video');

const url = 'https://www.instagram.com/reel/DdYZybhJ9s6/';
const video = [{ file: 'fake.mp4', name: 'social-video.mp4', contentType: 'video/mp4' }];
function fixture(options = {}) {
    const rest = { post: jest.fn().mockResolvedValue(), delete: jest.fn().mockResolvedValue(), get: jest.fn() };
    const message = {
        author: { id: '101' }, channelId: '200', id: '500', guildId: '300',
        channel: { type: ChannelType.GuildText, messages: { cache: new Map() } },
        client: { rest }, content: '.video ' + url, ...options,
    };
    return { request: createDiscordVideoRequest(message), rest, message };
}

test('Discord attaches a mention and a clickable link to the video without a reply reference', async () => {
    const { request, rest } = fixture();
    await request.sendMedia({ attachments: video, url });
    expect(rest.post).toHaveBeenCalledTimes(1);
    expect(rest.post).toHaveBeenCalledWith(Routes.channelMessages('200'), expect.objectContaining({
        body: { content: '<@101> : 已下載 <' + url + '>', allowed_mentions: { parse: [], users: ['101'] } },
        files: [{ name: 'social-video.mp4', contentType: 'video/mp4', data: Buffer.from('media') }],
    }));
});

test('an overlong source URL cannot prevent Discord from delivering the media', async () => {
    const { request, rest } = fixture();
    const original = 'https://x.com/' + 'a'.repeat(2050) + '/status/123';
    await request.sendMedia({ attachments: video, url: original });
    const { body, files } = rest.post.mock.calls[0][1];
    expect(body.content).toBe('<@101> : 已下載 原始連結');
    expect(files.map(file => file.name)).toEqual(['social-video.mp4', 'source-link.txt']);
    expect(files[1].data.toString()).toBe(original);
});

test('Discord reads the replied message and deletes only the command addressed by the adapter', async () => {
    const { request, rest } = fixture({
        content: '.video', type: MessageType.Reply, reference: { messageId: '499', channelId: '200' },
    });
    rest.get.mockResolvedValue({ content: 'View this', embeds: [{ url }] });
    await expect(request.getRepliedMessage()).resolves.toEqual({ text: 'View this', urls: [url] });
    expect(rest.get).toHaveBeenCalledTimes(1);
    expect(rest.delete).not.toHaveBeenCalled();
    await request.deleteCommand();
    expect(rest.delete).toHaveBeenCalledTimes(1);
    expect(rest.delete).toHaveBeenCalledWith(Routes.channelMessage('200', '500'), expect.anything());
});

test('Discord reports a failed file read before starting any upload', async () => {
    const { request, rest } = fixture();
    const cause = Object.assign(new Error('Missing file'), { code: 'ENOENT' });
    readFile.mockRejectedValueOnce(cause);
    const upload = request.sendMedia({ attachments: video, url });
    await expect(upload).rejects.toBeInstanceOf(VideoAttachmentReadError);
    await expect(upload).rejects.toMatchObject({ cause });
    expect(rest.post).not.toHaveBeenCalled();
});

test('Discord sends one caption for a photo album and replies to status messages', async () => {
    const { request, rest } = fixture();
    const photos = ['one.jpg', 'two.jpg'].map(file => ({ file, name: file, contentType: 'image/jpeg' }));
    await request.sendMedia({ attachments: photos, url });
    expect(rest.post.mock.calls[0][1].body.content).toBe('<@101> : 已下載 <' + url + '>');
    expect(rest.post.mock.calls[0][1].files).toHaveLength(2);
    await request.sendText('影片功能暫時無法使用，請稍後再試。');
    expect(rest.post.mock.calls[1][1].body).toMatchObject({
        content: '影片功能暫時無法使用，請稍後再試。',
        message_reference: { message_id: '500', fail_if_not_exists: false },
        allowed_mentions: { parse: [], replied_user: false },
    });
});

test('Discord supports media receipts in DMs and skips unavailable deletion', async () => {
    const { request, rest } = fixture({ guildId: undefined, channel: { type: ChannelType.DM } });
    await request.sendMedia({ attachments: video, url });
    expect(rest.post).toHaveBeenCalledTimes(1);
    expect(request.deleteCommand).toBeUndefined();
});
