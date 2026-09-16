'use strict';

/**
 * Write audit log entries for session-log works.
 * @param {object} schema
 * @param {{ workId: string, actor: string, action: string, detail?: object }} entry
 */
async function writeAudit(schema, entry) {
    if (!schema?.sessionLogAudit) return;
    try {
        await schema.sessionLogAudit.create({
            workId: entry.workId,
            actor: String(entry.actor || '').slice(0, 100),
            action: String(entry.action || '').slice(0, 40),
            detail: entry.detail || {},
        });
    } catch (error) {
        console.error('[SessionLog] audit write failed:', error.message);
    }
}

module.exports = { writeAudit };
