'use strict';

const { execFile } = require('node:child_process');
const { readFile, writeFile, stat, statfs, truncate } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { viplevelCheckGroup, viplevelCheckUser } = require('../modules/patreon/veryImportantPerson');
const { acquireVideoLease, reserveVideoQuota } = require('../modules/chat/social-video-quota');
const { readPrimaryMedia, postVideoLength, downloadPostVideo, downloadPostImages } = require('../modules/chat/social-post-media');
const { findSocialVideoLink, handleSocialVideo } = require('../modules/chat/social-video');
const i18n = require('../modules/i18n/i18n');

jest.mock('node:child_process', () => ({ execFile: jest.fn() }));
jest.mock('../modules/chat/social-video-tools', () => ({
    getVideoExecutables: () => ({ ytDlp: 'yt-dlp', ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' }),
}));
jest.mock('node:fs/promises', () => ({
    ...jest.requireActual('node:fs/promises'), readFile: jest.fn(), statfs: jest.fn(),
}));
jest.mock('node:os', () => ({
    ...jest.requireActual('node:os'), platform: () => 'linux', availableParallelism: () => 2, loadavg: () => [0, 0, 0],
}));
jest.mock('../modules/chat/social-video-quota', () => ({ acquireVideoLease: jest.fn(), reserveVideoQuota: jest.fn() }));
jest.mock('../modules/chat/social-post-media', () => ({
    readPrimaryMedia: jest.fn(), postVideoLength: jest.fn(), downloadPostVideo: jest.fn(), downloadPostImages: jest.fn(),
}));
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
    delete process.env.SOCIAL_VIDEO_ENABLED;
    viplevelCheckGroup.mockResolvedValue(1);
    viplevelCheckUser.mockResolvedValue(1);
    refund = jest.fn().mockResolvedValue();
    release = jest.fn().mockResolvedValue();
    acquireVideoLease.mockResolvedValue({ release });
    reserveVideoQuota.mockResolvedValue({ refund });
    readPrimaryMedia.mockResolvedValue(null);
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
        sendImages: jest.fn().mockResolvedValue(),
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
    expect(findSocialVideoLink(String.raw`https://www.facebook.com/story.php?story_fbid=1607357098088246\&id=Philipslightinghongkong\&seo_visit=1`)?.url)
        .toBe('https://www.facebook.com/Philipslightinghongkong/posts/1607357098088246/');
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

test('the main flag alone automatically handles a link in any VIP guild', async () => {
    process.env.SOCIAL_VIDEO_ENABLED = 'true';
    delete process.env.SOCIAL_VIDEO_DISCORD_GUILD_IDS;
    const request = telegram({ platform: 'Discord', groupId: '999' });
    await handleSocialVideo(request);
    expect(viplevelCheckGroup).toHaveBeenCalledWith('999', 'Discord');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('the main flag enables Threads in DMs even when legacy switches are off', async () => {
    process.env.SOCIAL_VIDEO_ENABLED = 'true';
    process.env.SOCIAL_VIDEO_THREADS_ENABLED = 'false';
    const image = 'https://scontent.cdninstagram.com/photo.jpg';
    readPrimaryMedia.mockResolvedValue({ kind: 'images', urls: [image] });
    downloadPostImages.mockResolvedValue([{ file: 'photo.jpg' }]);
    const request = telegram({ groupId: null, text: 'https://www.threads.com/share/abc' });
    await handleSocialVideo(request);
    expect(viplevelCheckUser).toHaveBeenCalledWith('123', 'Telegram');
    expect(request.sendImages).toHaveBeenCalledTimes(1);
});

test('an explicit false master flag disables legacy entry points', async () => {
    process.env.SOCIAL_VIDEO_ENABLED = 'false';
    process.env.SOCIAL_VIDEO_GROUP_COMMAND_ENABLED = 'true';
    const request = telegram({ text: '.video https://www.facebook.com/reel/123' });
    await handleSocialVideo(request);
    expect(viplevelCheckGroup).not.toHaveBeenCalled();
    expect(request.sendText).not.toHaveBeenCalled();
    expect(execFile).not.toHaveBeenCalled();
});

test('a bare Discord .video reply resolves the Facebook link from the original message', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: '/reel/789/' } }),
    );
    const getRepliedMessage = jest.fn().mockResolvedValue({
        text: 'Look at this https://www.facebook.com/share/r/19mRFFe9Ha/?mibextid=wwXIfr',
    });
    const request = telegram({ platform: 'Discord', groupId: '456', text: '.video', getRepliedMessage });
    await handleSocialVideo(request);
    expect(getRepliedMessage).toHaveBeenCalledTimes(1);
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/reel/789/');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('an addressed Telegram reply can use a hidden link from the original caption', async () => {
    const request = telegram({
        text: '/video@HKTRPGBot ', commandBotName: 'HKTRPGBot',
        getRepliedMessage: jest.fn().mockResolvedValue({
            text: 'Watch the clip', urls: ['https://www.facebook.com/reel/456/'],
        }),
    });
    await handleSocialVideo(request);
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/reel/456/');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('a link in the command wins and a regular reply does not fetch the referenced message', async () => {
    const getRepliedMessage = jest.fn();
    await handleSocialVideo(telegram({ text: 'nice clip', getRepliedMessage }));
    const request = telegram({ text: '.video https://www.facebook.com/reel/789/', getRepliedMessage });
    await handleSocialVideo(request);
    expect(getRepliedMessage).not.toHaveBeenCalled();
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test.each([undefined, { text: 'No links here' }])('an unavailable reply link costs no quota', async original => {
    const request = telegram({ text: '.video', getRepliedMessage: jest.fn().mockResolvedValue(original) });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('原訊息'));
    expect(acquireVideoLease).not.toHaveBeenCalled();
    expect(reserveVideoQuota).not.toHaveBeenCalled();
});

test('a failed Discord reference lookup gives the reply error without reserving quota', async () => {
    const request = telegram({
        platform: 'Discord', groupId: '456', text: '.video',
        getRepliedMessage: jest.fn().mockRejectedValue(new Error('Unknown message')),
    });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('原訊息'));
    expect(acquireVideoLease).not.toHaveBeenCalled();
});

test('non-VIPs cannot fetch a replied message through the video command', async () => {
    viplevelCheckGroup.mockResolvedValue(0);
    viplevelCheckUser.mockResolvedValue(0);
    const getRepliedMessage = jest.fn();
    const request = telegram({ text: '.video', getRepliedMessage });
    await handleSocialVideo(request);
    expect(getRepliedMessage).not.toHaveBeenCalled();
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('VIP 資格'));
});

test('explains VIP and link validation to a sender who invokes the command explicitly', async () => {
    process.env.SOCIAL_VIDEO_GROUP_COMMAND_ENABLED = 'true';
    viplevelCheckGroup.mockResolvedValue(0);
    viplevelCheckUser.mockResolvedValue(0);
    const request = telegram({ platform: 'Discord', groupId: '999', text: '.video' });
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenLastCalledWith(expect.stringContaining('公開貼文連結'));
    await handleSocialVideo({ ...request, text: '.video https://www.facebook.com/reel/123' });
    expect(request.sendText).toHaveBeenLastCalledWith('此功能需要群組 VIP 或個人 VIP 資格。\n\n💎 前往 Patreon 查看 HKTRPG VIP 會員方案：\nhttps://www.patreon.com/HKTRPG/membership');
    expect(execFile).not.toHaveBeenCalled();
});

test.each(['Telegram', 'Discord'])('shows the localized personal VIP membership prompt in a %s DM', async platform => {
    process.env.SOCIAL_VIDEO_DM_ENABLED = 'true';
    viplevelCheckUser.mockResolvedValue(0);
    jest.spyOn(i18n, 'resolveLocale').mockResolvedValue('en');

    const request = telegram({ platform, groupId: null, text: '.video https://www.facebook.com/reel/123' });
    await handleSocialVideo(request);

    expect(i18n.resolveLocale).toHaveBeenCalledWith({ groupid: null, userid: '123' });
    expect(request.sendText).toHaveBeenCalledWith(
        'This feature requires personal VIP membership.\n\n💎 View HKTRPG VIP membership plans on Patreon:\nhttps://www.patreon.com/HKTRPG/membership'
    );
    expect(viplevelCheckGroup).not.toHaveBeenCalled();
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

test('follows a Facebook video share through story.php and a localized video slug', async () => {
    const story = '/story.php?story_fbid=123&id=456&tracking=abc';
    const fetcher = jest.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: story } }))
        .mockResolvedValueOnce(new Response(null, {
            status: 302, headers: { location: '/page/videos/%E8%B2%93/789/' },
        }));
    const request = telegram({ text: 'https://www.facebook.com/share/v/abc/' });
    await handleSocialVideo(request);
    expect(fetcher).toHaveBeenNthCalledWith(2, `https://www.facebook.com${story}`, expect.anything());
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/watch/?v=789');
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
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
    readPrimaryMedia.mockResolvedValue({ kind: 'video', url: 'https://scontent.cdninstagram.com/video.mp4' });
    downloadPostVideo.mockImplementation((url, file) => writeFile(file, 'video'));
    await handleSocialVideo(request);
    expect(downloadPostVideo).toHaveBeenCalledTimes(1);
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});

test('posts images for a photo-only story and shares the normal daily quota', async () => {
    const image = 'https://scontent.xx.fbcdn.net/attachment.jpg';
    const attachment = { file: 'photo.jpg', name: 'social-photo-1.jpg', contentType: 'image/jpeg' };
    readPrimaryMedia.mockResolvedValue({ kind: 'images', urls: [image] });
    downloadPostImages.mockResolvedValue([attachment]);
    const request = telegram({
        platform: 'Discord', groupId: '456',
        text: 'https://www.facebook.com/story.php?story_fbid=1607357098088246&id=Philipslightinghongkong',
    });
    await handleSocialVideo(request);
    expect(reserveVideoQuota).toHaveBeenCalledTimes(1);
    expect(request.sendImages).toHaveBeenCalledWith([attachment]);
    expect(request.sendVideo).not.toHaveBeenCalled();
    expect(execFile).not.toHaveBeenCalled();
});

test('uses the source audio and smaller video rendition before considering encoding', async () => {
    const original = 'https://scontent.cdninstagram.com/progressive.mp4';
    const tracks = { video: 'https://scontent.cdninstagram.com/video.mp4', audio: 'https://scontent.cdninstagram.com/audio.m4a' };
    readPrimaryMedia.mockResolvedValue({ kind: 'video', url: original, tracks });
    postVideoLength.mockResolvedValue(23_795_532);
    downloadPostVideo.mockImplementation((url, file) => writeFile(file, 'part'));
    videoDuration = 94;
    const request = telegram({ platform: 'Discord', groupId: '456', text: 'https://www.instagram.com/reel/DfttAgLhlWw/' });
    await handleSocialVideo(request);
    expect(downloadPostVideo.mock.calls.map(([url]) => url)).toEqual([tracks.video, tracks.audio]);
    expect(execFile.mock.calls.some(([, args]) => args.includes('libx264'))).toBe(false);
    expect(request.sendVideo).toHaveBeenCalledTimes(1);
});
