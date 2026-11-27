"use strict";

const { execFile } = require('node:child_process');
const { rm, stat } = require('node:fs/promises');
const { constants, setPriority } = require('node:os');
const { join } = require('node:path');
const { promisify } = require('node:util');
const { setTimeout: delay } = require('node:timers/promises');
const { isEnvEnabled } = require('../../utils/env-flag');
const { acquireVideoLease, reserveVideoQuota } = require('./social-video-quota');
const {
    readPrimaryMedia, postVideoLength, downloadPostVideo, downloadPostImages,
    xPostRoute, redditPostRoute, redditVideoRoute, redditPhotoRoute,
} = require('./social-post-media');
const { createVideoScratch, hasVideoCapacity, watchVideoDownload } = require('./social-video-runtime');
const { getVideoExecutables } = require('./social-video-tools');

const runFile = promisify(execFile);
const MIB = 1024 * 1024;
const MAX_SOURCE_BYTES = 30 * MIB;
const MAX_DURATION = 300;
const MAX_TRANSCODE_DURATION = 90;
const MAX_TRANSCODE_FPS = 30;
const platforms = {
    Telegram: { groups: 'SOCIAL_VIDEO_TELEGRAM_GROUP_IDS', maxBytes: MAX_SOURCE_BYTES },
    Discord: { groups: 'SOCIAL_VIDEO_DISCORD_GUILD_IDS', maxBytes: 20 * MIB },
};
let active = false;
const telegramQueue = [];
let servingTelegramQueue = false;

function nextTelegramJob() {
    const next = telegramQueue.shift();
    servingTelegramQueue = Boolean(next);
    if (next) next.start(nextTelegramJob);
}

function enqueueTelegramVideo(key, limit) {
    if (telegramQueue.filter(job => job.key === key).length >= limit) return null;
    const waiting = servingTelegramQueue || active;
    const turn = new Promise(start => {
        telegramQueue.push({ key, start });
        if (!servingTelegramQueue) nextTelegramJob();
    });
    return { turn, waiting };
}

const sources = [
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/reels?\/\d+\/?$/,
    },
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/(?:[\w.-]+\/)?videos\/(?:[^/]+\/)?\d+\/?$/,
        videoPath: true,
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
        path: /^\/[\w.-]+\/posts\/(?:[^/]+\/)?(?:\d+|pfbid[\w]+)\/?$/i,
    },
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/(?:story|permalink)\.php$/,
        story: true,
    },
    {
        extractor: 'facebook.*',
        hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
        path: /^\/share\/[\w-]+\/[\w-]+\/?$/,
        redirect: true,
    },
    { extractor: 'facebook.*', hosts: ['fb.watch'], path: /^\/[\w-]+\/?$/, redirect: true },
    {
        extractor: 'twitter.*',
        hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
        path: xPostRoute,
    },
    {
        extractor: 'reddit',
        hosts: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com', 'sh.reddit.com', 'm.reddit.com'],
        path: redditPostRoute,
    },
    { extractor: 'reddit', hosts: ['v.redd.it'], path: redditVideoRoute },
    { extractor: 'reddit', hosts: ['i.redd.it'], path: redditPhotoRoute },
    {
        extractor: 'instagram.*',
        hosts: ['instagram.com', 'www.instagram.com'],
        path: /^\/(?:[\w.-]+\/)?(?:reel|p|tv)\/[\w-]+\/?$/,
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

function parseLink(value, followStory = false) {
    let url;
    try {
        url = new URL(String(value).replaceAll(String.raw`\&`, '&'));
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const source = sources.find(({ hosts, path }) => hosts.includes(url.hostname) && path.test(url.pathname));
    if (!source) return null;
    if (source.story) {
        const owner = url.searchParams.get('id') || '';
        const postId = url.searchParams.get('story_fbid') || '';
        if (!/^[\w.-]+$/.test(owner) || !/^(?:\d+|pfbid[\w]+)$/i.test(postId)) return null;
        if (followStory) return { url: url.href, extractor: source.extractor, redirect: true, story: true };
        return parseLink(`https://www.facebook.com/${owner}/posts/${postId}/`);
    }
    if (source.videoPath) {
        const id = url.pathname.split('/').findLast(Boolean);
        return parseLink(`https://www.facebook.com/watch/?v=${id}`);
    }
    const videoId = source.queryParam && url.searchParams.get(source.queryParam);
    if (source.queryParam && !/^\d+$/.test(videoId || '')) return null;
    url.search = '';
    url.hash = '';
    if (videoId) url.searchParams.set(source.queryParam, videoId);
    return { url: url.href, extractor: source.extractor, redirect: source.redirect };
}

function findSocialVideoLink(text, urls = []) {
    const candidates = String(text || '').matchAll(/https:\/\/[^\s<>"`[\]()]+/gi);
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

class VideoRequestError extends Error {}
class VideoAttachmentReadError extends Error {}

function formatVideoDuration(duration) {
    const seconds = Math.ceil(duration);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes} 分 ${seconds % 60} 秒` : `${seconds} 秒`;
}

function checkVideoDuration(duration) {
    if (Number.isFinite(duration) && duration > MAX_DURATION) {
        throw new VideoRequestError(`影片片長約 ${formatVideoDuration(duration)}，超過 ${MAX_DURATION / 60} 分鐘上限。請試一段較短的影片。`);
    }
}

function checkDownloaderMetadata(stdout) {
    // pre_process runs before yt-dlp skips a video rejected by --match-filter.
    const match = /^HKTRPG_VIDEO (\d+(?:\.\d+)?|NA|null) (true|false|NA|null)\r?$/m.exec(stdout ?? '');
    if (!match) return;
    if (match[2] === 'true') {
        throw new VideoRequestError('這是直播，影片功能只支援已錄製的公開影片。');
    }
    checkVideoDuration(Number(match[1]));
}

async function resolveShareLink(link) {
    const signal = AbortSignal.timeout(8000);
    for (let redirects = 0; link.redirect && redirects < 5; redirects++) {
        const response = await fetch(link.url, { redirect: 'manual', signal });
        await response.body?.cancel();
        const location = response.headers.get('location');
        if ((link.story || link.storyPost) && response.ok) return parseLink(link.url);
        if (response.status < 300 || response.status >= 400 || !location) {
            if (response.status >= 400) throw Object.assign(new Error('Facebook share link returned an error'), { status: response.status });
            throw new VideoRequestError('Facebook 分享連結未能轉到影片。請貼原始公開貼文或 Reel 連結。');
        }
        const destination = new URL(location, link.url);
        if (link.story && destination.origin === new URL(link.url).origin
            && /^\/login\/?$/.test(destination.pathname)) {
            // Facebook can require login for the share's story route even when its canonical post is public.
            link = { ...parseLink(link.url), redirect: true, storyPost: true };
            continue;
        }
        link = parseLink(destination.href, true);
        if (link?.extractor !== 'facebook.*') throw new VideoRequestError('Facebook 分享連結轉到不支援的頁面。請貼原始公開貼文或 Reel 連結。');
    }
    if (link.redirect) throw new VideoRequestError('Facebook 分享連結轉址次數過多。請貼原始公開貼文或 Reel 連結。');
    return link;
}

function subprocessEnv(directory) {
    // Keep bot tokens, Mongo credentials, home config and proxy credentials out of child processes.
    const names = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'LANG', 'LC_ALL']);
    return {
        ...Object.fromEntries(Object.entries(process.env).filter(([name]) => names.has(name.toUpperCase()))),
        TMP: directory, TEMP: directory, TMPDIR: directory,
    };
}

async function probeVideo(file, ffprobe, options) {
    const { stdout } = await runFile(ffprobe, [
        '-v', 'error', '-max_alloc', String(64 * MIB), '-protocol_whitelist', 'file,pipe', '-f', 'mov',
        '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height,avg_frame_rate,sample_aspect_ratio:stream_side_data=rotation',
        '-of', 'json', file,
    ], { ...options, timeout: 8000 });
    const { streams, format } = JSON.parse(stdout);
    const video = streams?.find(stream => stream.codec_type === 'video');
    const audio = streams?.find(stream => stream.codec_type === 'audio');
    const duration = Number(format?.duration);
    if (!video || !Number.isFinite(duration) || duration <= 0) {
        throw new VideoRequestError('無法辨識影片軌或片長。請試另一段可正常播放的公開影片。');
    }
    checkVideoDuration(duration);
    return { video, audio, duration };
}

function videoDisplayDimensions(video) {
    const { width, height } = video;
    if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) return;

    const [horizontal, vertical] = (video.sample_aspect_ratio ?? '').split(':').map(Number);
    const displayWidth = horizontal > 0 && vertical > 0 ? Math.round(width * horizontal / vertical) : width;
    if (!Number.isSafeInteger(displayWidth) || displayWidth < 1) return;

    const rotation = video.side_data_list?.find(entry => Number.isFinite(entry.rotation))?.rotation ?? 0;
    return Math.abs(rotation) % 180 === 90
        ? { width: height, height: displayWidth }
        : { width: displayWidth, height };
}

async function stagePostTracks(tracks, input, directory, maxBytes, ffmpeg, options) {
    const video = join(directory, 'post-video-track.mp4');
    const audio = join(directory, 'post-audio-track.m4a');
    const signal = AbortSignal.timeout(30_000);
    const byteLimit = maxBytes - 65_536;
    await downloadPostVideo(tracks.video, video, byteLimit, signal);
    const extraInput = [];
    const extraMap = [];
    if (tracks.audio) {
        const file = await stat(video);
        await downloadPostVideo(tracks.audio, audio, byteLimit - file.size, signal);
        extraInput.push('-protocol_whitelist', 'file,pipe', '-i', audio);
        extraMap.push('-map', '1:a:0');
    }
    await runFile(ffmpeg, [
        '-nostdin', '-v', 'error', '-max_alloc', String(64 * MIB),
        '-protocol_whitelist', 'file,pipe', '-i', video, ...extraInput,
        '-map', '0:v:0', ...extraMap, '-c', 'copy', input,
    ], { ...options, timeout: 10_000 });
    await rm(video, { force: true });
    await rm(audio, { force: true });
}

async function downloadSocialVideo(link, directory, maxBytes, primary) {
    checkVideoDuration(primary?.duration);
    const input = join(directory, 'source.mp4');
    const output = join(directory, 'social-video.mp4');
    const sizeFilter = `[filesize<=?${MAX_SOURCE_BYTES}][filesize_approx<=?${MAX_SOURCE_BYTES}]`;
    const videoFormat = `bv[ext=mp4][protocol=https]${sizeFilter}`;
    const audioFormat = `ba[ext=m4a][protocol=https]${sizeFilter}`;
    const singleFormat = `b[ext=mp4][protocol=https]${sizeFilter}`;
    const options = { env: subprocessEnv(directory), cwd: directory, windowsHide: true, maxBuffer: 64 * 1024, killSignal: 'SIGKILL' };
    const { ytDlp, ffmpeg, ffprobe, ffmpegLocation } = getVideoExecutables();
    const ffmpegArgs = ffmpegLocation ? ['--ffmpeg-location', ffmpegLocation] : [];
    if (primary?.url || primary?.tracks) {
        const { url, tracks } = primary;
        const bytes = url && tracks ? await postVideoLength(url).catch(() => 0) : 0;
        let useTracks = Boolean(tracks && (!url || bytes + 65_536 > maxBytes));
        if (!useTracks) {
            try {
                await downloadPostVideo(url, input, MAX_SOURCE_BYTES);
                const downloaded = await stat(input);
                useTracks = Boolean(tracks && downloaded.size + 65_536 > maxBytes);
            } catch (error) {
                if (!tracks) throw error;
                useTracks = true;
            }
        }
        if (useTracks) {
            await rm(input, { force: true });
            await stagePostTracks(tracks, input, directory, maxBytes, ffmpeg, options);
        }
    } else {
        const execution = runFile(ytDlp, [
            '--ignore-config', '--no-cache-dir', '--no-plugin-dirs', '--use-extractors', link.extractor,
            '--skip-playlist-after-errors', '1', '--no-playlist', '--playlist-items', '1',
            '--no-progress', '--socket-timeout', '10', '--retries', '0', '--extractor-retries', '0',
            '--limit-rate', '4M',
            '--print', 'pre_process:HKTRPG_VIDEO %(duration)j %(is_live)j', '--no-simulate',
            '--match-filter', `!is_live & duration <=? ${MAX_DURATION}`, '--max-filesize', String(MAX_SOURCE_BYTES),
            ...ffmpegArgs, '--format-sort', 'res:720', '--format', `${singleFormat}/${videoFormat}+${audioFormat}/${videoFormat}`,
            '--merge-output-format', 'mp4', '--output', input, '--', link.url,
        ], { ...options, timeout: 45_000 });
        const { stdout } = await watchVideoDownload(execution, directory).catch(error => {
            checkDownloaderMetadata(error.stdout);
            if (/Requested format is not available/i.test(error.stderr ?? '')) {
                throw new VideoRequestError(`來源沒有符合下載條件的 MP4 版本（來源上限 ${MAX_SOURCE_BYTES / MIB} MiB）。請試較小的影片或原始公開連結。`);
            }
            throw error;
        });
        checkDownloaderMetadata(stdout);
    }
    const source = await stat(input).catch(error => {
        if (error.code !== 'ENOENT') throw error;
        throw new VideoRequestError(`來源沒有提供可下載的 MP4 版本。請確認貼文公開，並試用 ${MAX_SOURCE_BYTES / MIB} MiB 以下的影片。`);
    });
    if (!source.isFile() || source.size === 0) throw new VideoRequestError('來源影片檔案為空，請試另一段可播放的公開影片。');
    if (source.size > MAX_SOURCE_BYTES) {
        throw new VideoRequestError(`來源影片為 ${(source.size / MIB).toFixed(1)} MiB，超過 ${MAX_SOURCE_BYTES / MIB} MiB 上限。請試較小的影片。`);
    }
    const { video, audio, duration } = await probeVideo(input, ffprobe, options);
    const transcode = source.size + 65_536 > maxBytes || video.codec_name !== 'h264' || (audio && audio.codec_name !== 'aac');
    let encoding = ['-c', 'copy'];
    if (transcode) {
        const [frames, seconds] = String(video.avg_frame_rate).split('/').map(Number);
        const frameRate = frames / seconds;
        const { width, height } = video;
        if (duration > MAX_TRANSCODE_DURATION) {
            throw new VideoRequestError(`這段影片需要轉檔，但片長約 ${formatVideoDuration(duration)}。轉檔上限為 ${formatVideoDuration(MAX_TRANSCODE_DURATION)}，${maxBytes / MIB} MiB 以下也需使用相容的 H.264／AAC 格式才能直接處理。`);
        }
        if (!(width > 0 && height > 0 && width * height <= 1920 * 1080) || Math.max(width, height) > 1920) {
            throw new VideoRequestError('這段影片需要轉檔，但解像度不符合 1080p 或等效畫面大小的上限。請試較低解像度的版本。');
        }
        if (!(frameRate > 0 && frameRate <= MAX_TRANSCODE_FPS)) {
            throw new VideoRequestError(`這段影片需要轉檔，但幀率無法確認或超過 ${MAX_TRANSCODE_FPS} fps。請試幀率較低的版本。`);
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
    const args = [
        '-nostdin', '-v', 'error', '-max_alloc', String(64 * MIB), '-filter_threads', '1', '-threads', '1',
        '-protocol_whitelist', 'file,pipe', '-f', 'mov', '-i', input,
        '-map', '0:v:0', '-map', '0:a:0?', ...encoding,
        '-movflags', '+faststart', '-fs', String(maxBytes), output,
    ];
    const execution = runFile(ffmpeg, args, { ...options, timeout: transcode ? 30_000 : 10_000 });
    if (transcode && execution.child?.pid) {
        try {
            setPriority(execution.child.pid, constants.priority.PRIORITY_BELOW_NORMAL);
        } catch (error) {
            execution.child.kill('SIGKILL');
            await execution.catch(() => {});
            throw error;
        }
    }
    await execution;
    const file = await stat(output);
    if (!file.isFile() || file.size === 0) throw new VideoRequestError('影片處理未能產生可上傳的檔案，請試另一段公開影片。');
    if (file.size > maxBytes) {
        throw new VideoRequestError(`處理後的影片超過本平台 ${maxBytes / MIB} MiB 附件上限。請試較小的影片。`);
    }
    const ready = await probeVideo(output, ffprobe, options);
    if (ready.duration < duration - 0.5) {
        throw new VideoRequestError(`處理後的影片只有約 ${formatVideoDuration(ready.duration)}，原片約 ${formatVideoDuration(duration)}。請試較短或較小的影片，本平台的附件上限為 ${maxBytes / MIB} MiB。`);
    }
    return { file: output, dimensions: videoDisplayDimensions(ready.video) };
}

function sanitizeSocialVideoLogText(value, maxLength = 400) {
    return String(value || '')
        .replaceAll(/[\r\n\t]+/g, ' ')
        .replaceAll(/https?:\/\/(?:[^@\s/]+@)?[^\s/]+[^\s]*/gi, '[url]')
        .trim()
        .slice(0, maxLength);
}

function socialVideoTarget(link) {
    const target = link?.url;
    if (!target) return;
    try {
        const url = new URL(target);
        return `${url.hostname}${url.pathname}`;
    } catch {
        return;
    }
}

function socialVideoFailureDetails({ platform, stage, link, groupId, userId, error, reply }) {
    const status = Number(error?.error_code || error?.status);
    const output = error?.stderr ?? error?.stdout;
    const command = typeof error?.cmd === 'string' ? error.cmd.split(/[/\\]/).pop() : undefined;
    const details = {
        platform,
        stage,
        reply,
        extractor: link?.extractor,
        target: socialVideoTarget(link),
        groupId: groupId ? String(groupId) : undefined,
        userId,
        code: error?.code,
        status: Number.isFinite(status) && status > 0 ? status : undefined,
        name: error?.name,
        message: sanitizeSocialVideoLogText(error?.message || error),
        command,
        killed: error?.killed || undefined,
        signal: error?.signal || undefined,
    };
    if (typeof output === 'string' && output.trim()) {
        details.detail = sanitizeSocialVideoLogText(output);
    }
    return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined && value !== ''));
}

const failureMessages = {
    groupDisabled: '這個群組尚未啟用 .video，請群組管理員檢查影片功能設定。',
    dmDisabled: '此 bot 尚未啟用私訊影片功能。',
    link: '請在 .video 後貼上支援的公開貼文連結，或用 .video 回覆含有連結的訊息。',
    reference: '未能從原訊息讀到支援的公開連結，請直接輸入 .video <完整連結>。',
    threads: 'Threads 媒體擷取尚未啟用。',
    busy: 'Bot 正在處理另一段影片，一次只處理一個請求。請等完成後再試。',
    quota: '今天的影片額度已用完，香港時間午夜重設。',
    capacity: '伺服器目前資源不足，請稍後再試或貼較小的影片。',
    empty: '主貼文沒有可取得的影片或圖片。',
    scratch: '媒體暫存位置不可用。伺服器需要可寫入的暫存目錄及足夠空間（Linux 至少 62 MiB，Windows 至少 64 MiB）。',
    download: `來源未提供可用的媒體，或伺服器未能處理來源檔案。請試原始公開連結，影片須在 ${MAX_DURATION / 60} 分鐘及 ${MAX_SOURCE_BYTES / MIB} MiB 以內。`,
    attachment: '伺服器未能讀取已處理的媒體檔案，請稍後再試。',
    upload: '媒體上傳失敗或逾時。請確認 bot 可以傳送附件，再稍後重試。',
    service: '影片功能暫時無法使用，請稍後再試。',
};

function videoErrorMessage(error, stage, fallback) {
    if (error instanceof VideoRequestError) return error.message;
    if (stage !== 'download' && stage !== 'upload') return failureMessages[fallback];

    if (error.code === 'ENOENT' && error.syscall?.startsWith('spawn ')) {
        return '本機或伺服器無法啟動所需的媒體工具。請管理員檢查 yt-dlp、FFmpeg 和 FFprobe 的安裝。';
    }
    if (error.code === 'SOCIAL_VIDEO_FETCH_LIMIT') {
        return `來源資料超過本次 ${Number((error.limit / MIB).toFixed(2))} MiB 讀取上限。請試較小的媒體。`;
    }
    const status = Number(error.error_code || error.status);
    const service = stage === 'upload' ? '聊天平台' : '來源平台';
    if (Number.isInteger(status) && status >= 400 && status < 600) {
        if (status === 401 || status === 403) {
            return stage === 'upload'
                ? `聊天平台拒絕上傳（HTTP ${status}）。請檢查 Bot 有冇傳送附件嘅權限。`
                : `來源平台拒絕存取（HTTP ${status}）。請確認貼文可以在未登入時公開開啟。`;
        }
        if (status === 429) return `${service}暫時限制請求（HTTP 429）。請稍後再試。`;
        return `${service}回傳 HTTP ${status}，未能${stage === 'upload' ? '上傳附件' : '取得媒體'}。請稍後再試或使用另一個公開連結。`;
    }
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.cause?.code === 'ETIMEDOUT') {
        return stage === 'upload' ? '上傳附件逾時，請稍後再試。' : '讀取或下載來源媒體逾時，請稍後再試或使用較短較小的影片。';
    }
    if (stage === 'download' && error.killed) {
        return '下載或轉檔程序超過處理時間或暫存限制而停止。請試較短、較小的影片。';
    }
    return failureMessages[fallback];
}

/**
 * Use group quota first. A non-VIP group can use the sender's personal quota.
 * A bare command can lazily resolve the replied message's text and link URLs.
 * The upload callback must finish before it resolves, since the file is then removed.
 */
async function handleSocialVideo({
    platform, groupId, userId, commandBotName, linkPromptReply, text, urls, getRepliedMessage, promptForLink,
    sendMedia, sendText, deleteCommand,
}) {
    const config = platforms[platform];
    const actor = String(userId || '');
    if (!config || !/^\d+$/.test(actor)) return;
    const allEnabled = isEnvEnabled('SOCIAL_VIDEO_ENABLED');
    if (process.env.SOCIAL_VIDEO_ENABLED !== undefined && !allEnabled) return;
    const matchedCommand = /^(?:\.video|\/video(?:@(\w+))?)(?=[\s\p{Default_Ignorable_Code_Point}]|$)/iu.exec(text || '');
    if (matchedCommand?.[1] && matchedCommand[1].toLowerCase() !== commandBotName?.toLowerCase()) return;
    const telegram = platform === 'Telegram';
    if (!matchedCommand && !(telegram && linkPromptReply)) return;

    const reply = async message => {
        try {
            await sendText(message);
        } catch {
            // The chat platform may reject a status message.
        }
    };
    let disabledMessage;
    if (!allEnabled) {
        if (groupId) {
            const configured = process.env[config.groups]?.split(',').some(group => group.trim() === String(groupId));
            if (!configured && !isEnvEnabled('SOCIAL_VIDEO_GROUP_COMMAND_ENABLED')) {
                disabledMessage = failureMessages.groupDisabled;
            }
        } else if (!isEnvEnabled('SOCIAL_VIDEO_DM_ENABLED')) {
            disabledMessage = failureMessages.dmDisabled;
        }
    }
    let link = findSocialVideoLink(text, urls);
    const bareCommand = matchedCommand && /^[\s\p{Default_Ignorable_Code_Point}]*$/u.test(text.slice(matchedCommand[0].length));
    const referenceRequested = bareCommand && getRepliedMessage;
    const needsLinkPrompt = telegram && !link && bareCommand && !referenceRequested && matchedCommand[0].startsWith('/') && promptForLink;

    let queueNotice = false;
    async function notifyQueued() {
        if (queueNotice) return;
        queueNotice = true;
        await reply('已加入影片隊列，輪到時會自動處理。');
    }

    async function acquireQueueLease() {
        let jobLease = await acquireVideoLease();
        while (!jobLease) {
            await notifyQueued();
            await delay(1000);
            jobLease = await acquireVideoLease();
        }
        return jobLease;
    }

    let leaveQueue;
    let localSlot = false;
    let lease;
    let reservation;
    let directory;
    let post;
    let attachments;
    let stage = 'eligibility';
    try {
        const { viplevelCheckGroup, viplevelCheckUser } = require('../patreon/veryImportantPerson');
        const groupLevel = groupId ? await viplevelCheckGroup(String(groupId), platform) : 0;
        const groupVip = groupLevel >= 1;
        const level = groupVip ? groupLevel : await viplevelCheckUser(actor, platform);
        if (!(level >= 1)) return;
        stage = 'service';
        if (disabledMessage) return await reply(disabledMessage);
        if (!link && !referenceRequested && !needsLinkPrompt) return await reply(failureMessages.link);
        if (needsLinkPrompt) {
            await promptForLink().catch(() => reply(failureMessages.link));
            return;
        }
        if (!link) {
            stage = 'reference';
            const original = await getRepliedMessage();
            link = findSocialVideoLink(original?.text, original?.urls);
            if (!link) return await reply(failureMessages.reference);
            stage = 'service';
        }
        if (link.extractor === 'threads' && !allEnabled && !isEnvEnabled('SOCIAL_VIDEO_THREADS_ENABLED')) {
            await reply(failureMessages.threads);
            return;
        }
        const recipient = {
            platform, scope: groupVip ? 'group' : 'user', id: groupVip ? String(groupId) : actor, userId: actor,
        };
        if (telegram) {
            const limit = Math.min(4, Math.floor(level)) * 3;
            const ticket = enqueueTelegramVideo(`${recipient.scope}:${recipient.id}`, limit);
            if (!ticket) return await reply(`影片隊列已滿。VIP LV ${level} 最多可以等候 ${limit} 條請求。`);
            if (ticket.waiting) void notifyQueued();
            leaveQueue = await ticket.turn;
            while (active) await delay(250);
        } else if (active || servingTelegramQueue) {
            return await reply(failureMessages.busy);
        }
        active = true;
        localSlot = true;
        lease = telegram ? await acquireQueueLease() : await acquireVideoLease();
        if (!lease) return await reply(failureMessages.busy);
        stage = 'scratch';
        directory = await createVideoScratch();
        stage = 'service';
        if (!await hasVideoCapacity()) return await reply(failureMessages.capacity);
        reservation = await reserveVideoQuota(lease, recipient);
        while (telegram && reservation.reason === 'cooldown') {
            await lease.release();
            lease = undefined;
            await notifyQueued();
            await delay(Math.max(1, reservation.retryAt - Date.now()));
            lease = await acquireQueueLease();
            reservation = await reserveVideoQuota(lease, recipient);
        }
        if (reservation.reason === 'cooldown') {
            const seconds = Math.ceil((reservation.retryAt - Date.now()) / 1000);
            const message = seconds > 0
                ? `影片請求太頻繁，請等 ${seconds} 秒再試。`
                : '影片請求的冷卻時間已結束，可以再試。';
            await reply(message);
            return;
        }
        if (reservation.reason) {
            await reply(failureMessages[reservation.reason]);
            return;
        }
        stage = 'download';
        post = await resolveShareLink(link);
        const primary = await readPrimaryMedia(post, config.maxBytes).catch(error => {
            // Video routes on Instagram retain the existing downloader for provider layout changes.
            if (post.extractor === 'instagram.*' && /\/reel\//.test(new URL(post.url).pathname)) return null;
            throw error;
        });
        if (primary?.kind === 'empty' || primary?.kind === 'unavailable'
            || (post.extractor === 'threads' && !primary?.url && !primary?.tracks && primary?.kind !== 'images')) {
            if (reservation?.refund) await reservation.refund().catch(() => console.warn('[Social video] Could not refund video quota'));
            await reply(primary?.kind === 'empty' ? failureMessages.empty : failureMessages.download);
            return;
        }
        attachments = primary?.kind === 'images'
            ? await downloadPostImages(primary.urls, directory)
            : [{
                ...await downloadSocialVideo(post, directory, config.maxBytes, primary),
                name: 'social-video.mp4',
                contentType: 'video/mp4',
            }];
        stage = 'upload';
        await sendMedia({ attachments, url: link.url });
        try {
            if (matchedCommand) await deleteCommand?.();
        } catch (error) {
            // Delivery succeeded. A missing permission or a stale command does not affect the upload.
            console.warn('[Social video] Could not delete the delivered command', { platform, status: error?.status ?? error?.error_code });
        }
    } catch (error) {
        if (stage === 'upload' && (error instanceof VideoAttachmentReadError
            || (['open', 'read'].includes(error?.syscall) && attachments.some(({ file }) => file === error.path)))) {
            stage = 'attachment';
        }
        const status = Number(error?.error_code || error?.status);
        if (reservation?.refund) {
            const keepUpload = stage === 'upload' && !(status >= 400 && status < 500);
            await reservation.refund({ keepUpload }).catch(() => console.warn('[Social video] Could not refund video quota'));
        }
        // The downloader and API errors may contain user links or request credentials.
        const replyKey = error?.code === 'SOCIAL_VIDEO_CAPACITY' ? 'capacity' : stage;
        console.warn('[Social video] request failed', socialVideoFailureDetails({
            platform, stage, link: post || link, groupId, userId: actor, error, reply: replyKey,
        }));
        if (stage !== 'eligibility') await reply(videoErrorMessage(error, stage, replyKey));
    } finally {
        try {
            if (directory) await rm(directory, { recursive: true, force: true });
        } catch (cleanupError) {
            console.warn('[Social video] Could not remove temporary files', {
                message: sanitizeSocialVideoLogText(cleanupError?.message),
                code: cleanupError?.code,
            });
        } finally {
            if (lease) await lease.release().catch(() => console.warn('[Social video] Could not release video slot'));
            if (localSlot) active = false;
            leaveQueue?.();
        }
    }
}

function formatSocialVideoSuccess(mention, url) {
    return `${mention} : 已下載 ${url}`;
}

module.exports = { findSocialVideoLink, formatSocialVideoSuccess, handleSocialVideo, VideoAttachmentReadError };
