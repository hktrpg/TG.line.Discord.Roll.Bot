'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const COVER_MAX_BYTES = 2 * 1024 * 1024;
const INLINE_MAX_BYTES = 5 * 1024 * 1024;
const QUOTA_FREE = 200 * 1024 * 1024;
const QUOTA_PATREON_1 = 1024 * 1024 * 1024;
const QUOTA_PATREON_3 = 5 * 1024 * 1024 * 1024;
const UPLOADS_PER_HOUR = 60;

const ASSETS_ROOT = path.join(process.cwd(), 'assets', 'session-logs');

/** @type {Map<string, number[]>} */
const uploadTimestamps = new Map();

let sharp = null;
try {
    sharp = require('sharp');
} catch {
    sharp = null;
}

function ownerDir(ownerDiscordId) {
    const safe = String(ownerDiscordId || '').replaceAll(/[^\w.-]/g, '_');
    return path.join(ASSETS_ROOT, safe);
}

function directorySizeBytes(dir) {
    if (!fs.existsSync(dir)) return 0;
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        try {
            total += fs.statSync(path.join(dir, entry.name)).size;
        } catch {
            // ignore
        }
    }
    return total;
}

/**
 * @param {number} [patreonLevel]
 * @returns {number}
 */
function quotaForLevel(patreonLevel = 0) {
    const level = Number(patreonLevel) || 0;
    if (level >= 3) return QUOTA_PATREON_3;
    if (level >= 1) return QUOTA_PATREON_1;
    return QUOTA_FREE;
}

function checkUploadRate(ownerDiscordId) {
    const key = String(ownerDiscordId || '');
    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const list = (uploadTimestamps.get(key) || []).filter((ts) => now - ts < windowMs);
    if (list.length >= UPLOADS_PER_HOUR) {
        uploadTimestamps.set(key, list);
        return false;
    }
    list.push(now);
    uploadTimestamps.set(key, list);
    return true;
}

function createUploader() {
    return multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: INLINE_MAX_BYTES, files: 1 },
    });
}

/**
 * Process image buffer with sharp: strip EXIF, convert to webp variants.
 * @param {Buffer} buffer
 * @param {'cover'|'inline'} kind
 * @returns {Promise<{ ok: true, hash: string, variants: object[], isGif: boolean }|{ ok: false, error: string }>}
 */
async function processImageBuffer(buffer, kind) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return { ok: false, error: 'FILE_REQUIRED' };
    }
    const maxBytes = kind === 'cover' ? COVER_MAX_BYTES : INLINE_MAX_BYTES;
    if (buffer.length > maxBytes) {
        return { ok: false, error: 'FILE_TOO_LARGE' };
    }
    if (!sharp) {
        return { ok: false, error: 'IMAGE_PROCESSOR_UNAVAILABLE' };
    }

    let meta;
    try {
        meta = await sharp(buffer, { animated: true }).metadata();
    } catch {
        return { ok: false, error: 'INVALID_MIME' };
    }

    const format = String(meta.format || '').toLowerCase();
    const allowed = kind === 'cover'
        ? new Set(['jpeg', 'jpg', 'png', 'webp'])
        : new Set(['jpeg', 'jpg', 'png', 'webp', 'gif']);
    if (!allowed.has(format)) {
        return { ok: false, error: 'INVALID_MIME' };
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const isGif = format === 'gif';
    const variants = [];

    if (isGif) {
        variants.push({ name: 'full', buffer, ext: '.gif', mime: 'image/gif' });
        return { ok: true, hash, variants, isGif: true };
    }

    const base = sharp(buffer).rotate().webp({ quality: 82 });

    if (kind === 'cover') {
        const cover = await base.clone().resize(400, 600, { fit: 'cover' }).toBuffer();
        const thumb = await base.clone().resize(200, 300, { fit: 'cover' }).toBuffer();
        variants.push(
            { name: 'cover', buffer: cover, ext: '.webp', mime: 'image/webp' },
            { name: 'thumb', buffer: thumb, ext: '.webp', mime: 'image/webp' },
        );
    } else {
        const full = await base.clone().resize({
            width: 1600,
            height: 1600,
            fit: 'inside',
            withoutEnlargement: true,
        }).toBuffer();
        const thumb = await base.clone().resize(320, 320, {
            fit: 'inside',
            withoutEnlargement: true,
        }).toBuffer();
        variants.push(
            { name: 'full', buffer: full, ext: '.webp', mime: 'image/webp' },
            { name: 'thumb', buffer: thumb, ext: '.webp', mime: 'image/webp' },
        );
    }

    return { ok: true, hash, variants, isGif: false };
}

/**
 * @param {{ discordId: string }} user
 * @param {Buffer} buffer
 * @param {'cover'|'inline'} kind
 * @param {number} [patreonLevel]
 */
async function saveProcessedAsset(user, buffer, kind, patreonLevel = 0) {
    if (!checkUploadRate(user.discordId)) {
        return { ok: false, error: 'RATE_LIMITED' };
    }

    const processed = await processImageBuffer(buffer, kind);
    if (!processed.ok) return processed;

    const dir = ownerDir(user.discordId);
    fs.mkdirSync(dir, { recursive: true });

    const primary = processed.variants[0];
    const assetId = `${processed.hash}-${primary.name}${primary.ext}`;
    const primaryPath = path.join(dir, assetId);

    // Dedup: if primary already exists, reuse
    if (!fs.existsSync(primaryPath)) {
        const used = directorySizeBytes(dir);
        const added = processed.variants.reduce((sum, item) => sum + item.buffer.length, 0);
        if (used + added > quotaForLevel(patreonLevel)) {
            return { ok: false, error: 'QUOTA_EXCEEDED' };
        }
        for (const variant of processed.variants) {
            const filename = `${processed.hash}-${variant.name}${variant.ext}`;
            fs.writeFileSync(path.join(dir, filename), variant.buffer);
        }
    }

    const url = `/session-log-assets/${encodeURIComponent(user.discordId)}/${encodeURIComponent(assetId)}`;
    return {
        ok: true,
        url,
        assetId,
        hash: processed.hash,
        kind,
        variants: processed.variants.map((item) => item.name),
    };
}

function deleteAsset(ownerDiscordId, assetId) {
    const safeName = path.basename(String(assetId || ''));
    if (!safeName || safeName.includes('..')) return false;
    const dir = ownerDir(ownerDiscordId);
    const filePath = path.join(dir, safeName);
    if (!filePath.startsWith(dir) || !fs.existsSync(filePath)) return false;
    try {
        fs.unlinkSync(filePath);
        // Also remove sibling variants with same hash prefix
        const hash = safeName.split('-')[0];
        if (hash && hash.length >= 8) {
            for (const entry of fs.readdirSync(dir)) {
                if (entry.startsWith(`${hash}-`) && entry !== safeName) {
                    try { fs.unlinkSync(path.join(dir, entry)); } catch { /* ignore */ }
                }
            }
        }
        return true;
    } catch {
        return false;
    }
}

function resolveAssetPath(ownerDiscordId, filename) {
    const safeOwner = String(ownerDiscordId || '').replaceAll(/[^\w.-]/g, '_');
    const safeName = path.basename(String(filename || ''));
    if (!safeOwner || !safeName) return null;
    const filePath = path.join(ASSETS_ROOT, safeOwner, safeName);
    if (!filePath.startsWith(path.join(ASSETS_ROOT, safeOwner))) return null;
    if (!fs.existsSync(filePath)) return null;
    return filePath;
}

/**
 * HMAC signed URL helpers for private assets.
 * @param {string} secret
 * @param {string} ownerId
 * @param {string} filename
 * @param {number} [ttlSeconds]
 */
function signAssetUrl(secret, ownerId, filename, ttlSeconds = 600) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = `${ownerId}:${filename}:${exp}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `/session-log-assets/${encodeURIComponent(ownerId)}/${encodeURIComponent(filename)}?exp=${exp}&sig=${sig}`;
}

function verifyAssetSignature(secret, ownerId, filename, exp, sig) {
    const expires = Number(exp);
    if (!expires || expires < Math.floor(Date.now() / 1000)) return false;
    const payload = `${ownerId}:${filename}:${expires}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig || '')));
    } catch {
        return false;
    }
}

function getQuotaUsage(ownerDiscordId, patreonLevel = 0) {
    const used = directorySizeBytes(ownerDir(ownerDiscordId));
    const limit = quotaForLevel(patreonLevel);
    return { used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Delete all files for an owner matching a cover asset id / hash.
 * @param {string} ownerDiscordId
 * @param {string} coverAssetId
 */
function deleteCoverAssets(ownerDiscordId, coverAssetId) {
    if (!coverAssetId) return;
    deleteAsset(ownerDiscordId, coverAssetId);
}

module.exports = {
    COVER_MAX_BYTES,
    INLINE_MAX_BYTES,
    ASSETS_ROOT,
    createUploader,
    processImageBuffer,
    saveProcessedAsset,
    deleteAsset,
    deleteCoverAssets,
    resolveAssetPath,
    signAssetUrl,
    verifyAssetSignature,
    getQuotaUsage,
    quotaForLevel,
    ownerDir,
    directorySizeBytes,
};
