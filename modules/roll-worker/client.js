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
} = require('./connection-status');
const deferQueue = require('./defer-queue');

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
	markWorkerUp({ url, detail: 'request ok' });
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

function isEnabled() {
	return Boolean((process.env.ROLL_WORKER_URL || '').trim());
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
	};
}

async function parse(params) {
	const { url, token, timeoutMs } = getConfig();
	const headers = { 'Content-Type': 'application/json' };
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
		noteTransportDown(error);
		throw error;
	}

	// Transport reached Worker (even 4xx/5xx/needsLocal) — link is up.
	noteTransportOk();

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

async function characterAction({ doc, item, locale, botname = 'WWW' } = {}) {
	const { url, token, timeoutMs } = getConfig();
	const headers = { 'Content-Type': 'application/json' };
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
	const headers = {};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const response = await axios.get(`${url}/health`, { headers, timeout: Math.min(timeoutMs, 5000) });
	return response.data;
}

function beginLinkMonitor(options = {}) {
	if (!isEnabled()) return;
	ensureDeferConnectedHook();
	startConnectionMonitor({
		healthFn: health,
		getUrl: () => getConfig().url,
		intervalMs: options.intervalMs,
		logger: options.logger,
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

module.exports = {
	DEFAULT_TIMEOUT_MS,
	isEnabled,
	getConfig,
	toSerializableContext,
	parse,
	characterAction,
	health,
	beginLinkMonitor,
	endLinkMonitor,
	checkLinkOnce,
	getLinkState,
	resetConnectionStatus,
};
