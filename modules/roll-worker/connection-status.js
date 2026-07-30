"use strict";

/** @typedef {'unknown' | 'up' | 'down'} LinkState */

const DEFAULT_MONITOR_MS = 30_000;
/** Faster poll while down so a late-started Standby/Primary is noticed quickly. */
const DEFAULT_DOWN_MONITOR_MS = 5000;

/**
 * Independent link tracker (Primary and Standby each get one).
 * @param {string} tag log prefix e.g. [RollWorkerLink] / [StandbyLink]
 */
function createLinkTracker(tag) {
	/** @type {LinkState} */
	let state = 'unknown';
	/** @type {ReturnType<typeof setTimeout> | null} */
	let monitorTimer = null;
	let probeInFlight = false;
	let running = false;
	/** @type {Array<() => void>} */
	const upListeners = [];

	function onUp(listener) {
		if (typeof listener === 'function') upListeners.push(listener);
	}

	function getState() {
		return state;
	}

	function stop() {
		running = false;
		if (monitorTimer) {
			clearTimeout(monitorTimer);
			monitorTimer = null;
		}
		probeInFlight = false;
	}

	function reset() {
		state = 'unknown';
		stop();
	}

	/**
	 * @param {{ url?: string, detail?: string, logger?: Console }} [meta]
	 * @returns {boolean}
	 */
	function markUp(meta = {}) {
		if (state === 'up') return false;
		const prev = state;
		state = 'up';
		const log = meta.logger || console;
		const line = `${tag} CONNECTED`
			+ (meta.url ? ` | ${meta.url}` : '')
			+ (meta.detail ? ` | ${meta.detail}` : '')
			+ ` | was=${prev}`;
		if (prev === 'down') {
			// Recovery must stay visible even when boot CONNECTED info() is silenced.
			console.info(line);
		} else {
			const info = typeof log.info === 'function' ? log.info.bind(log) : log.log.bind(log);
			info(line);
		}
		for (const listener of upListeners) {
			try { listener(); } catch { /* ignore */ }
		}
		return true;
	}

	/**
	 * @param {{ url?: string, reason?: string, logger?: Console }} [meta]
	 * @returns {boolean}
	 */
	function markDown(meta = {}) {
		if (state === 'down') return false;
		const prev = state;
		state = 'down';
		const log = meta.logger || console;
		const warn = typeof log.warn === 'function' ? log.warn.bind(log) : log.log.bind(log);
		warn(
			`${tag} DISCONNECTED`
			+ (meta.url ? ` | ${meta.url}` : '')
			+ (meta.reason ? ` | ${meta.reason}` : '')
			+ ` | was=${prev}`
		);
		return true;
	}

	/**
	 * @param {{ healthFn: () => Promise<object>, getUrl: () => string, logger?: Console }} deps
	 */
	async function probe(deps) {
		if (probeInFlight) return getState();
		probeInFlight = true;
		const url = deps.getUrl();
		try {
			const data = await deps.healthFn();
			const auth = data?.auth || (data?.ok ? 'ok' : 'unknown');
			const gateway = data?.gateway || '';
			markUp({
				url,
				detail: `health ok | auth=${auth}`
					+ (gateway ? ` | gateway=${gateway}` : ''),
				logger: deps.logger,
			});
		} catch (error) {
			markDown({
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
	 * Immediate probe + adaptive schedule: ~5s while down/unknown, ~30s while up.
	 * @param {{ healthFn: () => Promise<object>, getUrl: () => string, intervalMs?: number, downIntervalMs?: number, logger?: Console }} deps
	 */
	function start(deps) {
		if (running) return;
		running = true;
		const upMs = Number.isFinite(deps.intervalMs) && deps.intervalMs > 0
			? deps.intervalMs
			: DEFAULT_MONITOR_MS;
		const downMs = Number.isFinite(deps.downIntervalMs) && deps.downIntervalMs > 0
			? deps.downIntervalMs
			: DEFAULT_DOWN_MONITOR_MS;

		const scheduleNext = () => {
			if (!running) return;
			const ms = (state === 'up') ? upMs : downMs;
			monitorTimer = setTimeout(() => {
				monitorTimer = null;
				probe(deps)
					.catch(() => { /* markDown already logged */ })
					.finally(scheduleNext);
			}, ms);
			if (typeof monitorTimer.unref === 'function') {
				monitorTimer.unref();
			}
		};

		probe(deps)
			.catch(() => { /* markDown already logged */ })
			.finally(scheduleNext);
	}

	return {
		getState,
		reset,
		markUp,
		markDown,
		probe,
		start,
		stop,
		onUp,
	};
}

const primary = createLinkTracker('[RollWorkerLink]');
const standby = createLinkTracker('[StandbyLink]');

function onWorkerUp(listener) {
	primary.onUp(listener);
}

function getState() {
	return primary.getState();
}

function resetConnectionStatus() {
	primary.reset();
}

function markWorkerUp(meta) {
	return primary.markUp(meta);
}

function markWorkerDown(meta) {
	return primary.markDown(meta);
}

function probeWorkerLink(deps) {
	return primary.probe(deps);
}

function startConnectionMonitor(deps) {
	primary.start(deps);
}

function stopConnectionMonitor() {
	primary.stop();
}

function getStandbyState() {
	return standby.getState();
}

function resetStandbyConnectionStatus() {
	standby.reset();
}

function markStandbyUp(meta) {
	return standby.markUp(meta);
}

function markStandbyDown(meta) {
	return standby.markDown(meta);
}

function probeStandbyLink(deps) {
	return standby.probe(deps);
}

function startStandbyConnectionMonitor(deps) {
	standby.start(deps);
}

function stopStandbyConnectionMonitor() {
	standby.stop();
}

module.exports = {
	DEFAULT_MONITOR_MS,
	DEFAULT_DOWN_MONITOR_MS,
	getState,
	resetConnectionStatus,
	markWorkerUp,
	markWorkerDown,
	probeWorkerLink,
	startConnectionMonitor,
	stopConnectionMonitor,
	onWorkerUp,
	getStandbyState,
	resetStandbyConnectionStatus,
	markStandbyUp,
	markStandbyDown,
	probeStandbyLink,
	startStandbyConnectionMonitor,
	stopStandbyConnectionMonitor,
};
