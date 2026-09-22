'use strict';

const { errorMonitor } = require('node:events');

// Event-driven diagnostics only: no polling, timers, health summaries or payloads.
function clean(value) {
    return String(value)
        .replaceAll(/(?:https?|wss?|mongodb(?:\+srv)?):\/\/[^\s)]+/gi, '[redacted-url]')
        .replaceAll(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
        .replaceAll(/\b(?:token|secret|password|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '[redacted-credential]')
        .replaceAll(/\bsk-[\w-]+/g, '[redacted-key]')
        .slice(0, 4000);
}

function createProblemDebug({ role, enabled = process.env.DEBUG_LOG === 'true',
    write = line => console.error(line), now = Date.now, windowMs = 60_000, maxKeys = 128 } = {}) {
    const seen = new Map();
    const allowed = new Set(['clusterId', 'shardId', 'childPid', 'exitCode', 'signal',
        'connectionId', 'host', 'state', 'ageMs', 'attempt', 'durationMs', 'queuedMs',
        'source', 'pending', 'origin', 'recoveryId']);
    return (event, fields = {}, error, { force = false } = {}) => {
        if (!enabled) return;
        try {
            const detail = {};
            for (const [key, value] of Object.entries(fields)) {
                if (allowed.has(key) && ['string', 'number', 'boolean'].includes(typeof value)) {
                    detail[key] = typeof value === 'string' ? clean(value) : value;
                }
            }
            const failure = error ? {
                name: clean(error.name || 'Error'), code: clean(error.code || ''),
                category: /opening handshake has timed out/i.test(error.message || '') ? 'websocket_handshake_timeout'
                    : /CLUSTERING_READY_TIMEOUT/.test(error.message || '') ? 'cluster_ready_timeout' : 'other',
                // Exclude the first stack line (it repeats arbitrary error messages).
                stack: clean(String(error.stack || '').split('\n').slice(1, 9).join('\n')),
            } : undefined;
            const at = now();
            const key = JSON.stringify([event, detail.clusterId, detail.shardId, detail.source, failure?.name, failure?.code]);
            const previous = seen.get(key);
            if (!force && previous && at - previous.at < windowMs) {
                previous.suppressed++;
                return;
            }
            if (!seen.has(key) && seen.size >= maxKeys) seen.delete(seen.keys().next().value);
            seen.set(key, { at, suppressed: 0 });
            write('[ProblemDebug] ' + JSON.stringify({ event: clean(event), role, pid: process.pid,
                timestamp: new Date(at).toISOString(), ...detail, error: failure,
                suppressed: previous?.suppressed || 0 }));
        } catch {
            // Diagnostics must never change application error/exit behavior.
        }
    };
}

function installFatalDebug(role, target = process) {
    if (process.env.DEBUG_LOG !== 'true') return;
    const debug = createProblemDebug({ role });
    const listener = (error, origin) => debug('uncaught_exception', { origin,
        clusterId: process.env.CLUSTER }, error, { force: true });
    // Observe only: do not install uncaughtException or suppress the default crash.
    target.on('uncaughtExceptionMonitor', listener);
    return () => target.removeListener('uncaughtExceptionMonitor', listener);
}

let connectionSequence = 0;
const socketLoggers = new Map();
function observeSocketProblems(socket, { role, source, url, clusterId } = {}) {
    if (process.env.DEBUG_LOG !== 'true') return;
    if (!socketLoggers.has(role)) {
        if (socketLoggers.size >= 8) socketLoggers.delete(socketLoggers.keys().next().value);
        socketLoggers.set(role, createProblemDebug({ role }));
    }
    const debug = socketLoggers.get(role);
    const connectionId = ++connectionSequence;
    const started = Date.now();
    let host = 'unknown';
    try { host = new URL(url).hostname; } catch { /* Never log the raw URL. */ }
    socket.on(errorMonitor, error => debug('websocket_error', { source, clusterId,
        connectionId, host, state: socket.readyState, ageMs: Date.now() - started }, error));
}

module.exports = { createProblemDebug, installFatalDebug, observeSocketProblems };
