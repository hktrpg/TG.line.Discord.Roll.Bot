"use strict";

/**
 * True when exportHistoryMeta carries at least one message.
 * Empty arrays must NOT count as satisfied prefetch (would skip needsLocal).
 * @param {{ sum_messages?: unknown }|null|undefined} meta
 * @returns {boolean}
 */
function hasExportHistoryMessages(meta) {
	return Array.isArray(meta?.sum_messages) && meta.sum_messages.length > 0;
}

module.exports = {
	hasExportHistoryMessages,
};
