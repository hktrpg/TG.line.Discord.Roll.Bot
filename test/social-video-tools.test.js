'use strict';

const { mkdir, mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { bundledTools, getVideoExecutables, toolTarget } = require('../modules/chat/social-video-tools');

test.each([
    ['win32', 'x64', undefined, 'yt-dlp_win.zip'],
    ['linux', 'x64', 'glibc', 'yt-dlp_linux.zip'],
    ['linux', 'arm64', 'glibc', 'yt-dlp_linux_aarch64.zip'],
    ['linux', 'x64', 'musl', 'yt-dlp_musllinux.zip'],
    ['linux', 'arm64', 'musl', 'yt-dlp_musllinux_aarch64.zip'],
])('selects the pinned extractor for %s %s %s', (platform, arch, libc, file) => {
    expect(toolTarget(platform, arch, libc)).toMatchObject({ file, sha256: expect.stringMatching(/^[a-f\d]{64}$/) });
});

test('unsupported architectures can use manually configured executables', () => {
    expect(toolTarget('win32', 'arm64')).toBeNull();
    expect(getVideoExecutables({
        SOCIAL_VIDEO_YTDLP_PATH: 'override-yt-dlp',
        SOCIAL_VIDEO_FFMPEG_PATH: 'override-ffmpeg',
        SOCIAL_VIDEO_FFPROBE_PATH: 'override-ffprobe',
    })).toEqual({
        ytDlp: 'override-yt-dlp',
        ffmpeg: 'override-ffmpeg',
        ffprobe: 'override-ffprobe',
        ffmpegLocation: 'override-ffmpeg',
    });
});

test('resolves tools in the private bundle and points yt-dlp at the matching FFmpeg and FFprobe folder', async () => {
    const root = await mkdtemp(join(tmpdir(), 'test-hktrpg-media-tools-'));
    try {
        const env = { HKTRPG_SOCIAL_VIDEO_TOOLS_DIR: root };
        const tools = bundledTools(toolTarget(), env);
        expect(getVideoExecutables(env).ytDlp).toMatch(/^yt-dlp(?:\.exe)?$/);
        await mkdir(join(tools.directory, 'yt-dlp'), { recursive: true });
        await Promise.all([tools.ytDlp, tools.ffmpeg, tools.ffprobe].map(file => writeFile(file, 'tool', { mode: 0o755 })));
        expect(getVideoExecutables(env)).toEqual({
            ytDlp: tools.ytDlp, ffmpeg: tools.ffmpeg, ffprobe: tools.ffprobe, ffmpegLocation: tools.directory,
        });
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
