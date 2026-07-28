"use strict";

/**
 * Shared artifact roots for Gateway + Roll Worker on one machine (or a shared volume).
 * Set ROLL_ARTIFACT_ROOT to the same absolute path on both processes when cwd differs.
 */

const fs = require('node:fs');
const path = require('node:path');

const DEMO_EXPORT_MESSAGE_LIMIT = 500;

function getArtifactRoot() {
	const root = (process.env.ROLL_ARTIFACT_ROOT || '').trim();
	return path.resolve(root || process.cwd());
}

/**
 * Resolve a relative or absolute path under the artifact root.
 * Returns null if the path would escape the root.
 * @param {string} filePath
 * @returns {string|null}
 */
function resolveArtifactPath(filePath) {
	if (!filePath || typeof filePath !== 'string') return null;
	const root = getArtifactRoot();
	const normalized = filePath.replaceAll('\\', '/').replace(/^\.\//, '');
	const resolved = path.isAbsolute(filePath)
		? path.resolve(filePath)
		: path.resolve(root, normalized);
	const relative = path.relative(root, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		return null;
	}
	return resolved;
}

/**
 * @param {string} filePath
 * @returns {string|null} absolute path if readable, else null
 */
function assertArtifactReadable(filePath) {
	const resolved = resolveArtifactPath(filePath);
	if (!resolved) return null;
	try {
		if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
			return null;
		}
	} catch {
		return null;
	}
	return resolved;
}

function getExportDir() {
	return path.join(getArtifactRoot(), 'export') + path.sep;
}

function getTempDir() {
	return path.join(getArtifactRoot(), 'temp') + path.sep;
}

/** Ensure temp/ exists under artifact root; return absolute dir path. */
function ensureTempDir() {
	const dir = getTempDir();
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

/**
 * Absolute path for a file under artifact temp/.
 * @param {string} filename
 */
function getTempFilePath(filename) {
	ensureTempDir();
	return path.join(getTempDir(), filename);
}

/**
 * Truncate prefetched export history for limited (demo) users.
 * Matches lots_of_messages_getter_* demo break at 500 messages.
 * @param {{ sum_messages?: object[], totalSize?: number }|null} history
 * @param {boolean} demoMode
 */
function truncateExportHistoryForDemo(history, demoMode) {
	if (!demoMode || !history?.sum_messages) return history;
	const sum_messages = history.sum_messages.slice(0, DEMO_EXPORT_MESSAGE_LIMIT);
	return {
		...history,
		sum_messages,
		totalSize: sum_messages.length,
	};
}

module.exports = {
	DEMO_EXPORT_MESSAGE_LIMIT,
	getArtifactRoot,
	resolveArtifactPath,
	assertArtifactReadable,
	getExportDir,
	getTempDir,
	ensureTempDir,
	getTempFilePath,
	truncateExportHistoryForDemo,
};
