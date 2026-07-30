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

	let localLifecycle = null;
	try {
		localLifecycle = require('../roll-worker/local-worker');
	} catch {
		localLifecycle = null;
	}

	const remoteConfigured = Boolean(rollWorkerClient?.isEnabled?.());
	const localConfigured = Boolean(rollWorkerClient?.isLocalEnabled?.());
	const primaryStopped = Boolean(localLifecycle?.isPrimaryStopped?.());
	const standbyStopped = Boolean(localLifecycle?.isStandbyStopped?.());
	const remoteOnEffective = remoteConfigured && !primaryStopped;
	const localOnEffective = localConfigured && !standbyStopped;

	if (!onWorker && remoteConfigured && typeof rollWorkerClient.health === 'function') {
		if (primaryStopped) {
			lines.push(t('admin.state_report.version_worker', {
				display: t('admin.state_report.version_stopped'),
				link: 'stopped',
			}));
		} else {
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
	}

	if (!onWorker && localConfigured && typeof rollWorkerClient.healthAt === 'function') {
		if (standbyStopped) {
			lines.push(t('admin.state_report.version_local', {
				display: t('admin.state_report.version_stopped'),
			}));
		} else {
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
	}

	let parseMode = 'embedded';
	if (remoteOnEffective && localOnEffective) parseMode = 'hybrid';
	else if (remoteOnEffective || onWorker) parseMode = 'primary';

	lines.push(t('admin.state_report.version_parse', {
		mode: parseMode,
		standby: localOnEffective ? 'on' : (standbyStopped ? 'stopped' : 'off'),
	}));

	return lines;
}

module.exports = {
	buildStateVersionSection,
};
