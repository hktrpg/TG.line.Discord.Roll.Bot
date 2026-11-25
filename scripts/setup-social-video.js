'use strict';

const { execFile } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createWriteStream } = require('node:fs');
const { chmod, copyFile, link, mkdir, mkdtemp, readdir, rename, rm } = require('node:fs/promises');
const { dirname, join } = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { promisify } = require('node:util');
const extractZip = require('extract-zip');
const { bundledTools, getVideoExecutables, isExecutable, toolTarget, ytDlpVersion } = require('../modules/chat/social-video-tools');

const runFile = promisify(execFile);
const commandOptions = { timeout: 15_000, windowsHide: true };

function isInstalled({ ytDlp, ffmpeg, ffprobe }) {
    return [ytDlp, ffmpeg, ffprobe].every(isExecutable);
}

async function fetchYtDlp(target, archive) {
    const url = `https://github.com/yt-dlp/yt-dlp/releases/download/${ytDlpVersion}/${target.file}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    const maxBytes = 80 * 1024 * 1024;
    if (!response.ok || !response.body || Number(response.headers.get('content-length')) > maxBytes) {
        await response.body?.cancel();
        throw new Error(`Cannot download ${target.file} (HTTP ${response.status})`);
    }
    const hash = createHash('sha256');
    let size = 0;
    async function* verifyChunks(chunks) {
        for await (const chunk of chunks) {
            size += chunk.length;
            if (size > maxBytes) throw new Error('yt-dlp archive exceeded the size limit');
            hash.update(chunk);
            yield chunk;
        }
    }
    await pipeline(Readable.fromWeb(response.body), verifyChunks, createWriteStream(archive, { flags: 'wx' }));
    if (hash.digest('hex') !== target.sha256) throw new Error(`SHA-256 mismatch for ${target.file}`);
}

async function locateYtDlp(root, target) {
    const name = `yt-dlp${target.extension}`;
    // Official one-directory archives contain the executable beside its _internal directory.
    if (isExecutable(join(root, name))) return root;
    for (const item of await readdir(root, { withFileTypes: true })) {
        if (item.isDirectory() && isExecutable(join(root, item.name, name))) return join(root, item.name);
    }
    throw new Error(`Expected ${name} in the yt-dlp archive`);
}

async function stageFfmpeg(packageName, destination) {
    const exported = require(packageName);
    const source = typeof exported === 'string' ? exported : exported?.path;
    if (!source) throw new Error(`${packageName} has no executable for this platform`);
    if (!isExecutable(source)) {
        // Also supports running the setup command after dependencies were installed with scripts disabled.
        const directory = dirname(require.resolve(packageName));
        await runFile(process.execPath, [join(directory, 'install.js')], {
            cwd: directory, timeout: 180_000, windowsHide: true,
        });
    }
    try {
        await link(source, destination);
    } catch (error) {
        if (!['EXDEV', 'EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
        await copyFile(source, destination);
        await chmod(destination, 0o755);
    }
}

async function checkTools({ ytDlp, ffmpeg, ffprobe }) {
    for (const [name, file, flag] of [
        ['yt-dlp', ytDlp, '--version'], ['ffmpeg', ffmpeg, '-version'], ['ffprobe', ffprobe, '-version'],
    ]) {
        const { stdout } = await runFile(file, [flag], commandOptions);
        console.log(`[Social video setup] ${name}: ${stdout.trim().split(/\r?\n/)[0]}`);
    }
}

async function installTools(target) {
    const tools = bundledTools(target);
    if (isInstalled(tools)) return tools;
    const base = dirname(tools.directory);
    await mkdir(base, { recursive: true });
    const work = await mkdtemp(join(base, '.setup-'));
    try {
        const stage = join(work, 'tools');
        await mkdir(stage);
        const archive = join(work, target.file);
        await fetchYtDlp(target, archive);
        const unpacked = join(work, 'yt-dlp-unpacked');
        await extractZip(archive, { dir: unpacked, defaultFileMode: 0o755 });
        await rename(await locateYtDlp(unpacked, target), join(stage, 'yt-dlp'));
        const ffmpeg = join(stage, `ffmpeg${target.extension}`);
        const ffprobe = join(stage, `ffprobe${target.extension}`);
        await stageFfmpeg('ffmpeg-static', ffmpeg);
        await stageFfmpeg('@derhuerst/ffprobe-static', ffprobe);
        await checkTools({ ytDlp: join(stage, 'yt-dlp', `yt-dlp${target.extension}`), ffmpeg, ffprobe });
        try {
            await rename(stage, tools.directory);
        } catch (error) {
            if (!isInstalled(tools)) throw error;
        }
        return tools;
    } finally {
        await rm(work, { recursive: true, force: true });
    }
}

async function run(mode) {
    if (mode === '--check') {
        require('dotenv').config({ quiet: true, override: true });
        await checkTools(getVideoExecutables());
        return;
    }
    try {
        const target = toolTarget();
        if (!target) throw new Error(`No bundled tools for ${process.platform}/${process.arch}`);
        await installTools(target);
    } catch (error) {
        if (mode !== 'postinstall') throw error;
        console.warn(`[Social video setup] ${error.message}. Run yarn setup:social-video to retry.`);
    }
}

if (require.main === module) {
    run(process.argv[2]).catch(error => {
        console.error(`[Social video setup] ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { run };
