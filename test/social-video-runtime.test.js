'use strict';

const realFs = jest.requireActual('node:fs/promises');
const { lstat, statfs } = require('node:fs/promises');
const { availableParallelism, cpus, freemem, platform, tmpdir } = require('node:os');
const { join } = require('node:path');
const { createVideoScratch, hasVideoCapacity, watchVideoDownload } = require('../modules/chat/social-video-runtime');

jest.mock('node:fs/promises', () => ({
    ...jest.requireActual('node:fs/promises'),
    lstat: jest.fn(),
    statfs: jest.fn(),
}));
jest.mock('node:os', () => ({
    ...jest.requireActual('node:os'),
    availableParallelism: jest.fn(),
    cpus: jest.fn(),
    freemem: jest.fn(),
    platform: jest.fn(),
}));
jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn().mockResolvedValue() }));

const MIB = 1024 * 1024;
const originalEnv = process.env;
let root;

beforeEach(async () => {
    root = await realFs.mkdtemp(join(tmpdir(), 'test-social-video-runtime-'));
    process.env = { ...originalEnv, SOCIAL_VIDEO_TMP_DIR: root, SOCIAL_VIDEO_WINDOWS_TEMP_ENABLED: 'false' };
    delete process.env.SOCIAL_VIDEO_ENABLED;
    platform.mockReturnValue('win32');
    lstat.mockImplementation(realFs.lstat);
    statfs.mockResolvedValue({ type: 0, bsize: MIB, blocks: 2000, bavail: 1000 });
    freemem.mockReturnValue(1024 * MIB);
    availableParallelism.mockReturnValue(2);
});

afterEach(async () => {
    process.env = originalEnv;
    await realFs.rm(root, { recursive: true, force: true });
    jest.clearAllMocks();
});

test('Windows temporary storage requires explicit opt-in and accepts a normal volume', async () => {
    await expect(createVideoScratch()).rejects.toThrow('Windows temporary video storage is disabled');
    process.env.SOCIAL_VIDEO_WINDOWS_TEMP_ENABLED = 'true';
    const directory = await createVideoScratch();
    expect(directory.startsWith(join(root, 'hktrpg-media', 'hktrpg-social-video-'))).toBe(true);
});

test('the main switch alone enables Windows temporary storage', async () => {
    process.env.SOCIAL_VIDEO_ENABLED = 'true';
    const directory = await createVideoScratch();
    expect(directory.startsWith(join(root, 'hktrpg-media', 'hktrpg-social-video-'))).toBe(true);
});

test('Windows rejects low scratch space and Linux continues to require tmpfs', async () => {
    process.env.SOCIAL_VIDEO_WINDOWS_TEMP_ENABLED = 'true';
    statfs.mockResolvedValueOnce({ type: 0, bsize: MIB, blocks: 1000, bavail: 63 });
    await expect(createVideoScratch()).rejects.toThrow('Insufficient space');
    platform.mockReturnValue('linux');
    await expect(createVideoScratch()).rejects.toThrow('Linux tmpfs');
});

test('Linux can use its existing tmpfs even if the mount is larger than 64 MiB', async () => {
    platform.mockReturnValue('linux');
    process.env.SOCIAL_VIDEO_ENABLED = 'true';
    statfs.mockResolvedValue({ type: 0x01_02_19_94, bsize: MIB, blocks: 1024, bavail: 800 });
    await expect(createVideoScratch()).resolves.toContain(join(root, 'hktrpg-social-video-'));
});

test('Windows checks memory and sampled CPU activity before encoding', async () => {
    freemem.mockReturnValueOnce(255 * MIB);
    await expect(hasVideoCapacity()).resolves.toBe(false);
    await expect(hasVideoCapacity()).resolves.toBe(true);
    cpus.mockReturnValueOnce([{ times: { idle: 100, user: 100 } }])
        .mockReturnValueOnce([{ times: { idle: 100, user: 200 } }])
        .mockReturnValueOnce([{ times: { idle: 100, user: 200 } }])
        .mockReturnValueOnce([{ times: { idle: 200, user: 200 } }]);
    await expect(hasVideoCapacity(true)).resolves.toBe(false);
    await expect(hasVideoCapacity(true)).resolves.toBe(true);
});

test.each(['win32', 'linux'])('stops a %s downloader whose temporary output grows past the guard', async system => {
    platform.mockReturnValue(system);
    const part = join(root, 'source.part');
    await realFs.writeFile(part, 'bytes');
    lstat.mockResolvedValueOnce({ isFile: () => true, size: 65 * MIB });
    let finish;
    const execution = new Promise(resolve => {
        finish = resolve;
    });
    const kill = jest.fn(finish);
    execution.child = { pid: 123, kill };
    await watchVideoDownload(execution, root);
    expect(kill).toHaveBeenCalledWith('SIGKILL');
});
