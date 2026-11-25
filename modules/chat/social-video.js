"use strict";

const { execFile } = require('node:child_process');
const { mkdtemp, rm, stat } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { promisify } = require('node:util');
const { isEnvEnabled } = require('../../utils/env-flag');

const runFile = promisify(execFile);
const DOWNLOAD_TIMEOUT = 60_000;
const MAX_CONCURRENT = 2;
const COOLDOWN = { group: 15_000, user: 30_000 };
const platforms = {
    Telegram: { groups: 'SOCIAL_VIDEO_TELEGRAM_GROUP_IDS', maxBytes: 49_000_000 },
    Discord: { groups: 'SOCIAL_VIDEO_DISCORD_GUILD_IDS', maxBytes: 20 * 1024 * 1024 },
};
const active = new Set();
const recent = new Map();

const sources = [
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/(?:reels?\/\d+|(?:[\w.-]+\/)?videos\/(?:[\w.-]+\/)?\d+)\/?$/,
    },
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/(?:watch|video\.php)\/?$/,
        queryParam: 'v',
    },
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/share\/(?:r|v)\/[\w-]+\/?$/,
        redirect: true,
    },
    { extractor: 'facebook.*', hosts: ['fb.watch'], path: /^\/[\w-]+\/?$/, redirect: true },
    {
        extractor: 'twitter.*',
        hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
        path: /^\/(?:[\w]+\/status|i\/web\/status)\/\d+(?:\/video\/\d+)?\/?$/,
    },
    {
        extractor: 'instagram.*',
        hosts: ['instagram.com', 'www.instagram.com'],
        path: /^\/(?:reel|p|tv)\/[\w-]+\/?$/,
    },
    {
        extractor: 'tiktok',
        hosts: ['tiktok.com', 'www.tiktok.com'],
        path: /^\/@[\w.-]+\/video\/\d+\/?$/,
    },
    {
        extractor: String.raw`tiktok,vm\.tiktok`,
        hosts: ['vm.tiktok.com', 'vt.tiktok.com'],
        path: /^\/[\w-]+\/?$/,
    },
    {
        extractor: 'threads',
        hosts: ['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'],
        path: /^\/(?:@[\w.-]+\/post|t|share)\/[\w-]+\/?$/,
    },
];

function parseLink(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const source = sources.find(({ hosts, path }) => hosts.includes(url.hostname) && path.test(url.pathname));
    if (!source) return null;
    const videoId = source.queryParam && url.searchParams.get(source.queryParam);
    if (source.queryParam && !/^\d+$/.test(videoId || '')) return null;
    url.search = '';
    url.hash = '';
    if (videoId) url.searchParams.set(source.queryParam, videoId);
    return { url: url.href, extractor: source.extractor, redirect: source.redirect };
}

function findSocialVideoLink(text, urls = []) {
    const candidates = String(text || '').matchAll(/https:\/\/[^\s<>"`]+/gi);
    for (const match of candidates) {
        const link = parseLink(match[0].replace(/[)\]}.!,;，。！？]+$/, ''));
        if (link) return link;
    }
    for (const url of urls) {
        const link = parseLink(url);
        if (link) return link;
    }
    return null;
}

async function resolveShareLink(link) {
    const signal = AbortSignal.timeout(8000);
    for (let redirects = 0; link.redirect && redirects < 5; redirects++) {
        const response = await fetch(link.url, { redirect: 'manual', signal });
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (response.status < 300 || response.status >= 400 || !location) {
            throw new Error('Unresolved Facebook share link');
        }
        link = parseLink(new URL(location, link.url).href);
        if (link?.extractor !== 'facebook.*') throw new Error('Unsupported Facebook redirect');
    }
    if (link.redirect) throw new Error('Too many Facebook redirects');
    return link.url;
}

function subprocessEnv() {
    // Keep bot tokens, Mongo credentials, home config and proxy credentials out of child processes.
    const names = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'TMP', 'TEMP', 'TMPDIR', 'LANG', 'LC_ALL']);
    return Object.fromEntries(Object.entries(process.env).filter(([name]) => names.has(name.toUpperCase())));
}

async function downloadSocialVideo(link, directory, maxBytes) {
    const input = join(directory, 'source.mp4');
    const output = join(directory, 'social-video.mp4');
    const sizeFilter = `[filesize<=?${maxBytes}][filesize_approx<=?${maxBytes}]`;
    // Progressive MP4s on Facebook and Threads can omit codec metadata.
    const videoFormat = `bv[ext=mp4][vcodec~=?'^(avc1|h264)'][protocol=https]${sizeFilter}`;
    const audioFormat = "ba[ext=m4a][acodec~=?'^(mp4a|aac)'][protocol=https]";
    const singleFormat = `b[ext=mp4][vcodec~=?'^(avc1|h264)'][acodec~=?'^(mp4a|aac)'][protocol=https]${sizeFilter}`;
    const options = { env: subprocessEnv(), windowsHide: true, maxBuffer: 64 * 1024 };
    const url = await resolveShareLink(link);
    const threadsPluginDir = process.env.SOCIAL_VIDEO_THREADS_PLUGIN_DIR;
    let pluginArgs = ['--no-plugin-dirs'];
    if (link.extractor === 'threads') {
        pluginArgs = threadsPluginDir ? ['--no-plugin-dirs', '--plugin-dirs', threadsPluginDir] : [];
    }
    const ffmpegPath = process.env.SOCIAL_VIDEO_FFMPEG_PATH;
    const ffmpegArgs = ffmpegPath ? ['--ffmpeg-location', ffmpegPath] : [];
    await runFile(process.env.SOCIAL_VIDEO_YTDLP_PATH || 'yt-dlp', [
        '--ignore-config', '--no-cache-dir', ...pluginArgs, '--use-extractors', link.extractor,
        '--skip-playlist-after-errors', '1', '--no-playlist', '--playlist-items', '1',
        '--no-progress', '--socket-timeout', '10', '--retries', '0', '--extractor-retries', '0',
        '--match-filter', '!is_live & duration <=? 300', '--max-filesize', String(maxBytes),
        ...ffmpegArgs, '--format-sort', 'res:720', '--format', `${singleFormat}/${videoFormat}+${audioFormat}/${videoFormat}`,
        '--merge-output-format', 'mp4', '--output', input, '--', url,
    ], { ...options, timeout: DOWNLOAD_TIMEOUT });
    const source = await stat(input);
    if (!source.isFile() || source.size === 0 || source.size > maxBytes) throw new Error('Invalid video size');
    await runFile(ffmpegPath || 'ffmpeg', [
        '-nostdin', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-f', 'mov',
        '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', '-tag:v', 'avc1',
        '-movflags', '+faststart', output,
    ], { ...options, timeout: 15_000 });
    const file = await stat(output);
    if (!file.isFile() || file.size === 0 || file.size > maxBytes) throw new Error('Invalid upload size');
    return output;
}

const failureMessages = {
    threads: 'Threads 影片擷取尚未啟用。',
    download: '無法取得可上傳的影片。請確認貼文公開，或試試較短的影片及原始影片連結。',
    upload: '已取得影片，但無法上傳到這個頻道。請檢查 bot 的附件權限。',
};

/**
 * Repost the first supported link in a configured VIP group or an enabled personal
 * VIP DM. Gateways pass userId only for DMs. The upload callback must finish before
 * it resolves, since the temporary file is then removed.
 */
async function handleSocialVideo({ platform, groupId, userId, text, urls, sendVideo, sendText }) {
    const config = platforms[platform];
    if (!config || (!groupId && !userId)) return;
    const scope = groupId ? 'group' : 'user';
    const id = String(groupId || userId);
    if (scope === 'group' && !process.env[config.groups]?.split(',').some(group => group.trim() === id)) return;
    if (scope === 'user' && !isEnvEnabled('SOCIAL_VIDEO_DM_ENABLED')) return;
    const link = findSocialVideoLink(text, urls);
    if (!link) return;

    const key = `${platform}:${scope}:${id}`;
    if (active.size >= MAX_CONCURRENT || active.has(key) || recent.has(key)) return;
    active.add(key);
    let directory;
    let stage = 'VIP check';
    try {
        const { viplevelCheckGroup, viplevelCheckUser } = require('../patreon/veryImportantPerson');
        const checkVip = scope === 'group' ? viplevelCheckGroup : viplevelCheckUser;
        if (await checkVip(id, platform) < 1) return;

        recent.set(key, setTimeout(() => recent.delete(key), COOLDOWN[scope]).unref());
        if (link.extractor === 'threads' && !isEnvEnabled('SOCIAL_VIDEO_THREADS_ENABLED')) {
            stage = 'threads';
            await sendText(failureMessages.threads);
            return;
        }
        stage = 'download';
        directory = await mkdtemp(join(tmpdir(), 'hktrpg-social-video-'));
        const video = await downloadSocialVideo(link, directory, config.maxBytes);
        stage = 'upload';
        await sendVideo(video);
    } catch {
        // The downloader and API errors may contain user links or request credentials.
        console.warn(`[Social video] ${platform}: ${stage} failed`);
        if (stage === 'download' || stage === 'upload') {
            await sendText(failureMessages[stage]).catch(() => {});
        }
    } finally {
        try {
            if (directory) await rm(directory, { recursive: true, force: true });
        } catch {
            console.warn('[Social video] Could not remove temporary files');
        } finally {
            active.delete(key);
        }
    }
}

module.exports = { findSocialVideoLink, handleSocialVideo };
