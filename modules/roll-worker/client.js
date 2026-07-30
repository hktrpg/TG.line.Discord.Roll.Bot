"use strict";

const axios = require('axios');
const { attachGatewayAuth } = require('./request-auth');
const { ensureRollWorkerToken } = require('./ensure-token');
const {
	markWorkerUp,
	markWorkerDown,
	startConnectionMonitor,
	stopConnectionMonitor,
	probeWorkerLink,
	getState: getLinkState,
	resetConnectionStatus,
	onWorkerUp,
	startStandbyConnectionMonitor,
	stopStandbyConnectionMonitor,
	probeStandbyLink,
	getStandbyState,
	resetStandbyConnectionStatus,
} = require('./connection-status');
const deferQueue = require('./defer-queue');
const {
	getGatewayLabel,
	gatewayRequestHeaders,
} = require('./gateway-label');

let deferConnectedHooked = false;
function ensureDeferConnectedHook() {
	if (deferConnectedHooked) return;
	deferConnectedHooked = true;
	onWorkerUp(() => deferQueue.onWorkerConnected());
}

const DEFAULT_URL = 'http://127.0.0.1:3950';
// OpenAI / heavy export often exceed 30s; env still overrides.
const DEFAULT_TIMEOUT_MS = 120_000;

function noteTransportOk() {
	const { url } = getConfig();
	markWorkerUp({ url, detail: `request ok | gateway=${getGatewayLabel()}` });
}

function noteTransportDown(error) {
	const { url } = getConfig();
	markWorkerDown({
		url,
		reason: error?.message || String(error || 'unknown'),
	});
}

function getConfig() {
	// When remoting is enabled, load/generate the shared secret from .env so
	// Gateway matches Worker without manual copy-paste on a single machine.
	if ((process.env.ROLL_WORKER_URL || '').trim()
		&& process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		ensureRollWorkerToken({ generate: true });
	}
	const url = (process.env.ROLL_WORKER_URL || '').trim() || DEFAULT_URL;
	const token = (process.env.ROLL_WORKER_TOKEN || '').trim();
	const timeoutMs = Number.parseInt(process.env.ROLL_WORKER_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);
	return {
		url: url.replace(/\/$/, ''),
		token,
		timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
	};
}

/** Standby HTTP fallback (same token / timeout as Primary). */
function getLocalConfig() {
	// Ensure shared secret exists when only Standby URL is configured (SPAWN / dual-worker).
	if ((process.env.ROLL_STANDBY_URL || '').trim()
		&& process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		ensureRollWorkerToken({ generate: true });
	}
	const url = (process.env.ROLL_STANDBY_URL || '').trim().replace(/\/$/, '');
	const { token, timeoutMs } = getConfig();
	return { url, token, timeoutMs };
}

function isEnabled() {
	return Boolean((process.env.ROLL_WORKER_URL || '').trim());
}

function normalizeWorkerBaseUrl(raw) {
	return String(raw || '').trim().replace(/\/$/, '').toLowerCase();
}

function isLocalEnabled() {
	const standby = normalizeWorkerBaseUrl(process.env.ROLL_STANDBY_URL);
	if (!standby) return false;
	// Same URL as primary is useless for fallback (primary is already down).
	const primary = normalizeWorkerBaseUrl(process.env.ROLL_WORKER_URL);
	if (primary && standby === primary) return false;
	return true;
}

function toSerializableContext(params = {}) {
	return {
		inputStr: params.inputStr || '',
		groupid: params.groupid || null,
		userid: params.userid || null,
		userrole: params.userrole ?? 1,
		botname: params.botname || null,
		displayname: params.displayname || null,
		channelid: params.channelid || null,
		displaynameDiscord: params.displaynameDiscord || null,
		membercount: params.membercount || 0,
		titleName: params.titleName || '',
		tgDisplayname: params.tgDisplayname || '',
		locale: params.locale || null,
		channelType: params.channelType ?? params.discordMessage?.channel?.type ?? null,
		avatarUrl: params.avatarUrl || null,
		attachmentsMeta: Array.isArray(params.attachmentsMeta) ? params.attachmentsMeta : null,
		replyAttachmentsMeta: Array.isArray(params.replyAttachmentsMeta) ? params.replyAttachmentsMeta : null,
		replyContent: params.replyContent || null,
		storyAttachmentMeta: params.storyAttachmentMeta || null,
		storyGroupNamesMeta: params.storyGroupNamesMeta || null,
		forwardSourceMeta: params.forwardSourceMeta || null,
		chatroomChannelMeta: params.chatroomChannelMeta || null,
		exportMeta: params.exportMeta || null,
		exportHistoryMeta: params.exportHistoryMeta || null,
		clusterHealthMeta: params.clusterHealthMeta || null,
		clusterMemMeta: params.clusterMemMeta || null,
		csvAttachmentMeta: params.csvAttachmentMeta || null,
		fixShardMeta: params.fixShardMeta || null,
		slashDeployMeta: params.slashDeployMeta || null,
		skipExp: Boolean(params.skipExp),
		gatewayBuildInfo: params.gatewayBuildInfo || (
			process.env.ROLL_WORKER_MODE === 'true'
				? null
				: require('../runtime/build-info').getPublic()
		),
	};
}

/**
 * POST /v1/parse against an explicit Worker base URL.
 * @param {string} baseUrl
 * @param {object} params
 * @param {{ trackPrimaryLink?: boolean }} [options]
 */
async function parseWithUrl(baseUrl, params, options = {}) {
	const trackPrimaryLink = options.trackPrimaryLink !== false;
	const { token, timeoutMs } = getConfig();
	const url = String(baseUrl || '').replace(/\/$/, '');
	if (!url) {
		throw new Error('Roll worker URL missing');
	}
	const headers = {
		'Content-Type': 'application/json',
		...gatewayRequestHeaders({ botname: params?.botname }),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const body = attachGatewayAuth(toSerializableContext(params), token);
	let response;
	try {
		response = await axios.post(
			`${url}/v1/parse`,
			body,
			{ headers, timeout: timeoutMs, validateStatus: () => true }
		);
	} catch (error) {
		if (trackPrimaryLink) noteTransportDown(error);
		throw error;
	}

	// Transport reached Worker (even 4xx/5xx/needsLocal) — link is up.
	if (trackPrimaryLink) noteTransportOk();

	if (response.status === 503 && response.data?.needsLocal) {
		return {
			needsLocal: true,
			moduleName: response.data.moduleName || undefined,
			// Preserve worker EXPUP side-effects for gateway merge / fallback.
			LevelUp: response.data.LevelUp || '',
			statue: response.data.statue || '',
			nestedNeedsLocal: Boolean(response.data.nestedNeedsLocal),
			nestedInputStr: response.data.nestedInputStr || undefined,
			parentResult: response.data.parentResult || undefined,
		};
	}
	if (response.status < 200 || response.status >= 300) {
		const message = response.data?.error || `Roll worker HTTP ${response.status}`;
		const error = new Error(message);
		error.status = response.status;
		error.body = response.data;
		throw error;
	}
	return response.data;
}

async function parse(params) {
	const { url } = getConfig();
	return parseWithUrl(url, params, { trackPrimaryLink: true });
}

/** Hybrid fallback: parse on ROLL_STANDBY_URL (does not affect primary link monitor). */
async function parseLocal(params) {
	const { url } = getLocalConfig();
	if (!url) {
		throw new Error('ROLL_STANDBY_URL unset');
	}
	return parseWithUrl(url, params, { trackPrimaryLink: false });
}

/**
 * Loopback-only admin shutdown (Worker exits after drainMs).
 * Server rejects non-loopback callers.
 */
async function requestAdminShutdown(baseUrl, { drainMs = 500 } = {}) {
	const { token, timeoutMs } = getConfig();
	const url = String(baseUrl || '').replace(/\/$/, '');
	if (!url) {
		throw new Error('Roll worker URL missing');
	}
	const headers = {
		'Content-Type': 'application/json',
		...gatewayRequestHeaders(),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.post(
		`${url}/v1/admin/shutdown`,
		{ drainMs },
		{ headers, timeout: Math.min(timeoutMs, 10_000), validateStatus: () => true }
	);
	if (response.status < 200 || response.status >= 300) {
		const message = response.data?.error || `Roll worker shutdown HTTP ${response.status}`;
		const error = new Error(message);
		error.status = response.status;
		error.body = response.data;
		throw error;
	}
	return response.data;
}

/**
 * Loopback-only admin reload (Worker spawns successor then exits).
 */
async function requestAdminReload(baseUrl, { drainMs = 500 } = {}) {
	const { token, timeoutMs } = getConfig();
	const url = String(baseUrl || '').replace(/\/$/, '');
	if (!url) {
		throw new Error('Roll worker URL missing');
	}
	const headers = {
		'Content-Type': 'application/json',
		...gatewayRequestHeaders(),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.post(
		`${url}/v1/admin/reload`,
		{ drainMs },
		{ headers, timeout: Math.min(timeoutMs, 10_000), validateStatus: () => true }
	);
	if (response.status < 200 || response.status >= 300) {
		const message = response.data?.error || `Roll worker reload HTTP ${response.status}`;
		const error = new Error(message);
		error.status = response.status;
		error.body = response.data;
		throw error;
	}
	return response.data;
}

async function healthAt(baseUrl) {
	const { token, timeoutMs } = getConfig();
	const url = String(baseUrl || '').replace(/\/$/, '');
	const headers = { ...gatewayRequestHeaders() };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.get(`${url}/health`, {
		headers,
		timeout: Math.min(timeoutMs, 5000),
	});
	return response.data;
}

async function characterAction({ doc, item, locale, botname = 'WWW' } = {}) {
	const { url, token, timeoutMs } = getConfig();
	const headers = {
		'Content-Type': 'application/json',
		...gatewayRequestHeaders({ botname }),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const body = attachGatewayAuth({ doc, item, locale, botname }, token);
	let response;
	try {
		response = await axios.post(
			`${url}/v1/character-action`,
			body,
			{ headers, timeout: timeoutMs, validateStatus: () => true }
		);
	} catch (error) {
		noteTransportDown(error);
		throw error;
	}

	noteTransportOk();

	if (response.status < 200 || response.status >= 300) {
		const message = response.data?.error || `Roll worker HTTP ${response.status}`;
		const error = new Error(message);
		error.status = response.status;
		error.body = response.data;
		throw error;
	}
	return response.data;
}

async function health() {
	const { url, token, timeoutMs } = getConfig();
	const headers = { ...gatewayRequestHeaders() };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.get(`${url}/health`, { headers, timeout: Math.min(timeoutMs, 5000) });
	return response.data;
}

async function healthLocal() {
	const { url, token, timeoutMs } = getLocalConfig();
	if (!url) {
		throw new Error('ROLL_STANDBY_URL unset');
	}
	const headers = { ...gatewayRequestHeaders() };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.get(`${url}/health`, { headers, timeout: Math.min(timeoutMs, 5000) });
	return response.data;
}

function quietLinkLogger(logger) {
	return logger || { info() {}, warn: console.warn, error: console.error };
}

function beginLinkMonitor(options = {}) {
	if (!isEnabled()) return;
	ensureDeferConnectedHook();
	startConnectionMonitor({
		healthFn: health,
		getUrl: () => getConfig().url,
		intervalMs: options.intervalMs,
		logger: quietLinkLogger(options.logger),
	});
}

function endLinkMonitor() {
	stopConnectionMonitor();
}

async function checkLinkOnce(options = {}) {
	return probeWorkerLink({
		healthFn: health,
		getUrl: () => getConfig().url,
		logger: options.logger,
	});
}

/** Periodic /health for ROLL_STANDBY_URL — failure logs [StandbyLink] DISCONNECTED. */
function beginStandbyLinkMonitor(options = {}) {
	if (!isLocalEnabled()) return;
	startStandbyConnectionMonitor({
		healthFn: healthLocal,
		getUrl: () => getLocalConfig().url,
		intervalMs: options.intervalMs,
		logger: quietLinkLogger(options.logger),
	});
}

function endStandbyLinkMonitor() {
	stopStandbyConnectionMonitor();
}

async function checkStandbyLinkOnce(options = {}) {
	return probeStandbyLink({
		healthFn: healthLocal,
		getUrl: () => getLocalConfig().url,
		logger: options.logger,
	});
}

module.exports = {
	DEFAULT_TIMEOUT_MS,
	isEnabled,
	isLocalEnabled,
	normalizeWorkerBaseUrl,
	getConfig,
	getLocalConfig,
	toSerializableContext,
	parse,
	parseLocal,
	parseWithUrl,
	requestAdminShutdown,
	requestAdminReload,
	characterAction,
	health,
	healthAt,
	healthLocal,
	beginLinkMonitor,
	endLinkMonitor,
	checkLinkOnce,
	beginStandbyLinkMonitor,
	endStandbyLinkMonitor,
	checkStandbyLinkOnce,
	getLinkState,
	getStandbyState,
	resetConnectionStatus,
	resetStandbyConnectionStatus,
	getGatewayLabel,
};
