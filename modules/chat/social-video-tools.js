'use strict';

const { accessSync, constants, statSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');

const ytDlpVersion = '2026.11.23';
const ffmpegPackageVersion = '5.3.0';
const assets = {
    'win32-x64': ['yt-dlp_win.zip', '824860984b96ca01de09f98f7bfd74ed7bbdce72a3340b51af8b9dc5ee037a5f'],
    'linux-x64-glibc': ['yt-dlp_linux.zip', 'cc4a3aa98fb438a1dac04a6fb006fe57acbeed00fc12db9ec84e3036dbbe6ccb'],
    'linux-arm64-glibc': ['yt-dlp_linux_aarch64.zip', 'e80b05e7e7ae5e2b7ff480937b51699c733563bfa5c185a19dfceadc4e6191bf'],
    'linux-x64-musl': ['yt-dlp_musllinux.zip', '49d1bcbf58082b069225699fad480e85491ff85bb1cc63116f953eba21b890e3'],
    'linux-arm64-musl': ['yt-dlp_musllinux_aarch64.zip', '2c27b37e6ccc6b827c135ba18410094711ab7a5a66ada6efd55f37c3b8f9c35a'],
};
const root = resolve(__dirname, '../..');

function toolTarget(platform = process.platform, arch = process.arch, libc) {
    const suffix = platform === 'linux'
        ? `-${libc || (process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl')}`
        : '';
    const key = `${platform}-${arch}${suffix}`;
    if (!Object.hasOwn(assets, key)) return null;
    const [file, sha256] = assets[key];
    return { key, file, sha256, extension: platform === 'win32' ? '.exe' : '' };
}

function bundledTools(target, env = process.env) {
    const base = env.HKTRPG_SOCIAL_VIDEO_TOOLS_DIR || join(root, 'node_modules', '.cache', 'hktrpg-media-tools');
    const directory = resolve(base, target.key, `${ytDlpVersion}-ffmpeg-${ffmpegPackageVersion}`);
    return {
        directory,
        ytDlp: join(directory, 'yt-dlp', `yt-dlp${target.extension}`),
        ffmpeg: join(directory, `ffmpeg${target.extension}`),
        ffprobe: join(directory, `ffprobe${target.extension}`),
    };
}

function isExecutable(path) {
    if (!path) return false;
    try {
        accessSync(path, constants.X_OK);
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

function getVideoExecutables(env = process.env) {
    const target = toolTarget();
    const bundled = target && bundledTools(target, env);
    const extension = process.platform === 'win32' ? '.exe' : '';
    const ffmpegOverride = env.SOCIAL_VIDEO_FFMPEG_PATH;
    const probeSibling = ffmpegOverride && join(dirname(ffmpegOverride), `ffprobe${extension}`);
    const ffmpeg = ffmpegOverride || (isExecutable(bundled?.ffmpeg) ? bundled.ffmpeg : `ffmpeg${extension}`);
    return {
        ytDlp: env.SOCIAL_VIDEO_YTDLP_PATH || (isExecutable(bundled?.ytDlp) ? bundled.ytDlp : `yt-dlp${extension}`),
        ffmpeg,
        ffprobe: env.SOCIAL_VIDEO_FFPROBE_PATH
            || (isExecutable(probeSibling) && probeSibling)
            || (isExecutable(bundled?.ffprobe) ? bundled.ffprobe : `ffprobe${extension}`),
        ffmpegLocation: ffmpegOverride || (ffmpeg === bundled?.ffmpeg ? bundled.directory : undefined),
    };
}

module.exports = { bundledTools, getVideoExecutables, isExecutable, toolTarget, ytDlpVersion };
