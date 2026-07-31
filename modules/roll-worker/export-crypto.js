'use strict';

/**
 * Discord HTML export payload crypto.
 * v2 (`v2g.`): gzip JSON → AES-128-GCM (random 12-byte IV) → base64.
 * Legacy (no prefix): AES-128-CBC zero-IV of raw JSON (CryptoJS-compatible).
 */

const crypto = require('node:crypto');
const zlib = require('node:zlib');

const V2_PREFIX = 'v2g.';
const AES_KEY_BYTES = 16;
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const TEXT_TRUNCATE = 500;

/**
 * Normalize password to 16 UTF-8 bytes (same as browser padEnd/slice).
 * @param {string} password
 * @returns {Buffer}
 */
function normalizeKey(password) {
	const normalized = String(password || '').padEnd(16, String(password || '')).slice(0, 16);
	return Buffer.from(normalized, 'utf8').subarray(0, AES_KEY_BYTES);
}

function truncateText(value, max = TEXT_TRUNCATE) {
	if (value == null) return value;
	const s = String(value);
	return s.length > max ? s.slice(0, max) : s;
}

function slimAttachment(attachment) {
	if (!attachment || typeof attachment !== 'object') return null;
	const url = attachment.url || attachment.proxyURL || attachment.proxy_url || '';
	const name = attachment.name || attachment.filename || '';
	if (!url && !name) return null;
	return { url, name };
}

function slimEmbed(embed) {
	if (!embed || typeof embed !== 'object') return null;
	const title = truncateText(embed.title || '');
	const description = truncateText(embed.description || '');
	if (!title && !description) return null;
	return { title, description };
}

function slimReply(reply) {
	if (!reply || typeof reply !== 'object') return null;
	return {
		c: reply.contact || reply.c || '',
		u: reply.userName || reply.u || 'unknown',
		b: Boolean(reply.isbot ?? reply.b),
		a: slimAttachmentList(reply.attachments || reply.a),
		e: slimEmbedList(reply.embeds || reply.e),
	};
}

function slimAttachmentList(list) {
	if (!Array.isArray(list) || list.length === 0) return [];
	return list.map((item) => slimAttachment(item)).filter(Boolean);
}

function slimEmbedList(list) {
	if (!Array.isArray(list) || list.length === 0) return [];
	return list.map((item) => slimEmbed(item)).filter(Boolean);
}

/**
 * Compact message rows for encryption.
 * @param {object[]} data
 * @returns {object[]}
 */
function minifyExportMessages(data) {
	if (!Array.isArray(data)) return [];
	return data.map((item) => ({
		t: item.timestamp,
		c: item.contact,
		u: item.userName,
		b: item.isbot,
		a: slimAttachmentList(item.attachments),
		e: slimEmbedList(item.embeds),
		r: slimReply(item.reply_to),
	}));
}

/**
 * Expand minified rows to viewer shape.
 * @param {object[]} minData
 * @returns {object[]}
 */
function expandExportMessages(minData) {
	if (!Array.isArray(minData)) return [];
	return minData.map((item) => ({
		timestamp: item.t,
		contact: item.c,
		userName: item.u,
		isbot: item.b,
		attachments: item.a || [],
		embeds: item.e || [],
		reply_to: item.r
			? {
				contact: item.r.c,
				userName: item.r.u,
				isbot: item.r.b,
				attachments: item.r.a || [],
				embeds: item.r.e || [],
			}
			: null,
	}));
}

/**
 * Encrypt export messages (v2g gzip + AES-128-GCM).
 * @param {object[]} data
 * @param {string} password
 * @returns {string}
 */
function encryptExportPayload(data, password) {
	const minData = minifyExportMessages(data);
	const jsonUtf8 = Buffer.from(JSON.stringify(minData), 'utf8');
	const gzipped = zlib.gzipSync(jsonUtf8);
	const key = normalizeKey(password);
	const iv = crypto.randomBytes(GCM_IV_BYTES);
	const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(gzipped), cipher.final()]);
	const authTag = cipher.getAuthTag();
	const packed = Buffer.concat([iv, authTag, ciphertext]);
	return V2_PREFIX + packed.toString('base64');
}

/**
 * Decrypt v2g. payload (Node).
 * @param {string} payload
 * @param {string} password
 * @returns {object[]|null}
 */
function decryptExportPayloadV2(payload, password) {
	try {
		if (!payload || !String(payload).startsWith(V2_PREFIX)) return null;
		const packed = Buffer.from(String(payload).slice(V2_PREFIX.length), 'base64');
		if (packed.length < GCM_IV_BYTES + GCM_TAG_BYTES + 1) return null;
		const iv = packed.subarray(0, GCM_IV_BYTES);
		const authTag = packed.subarray(GCM_IV_BYTES, GCM_IV_BYTES + GCM_TAG_BYTES);
		const ciphertext = packed.subarray(GCM_IV_BYTES + GCM_TAG_BYTES);
		const key = normalizeKey(password);
		const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv);
		decipher.setAuthTag(authTag);
		const gzipped = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		const jsonUtf8 = zlib.gunzipSync(gzipped).toString('utf8');
		return expandExportMessages(JSON.parse(jsonUtf8));
	} catch {
		return null;
	}
}

/**
 * Legacy AES-128-CBC zero-IV (matches old lightEncrypt / CryptoJS viewer).
 * @param {object[]} data
 * @param {string} password
 * @returns {string} base64 ciphertext (no prefix)
 */
function encryptExportPayloadLegacy(data, password) {
	const minData = (Array.isArray(data) ? data : []).map((item) => ({
		t: item.timestamp,
		c: item.contact,
		u: item.userName,
		b: item.isbot,
		a: item.attachments,
		e: item.embeds,
		r: item.reply_to,
	}));
	const jsonString = JSON.stringify(minData);
	const iv = Buffer.alloc(16, 0);
	const cipher = crypto.createCipheriv('aes-128-cbc', normalizeKey(password), iv);
	const encrypted = Buffer.concat([
		cipher.update(jsonString, 'utf8'),
		cipher.final(),
	]);
	return encrypted.toString('base64');
}

/**
 * Decrypt legacy CBC payload (Node mirror of CryptoJS path).
 * @param {string} cipherText
 * @param {string} password
 * @returns {object[]|null}
 */
function decryptExportPayloadLegacy(cipherText, password) {
	try {
		if (!cipherText || String(cipherText).startsWith(V2_PREFIX)) return null;
		const iv = Buffer.alloc(16, 0);
		const decipher = crypto.createDecipheriv('aes-128-cbc', normalizeKey(password), iv);
		const jsonText = Buffer.concat([
			decipher.update(Buffer.from(String(cipherText), 'base64')),
			decipher.final(),
		]).toString('utf8');
		if (!jsonText) return null;
		// Legacy rows store reply_to as full { contact, userName, ... }, not minified c/u.
		return JSON.parse(jsonText).map((item) => ({
			timestamp: item.t,
			contact: item.c,
			userName: item.u,
			isbot: item.b,
			attachments: item.a || [],
			embeds: item.e || [],
			reply_to: item.r || null,
		}));
	} catch {
		return null;
	}
}

/**
 * Decrypt any supported export payload.
 * @param {string} payload
 * @param {string} password
 * @returns {object[]|null}
 */
function decryptExportPayload(payload, password) {
	if (!payload || !password) return null;
	if (String(payload).startsWith(V2_PREFIX)) {
		return decryptExportPayloadV2(payload, password);
	}
	return decryptExportPayloadLegacy(payload, password);
}

module.exports = {
	V2_PREFIX,
	minifyExportMessages,
	expandExportMessages,
	encryptExportPayload,
	decryptExportPayload,
	decryptExportPayloadV2,
	encryptExportPayloadLegacy,
	decryptExportPayloadLegacy,
	normalizeKey,
};
