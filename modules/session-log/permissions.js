'use strict';

/**
 * Access control for session log works.
 * @param {object} log
 * @param {{ discordId?: string }|null} user
 * @param {string} [shareToken]
 * @returns {{ allowed: boolean, isOwner: boolean, reason?: string }}
 */
function evaluateWorkAccess(log, user, shareToken = '') {
    if (!log) return { allowed: false, isOwner: false, reason: 'NOT_FOUND' };

    const isOwner = Boolean(user?.discordId && user.discordId === log.ownerDiscordId);

    if (log.deletedAt) {
        return isOwner
            ? { allowed: true, isOwner, reason: 'TRASH' }
            : { allowed: false, isOwner: false, reason: 'NOT_FOUND' };
    }

    const moderationState = log.moderation?.state || 'ok';
    if (moderationState === 'taken_down') {
        return isOwner
            ? { allowed: true, isOwner, reason: 'TAKEN_DOWN' }
            : { allowed: false, isOwner: false, reason: 'NOT_FOUND' };
    }

    if (isOwner) return { allowed: true, isOwner: true };

    const status = log.status || 'published';
    if (status === 'draft' || status === 'scheduled' || status === 'archived') {
        return { allowed: false, isOwner: false, reason: 'FORBIDDEN' };
    }

    if (status !== 'published') {
        return { allowed: false, isOwner: false, reason: 'FORBIDDEN' };
    }

    const visibility = log.visibility || 'private';
    if (visibility === 'public') {
        return { allowed: true, isOwner: false };
    }
    if (visibility === 'unlisted') {
        const token = String(shareToken || '');
        if (token && log.shareToken && token === log.shareToken) {
            return { allowed: true, isOwner: false };
        }
        return { allowed: false, isOwner: false, reason: 'FORBIDDEN' };
    }

    return { allowed: false, isOwner: false, reason: 'FORBIDDEN' };
}

/**
 * Whether a work can appear in public discovery lists.
 * @param {object} log
 * @param {{ safe?: boolean }} [options]
 * @returns {boolean}
 */
function isPublicDiscoverable(log, options = {}) {
    if (!log || log.deletedAt) return false;
    if ((log.moderation?.state || 'ok') !== 'ok') return false;
    if ((log.status || 'published') !== 'published') return false;
    if (log.visibility !== 'public') return false;
    if (options.safe && (log.rating === 'r18' || log.rating === 'r15')) return false;
    return true;
}

module.exports = {
    evaluateWorkAccess,
    isPublicDiscoverable,
};
