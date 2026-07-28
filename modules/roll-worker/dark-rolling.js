"use strict";

/**
 * Mongo-backed dark-rolling GM list for gateways (avoids stale process RAM after Worker updates).
 */
const CACHE_TTL_MS = 30_000;
let cache = { at: 0, list: null };

async function loadAll() {
	const now = Date.now();
	if (cache.list && (now - cache.at) < CACHE_TTL_MS) {
		return cache.list;
	}
	try {
		const records = require('../db/records');
		const list = await records.get('trpgDarkRolling');
		cache = { at: now, list: Array.isArray(list) ? list : [] };
		return cache.list;
	} catch (error) {
		console.error('[DarkRolling] Failed to load from Mongo:', error?.message || error);
		return cache.list || [];
	}
}

async function getGroupGms(groupid) {
	if (!groupid || !process.env.mongoURL) return [];
	const list = await loadAll();
	const groupInfo = list.find(data => data.groupid == groupid);
	return groupInfo?.trpgDarkRollingfunction || [];
}

function invalidateCache() {
	cache = { at: 0, list: null };
}

module.exports = {
	getGroupGms,
	invalidateCache,
	loadAll,
};
