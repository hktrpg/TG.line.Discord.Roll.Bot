'use strict';

const { EventEmitter } = require('node:events');
const { spawnSync } = require('node:child_process');
const { createProblemDebug, observeSocketProblems } = require('../modules/runtime/problem-debug');

describe('event-driven problem diagnostics', () => {
    const previousDebug = process.env.DEBUG_LOG;
    afterEach(() => {
        if (previousDebug === undefined) delete process.env.DEBUG_LOG;
        else process.env.DEBUG_LOG = previousDebug;
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    test('disabled and idle loggers emit nothing and create no timers', () => {
        jest.useFakeTimers();
        const write = jest.fn();
        createProblemDebug({ enabled: false, write })('failure', {}, new Error('bad'));
        createProblemDebug({ enabled: true, write });
        jest.advanceTimersByTime(600_000);
        expect(write).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    test('repeated errors are counted only on the next event after the window', () => {
        let at = 1000;
        const write = jest.fn();
        const log = createProblemDebug({ enabled: true, write, now: () => at });
        const error = new Error('Opening handshake has timed out');
        log('socket', { clusterId: 1 }, error);
        log('socket', { clusterId: 1 }, error);
        expect(write).toHaveBeenCalledTimes(1);
        at += 60_000;
        log('socket', { clusterId: 1 }, error);
        const record = JSON.parse(write.mock.calls[1][0].replace('[ProblemDebug] ', ''));
        expect(record.suppressed).toBe(1);
        expect(record.error.category).toBe('websocket_handshake_timeout');
    });

    test('does not dump arbitrary errors, request payloads or credentials', () => {
        const write = jest.fn();
        const log = createProblemDebug({ enabled: true, write });
        const error = new Error('private message Bearer secret-value');
        error.stack += '\n at https://user:password@example.com/path?token=secret';
        log('failed', { request: { token: 'secret' }, source: 'token=secret' }, error);
        const line = write.mock.calls[0][0];
        expect(line).not.toContain('private message');
        expect(line).not.toContain('secret-value');
        expect(line).not.toContain('token=secret');
        expect(line).not.toContain('user:password');
    });

    test('websocket error observer identifies connection without consuming the error', () => {
        process.env.DEBUG_LOG = 'true';
        const output = jest.spyOn(console, 'error').mockImplementation(() => {});
        const socket = new EventEmitter();
        socket.readyState = 0;
        observeSocketProblems(socket, { role: 'test', source: 'relay', url: 'wss://user:pass@example.com/private?token=x' });
        expect(() => socket.emit('error', new Error('Opening handshake has timed out'))).toThrow();
        const line = output.mock.calls[0][0];
        expect(line).toContain('example.com');
        expect(line).not.toContain('private');
        expect(socket.listenerCount('error')).toBe(0);
    });

    test('fatal monitor records origin and leaves the real process exit nonzero', () => {
        const helper = require.resolve('../modules/runtime/problem-debug');
        const result = spawnSync(process.execPath, ['-e',
            `require(${JSON.stringify(helper)}).installFatalDebug('test-child'); throw new Error('fatal-test');`],
        { env: { ...process.env, DEBUG_LOG: 'true' }, encoding: 'utf8' });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('"event":"uncaught_exception"');
        expect(result.stderr).toContain('"origin":"uncaughtException"');
    });
});
