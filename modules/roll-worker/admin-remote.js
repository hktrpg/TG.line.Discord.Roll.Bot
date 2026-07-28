"use strict";

/**
 * Shared classifier: which admin/root/patreon subs need live Discord on Roll Worker.
 * Kept outside roll/z_admin.js so Jest can unit-test without loading deploy-commands top-level return.
 */

const os = require('node:os');
const v8 = require('node:v8');

/** .admin subs that need Gateway unless meta is prefetched. */
const ADMIN_LIVE_SUBS = new Set([
	'clusterhealth',
]);

/**
 * .root subs that need live Discord unless meta is prefetched.
 * mem / importpatreon / fixshard / slash deploy use meta; respawn* uses clusterIpc.
 */
const ROOT_LIVE_SUBS = new Set([
	'removeslashcommands',
	'registeredglobal',
	'testregistered',
	'fixshard',
]);

/**
 * @param {string} mainMsg0
 * @param {string} mainMsg1
 * @param {{
 *   clusterHealthMeta?: object,
 *   clusterMemMeta?: object,
 *   csvAttachmentMeta?: object,
 *   fixShardMeta?: object,
 *   slashDeployMeta?: object,
 * }} [meta]
 */
function adminSubNeedsLiveDiscord(mainMsg0, mainMsg1, meta = {}) {
	const cmd = String(mainMsg0 || '').toLowerCase();
	const sub = String(mainMsg1 || '').toLowerCase();
	if (cmd === '.admin') {
		if (sub === 'clusterhealth') {
			return !meta.clusterHealthMeta?.healthReport;
		}
		return ADMIN_LIVE_SUBS.has(sub);
	}
	if (cmd === '.patreon') {
		return false;
	}
	if (cmd === '.root') {
		if (!sub || sub === 'help') return false;
		if (sub === 'mem') {
			return !Array.isArray(meta.clusterMemMeta?.rows);
		}
		if (sub === 'importpatreon') {
			return !meta.csvAttachmentMeta?.url;
		}
		if (sub === 'fixshard') {
			return !meta.fixShardMeta?.action;
		}
		if (sub === 'registeredglobal' || sub === 'testregistered' || sub === 'removeslashcommands') {
			return !meta.slashDeployMeta?.text;
		}
		// respawn / respawnall → Worker returns clusterIpc; Gateway applies.
		if (sub === 'respawn' || sub === 'respawnall') {
			return false;
		}
		return ROOT_LIVE_SUBS.has(sub);
	}
	return true;
}

/**
 * Collect serializable cluster health snapshot on Discord Gateway.
 * @returns {object|null}
 */
function collectClusterHealthMeta() {
	try {
		if (typeof globalThis.getClusterHealthReport !== 'function') {
			return null;
		}
		const healthReport = globalThis.getClusterHealthReport();
		if (!healthReport || healthReport.error || !Array.isArray(healthReport.clusters)) {
			return null;
		}
		const dbProtectionLayer = require('../db/protection-layer.js');
		const clusterProtection = require('../runtime/cluster-protection.js');
		return {
			healthReport,
			dbStatus: dbProtectionLayer.getStatusReport(),
			clusterProtectionStatus: clusterProtection.getStatusReport(),
		};
	} catch (error) {
		console.warn('[AdminRemote] collectClusterHealthMeta failed:', error?.message || error);
		return null;
	}
}

/**
 * Collect per-cluster memory rows on Discord Gateway (broadcastEval).
 * @param {object} discordClient
 * @returns {Promise<object|null>}
 */
async function collectClusterMemMeta(discordClient) {
	if (!discordClient?.cluster) return null;
	try {
		const clusterProtection = require('../runtime/cluster-protection.js');
		const results = await clusterProtection.safeBroadcastEval(
			discordClient,
			(client) => {
				const v8mod = require('node:v8');
				const mem = process.memoryUsage();
				const heapStats = v8mod.getHeapStatistics();
				return {
					clusterId: (client.cluster && client.cluster.id != null) ? client.cluster.id : -1,
					rss: mem.rss,
					heapUsed: mem.heapUsed,
					heapTotal: mem.heapTotal,
					external: mem.external,
					heapSizeLimit: heapStats.heap_size_limit,
					uptime: Math.floor(process.uptime()),
				};
			},
			{ timeout: 10_000 }
		);
		const rows = (Array.isArray(results) ? results : [results])
			.filter(Boolean)
			.sort((a, b) => a.clusterId - b.clusterId);
		if (rows.length === 0) return null;
		return {
			rows,
			hostTotal: os.totalmem(),
			hostFree: os.freemem(),
			heapSizeLimit: rows[0].heapSizeLimit || v8.getHeapStatistics().heap_size_limit,
		};
	} catch (error) {
		console.warn('[AdminRemote] collectClusterMemMeta failed:', error?.message || error);
		return null;
	}
}

/**
 * Prefetch CSV attachment for .root importpatreon.
 * @param {object} discordMessage
 * @returns {object|null}
 */
function prefetchCsvAttachment(discordMessage) {
	try {
		if (!discordMessage?.attachments?.size) return null;
		const attachments = [...discordMessage.attachments.values()];
		const csv = attachments.find((a) => (a.name || '').toLowerCase().endsWith('.csv'));
		if (!csv?.url) return null;
		return {
			url: csv.url,
			name: csv.name || 'import.csv',
			size: csv.size || 0,
			contentType: csv.contentType || '',
		};
	} catch (error) {
		console.warn('[AdminRemote] prefetchCsvAttachment failed:', error?.message || error);
		return null;
	}
}

/**
 * Run fixshard side-effects / reads on Discord Gateway, return serializable meta for Worker.
 * @param {string} action
 * @returns {Promise<object|null>}
 */
async function collectFixShardMeta(action) {
	const act = String(action || '').toLowerCase();
	if (!act) return null;
	try {
		if (act === 'check') {
			if (typeof globalThis.checkShardHealth !== 'function') return null;
			const report = await globalThis.checkShardHealth();
			return { action: 'check', report };
		}
		if (act === 'status') {
			if (typeof globalThis.getShardFixStatus !== 'function') return null;
			return { action: 'status', status: globalThis.getShardFixStatus() };
		}
		if (act === 'start') {
			if (typeof globalThis.startShardFix !== 'function') return null;
			return { action: 'start', result: globalThis.startShardFix() };
		}
		if (act === 'stop') {
			if (typeof globalThis.stopShardFix !== 'function') return null;
			return { action: 'stop', result: globalThis.stopShardFix() };
		}
		return { action: act, invalid: true };
	} catch (error) {
		console.warn('[AdminRemote] collectFixShardMeta failed:', error?.message || error);
		return null;
	}
}

/**
 * Run slash deploy on Discord Gateway (needs DISCORD_CHANNEL_SECRET), return text for Worker.
 * @param {{ action: string, targetId?: string, locale?: string }} opts
 * @returns {Promise<object|null>}
 */
async function collectSlashDeployMeta({ action, targetId, locale } = {}) {
	const act = String(action || '').toLowerCase();
	if (!act) return null;
	try {
		const deploy = require('../discord/deploy-commands.js');
		if (!deploy || typeof deploy.registeredGlobalSlashCommands !== 'function') {
			return null;
		}
		if (act === 'registeredglobal') {
			const text = await deploy.registeredGlobalSlashCommands(locale);
			return text ? { text: String(text) } : null;
		}
		if (act === 'testregistered') {
			if (!targetId || typeof deploy.testRegisteredSlashCommands !== 'function') return null;
			const text = await deploy.testRegisteredSlashCommands(targetId, locale);
			return text ? { text: String(text) } : null;
		}
		if (act === 'removeslashcommands') {
			if (!targetId || typeof deploy.removeSlashCommands !== 'function') return null;
			const text = await deploy.removeSlashCommands(targetId, locale);
			return text ? { text: String(text) } : null;
		}
		return null;
	} catch (error) {
		console.warn('[AdminRemote] collectSlashDeployMeta failed:', error?.message || error);
		return null;
	}
}

module.exports = {
	adminSubNeedsLiveDiscord,
	ADMIN_LIVE_SUBS,
	ROOT_LIVE_SUBS,
	collectClusterHealthMeta,
	collectClusterMemMeta,
	prefetchCsvAttachment,
	collectFixShardMeta,
	collectSlashDeployMeta,
};
