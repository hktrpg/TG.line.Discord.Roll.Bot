"use strict";

/** @typedef {'unknown' | 'up' | 'down'} LinkState */

/** @type {LinkState} */
let state = 'unknown';
/** @type {ReturnType<typeof setInterval> | null} */
let monitorTimer = null;
let probeInFlight = false;

const DEFAULT_MONITOR_MS = 30_000;

function getState() {
	return state;
}

function resetConnectionStatus() {
	state = 'unknown';
	stopConnectionMonitor();
}

/**
 * Edge-triggered: log only when leaving non-up.
 * @param {{ url?: string, detail?: string, logger?: Console }} [meta]
 * @returns {boolean} true if state changed
 */
function markWorkerUp(meta = {}) {
	if (state === 'up') return false;
	const prev = state;
	state = 'up';
	const log = meta.logger || console;
	const info = typeof log.info === 'function' ? log.info.bind(log) : log.log.bind(log);
	info(
		`[RollWorkerLink] CONNECTED`
		+ (meta.url ? ` | ${meta.url}` : '')
		+ (meta.detail ? ` | ${meta.detail}` : '')
		+ ` | was=${prev}`
	);
	return true;
}

/**
 * Edge-triggered: log only when leaving non-down.
 * @param {{ url?: string, reason?: string, logger?: Console }} [meta]
 * @returns {boolean} true if state changed
 */
function markWorkerDown(meta = {}) {
	if (state === 'down') return false;
	const prev = state;
	state = 'down';
	const log = meta.logger || console;
	const warn = typeof log.warn === 'function' ? log.warn.bind(log) : log.log.bind(log);
	warn(
		`[RollWorkerLink] DISCONNECTED`
		+ (meta.url ? ` | ${meta.url}` : '')
		+ (meta.reason ? ` | ${meta.reason}` : '')
		+ ` | was=${prev}`
	);
	return true;
}

/**
 * Probe /health once and update link state.
 * @param {{ healthFn: () => Promise<object>, getUrl: () => string, logger?: Console }} deps
 */
async function probeWorkerLink(deps) {
	if (probeInFlight) return getState();
	probeInFlight = true;
	const url = deps.getUrl();
	try {
		const data = await deps.healthFn();
		const auth = data?.auth || (data?.ok ? 'ok' : 'unknown');
		markWorkerUp({
			url,
			detail: `health ok | auth=${auth}`,
			logger: deps.logger,
		});
	} catch (error) {
		markWorkerDown({
			url,
			reason: error?.message || String(error),
			logger: deps.logger,
		});
	} finally {
		probeInFlight = false;
	}
	return getState();
}

/**
 * Immediate probe + periodic health checks (unref'd so it won't block exit).
 * @param {{ healthFn: () => Promise<object>, getUrl: () => string, intervalMs?: number, logger?: Console }} deps
 */
function startConnectionMonitor(deps) {
	if (monitorTimer) return;
	const intervalMs = Number.isFinite(deps.intervalMs) && deps.intervalMs > 0
		? deps.intervalMs
		: DEFAULT_MONITOR_MS;

	const tick = () => {
		probeWorkerLink(deps).catch(() => { /* markWorkerDown already logged */ });
	};
	tick();
	monitorTimer = setInterval(tick, intervalMs);
	if (typeof monitorTimer.unref === 'function') {
		monitorTimer.unref();
	}
}

function stopConnectionMonitor() {
	if (monitorTimer) {
		clearInterval(monitorTimer);
		monitorTimer = null;
	}
	probeInFlight = false;
}

module.exports = {
	DEFAULT_MONITOR_MS,
	getState,
	resetConnectionStatus,
	markWorkerUp,
	markWorkerDown,
	probeWorkerLink,
	startConnectionMonitor,
	stopConnectionMonitor,
};
