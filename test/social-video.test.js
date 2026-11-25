'use strict';

const { execFile } = require('node:child_process');
const { writeFile, stat } = require('node:fs/promises');
const { viplevelCheckGroup } = require('../modules/patreon/veryImportantPerson');
const { findSocialVideoLink, handleSocialVideo } = require('../modules/chat/social-video');

jest.mock('node:child_process', () => ({ execFile: jest.fn() }));
jest.mock('../modules/patreon/veryImportantPerson', () => ({ viplevelCheckGroup: jest.fn() }));

const originalEnv = process.env;

beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    process.env = { ...originalEnv, SOCIAL_VIDEO_TELEGRAM_GROUP_IDS: '-100123', SOCIAL_VIDEO_DISCORD_GUILD_IDS: '456' };
    viplevelCheckGroup.mockResolvedValue(1);
    execFile.mockImplementation((command, args, options, callback) => {
        const output = command === 'yt-dlp' ? args[args.indexOf('--output') + 1] : args.at(-1);
        void writeFile(output, 'video').then(() => callback(null), callback);
    });
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    process.env = originalEnv;
});

function telegram(options = {}) {
    return {
        platform: 'Telegram',
        groupId: -100_123,
        text: 'https://www.facebook.com/reel/123',
        sendVideo: jest.fn().mockResolvedValue(),
        sendText: jest.fn().mockResolvedValue(),
        ...options,
    };
}

test('recognizes supported links, including Telegram text entities, and removes tracking query parameters', () => {
    expect(findSocialVideoLink('好好笑 <https://www.facebook.com/share/r/abc/?mibextid=test>')).toMatchObject({
        url: 'https://www.facebook.com/share/r/abc/',
        extractor: 'facebook.*',
        redirect: true,
    });
    expect(findSocialVideoLink('Watch here', ['https://www.threads.com/share/abc?x=1'])).toMatchObject({
        url: 'https://www.threads.com/share/abc',
        extractor: 'threads',
    });
    expect(findSocialVideoLink('(https://x.com/user/status/123?s=1)')).toMatchObject({
        url: 'https://x.com/user/status/123',
        extractor: 'twitter.*',
    });
    expect(findSocialVideoLink('https://www.facebook.com/watch/?v=123&tracking=1')?.url)
        .toBe('https://www.facebook.com/watch/?v=123');
});

test.each([
    'http://facebook.com/reel/123',
    'https://facebook.com.evil.example/reel/123',
    'https://www.facebook.com@evil.example/reel/123',
    'https://user@www.facebook.com/reel/123',
    'https://www.facebook.com:8080/reel/123',
    'https://www.facebook.com/l.php?u=https://example.com/',
    'https://www.facebook.com/groups/123/',
])('ignores a URL outside the supported routes (%s)', url => {
    expect(findSocialVideoLink(url)).toBeNull();
});

test('requires an enabled group and a group VIP match before using the downloader', async () => {
    await handleSocialVideo(telegram({ groupId: -100_999 }));
    expect(viplevelCheckGroup).not.toHaveBeenCalled();
    viplevelCheckGroup.mockResolvedValue(0);
    await handleSocialVideo(telegram());
    expect(viplevelCheckGroup).toHaveBeenCalledWith('-100123', 'Telegram');
    expect(execFile).not.toHaveBeenCalled();
});

test('resolves a Facebook share to a Reel, uploads the file, then cleans up', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 302, headers: { Location: '/reel/123/?tracking=1' } }),
    );
    const request = telegram({ text: 'https://www.facebook.com/share/r/abc/' });
    request.sendVideo.mockImplementation(async file => {
        const details = await stat(file);
        expect(details.isFile()).toBe(true);
    });
    await handleSocialVideo(request);
    expect(fetcher).toHaveBeenCalledWith('https://www.facebook.com/share/r/abc/', expect.objectContaining({ redirect: 'manual' }));
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/reel/123/');
    expect(execFile.mock.calls[0][1]).toContain('49000000');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
    await expect(stat(request.sendVideo.mock.calls[0][0])).rejects.toMatchObject({ code: 'ENOENT' });
});

test('rejects a Facebook redirect to a different host before fetching it', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 302, headers: { Location: 'https://example.org/reel/123/' } }),
    );
    const request = telegram({ text: 'https://www.facebook.com/share/r/abc/' });
    await handleSocialVideo(request);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(execFile).not.toHaveBeenCalled();
    expect(request.sendText).toHaveBeenCalledTimes(1);
});

test('applies the Discord cap and cleans up after an upload failure', async () => {
    const request = telegram({ platform: 'Discord', groupId: '456' });
    request.sendVideo.mockRejectedValue(new Error('Upload failed'));
    await handleSocialVideo(request);
    expect(execFile.mock.calls[0][1]).toContain(String(20 * 1024 * 1024));
    expect(request.sendText).toHaveBeenCalledTimes(1);
    await expect(stat(request.sendVideo.mock.calls[0][0])).rejects.toMatchObject({ code: 'ENOENT' });
});

test('requires opt-in for the Threads extractor', async () => {
    process.env.SOCIAL_VIDEO_THREADS_ENABLED = 'false';
    const request = telegram({ text: 'https://www.threads.com/@user/post/abc' });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledTimes(1);
    expect(execFile).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    process.env.SOCIAL_VIDEO_THREADS_ENABLED = 'true';
    await handleSocialVideo(request);
    expect(execFile.mock.calls[0][1]).toContain('threads');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});
