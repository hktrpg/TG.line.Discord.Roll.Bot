'use strict';

const { execFile } = require('node:child_process');
const { readFile, writeFile, stat, statfs, truncate } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { viplevelCheckGroup, viplevelCheckUser } = require('../modules/patreon/veryImportantPerson');
const { acquireVideoLease, reserveVideoQuota } = require('../modules/chat/social-video-quota');
const { readPrimaryMedia, postVideoLength, downloadPostVideo, downloadPostImages } = require('../modules/chat/social-post-media');
const { findSocialVideoLink, handleSocialVideo } = require('../modules/chat/social-video');
const { socialVideoInput, telegramVideoReply } = require('../modules/chat/telegram-social-video');
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
    ...jest.requireActual('../modules/chat/social-post-media'),
    readPrimaryMedia: jest.fn(), postVideoLength: jest.fn(), downloadPostVideo: jest.fn(), downloadPostImages: jest.fn(),
}));
jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(),
    viplevelCheckUser: jest.fn(),
}));

const originalEnv = process.env;
const scratchRoot = tmpdir();
const videoAttachment = [{ file: expect.any(String), name: 'social-video.mp4', contentType: 'video/mp4' }];
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
            void writeFile(source, 'video').then(() => truncate(source, sourceBytes)).then(() => callback(null, { stdout: '' }), callback);
        } else {
            void writeFile(output, 'video').then(() => callback(null, { stdout: '' }), callback);
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
        sendMedia: jest.fn().mockResolvedValue(),
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
    ['https://x.com/user/status/123/photo/1?s=1', 'twitter.*'],
    ['https://www.reddit.com/r/aww/comments/abc/example/?share=1', 'reddit'],
    ['https://v.redd.it/example', 'reddit'],
    ['https://i.redd.it/example.jpg', 'reddit'],
])('recognizes a supported X or Reddit media link (%s)', (url, extractor) => {
    expect(findSocialVideoLink(url)).toMatchObject({ url: url.split('?')[0], extractor });
});

test.each([
    'https://reddit.com.evil.example/r/aww/comments/abc/example/',
    'https://v.redd.it/unknown/../../arbitrary/path',
    'https://i.redd.it/example.exe',
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test.each([
    ['Telegram', -100_123, '.video '],
    ['Discord', '456', '.video '],
    ['Telegram', -100_123, '.video'],
    ['Discord', '456', '.video'],
])('%s in %s deletes a successful explicit command only after upload (%s)', async (platform, groupId, command) => {
    const url = 'https://www.instagram.com/reel/DdYZybhJ9s6/';
    const started = Promise.withResolvers();
    const upload = Promise.withResolvers();
    const text = command.endsWith(' ') ? command + url + '?stkn=tracking' : command;
    const request = telegram({
        platform, groupId, text,
        getRepliedMessage: jest.fn().mockResolvedValue({ text: url + '?stkn=tracking' }),
        sendMedia: jest.fn(() => { started.resolve(); return upload.promise; }),
        deleteCommand: jest.fn(),
    });
    const task = handleSocialVideo(request);
    try {
        await Promise.race([started.promise, task]);
        expect(request.sendMedia).toHaveBeenCalledTimes(1);
        expect(request.deleteCommand).not.toHaveBeenCalled();
    } finally {
        upload.resolve();
        await task;
    }
    expect(request.deleteCommand).toHaveBeenCalledTimes(1);
    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment, url });
    expect(request.sendText).not.toHaveBeenCalled();
});

test.each([['Telegram', -100_123], ['Discord', '456']])('%s labels an automatic link without deleting it', async (platform, groupId) => {
    const request = telegram({ platform, groupId, deleteCommand: jest.fn() });
    await handleSocialVideo(request);
    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment, url: request.text });
    expect(request.deleteCommand).not.toHaveBeenCalled();
});

test.each([['Telegram', -100_123], ['Discord', '456']])('%s preserves a command when the upload fails', async (platform, groupId) => {
    const request = telegram({ platform, groupId, text: '.video https://www.facebook.com/reel/123', deleteCommand: jest.fn() });
    request.sendMedia.mockRejectedValue(Object.assign(new Error('Permission denied'), { status: 403 }));
    await handleSocialVideo(request);
    expect(request.sendText).toHaveBeenCalledWith('聊天平台拒絕上傳（HTTP 403）。請檢查 Bot 有冇傳送附件嘅權限。');
    expect(request.deleteCommand).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledWith({ keepUpload: false });
});

test('a rejected command deletion keeps the delivered media and the charged quota', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const request = telegram({
        platform: 'Discord', groupId: '456', text: '.video https://www.facebook.com/reel/123',
        deleteCommand: jest.fn().mockRejectedValue(Object.assign(new Error('Missing permission'), { status: 403 })),
    });
    await handleSocialVideo(request);
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
    expect(request.deleteCommand).toHaveBeenCalledTimes(1);
    expect(request.sendText).not.toHaveBeenCalled();
    expect(refund).not.toHaveBeenCalled();
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test.each([
    ['same-chat reply', { reply_to_message: { text: 'https://www.facebook.com/reel/456/' } }],
    ['quoted text without a full reply', { quote: { text: 'https://www.facebook.com/reel/456/' } }],
    ['preview URL in the original', { reply_to_message: {
        text: 'Tap the preview',
        link_preview_options: { url: 'https://www.facebook.com/reel/456/' },
    } }],
    ['external preview URL', { external_reply: { link_preview_options: { url: 'https://www.facebook.com/reel/456/' } } }],
    ['original caption before quote', {
        reply_to_message: { caption: 'Tap to watch', caption_entities: [{ type: 'text_link', url: 'https://www.facebook.com/reel/456/' }] },
        quote: { text: 'https://www.facebook.com/reel/789/' },
    }],
])('the Telegram adapter resolves a bare reply using %s', async (_kind, fields) => {
    const message = { text: '.video', ...fields };
    const request = telegram({ ...socialVideoInput(message), getRepliedMessage: telegramVideoReply(message) });

    await handleSocialVideo(request);

    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/reel/456/');
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test.each([['text', 'entities'], ['caption', 'caption_entities']])(
    'reads the exact Telegram URL entity from a replied %s even when other characters touch it',
    async (bodyField, entitiesField) => {
        const prefix = '🎲 ';
        const url = 'https://www.facebook.com/reel/456/';
        const message = {
            text: '.video',
            reply_to_message: {
                [bodyField]: prefix + url + '\u200B附註',
                [entitiesField]: [{ type: 'url', offset: prefix.length, length: url.length }],
            },
        };
        const request = telegram({ ...socialVideoInput(message), getRepliedMessage: telegramVideoReply(message) });

        await handleSocialVideo(request);

        expect(request.sendMedia).toHaveBeenCalledTimes(1);
        expect(execFile.mock.calls[0][1].at(-1)).toBe(url);
    },
);

test.each([
    ['Telegram', -100_123, null], ['Telegram', -100_123, { kind: 'empty' }],
    ['Discord', '456', null], ['Discord', '456', { kind: 'empty' }],
])('a %s .video reply takes over its own active download (%s, %j)', async (platform, groupId, primary) => {
    const downloading = Promise.withResolvers();
    const finishDownload = Promise.withResolvers();
    readPrimaryMedia.mockImplementationOnce(() => {
        downloading.resolve();
        return finishDownload.promise;
    });
    const original = telegram({ platform, groupId, messageContext: { id: 500 }, deleteCommand: jest.fn() });
    const request = telegram({
        platform, groupId, text: '.video', deleteCommand: jest.fn(),
        messageContext: { id: 501, replyToId: 500 },
        getRepliedMessage: telegramVideoReply({ reply_to_message: { text: original.text } }),
    });
    const queued = Promise.withResolvers();
    request.sendText.mockImplementation(async () => { queued.resolve('queued'); });

    const autoTask = handleSocialVideo(original);
    let commandTask;
    try {
        await downloading.promise;
        commandTask = handleSocialVideo(request);
        await expect(Promise.race([commandTask, queued.promise])).resolves.toBeUndefined();
    } finally {
        finishDownload.resolve(primary);
        await Promise.all([autoTask, commandTask]);
    }

    expect(original.sendMedia).not.toHaveBeenCalled();
    expect(original.sendText).not.toHaveBeenCalled();
    expect(original.deleteCommand).not.toHaveBeenCalled();
    expect(reserveVideoQuota).toHaveBeenCalledTimes(1);
    if (primary) {
        expect(request.sendMedia).not.toHaveBeenCalled();
        expect(request.sendText).toHaveBeenCalledTimes(1);
        expect(refund).toHaveBeenCalledTimes(1);
        expect(request.deleteCommand).not.toHaveBeenCalled();
    } else {
        expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment, url: original.text });
        expect(request.sendText).not.toHaveBeenCalled();
        expect(request.deleteCommand).toHaveBeenCalledTimes(1);
        expect(execFile.mock.calls.filter(([program]) => program === 'yt-dlp')).toHaveLength(1);
    }
});

test('a bare Telegram /video from the menu prompts for a link without using quota', async () => {
    const promptForLink = jest.fn().mockResolvedValue();
    const request = telegram({ text: '/video@HKTRPGBot', commandBotName: 'HKTRPGBot', promptForLink });

    await handleSocialVideo(request);

    expect(promptForLink).toHaveBeenCalledTimes(1);
    expect(reserveVideoQuota).not.toHaveBeenCalled();
    expect(request.sendText).not.toHaveBeenCalled();
});

test('a reply to a Telegram /video prompt uses the command delivery for the supplied link', async () => {
    const request = telegram({ messageContext: { linkPromptReply: true }, promptForLink: jest.fn(), deleteCommand: jest.fn() });

    await handleSocialVideo(request);

    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment, url: request.text });
    expect(request.promptForLink).not.toHaveBeenCalled();
    expect(request.deleteCommand).not.toHaveBeenCalled();
});

test.each([['Telegram', -100_123], ['Discord', '456']])('%s gives the same guidance for a bare command without a reply', async (platform, groupId) => {
    const request = telegram({ platform, groupId, text: '.video' });
    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(
        '請在 .video 後貼上支援的公開貼文連結，或用 .video 回覆含有連結的訊息。'
    );
    expect(reserveVideoQuota).not.toHaveBeenCalled();
});

test('Telegram metadata without a supported URL prompts for the full link without reserving quota', async () => {
    const request = telegram({ text: '.video', getRepliedMessage: telegramVideoReply({ external_reply: {} }) });
    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('.video <完整連結>'));
    expect(acquireVideoLease).not.toHaveBeenCalled();
    expect(reserveVideoQuota).not.toHaveBeenCalled();
});

test.each(['.video \u200B', '.video\u200B'])('a Telegram .video reply ignores invisible trailing characters (%s)', async text => {
    const getRepliedMessage = jest.fn().mockResolvedValue({ text: 'https://www.facebook.com/reel/456/' });
    const request = telegram({ text, getRepliedMessage });
    await handleSocialVideo(request);
    expect(getRepliedMessage).toHaveBeenCalledTimes(1);
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
    expect(request.sendText).not.toHaveBeenCalled();
});

test('a link in the command wins and a regular reply does not fetch the referenced message', async () => {
    const getRepliedMessage = jest.fn();
    await handleSocialVideo(telegram({ text: 'nice clip', getRepliedMessage }));
    const request = telegram({ text: '.video https://www.facebook.com/reel/789/', getRepliedMessage });
    await handleSocialVideo(request);
    expect(getRepliedMessage).not.toHaveBeenCalled();
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test.each([
    [17_001, '影片請求太頻繁，請等 18 秒再試。'],
    [1, '影片請求太頻繁，請等 1 秒再試。'],
    [0, '影片請求的冷卻時間已結束，可以再試。'],
])('reports the cooldown with %d ms remaining at reply time', async (remainingMs, message) => {
    const now = Date.parse('2026-11-25T15:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now);
    reserveVideoQuota.mockResolvedValue({ reason: 'cooldown', retryAt: now + remainingMs });

    const request = telegram({ platform: 'Discord', groupId: '456' });
    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(message);
    expect(execFile).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
});

test.each([[1, 3], [2, 6], [3, 9], [4, 12], [7, 12]])(
    'queues %d group-VIP requests with capacity %d and processes them in arrival order',
    async (level, limit) => {
        viplevelCheckGroup.mockResolvedValue(level);
        const firstStarted = Promise.withResolvers();
        const continueFirst = Promise.withResolvers();
        const order = [];
        const text = '.video https://www.facebook.com/reel/123';
        const first = telegram({ text });
        first.sendMedia.mockImplementation(async () => {
            firstStarted.resolve();
            await continueFirst.promise;
            order.push(0);
        });
        const firstTask = handleSocialVideo(first);
        const tasks = [firstTask];
        try {
            await firstStarted.promise;
            for (let index = 1; index <= limit; index++) {
                const next = telegram({ text, userId: 123 + index });
                const queued = Promise.withResolvers();
                next.sendText.mockImplementation(async message => queued.resolve(message));
                next.sendMedia.mockImplementation(async () => { order.push(index); });
                tasks.push(handleSocialVideo(next));
                await expect(queued.promise).resolves.toContain('已加入影片隊列');
                expect(next.sendMedia).not.toHaveBeenCalled();
            }
            const overflow = telegram({ text, userId: 1000 });
            await handleSocialVideo(overflow);
            expect(overflow.sendText).toHaveBeenCalledWith(expect.stringContaining('最多可以等候 ' + limit));
            expect(overflow.sendMedia).not.toHaveBeenCalled();
        } finally {
            continueFirst.resolve();
            await Promise.all(tasks);
        }
        expect(order).toEqual(Array.from({ length: limit + 1 }, (_, index) => index));
    },
);

test('personal VIP uses one waiting limit across private chats and non-VIP groups', async () => {
    process.env.SOCIAL_VIDEO_ENABLED = 'true';
    viplevelCheckGroup.mockResolvedValue(0);
    viplevelCheckUser.mockResolvedValue(1);
    const text = '.video https://www.facebook.com/reel/123';
    const started = Promise.withResolvers();
    const unblock = Promise.withResolvers();
    const first = telegram({ text, groupId: null });
    first.sendMedia.mockImplementation(async () => {
        started.resolve();
        await unblock.promise;
    });
    const running = [handleSocialVideo(first)];
    try {
        await started.promise;
        for (const groupId of [-100_123, null, -100_456]) {
            const waiting = Promise.withResolvers();
            const request = telegram({ text, groupId });
            request.sendText.mockImplementation(async message => waiting.resolve(message));
            running.push(handleSocialVideo(request));
            await expect(waiting.promise).resolves.toContain('已加入影片隊列');
        }
        const overflow = telegram({ text, groupId: -100_789 });
        await handleSocialVideo(overflow);
        expect(overflow.sendText).toHaveBeenCalledWith(expect.stringContaining('最多可以等候 3'));
    } finally {
        unblock.resolve();
        await Promise.all(running);
    }
    expect(reserveVideoQuota).toHaveBeenCalledTimes(4);
    for (const [, recipient] of reserveVideoQuota.mock.calls) {
        expect(recipient).toMatchObject({ scope: 'user', id: '123', userId: '123' });
    }
});

test('a Telegram .video waits through a successful cooldown without sending a rate-limit error', async () => {
    reserveVideoQuota.mockResolvedValueOnce({ reason: 'cooldown', retryAt: Date.now() + 1 });
    const request = telegram({ text: '.video https://www.facebook.com/reel/123' });

    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('已加入影片隊列'));
    expect(request.sendText.mock.calls.every(([message]) => !message.includes('太頻繁'))).toBe(true);
    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment, url: 'https://www.facebook.com/reel/123' });
    expect(release).toHaveBeenCalledTimes(2);
});

test('an uncertain Telegram upload failure restores cooldown without returning the upload allowance', async () => {
    const request = telegram({ text: '.video https://www.facebook.com/reel/123' });
    request.sendMedia.mockRejectedValue(new Error('connection failed'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await handleSocialVideo(request);

    expect(refund).toHaveBeenCalledWith({ keepUpload: true });
    expect(request.sendText).toHaveBeenCalledWith(expect.stringContaining('上傳失敗'));
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
    request.sendMedia.mockImplementation(async ({ attachments: [{ file }] }) => {
        const details = await stat(file);
        expect(details.isFile()).toBe(true);
    });
    await handleSocialVideo(request);
    expect(fetcher).toHaveBeenCalledWith('https://www.facebook.com/share/r/abc/', expect.objectContaining({ redirect: 'manual' }));
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/reel/123/');
    expect(execFile.mock.calls[0][1]).toContain(String(30 * 1024 * 1024));
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
    await expect(stat(request.sendMedia.mock.calls[0][0].attachments[0].file)).rejects.toMatchObject({ code: 'ENOENT' });
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test('resolves a Facebook video share through its public canonical post when story.php redirects to login', async () => {
    const share = 'https://www.facebook.com/share/v/19sWN9xGhY/?mibextid=wwXIfr';
    const fetcher = jest.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: {
            location: '/story.php?story_fbid=1867816297994985&id=100063738685814',
        } }))
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/login/?next=private' } }))
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: {
            location: '/incgmedia/videos/%E7%89%87%E5%90%8D/1867816297994985/',
        } }));
    const request = telegram({ text: '.video ' + share });

    await handleSocialVideo(request);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher).toHaveBeenNthCalledWith(3, 'https://www.facebook.com/100063738685814/posts/1867816297994985/', expect.anything());
    expect(execFile.mock.calls[0][1].at(-1)).toBe('https://www.facebook.com/watch/?v=1867816297994985');
    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: videoAttachment,
        url: 'https://www.facebook.com/share/v/19sWN9xGhY/',
    });
});

test('compresses a short clip that exceeds the Discord cap and refunds a rejected upload', async () => {
    sourceBytes = 21 * 1024 * 1024;
    const request = telegram({ platform: 'Discord', groupId: '456' });
    request.sendMedia.mockRejectedValue(Object.assign(new Error('Upload failed'), { status: 403 }));
    await handleSocialVideo(request);
    const encoding = execFile.mock.calls.find(([, args]) => args.includes('libx264'));
    expect(encoding?.[1]).toContain(String(20 * 1024 * 1024));
    expect(encoding?.[2].timeout).toBe(30_000);
    expect(request.sendText).toHaveBeenCalledTimes(1);
    expect(refund).toHaveBeenCalledTimes(1);
    await expect(stat(request.sendMedia.mock.calls[0][0].attachments[0].file)).rejects.toMatchObject({ code: 'ENOENT' });
});

test.each([
    ['811.456 NA', /13 分 32 秒.*5 分鐘上限/],
    ['NA true', /直播.*已錄製/],
])('explains rejection metadata from yt-dlp %s before checking for a source file', async (metadata, expected) => {
    execFile.mockImplementationOnce((_tool, _args, _options, callback) => {
        callback(null, { stdout: 'HKTRPG_VIDEO ' + metadata + '\n' });
    });
    const request = telegram();

    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(expect.stringMatching(expected));
    expect(request.sendMedia).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledTimes(1);
    expect(execFile.mock.calls[0][1]).toContain('--no-simulate');
});

test('explains the clip-length limit when FFprobe discovers it after download', async () => {
    videoDuration = 301;
    const request = telegram();

    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(expect.stringMatching(/5 分 1 秒.*5 分鐘上限/));
    expect(request.sendMedia).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledTimes(1);
});

test.each([
    [Object.assign(new Error('Private URL - do not expose'), {status: 403}), /來源平台拒絕存取（HTTP 403）/],
    [Object.assign(new Error('Private URL - do not expose'), {code: 'SOCIAL_VIDEO_FETCH_LIMIT', limit: 3 * 1024 * 1024}), /3 MiB.*上限/],
    [Object.assign(new Error('Private URL - do not expose'), {name: 'TimeoutError'}), /來源媒體逾時/],
])('explains known source limits without echoing the raw error', async (error, expected) => {
    readPrimaryMedia.mockRejectedValueOnce(error);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const request = telegram();

    await handleSocialVideo(request);

    expect(request.sendText).toHaveBeenCalledWith(expect.stringMatching(expected));
    expect(request.sendText.mock.calls[0][0]).not.toContain(error.message);
    expect(refund).toHaveBeenCalledTimes(1);
});

test('rejects an oversized long clip before encoding and refunds the upload quota', async () => {
    sourceBytes = 21 * 1024 * 1024;
    videoDuration = 91;
    const request = telegram({ platform: 'Discord', groupId: '456' });
    await handleSocialVideo(request);
    expect(execFile).toHaveBeenCalledTimes(2);
    expect(request.sendMedia).not.toHaveBeenCalled();
    expect(request.sendText).toHaveBeenCalledWith(expect.stringMatching(/1 分 31 秒.*1 分 30 秒.*20 MiB/));
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test('posts images for a photo-only story and shares the normal daily quota', async () => {
    const image = 'https://scontent.xx.fbcdn.net/attachment.jpg';
    const attachment = { file: 'photo.jpg', name: 'social-photo-1.jpg', contentType: 'image/jpeg' };
    readPrimaryMedia.mockResolvedValue({ kind: 'images', urls: [image] });
    downloadPostImages.mockResolvedValue([attachment]);
    const request = telegram({
        platform: 'Discord', groupId: '456',
        text: '.video https://www.facebook.com/story.php?story_fbid=1607357098088246&id=Philipslightinghongkong',
        deleteCommand: jest.fn(),
    });
    await handleSocialVideo(request);
    expect(reserveVideoQuota).toHaveBeenCalledTimes(1);
    expect(request.sendMedia).toHaveBeenCalledWith({ attachments: [attachment],
        url: 'https://www.facebook.com/Philipslightinghongkong/posts/1607357098088246/',
    });
    expect(request.deleteCommand).toHaveBeenCalledTimes(1);
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
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
    expect(request.sendMedia).toHaveBeenCalledTimes(1);
});

test('every explicit Discord command gets a busy reply while automatic notices are throttled', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
    acquireVideoLease.mockResolvedValue(null);
    const createRequest = text => telegram({ platform: 'Discord', groupId: '456', text });
    const link = 'https://www.facebook.com/reel/123';
    const firstAuto = createRequest(link);
    const secondAuto = createRequest(link);
    const commands = [createRequest('.video ' + link), createRequest('.video ' + link)];
    for (const request of [firstAuto, secondAuto, ...commands]) await handleSocialVideo(request);
    const busy = 'Bot 正在處理另一段影片，一次只處理一個請求。請等完成後再試。';
    expect(firstAuto.sendText).toHaveBeenCalledWith(busy);
    expect(secondAuto.sendText).not.toHaveBeenCalled();
    for (const request of commands) {
        expect(request.sendText).toHaveBeenCalledTimes(1);
        expect(request.sendText).toHaveBeenCalledWith(busy);
    }
    expect(reserveVideoQuota).not.toHaveBeenCalled();
});
