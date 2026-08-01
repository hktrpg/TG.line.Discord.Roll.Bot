"use strict";

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function getDefaultEnvPath() {
	return path.resolve(__dirname, '../../.env');
}

function parseTokenFromEnvContent(content) {
	for (const line of String(content || '').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		if (key !== 'ROLL_WORKER_TOKEN') continue;
		return trimmed.slice(eq + 1).trim().replaceAll(/^['"]|['"]$/g, '');
	}
	return '';
}

function readTokenFromEnvFile(envPath) {
	if (!fs.existsSync(envPath)) return '';
	try {
		return parseTokenFromEnvContent(fs.readFileSync(envPath, 'utf8'));
	} catch {
		return '';
	}
}

/**
 * Upsert ROLL_WORKER_TOKEN without rewriting the rest of .env.
 */
function upsertEnvToken(token, envPath) {
	let content = '';
	if (fs.existsSync(envPath)) {
		content = fs.readFileSync(envPath, 'utf8');
	}
	const lines = content.length > 0 ? content.split(/\r?\n/) : [];
	let found = false;
	const next = lines.map((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) return line;
		const eq = trimmed.indexOf('=');
		if (eq === -1) return line;
		if (trimmed.slice(0, eq).trim() !== 'ROLL_WORKER_TOKEN') return line;
		found = true;
		return `ROLL_WORKER_TOKEN=${token}`;
	});
	if (!found) {
		if (next.length > 0 && next.at(-1) !== '') next.push('');
		next.push(
			'# Auto-generated shared secret for Roll Worker + Gateway',
			`ROLL_WORKER_TOKEN=${token}`,
		);
	}
	const body = next.join('\n').replace(/\n+$/, '');
	fs.writeFileSync(envPath, `${body}\n`, 'utf8');
}

/**
 * Ensure ROLL_WORKER_TOKEN is available in process.env (and persisted to .env).
 * Order: process.env → .env file → generate (optional).
 *
 * @param {{ generate?: boolean, envPath?: string, logger?: Console }} [options]
 * @returns {string} token (empty when missing and generate=false)
 */
function ensureRollWorkerToken(options = {}) {
	const generate = options.generate !== false;
	const envPath = options.envPath || getDefaultEnvPath();
	const log = options.logger || console;

	let token = (process.env.ROLL_WORKER_TOKEN || '').trim();
	if (token) return token;

	const fromFile = readTokenFromEnvFile(envPath);
	if (fromFile) {
		process.env.ROLL_WORKER_TOKEN = fromFile;
		return fromFile;
	}

	if (!generate) return '';

	token = crypto.randomBytes(32).toString('hex');
	const info = typeof log.info === 'function' ? log.info.bind(log) : log.log.bind(log);
	const warn = typeof log.warn === 'function' ? log.warn.bind(log) : log.log.bind(log);
	try {
		upsertEnvToken(token, envPath);
		info(
			`[RollWorker] Generated ROLL_WORKER_TOKEN and saved to ${path.basename(envPath)} `
			+ '(use the same value on all gateways if they do not share this file)'
		);
	} catch (error) {
		warn(`[RollWorker] Generated ROLL_WORKER_TOKEN in memory only (could not write .env: ${error.message})`);
		warn('[RollWorker] Set ROLL_WORKER_TOKEN manually on all gateways (token value not logged).');
	}
	process.env.ROLL_WORKER_TOKEN = token;
	return token;
}

module.exports = {
	ensureRollWorkerToken,
	readTokenFromEnvFile,
	upsertEnvToken,
	parseTokenFromEnvContent,
	getDefaultEnvPath,
};
