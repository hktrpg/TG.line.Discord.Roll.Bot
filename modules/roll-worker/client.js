"use strict";

const axios = require('axios');

const DEFAULT_URL = 'http://127.0.0.1:3950';
const DEFAULT_TIMEOUT_MS = 30_000;

function getConfig() {
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
	};
}

async function parse(params) {
	const { url, token, timeoutMs } = getConfig();
	const headers = { 'Content-Type': 'application/json' };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await axios.post(
		`${url}/v1/parse`,
		toSerializableContext(params),
		{ headers, timeout: timeoutMs, validateStatus: () => true }
	);

	if (response.status === 503 && response.data?.needsLocal) {
		return {
			needsLocal: true,
			moduleName: response.data.moduleName || undefined,
			// Preserve worker EXPUP side-effects for gateway merge / fallback.
			LevelUp: response.data.LevelUp || '',
			statue: response.data.statue || '',
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

	const response = await axios.post(
		`${url}/v1/character-action`,
		{ doc, item, locale, botname },
		{ headers, timeout: timeoutMs, validateStatus: () => true }
	);

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

module.exports = {
	isEnabled,
	getConfig,
	toSerializableContext,
	parse,
	characterAction,
	health,
};
