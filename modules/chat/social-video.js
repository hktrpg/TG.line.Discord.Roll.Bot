"use strict";

const { execFile } = require('node:child_process');
const { lstat, mkdtemp, readFile, readdir, rm, stat, statfs } = require('node:fs/promises');
const { availableParallelism, loadavg, platform: hostPlatform } = require('node:os');
const { dirname, isAbsolute, join } = require('node:path');
const { promisify } = require('node:util');
const { isEnvEnabled } = require('../../utils/env-flag');
const { acquireVideoLease, reserveVideoQuota } = require('./social-video-quota');

const runFile = promisify(execFile);
const MIB = 1024 * 1024;
const MAX_SOURCE_BYTES = 30 * MIB;
const MAX_DURATION = 300;
const scratchPrefix = 'hktrpg-social-video-';
const platforms = {
    Telegram: { groups: 'SOCIAL_VIDEO_TELEGRAM_GROUP_IDS', maxBytes: MAX_SOURCE_BYTES },
    Discord: { groups: 'SOCIAL_VIDEO_DISCORD_GUILD_IDS', maxBytes: 20 * MIB },
};
let active = false;
let nextBusyReply = 0;

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

function subprocessEnv(directory) {
    // Keep bot tokens, Mongo credentials, home config and proxy credentials out of child processes.
    const names = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'LANG', 'LC_ALL']);
    return {
        ...Object.fromEntries(Object.entries(process.env).filter(([name]) => names.has(name.toUpperCase()))),
        TMP: directory, TEMP: directory, TMPDIR: directory,
    };
}

async function createVideoScratch() {
    const root = process.env.SOCIAL_VIDEO_TMP_DIR || '/dev/shm';
    if (!isAbsolute(root)) throw new Error('Video scratch path must be absolute');
    const fs = await statfs(root);
    // Linux TMPFS_MAGIC. Require bounded RAM-backed storage, including in custom deployments.
    if (fs.type !== 0x01_02_19_94 || fs.blocks * fs.bsize > 64 * MIB) {
        throw new Error('Video scratch must be a bounded Linux tmpfs');
    }
    // A gateway crash can leave a job directory until its shared lease has expired.
    const cutoff = Date.now() - 240_000;
    for (const name of await readdir(root)) {
        if (!/^hktrpg-social-video-[a-z\d]{6}$/i.test(name)) continue;
        const path = join(root, name);
        const file = await lstat(path);
        if (file.isDirectory() && file.uid === process.getuid?.() && file.mtimeMs < cutoff) {
            await rm(path, { recursive: true, force: true });
        }
    }
    const available = await statfs(root);
    if (available.bavail * available.bsize < 62 * MIB) {
        throw new Error('Video scratch needs 62 MiB free on a bounded tmpfs');
    }
    return mkdtemp(join(root, scratchPrefix));
}

async function hasVideoCapacity(encoding = false) {
    if (hostPlatform() !== 'linux') return false;
    const cpus = availableParallelism();
    if (encoding && (cpus < 2 || loadavg()[0] >= cpus * 0.75)) return false;
    const memory = await readFile('/proc/meminfo', 'utf8');
    const available = Number(/^MemAvailable:\s+(\d+)/m.exec(memory)?.[1]) * 1024;
    if (!(available >= (encoding ? 512 : 256) * MIB)) return false;

    const limit = await readFile('/sys/fs/cgroup/memory.max', 'utf8').catch(error => {
        if (error.code === 'ENOENT') return 'max';
        throw error;
    });
    if (limit.trim() === 'max') return true;
    const used = await readFile('/sys/fs/cgroup/memory.current', 'utf8');
    return Number(limit) - Number(used) >= (encoding ? 256 : 128) * MIB;
}

async function probeVideo(file, ffprobe, options) {
    const { stdout } = await runFile(ffprobe, [
        '-v', 'error', '-max_alloc', String(64 * MIB), '-protocol_whitelist', 'file,pipe', '-f', 'mov',
        '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height,avg_frame_rate',
        '-of', 'json', file,
    ], { ...options, timeout: 8000 });
    const { streams, format } = JSON.parse(stdout);
    const video = streams?.find(stream => stream.codec_type === 'video');
    const audio = streams?.find(stream => stream.codec_type === 'audio');
    const duration = Number(format?.duration);
    if (!video || !Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION) {
        throw new Error('Invalid video duration');
    }
    return { video, audio, duration };
}

async function downloadSocialVideo(link, directory, maxBytes) {
    const input = join(directory, 'source.mp4');
    const output = join(directory, 'social-video.mp4');
    const sizeFilter = `[filesize<=?${MAX_SOURCE_BYTES}][filesize_approx<=?${MAX_SOURCE_BYTES}]`;
    const videoFormat = `bv[ext=mp4][protocol=https]${sizeFilter}`;
    const audioFormat = `ba[ext=m4a][protocol=https]${sizeFilter}`;
    const singleFormat = `b[ext=mp4][protocol=https]${sizeFilter}`;
    const options = { env: subprocessEnv(directory), cwd: directory, windowsHide: true, maxBuffer: 64 * 1024, killSignal: 'SIGKILL' };
    const url = await resolveShareLink(link);
    const threadsPluginDir = process.env.SOCIAL_VIDEO_THREADS_PLUGIN_DIR;
    let pluginArgs = ['--no-plugin-dirs'];
    if (link.extractor === 'threads') {
        pluginArgs = threadsPluginDir ? ['--no-plugin-dirs', '--plugin-dirs', threadsPluginDir] : [];
    }
    const ffmpegPath = process.env.SOCIAL_VIDEO_FFMPEG_PATH;
    const ffmpegArgs = ffmpegPath ? ['--ffmpeg-location', ffmpegPath] : [];
    const ffprobe = process.env.SOCIAL_VIDEO_FFPROBE_PATH || (ffmpegPath ? join(dirname(ffmpegPath), 'ffprobe') : 'ffprobe');
    await runFile(process.env.SOCIAL_VIDEO_YTDLP_PATH || 'yt-dlp', [
        '--ignore-config', '--no-cache-dir', ...pluginArgs, '--use-extractors', link.extractor,
        '--skip-playlist-after-errors', '1', '--no-playlist', '--playlist-items', '1',
        '--no-progress', '--socket-timeout', '10', '--retries', '0', '--extractor-retries', '0',
        '--match-filter', `!is_live & duration <=? ${MAX_DURATION}`, '--max-filesize', String(MAX_SOURCE_BYTES),
        ...ffmpegArgs, '--format-sort', 'res:720', '--format', `${singleFormat}/${videoFormat}+${audioFormat}/${videoFormat}`,
        '--merge-output-format', 'mp4', '--output', input, '--', url,
    ], { ...options, timeout: 45_000 });
    const source = await stat(input);
    if (!source.isFile() || source.size === 0 || source.size > MAX_SOURCE_BYTES) throw new Error('Invalid video size');
    const { video, audio, duration } = await probeVideo(input, ffprobe, options);
    const transcode = source.size + 65_536 > maxBytes || video.codec_name !== 'h264' || (audio && audio.codec_name !== 'aac');
    let encoding = ['-c', 'copy'];
    if (transcode) {
        const [frames, seconds] = String(video.avg_frame_rate).split('/').map(Number);
        const frameRate = frames / seconds;
        const { width, height } = video;
        if (duration > 90 || !(width > 0 && height > 0 && width * height <= 1920 * 1080)
            || Math.max(width, height) > 1920 || !(frameRate > 0 && frameRate <= 30)) {
            throw new Error('Video exceeds transcode limits');
        }
        if (!await hasVideoCapacity(true)) {
            const error = new Error('Server is too busy for video encoding');
            error.code = 'SOCIAL_VIDEO_CAPACITY';
            throw error;
        }
        encoding = [
            '-vf', "scale='min(854,iw)':'min(854,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=24",
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '25', '-maxrate', '1400k', '-bufsize', '1400k',
            '-threads:v', '1', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
        ];
    }
    const ffmpeg = ffmpegPath || 'ffmpeg';
    const args = [
        '-nostdin', '-v', 'error', '-max_alloc', String(64 * MIB), '-filter_threads', '1', '-threads', '1',
        '-protocol_whitelist', 'file,pipe', '-f', 'mov', '-i', input,
        '-map', '0:v:0', '-map', '0:a:0?', ...encoding,
        '-movflags', '+faststart', '-fs', String(maxBytes), output,
    ];
    const lowPriority = transcode && hostPlatform() === 'linux';
    await runFile(lowPriority ? 'nice' : ffmpeg, lowPriority ? ['-n', '10', ffmpeg, ...args] : args,
        { ...options, timeout: transcode ? 30_000 : 10_000 });
    const file = await stat(output);
    if (!file.isFile() || file.size === 0 || file.size > maxBytes) throw new Error('Invalid upload size');
    const ready = await probeVideo(output, ffprobe, options);
    if (ready.duration < duration - 0.5) throw new Error('Incomplete video');
    return output;
}

const failureMessages = {
    threads: 'Threads 影片擷取尚未啟用。',
    busy: 'Bot 正在處理另一段影片，請稍後再貼一次。',
    cooldown: '影片請求太頻繁，請稍後再試。',
    quota: '今天的影片額度已用完，香港時間午夜重設。',
    capacity: '伺服器目前資源不足，請稍後再試或貼較小的影片。',
    download: '無法取得可上傳的影片。請確認貼文公開，或試試較短、較小的影片及原始連結。',
    upload: '影片上傳失敗或逾時。請確認 bot 可以傳送附件，再稍後重試。',
    service: '影片功能暫時無法使用，請稍後再試。',
};

/**
 * Use group quota first. A non-VIP group can use the sender's personal quota.
 * The upload callback must finish before it resolves, since the file is then removed.
 */
async function handleSocialVideo({ platform, groupId, userId, commandBotName, text, urls, sendVideo, sendText }) {
    const config = platforms[platform];
    const actor = String(userId || '');
    if (!config || !/^\d+$/.test(actor)) return;
    if (groupId) {
        const configured = process.env[config.groups]?.split(',').some(group => group.trim() === String(groupId));
        const command = /^(?:\.video|\/video(?:@(\w+))?)(?:\s|$)/i.exec(text || '');
        const addressedToBot = command && (!command[1] || command[1].toLowerCase() === commandBotName?.toLowerCase());
        if (!configured && !(addressedToBot && isEnvEnabled('SOCIAL_VIDEO_GROUP_COMMAND_ENABLED'))) return;
    } else if (!isEnvEnabled('SOCIAL_VIDEO_DM_ENABLED')) {
        return;
    }
    const link = findSocialVideoLink(text, urls);
    if (!link) return;

    const reply = reason => sendText(failureMessages[reason]).catch(() => {});
    async function busy() {
        if (Date.now() < nextBusyReply) return;
        nextBusyReply = Date.now() + 10_000;
        await reply('busy');
    }

    let localSlot = false;
    let lease;
    let reservation;
    let directory;
    let stage = 'service';
    try {
        const { viplevelCheckGroup, viplevelCheckUser } = require('../patreon/veryImportantPerson');
        const groupVip = groupId && await viplevelCheckGroup(String(groupId), platform) >= 1;
        if (!groupVip && await viplevelCheckUser(actor, platform) < 1) return;
        if (link.extractor === 'threads' && !isEnvEnabled('SOCIAL_VIDEO_THREADS_ENABLED')) {
            await reply('threads');
            return;
        }
        if (active) return await busy();
        active = true;
        localSlot = true;
        lease = await acquireVideoLease();
        if (!lease) return await busy();
        directory = await createVideoScratch();
        if (!await hasVideoCapacity()) return await reply('capacity');
        reservation = await reserveVideoQuota(lease, {
            platform, scope: groupVip ? 'group' : 'user', id: groupVip ? String(groupId) : actor, userId: actor,
        });
        if (reservation.reason) {
            await reply(reservation.reason);
            return;
        }
        stage = 'download';
        const video = await downloadSocialVideo(link, directory, config.maxBytes);
        stage = 'upload';
        await sendVideo(video);
    } catch (error) {
        const status = Number(error?.error_code || error?.status);
        if (reservation?.refund && (stage !== 'upload' || (status >= 400 && status < 500))) {
            await reservation.refund().catch(() => console.warn('[Social video] Could not refund video quota'));
        }
        // The downloader and API errors may contain user links or request credentials.
        console.warn(`[Social video] ${platform}: ${stage} failed`);
        await reply(error?.code === 'SOCIAL_VIDEO_CAPACITY' ? 'capacity' : stage);
    } finally {
        try {
            if (directory) await rm(directory, { recursive: true, force: true });
        } catch {
            console.warn('[Social video] Could not remove temporary files');
        } finally {
            if (lease) await lease.release().catch(() => console.warn('[Social video] Could not release video slot'));
            if (localSlot) active = false;
        }
    }
}

module.exports = { findSocialVideoLink, handleSocialVideo };
