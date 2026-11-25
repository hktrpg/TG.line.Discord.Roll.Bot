'use strict';

const { lstat, mkdir, mkdtemp, readFile, readdir, rm, statfs } = require('node:fs/promises');
const { availableParallelism, cpus, freemem, loadavg, platform, tmpdir } = require('node:os');
const { isAbsolute, join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { isEnvEnabled } = require('../../utils/env-flag');

const MIB = 1024 * 1024;
const scratchPrefix = 'hktrpg-social-video-';

async function cleanScratch(root, windows) {
    const cutoff = Date.now() - 240_000;
    for (const name of await readdir(root)) {
        if (!/^hktrpg-social-video-[a-z\d]{6}$/i.test(name)) continue;
        const path = join(root, name);
        const file = await lstat(path);
        if (file.isDirectory() && (windows || file.uid === process.getuid?.()) && file.mtimeMs < cutoff) {
            await rm(path, { recursive: true, force: true });
        }
    }
}

async function createVideoScratch() {
    const system = platform();
    const windows = system === 'win32';
    const configured = process.env.SOCIAL_VIDEO_TMP_DIR;
    if (system !== 'linux' && !windows) throw new Error('Social video requires Linux or Windows');
    const windowsTempFlag = process.env.SOCIAL_VIDEO_ENABLED === undefined
        ? 'SOCIAL_VIDEO_WINDOWS_TEMP_ENABLED' : 'SOCIAL_VIDEO_ENABLED';
    if (windows && !isEnvEnabled(windowsTempFlag)) {
        throw new Error('Windows temporary video storage is disabled');
    }
    const base = configured || (windows ? tmpdir() : '/dev/shm');
    if (!isAbsolute(base)) throw new Error('Video scratch path must be absolute');
    const root = windows ? join(base, 'hktrpg-media') : base;
    if (windows) {
        // Use a dedicated scratch subdirectory inside the user's private temp directory.
        await mkdir(root, { recursive: true });
        const folder = await lstat(root);
        if (!folder.isDirectory()) throw new Error('Windows video scratch must be a directory');
    } else {
        const fs = await statfs(root);
        if (fs.type !== 0x01_02_19_94) throw new Error('Video scratch must be on Linux tmpfs');
    }
    // Reclaim scratch from crashed jobs after the shared lease has expired.
    await cleanScratch(root, windows);
    const fs = await statfs(root);
    if (fs.bavail * fs.bsize < (windows ? 64 : 62) * MIB) {
        throw new Error('Insufficient space for video scratch');
    }
    return mkdtemp(join(root, scratchPrefix));
}

function cpuTimes() {
    const totals = { idle: 0, total: 0 };
    for (const cpu of cpus()) {
        totals.idle += cpu.times.idle;
        totals.total += Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
    }
    return totals;
}

async function hasVideoCapacity(encoding = false) {
    const memoryLimit = (encoding ? 512 : 256) * MIB;
    if (platform() === 'win32') {
        if (freemem() < memoryLimit) return false;
        if (!encoding) return true;
        if (availableParallelism() < 2) return false;
        const start = cpuTimes();
        await delay(250);
        const end = cpuTimes();
        const total = end.total - start.total;
        return total > 0 && (end.idle - start.idle) / total > 0.25;
    }
    if (platform() !== 'linux') return false;
    const cores = availableParallelism();
    if (encoding && (cores < 2 || loadavg()[0] >= cores * 0.75)) return false;
    const memory = await readFile('/proc/meminfo', 'utf8');
    const available = Number(/^MemAvailable:\s+(\d+)/m.exec(memory)?.[1]) * 1024;
    if (!(available >= memoryLimit)) return false;

    const limit = await readFile('/sys/fs/cgroup/memory.max', 'utf8').catch(error => {
        if (error.code === 'ENOENT') return 'max';
        throw error;
    });
    if (limit.trim() === 'max') return true;
    const used = await readFile('/sys/fs/cgroup/memory.current', 'utf8');
    return Number(limit) - Number(used) >= (encoding ? 256 : 128) * MIB;
}

function watchVideoDownload(execution, directory) {
    if (!execution.child?.pid) return execution;
    let finished = false;
    let checking = false;
    const timer = setInterval(async () => {
        if (checking) return;
        checking = true;
        try {
            let bytes = 0;
            for (const name of await readdir(directory)) {
                const file = await lstat(join(directory, name)).catch(error => {
                    if (error.code !== 'ENOENT') throw error;
                });
                if (file?.isFile()) bytes += file.size;
            }
            if (bytes > 64 * MIB && !finished) execution.child.kill('SIGKILL');
        } catch {
            if (!finished) execution.child.kill('SIGKILL');
        } finally {
            checking = false;
        }
    }, 250);
    return execution.finally(() => {
        finished = true;
        clearInterval(timer);
    });
}

module.exports = { createVideoScratch, hasVideoCapacity, watchVideoDownload };
