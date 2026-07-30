"use strict";

/**
 * Version section lines for `.admin state`.
 * On Worker: Gateway comes from request `gatewayBuildInfo` (Gateway prefetch); self = Worker.
 */

const buildInfo = require('./build-info');

/**
 * @param {(key: string, vars?: object) => string} t
 * @param {{ gatewayBuildInfo?: object | null, debug?: boolean }} [options]
 * @returns {Promise<string[]>}
 */
async function buildStateVersionSection(t, options = {}) {
	const self = buildInfo.getPublic();
	const lines = [];
	const onWorker = process.env.ROLL_WORKER_MODE === 'true';
	const gatewayPrefetch = options.gatewayBuildInfo && typeof options.gatewayBuildInfo === 'object'
		? options.gatewayBuildInfo
		: null;

	if (onWorker) {
		const gatewayDisplay = gatewayPrefetch?.display
			|| t('admin.state_report.version_unreachable');
		lines.push(t('admin.state_report.version_gateway', {
			display: gatewayDisplay,
		}));
		lines.push(t('admin.state_report.version_worker', {
			display: self.display,
			link: 'self',
		}));
	} else {
		lines.push(t('admin.state_report.version_gateway', {
			display: self.display,
		}));
	}

	let rollWorkerClient = null;
	try {
		rollWorkerClient = require('../roll-worker/client');
	} catch (error) {
		if (options.debug) {
			console.error('[StateVersion] roll-worker client load failed:', error.message);
		}
	}

	const remoteOn = Boolean(rollWorkerClient?.isEnabled?.());
	const localOn = Boolean(rollWorkerClient?.isLocalEnabled?.());

	if (!onWorker && remoteOn && typeof rollWorkerClient.health === 'function') {
		try {
			const body = await rollWorkerClient.health();
			const display = body?.version?.display || '—';
			const link = body?.ok ? 'up' : 'down';
			lines.push(t('admin.state_report.version_worker', { display, link }));
		} catch {
			lines.push(t('admin.state_report.version_worker', {
				display: t('admin.state_report.version_unreachable'),
				link: 'down',
			}));
		}
	}

	if (!onWorker && localOn && typeof rollWorkerClient.healthAt === 'function') {
		try {
			const { url } = rollWorkerClient.getLocalConfig();
			const body = await rollWorkerClient.healthAt(url);
			const display = body?.version?.display || '—';
			lines.push(t('admin.state_report.version_local', { display }));
		} catch {
			lines.push(t('admin.state_report.version_local', {
				display: t('admin.state_report.version_unreachable'),
			}));
		}
	}

	let parseMode = 'in-process';
	if (remoteOn && localOn) parseMode = 'hybrid';
	else if (remoteOn || onWorker) parseMode = 'remote';

	lines.push(t('admin.state_report.version_parse', {
		mode: parseMode,
		local_http: localOn ? 'on' : 'off',
	}));

	return lines;
}

module.exports = {
	buildStateVersionSection,
};
