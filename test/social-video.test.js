'use strict';

const { execFile } = require('node:child_process');
const { readFile, writeFile, stat, statfs, truncate } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { viplevelCheckGroup, viplevelCheckUser } = require('../modules/patreon/veryImportantPerson');
const { acquireVideoLease, reserveVideoQuota } = require('../modules/chat/social-video-quota');
const { findSocialVideoLink, handleSocialVideo } = require('../modules/chat/social-video');

jest.mock('node:child_process', () => ({ execFile: jest.fn() }));
jest.mock('node:fs/promises', () => ({
    ...jest.requireActual('node:fs/promises'), readFile: jest.fn(), statfs: jest.fn(),
}));
jest.mock('node:os', () => ({
    ...jest.requireActual('node:os'), platform: () => 'linux', availableParallelism: () => 2, loadavg: () => [0, 0, 0],
}));
jest.mock('../modules/chat/social-video-quota', () => ({ acquireVideoLease: jest.fn(), reserveVideoQuota: jest.fn() }));
jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(),
    viplevelCheckUser: jest.fn(),
}));

const originalEnv = process.env;
const scratchRoot = tmpdir();
let sourceBytes;
let videoDuration;
let refund;
let release;

beforeEach(() => {
    process.env = {
        ...originalEnv,
        SOCIAL_VIDEO_TELEGRAM_GROUP_IDS: '-100123',
        SOCIAL_VIDEO_DISCORD_GUILD_IDS: '456',
        SOCIAL_VIDEO_DM_ENABLED: 'false',
        SOCIAL_VIDEO_GROUP_COMMAND_ENABLED: 'false',
        SOCIAL_VIDEO_TMP_DIR: scratchRoot,
    };
    viplevelCheckGroup.mockResolvedValue(1);
    viplevelCheckUser.mockResolvedValue(1);
    refund = jest.fn().mockResolvedValue();
    release = jest.fn().mockResolvedValue();
    acquireVideoLease.mockResolvedValue({ release });
    reserveVideoQuota.mockResolvedValue({ refund });
    statfs.mockResolvedValue({ type: 0x01_02_19_94, blocks: 16_384, bavail: 16_384, bsize: 4096 });
    readFile.mockImplementation(file => Promise.resolve(file === '/proc/meminfo' ? 'MemAvailable: 1048576 kB' : 'max'));
    sourceBytes = 5;
    videoDuration = 10;
    execFile.mockImplementation((command, args, options, callback) => {
        if (command === 'ffprobe') {
            callback(null, { stdout: JSON.stringify({
                streams: [{ codec_type: 'video', codec_name: 'h264', width: 720, height: 1280, avg_frame_rate: '30/1' }],
                format: { duration: videoDuration },
            }) });
            return;
        }
        const output = args.at(-1);
        if (command === 'yt-dlp') {
            const source = args[args.indexOf('--output') + 1];
            void writeFile(source, 'video').then(() => truncate(source, sourceBytes)).then(() => callback(null), callback);
        } else {
            void writeFile(output, 'video').then(() => callback(null), callback);
        }
    });
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    process.env = originalEnv;
});

function telegram(options = {}) {
    return {
        platform: 'Telegram',
        groupId: -100_123,
        userId: 123,
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
    const reel = 'https://www.facebook.com/share/r/abc/';
    expect(findSocialVideoLink(`.video [${reel}](${reel})`)?.url).toBe(reel);
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

test('requires an enabled group and a VIP match before using the downloader', async () => {
    await handleSocialVideo(telegram({ groupId: -100_999 }));
    expect(viplevelCheckGroup).not.toHaveBeenCalled();
    viplevelCheckGroup.mockResolvedValue(0);
    viplevelCheckUser.mockResolvedValue(0);
    await handleSocialVideo(telegram());
    expect(viplevelCheckGroup).toHaveBeenCalledWith('-100123', 'Telegram');
    expect(execFile).not.toHaveBeenCalled();
});

test('a Discord guild command explains why the DM flag alone does not enable it', async () => {
    process.env.SOCIAL_VIDEO_DM_ENABLED = 'true';
    const request = telegram({
        platform: 'Discord', groupId: '999', text: '.video https://www.facebook.com/share/r/19mRFFe9Ha/?mibextid=wwXIfr',
    });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('群組尚未啟用'));
    expect(execFile).not.toHaveBeenCalled();
});

test('explains VIP and link validation to a sender who invokes the command explicitly', async () => {
    process.env.SOCIAL_VIDEO_GROUP_COMMAND_ENABLED = 'true';
    viplevelCheckGroup.mockResolvedValue(0);
    viplevelCheckUser.mockResolvedValue(0);
    const request = telegram({ platform: 'Discord', groupId: '999', text: '.video' });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenLastCalledWith(expect.stringContaining('公開影片連結'));
    await handleSocialVideo({ ...request, text: '.video https://www.facebook.com/reel/123' });
    expect(request.sendText).toHaveBeenLastCalledWith(expect.stringContaining('VIP 資格'));
    expect(execFile).not.toHaveBeenCalled();
});

test.each(['Telegram', 'Discord'])('personal VIP can use an enabled %s DM', async platform => {
    const request = telegram({ platform, groupId: null, userId: 123 });
    await handleSocialVideo(request);
    expect(viplevelCheckUser).not.toHaveBeenCalled();

    process.env.SOCIAL_VIDEO_DM_ENABLED = 'true';
    viplevelCheckUser.mockResolvedValueOnce(0);
    await handleSocialVideo(request);
    expect(execFile).not.toHaveBeenCalled();

    await handleSocialVideo(request);
    expect(viplevelCheckUser).toHaveBeenLastCalledWith('123', platform);
    expect(viplevelCheckGroup).not.toHaveBeenCalled();
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('consumes group quota first even when the sender is a personal VIP', async () => {
    await handleSocialVideo(telegram());
    expect(reserveVideoQuota).toHaveBeenCalledWith(expect.anything(), {
        platform: 'Telegram', scope: 'group', id: '-100123', userId: '123',
    });
    expect(viplevelCheckUser).not.toHaveBeenCalled();
});

test('a personal VIP uses personal quota and receives the file in a non-VIP group', async () => {
    process.env.SOCIAL_VIDEO_GROUP_COMMAND_ENABLED = 'true';
    viplevelCheckGroup.mockResolvedValue(0);
    const request = telegram({
        groupId: -100_999,
        commandBotName: 'HKTRPGBot',
        text: '/video@HKTRPGBot https://www.facebook.com/reel/123',
    });
    await handleSocialVideo({ ...request, commandBotName: 'OtherBot' });
    expect(viplevelCheckUser).not.toHaveBeenCalled();
    await handleSocialVideo(request);
    expect(reserveVideoQuota).toHaveBeenCalledWith(expect.anything(), {
        platform: 'Telegram', scope: 'user', id: '123', userId: '123',
    });
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('reports a group quota limit without downloading or falling back to personal quota', async () => {
    reserveVideoQuota.mockResolvedValue({ reason: 'quota' });
    const request = telegram();
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('額度'));
    expect(viplevelCheckUser).not.toHaveBeenCalled();
    expect(execFile).not.toHaveBeenCalled();
});

test('does not download when the shared slot is occupied or when the scratch filesystem is on disk', async () => {
    acquireVideoLease.mockResolvedValueOnce(null);
    const request = telegram();
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('另一段影片'));
    statfs.mockResolvedValueOnce({ type: 1, blocks: 16_384, bavail: 16_384, bsize: 4096 });
    await handleSocialVideo(request);
    expect(execFile).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
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
    expect(execFile.mock.calls[0][1]).toContain(String(30 * 1024 * 1024));
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

test('compresses a short clip that exceeds the Discord cap and refunds a rejected upload', async () => {
    sourceBytes = 21 * 1024 * 1024;
    const request = telegram({ platform: 'Discord', groupId: '456' });
    request.sendVideo.mockRejectedValue(Object.assign(new Error('Upload failed'), { status: 403 }));
    await handleSocialVideo(request);
    const encoding = execFile.mock.calls.find(([, args]) => args.includes('libx264'));
    expect(encoding?.[1]).toContain(String(20 * 1024 * 1024));
    expect(encoding?.[2].timeout).toBe(30_000);
    expect(request.sendText).toHaveBeenCalledTimes(1);
    expect(refund).toHaveBeenCalledTimes(1);
    await expect(stat(request.sendVideo.mock.calls[0][0])).rejects.toMatchObject({ code: 'ENOENT' });
});

test('rejects an oversized long clip before encoding and refunds the upload quota', async () => {
    sourceBytes = 21 * 1024 * 1024;
    videoDuration = 91;
    const request = telegram({ platform: 'Discord', groupId: '456' });
    await handleSocialVideo(request);
    expect(execFile).toHaveBeenCalledTimes(2);
    expect(request.sendVideo).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledTimes(1);
});

test('skips encoding on low memory after allowing a lighter download', async () => {
    sourceBytes = 21 * 1024 * 1024;
    readFile.mockImplementation(file => Promise.resolve(file === '/proc/meminfo' ? 'MemAvailable: 400000 kB' : 'max'));
    const request = telegram({ platform: 'Discord', groupId: '456' });
    await handleSocialVideo(request);
    expect(execFile).toHaveBeenCalledTimes(2);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('資源不足'));
    expect(refund).toHaveBeenCalledTimes(1);
});

test('requires opt-in for the Threads extractor', async () => {
    process.env.SOCIAL_VIDEO_THREADS_ENABLED = 'false';
    const request = telegram({ text: 'https://www.threads.com/@user/post/abc' });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledTimes(1);
    expect(execFile).not.toHaveBeenCalled();
    process.env.SOCIAL_VIDEO_THREADS_ENABLED = 'true';
    await handleSocialVideo(request);
    expect(execFile.mock.calls[0][1]).toContain('threads');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});
