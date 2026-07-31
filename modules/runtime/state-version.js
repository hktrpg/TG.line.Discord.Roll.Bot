"use strict";

/**
 * Version section lines for `.admin state`.
 * On Worker: Gateway from `gatewayBuildInfo`; self = Primary; Standby via `standbyWorkerUrl` + /health.
 */

const buildInfo = require('./build-info');

/**
 * @param {(key: string, vars?: object) => string} t
 * @param {{ gatewayBuildInfo?: object | null, standbyWorkerUrl?: string | null, debug?: boolean }} [options]
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
		lines.push(
			t('admin.state_report.version_gateway', {
				display: gatewayDisplay,
			}),
			t('admin.state_report.version_worker', {
				display: self.display,
				link: 'self',
			}),
		);
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
	const primaryStopped = Boolean(localLifecycle?.isPrimaryStopped?.());
	const standbyStopped = Boolean(localLifecycle?.isStandbyStopped?.());

	const standbyUrl = (() => {
		const fromOpts = String(options.standbyWorkerUrl || '').trim().replace(/\/$/, '');
		if (fromOpts) return fromOpts;
		if (!onWorker && rollWorkerClient?.isLocalEnabled?.()) {
			return String(rollWorkerClient.getLocalConfig()?.url || '').trim().replace(/\/$/, '');
		}
		return '';
	})();
	const localConfigured = Boolean(standbyUrl);

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

	if (localConfigured && typeof rollWorkerClient?.healthAt === 'function') {
		if (standbyStopped) {
			lines.push(t('admin.state_report.version_local', {
				display: t('admin.state_report.version_stopped'),
				link: 'stopped',
			}));
		} else {
			try {
				const body = await rollWorkerClient.healthAt(standbyUrl);
				const display = body?.version?.display || '—';
				const link = body?.ok ? 'up' : 'down';
				lines.push(t('admin.state_report.version_local', { display, link }));
			} catch {
				lines.push(t('admin.state_report.version_local', {
					display: t('admin.state_report.version_unreachable'),
					link: 'down',
				}));
			}
		}
	}

	return lines;
}

module.exports = {
	buildStateVersionSection,
};
