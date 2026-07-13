"use strict";

/**
 * Patreon CSV import: parse Patreon member export, sync addpatreon/on/off,
 * store Name + encrypted Email/Discord, report OFF reasons.
 * Uses CRYPTO_SECRET for encryption (utils/security), never regens KEY.
 */

const security = require('../utils/security.js');
const schema = require('./schema.js');
const patreonTiers = require('./patreon-tiers.js');
const patreonSync = require('./patreon-sync.js');
const i18n = require('./i18n.js');

/**
 * Parse a single CSV line into fields (handles quoted fields with commas).
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
    const fields = [];
    let i = 0;
    while (i < line.length) {
        if (line[i] === '"') {
            i++;
            let end = i;
            while (end < line.length) {
                const next = line.indexOf('"', end);
                if (next === -1) {
                    end = line.length;
                    break;
            }
                if (line[next + 1] === '"') {
                    end = next + 2;
                    continue;
            }
                end = next;
                break;
            }
            fields.push(line.slice(i, end).replaceAll('""', '"'));
            i = end + 1;
            if (line[i] === ',') i++;
            continue;
        }
        const comma = line.indexOf(',', i);
        if (comma === -1) {
            fields.push(line.slice(i).trim());
            break;
        }
        fields.push(line.slice(i, comma).trim());
        i = comma + 1;
    }
    return fields;
}

/**
 * Parse CSV content into rows of objects keyed by column name.
 * @param {string} csvContent
 * @returns {{ headers: string[], rows: Object[] }}
 */
function parseCSV(csvContent) {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        for (let idx = 0; idx < headers.length; idx++) {
            const header = headers[idx];
            row[header] = values[idx] !== undefined ? String(values[idx]).trim() : '';
        }
        rows.push(row);
    }
    return { headers, rows };
}

/**
 * Parse "Last Updated" date from CSV (e.g. "2026-02-10 05:58:57").
 * @param {string} s
 * @returns {number} timestamp for sorting
 */
function parseLastUpdated(s) {
    if (!s) return 0;
    const d = new Date(s.replaceAll(' ', 'T'));
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Required CSV headers (Patreon export format). */
const REQUIRED_CSV_HEADERS = ['Name', 'Patron Status', 'Tier', 'Last Updated'];

/**
 * Get plain key for display from member doc (decrypt keyEncrypted).
 * @param {Object} doc - patreonMember doc
 * @returns {string|null}
 */
/**
 * Get plain key for display from member doc (decrypt keyEncrypted).
 * Adds validation to ensure decrypted key matches expected format.
 * @param {Object} doc - patreonMember doc
 * @returns {string|null}
 */
function getDisplayKey(doc) {
    if (!doc || !doc.keyEncrypted) return null;
    const decryptedKey = security.decryptWithCryptoSecret(doc.keyEncrypted);

    // Validate decrypted key format: XXXX-XXXX-XXXX-XXXX (19 characters)
    const isValidKeyFormat = typeof decryptedKey === 'string' &&
                             /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(decryptedKey);

    if (isValidKeyFormat) {
        return decryptedKey;
    } else if (decryptedKey && decryptedKey.startsWith('DECRYPTION_ERROR')) {
        console.warn('[patreon-import] getDisplayKey: Decryption failed for keyEncrypted. Error:', decryptedKey);
    } else {
        console.warn(
            '[patreon-import] getDisplayKey: Decryption resulted in invalid key format.',
            'Original encrypted data:', doc.keyEncrypted,
            'Decrypted output:', decryptedKey
        );
    }
    return null;
}

/**
 * Validate CSV has required columns. Returns null if valid, or error string.
 * @param {string[]} headers
 * @returns {string|null}
 */
function validateCSVHeaders(headers, t = i18n.createTranslator(i18n.DEFAULT_LOCALE)) {
    if (!headers || !Array.isArray(headers)) return t('admin.patreon_import_csv_missing_headers');
    const missing = REQUIRED_CSV_HEADERS.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        return t('admin.patreon_import_csv_missing_columns', { columns: missing.join(', ') });
    }
    return null;
}

/**
 * Run Patreon CSV import: update DB (add/on/off), store encrypted Email/Discord,
 * return report and keys. Never regens KEY. Accepts only raw CSV string (no file path).
 * @param {string} csvContent - Raw CSV string (e.g. from attachment)
 * @param {{ keyMode: 'all'|'newonly' }} options - all: list all keys for members in CSV; newonly: only keys for newly added members
 * @returns {Promise<{ report: string[], keys: string[], errors: string[], summary: object, keyMessages: string[], emailContent: string|null }>}
 */
async function runImport(csvContent, options = {}) {
    const { keyMode = 'all', generateEmail = false, locale } = options;
    const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
    const report = [];
    const keys = [];
    const errors = [];
    const keyMessages = [];
    const emailBlocks = [];
    const newMemberKeys = new Set(); // keys of members created in this run
    const summary = {
        added: 0,
        updated: 0,
        offFormer: 0,
        offNotActive: 0,
        errors: 0,
        activeTotal: 0,
        formerTotal: 0
    };

    const generateEmailBlock = (name, email, key) => {
        if (!name || !email || !key) return '';
        return `===
email: ${email}
subject: ${t('admin.patreon_import_email_subject')}
username: ${name}
key: ${key}`;
    };

    if (typeof csvContent !== 'string') {
        errors.push(t('admin.patreon_import_csv_must_be_string'));
        summary.errors = errors.length;
        return { report, keys, errors, summary, keyMessages, emailContent: null };
    }

    const { headers, rows } = parseCSV(csvContent);
    const headerError = validateCSVHeaders(headers, t);
    if (headerError) {
        errors.push(headerError);
        report.push(t('admin.patreon_import_csv_format_error'));
        summary.errors = errors.length;
        return { report, keys, errors, summary, keyMessages, emailContent: null };
    }
    if (rows.length === 0) {
        report.push(t('admin.patreon_import_csv_empty'));
        summary.errors = errors.length;
        return { report, keys, errors, summary, keyMessages, emailContent: null };
    }

    // Sort by Last Updated descending (newest first)
    rows.sort((a, b) => parseLastUpdated(b['Last Updated']) - parseLastUpdated(a['Last Updated']));

    const encrypt = (text) => (text != null && text !== '') ? security.encryptWithCryptoSecret(String(text)) : '';

    /** Stats: active/former counts and by tier (CSV tier name) */
    let activeTotal = 0;
    const activeByTier = {};
    let formerTotal = 0;
    const formerByTier = {};

    for (const row of rows) {
        const name = (row['Name'] || '').trim();
        if (!name) continue;

        const patronStatus = (row['Patron Status'] || '').trim();
        const tierName = (row['Tier'] || '').trim();
        const tierLabel = tierName || t('admin.patreon_import_tier_not_set');
        const level = patreonTiers.csvTierNameToLevel(tierName);
        const isActive = patronStatus === 'Active patron';
        const isFormer = patronStatus === 'Former patron';
        const lastUpdatedStr = row['Last Updated'] || '';
        const lastUpdatedDate = lastUpdatedStr ? new Date(lastUpdatedStr.replace(' ', 'T')) : null;

        const existing = await schema.patreonMember.findOne({ patreonName: name }).lean();
        const isHonoraryLifetime = level === patreonTiers.LEVEL_HONORARY_LIFETIME;

        // Former patron: normally do not add new members; if was ON -> turn OFF and report.
        // Special case 悠久者(名譽會員) - Honorary Member(Lifetime): even when Former, still create and produce KEY.
        if (isFormer) {
            formerTotal++;
            formerByTier[tierLabel] = (formerByTier[tierLabel] || 0) + 1;
            // 悠久者 is special: Former 也會生產 — create member + KEY if not in DB yet
            if (isHonoraryLifetime && !existing) {
                const emailEncrypted = encrypt(row['Email']);
                const discordEncrypted = encrypt(row['Discord']);
                const zAdmin = require('../roll/z_admin.js');
                const key = typeof zAdmin.generatePatreonKey === 'function' ? zAdmin.generatePatreonKey() : null;
                if (!key) {
                    errors.push(t('admin.patreon_import_key_failed_honorary', { name }));
                    continue;
                }
                try {
                    const normalized = (key || '').replaceAll(/\s/g, '').replaceAll('-', '').toUpperCase();
                    const keyHash = security.hashPatreonKey(normalized);
                    const keyEncrypted = security.encryptWithCryptoSecret(key);
                    const historyEntry = { at: new Date(), action: 'on', source: 'import', reason: 'honorary_lifetime_former_in_csv' };
                    const newDoc = await schema.patreonMember.create({
                        patreonName: name,
                        key: keyHash,
                        keyHash,
                        keyEncrypted,
                        level: patreonTiers.LEVEL_HONORARY_LIFETIME,
                        name: name,
                        switch: true,
                        startDate: new Date(),
                        emailEncrypted,
                        discordEncrypted,
                        lastUpdatedFromPatreon: lastUpdatedDate || new Date(),
                        history: [historyEntry],
                        slots: []
                    });
                    newMemberKeys.add(key);
                    keys.push(key);
                    if (generateEmail) {
                        const email = row['Email'];
                        if (email) {
                            emailBlocks.push(generateEmailBlock(name, email, key));
                        }
                    }
                    await patreonSync.syncMemberSlotsToVip(newDoc);
                    const honoraryLabel = patreonTiers.getTierLabel(patreonTiers.LEVEL_HONORARY_LIFETIME, locale);
                    report.push(
                        t('admin.patreon_import_add_lifetime_report', { name, tier: honoraryLabel }),
                        key
                    );
                    keyMessages.push(`${t('admin.patreon_import_add_lifetime_key', { name, tier: honoraryLabel })}\n${key}`);
                    summary.added++;
                } catch (error) {
                    errors.push(t('admin.patreon_import_add_honorary_error', { name, message: error.message }));
                }
                continue;
            }
            if (existing && existing.switch) {
                // Skip turning off Honorary Member(Lifetime) - they are permanent
                if (isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME) {
                    report.push(t('admin.patreon_import_former_honorary_on', { name }));
                    continue;
                }
                const graceEnd = patreonTiers.addVipGraceEndDate();
                try {
                    await patreonSync.applyVipGraceAfterCancellation(existing, graceEnd);
                    await schema.patreonMember.updateOne(
                        { patreonName: name },
                        {
                            $set: { switch: false, vipGraceUntil: graceEnd },
                            $push: { history: { at: new Date(), action: 'off', source: 'import', reason: 'former_patron' } }
                        }
                    );
                    report.push(
                        t('admin.patreon_import_former_off', {
                            name,
                            date: graceEnd.toISOString().slice(0, 10),
                            days: patreonTiers.PATREON_VIP_GRACE_DAYS
                        })
                    );
                    summary.offFormer++;
                } catch (error) {
                    errors.push(t('admin.patreon_import_off_error', { name, message: error.message }));
                }
                continue;
            }
            if (existing && !existing.switch && existing.vipGraceUntil && new Date(existing.vipGraceUntil) > new Date()) {
                if (!(isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME)) {
                    report.push(
                        t('admin.patreon_import_former_grace_kept', {
                            name,
                            date: new Date(existing.vipGraceUntil).toISOString().slice(0, 10)
                        })
                    );
                }
                continue;
            }
            if (existing && !existing.switch && existing.vipGraceUntil && new Date(existing.vipGraceUntil) <= new Date()) {
                if (!(isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME)) {
                    try {
                        await patreonSync.clearVipEntriesByPatreonKey(existing);
                        await schema.patreonMember.updateOne(
                            { patreonName: name },
                            {
                                $unset: { vipGraceUntil: 1 },
                                $push: { history: { at: new Date(), action: 'off', source: 'import', reason: 'former_patron_grace_expired' } }
                            }
                        );
                        report.push(t('admin.patreon_import_former_grace_revoked', { name }));
                    } catch (error) {
                        errors.push(t('admin.patreon_import_grace_expire_error', { name, message: error.message }));
                    }
                }
            }
            continue;
        }

        // Not Active (e.g. Declined): if was ON -> turn OFF and report
        // Exception: Honorary Member(Lifetime) should never be turned off (permanent status)
        if (!isActive) {
            if (existing && existing.switch) {
                // Skip turning off Honorary Member(Lifetime) - they are permanent
                if (isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME) {
                    report.push(t('admin.patreon_import_not_active_honorary_on', { name }));
                    continue;
                }
                const graceEnd = patreonTiers.addVipGraceEndDate();
                try {
                    await patreonSync.applyVipGraceAfterCancellation(existing, graceEnd);
                    await schema.patreonMember.updateOne(
                        { patreonName: name },
                        {
                            $set: { switch: false, vipGraceUntil: graceEnd },
                            $push: { history: { at: new Date(), action: 'off', source: 'import', reason: 'not_active' } }
                        }
                    );
                    report.push(
                        t('admin.patreon_import_not_active_off', {
                            name,
                            date: graceEnd.toISOString().slice(0, 10),
                            days: patreonTiers.PATREON_VIP_GRACE_DAYS
                        })
                    );
                    summary.offNotActive++;
                } catch (error) {
                    errors.push(t('admin.patreon_import_off_error', { name, message: error.message }));
                }
                continue;
            }
            if (existing && !existing.switch && existing.vipGraceUntil && new Date(existing.vipGraceUntil) > new Date()) {
                if (!(isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME)) {
                    report.push(
                        t('admin.patreon_import_not_active_grace_kept', {
                            name,
                            date: new Date(existing.vipGraceUntil).toISOString().slice(0, 10)
                        })
                    );
                }
                continue;
            }
            if (existing && !existing.switch && existing.vipGraceUntil && new Date(existing.vipGraceUntil) <= new Date()) {
                if (!(isHonoraryLifetime || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME)) {
                    try {
                        await patreonSync.clearVipEntriesByPatreonKey(existing);
                        await schema.patreonMember.updateOne(
                            { patreonName: name },
                            {
                                $unset: { vipGraceUntil: 1 },
                                $push: { history: { at: new Date(), action: 'off', source: 'import', reason: 'not_active_grace_expired' } }
                            }
                        );
                        report.push(t('admin.patreon_import_not_active_grace_revoked', { name }));
                    } catch (error) {
                        errors.push(t('admin.patreon_import_grace_expire_error', { name, message: error.message }));
                    }
                }
            }
            continue;
        }

        // Count active (all Active patrons in CSV, including 無名調查員)
        activeTotal++;
        activeByTier[tierLabel] = (activeByTier[tierLabel] || 0) + 1;

        // Active but tier not 調查員+ : do not add, do not create KEY; leave existing as-is (no auto OFF)
        if (level == null) continue;

        const emailEncrypted = encrypt(row['Email']);
        const discordEncrypted = encrypt(row['Discord']);

        if (!existing) {
            // New member: add with new KEY (never regen), store encrypted
            const zAdmin = require('../roll/z_admin.js');
            const key = typeof zAdmin.generatePatreonKey === 'function' ? zAdmin.generatePatreonKey() : null;
            if (!key) {
                errors.push(t('admin.patreon_import_key_failed', { name }));
                continue;
            }
            try {
                const normalized = (key || '').replaceAll(/\s/g, '').replaceAll('-', '').toUpperCase();
                const keyHash = security.hashPatreonKey(normalized);
                const keyEncrypted = security.encryptWithCryptoSecret(key);
                const historyEntry = { at: new Date(), action: 'on', source: 'import', reason: 'new_active_member' };
                const newDoc = await schema.patreonMember.create({
                    patreonName: name,
                    key: keyHash,
                    keyHash,
                    keyEncrypted,
                    level,
                    name: name,
                    switch: true,
                    startDate: new Date(),
                    emailEncrypted,
                    discordEncrypted,
                    lastUpdatedFromPatreon: lastUpdatedDate || new Date(),
                    history: [historyEntry],
                    slots: []
                });
                newMemberKeys.add(key);
                keys.push(key);
                if (generateEmail) {
                    const email = row['Email'];
                    if (email) {
                        emailBlocks.push(generateEmailBlock(name, email, key));
                    }
                }
                await patreonSync.syncMemberSlotsToVip(newDoc);
                const tierLabelForLevel = patreonTiers.getTierLabel(level, locale);
                report.push(
                    t('admin.patreon_import_added', { name, tier: tierLabelForLevel }),
                    key
                );
                keyMessages.push(`${t('admin.patreon_import_added_key', { name, tier: tierLabelForLevel })}\n${key}`);
                summary.added++;
            } catch (error) {
                errors.push(t('admin.patreon_import_add_error', { name, message: error.message }));
            }
            continue;
        }

        // Existing: update level, encrypted fields, lastUpdated; ensure ON (no KEY regen)
        // Skip update for Honorary Member(Lifetime) - they are permanent and should not be changed once set
        const isExistingHonorary = existing && (level === patreonTiers.LEVEL_HONORARY_LIFETIME || existing.level === patreonTiers.LEVEL_HONORARY_LIFETIME);
        if (isExistingHonorary) {
            // Honorary Member(Lifetime) already exists - skip update to preserve permanent status
            report.push(t('admin.patreon_import_skipped_honorary', { name, tier: patreonTiers.getTierLabel(level, locale) }));
            if (keyMode === 'all') {
                const displayKey = getDisplayKey(existing);
                if (displayKey) {
                    keys.push(displayKey);
                    keyMessages.push(`${t('admin.patreon_import_current_key', { name, tier: patreonTiers.getTierLabel(existing.level || level, locale) })}\n${displayKey}`);
                    if (generateEmail) {
                        const email = row['Email'];
                        if (email) {
                            emailBlocks.push(generateEmailBlock(name, email, displayKey));
                        }
                    }
                }
            }
            continue;
        }

        try {
            const shouldTurnOn = !existing.switch;
            const updateDoc = {
                $set: {
                    level,
                    name: name,
                    switch: true,
                    emailEncrypted,
                    discordEncrypted,
                    lastUpdatedFromPatreon: lastUpdatedDate || new Date(),
                    key: existing.keyHash
                },
                $unset: { vipGraceUntil: 1 }
            };
            if (shouldTurnOn) {
                updateDoc.$push = {
                    history: { at: new Date(), action: 'on', source: 'import', reason: 'reactivated_by_import' }
                };
            }
            await schema.patreonMember.updateOne(
                { patreonName: name },
                updateDoc,
                { runValidators: true }
            );
            const doc = await schema.patreonMember.findOne({ patreonName: name });
            await patreonSync.syncMemberSlotsToVip(doc);
            if (keyMode === 'all') {
                const displayKey = getDisplayKey(doc);
                const tierLabelForLevel = patreonTiers.getTierLabel(level, locale);
                if (displayKey) {
                    keys.push(displayKey);
                    if (generateEmail) {
                        const email = row['Email'];
                        if (email) {
                            emailBlocks.push(generateEmailBlock(name, email, displayKey));
                        }
                    }
                    report.push(
                        t('admin.patreon_import_updated', { name, tier: tierLabelForLevel }),
                        displayKey
                    );
                    keyMessages.push(`${t('admin.patreon_import_updated_key', { name, tier: tierLabelForLevel })}\n${displayKey}`);
                } else {
                    report.push(t('admin.patreon_import_updated', { name, tier: tierLabelForLevel }));
                }
            } else {
                report.push(t('admin.patreon_import_updated', { name, tier: patreonTiers.getTierLabel(level, locale) }));
            }
            summary.updated++;
        } catch (error) {
            errors.push(t('admin.patreon_import_update_error', { name, message: error.message }));
        }
    }

    if (keyMode === 'all') {
        // Force "allkeys": always send the current active Patreon key list.
        // This is independent from whether members were changed in this import.
        const now = new Date();
        const allActiveMembers = await schema.patreonMember.find({
            $or: [
                { switch: true },
                { vipGraceUntil: { $gt: now } }
            ]
        }).sort({ patreonName: 1 }).lean();
        keys.length = 0;
        keyMessages.length = 0;
        emailBlocks.length = 0;
        for (const member of allActiveMembers) {
            const displayKey = getDisplayKey(member);
            const tierLabel = patreonTiers.getTierLabel(member.level, locale);
            if (displayKey) {
                keys.push(displayKey);
                keyMessages.push(`${t('admin.patreon_import_current_key', { name: member.patreonName, tier: tierLabel })}\n${displayKey}`);
                if (generateEmail) {
                    const email = member.emailEncrypted ? security.decryptWithCryptoSecret(member.emailEncrypted) : null;
                    if (email) {
                        emailBlocks.push(generateEmailBlock(member.patreonName, email, displayKey));
                    }
                }
                } else {
                // If key cannot be decrypted, rotate to a fresh key so allkeys can still be delivered.
                try {
                    const zAdmin = require('../roll/z_admin.js');
                    const newKey = typeof zAdmin.generatePatreonKey === 'function' ? zAdmin.generatePatreonKey() : null;
                    if (!newKey) {
                        throw new Error(t('admin.patreon_import_key_regen_failed'));
                    }
                    const normalized = (newKey || '').replaceAll(/\s/g, '').replaceAll('-', '').toUpperCase();
                    const keyHash = security.hashPatreonKey(normalized);
                    const keyEncrypted = security.encryptWithCryptoSecret(newKey);
                    await patreonSync.clearVipEntriesByPatreonKey(member);
                    await schema.patreonMember.updateOne(
                        { _id: member._id },
                        { $set: { keyHash, keyEncrypted, key: keyHash }, $unset: { vipGraceUntil: 1 } }
                    );
                    const updated = await schema.patreonMember.findOne({ _id: member._id }).lean();
                    await patreonSync.syncMemberSlotsToVip(updated);
                    keys.push(newKey);
                    keyMessages.push(`${t('admin.patreon_import_current_key', { name: member.patreonName, tier: tierLabel })}\n${newKey}`);
                    if (generateEmail) {
                        const email = member.emailEncrypted ? security.decryptWithCryptoSecret(member.emailEncrypted) : null;
                        if (email) {
                            emailBlocks.push(generateEmailBlock(member.patreonName, email, newKey));
                        }
                    }
                    summary.updated++;
                } catch (error) {
                    errors.push(t('admin.patreon_import_reset_key_error', { name: member.patreonName, message: error.message }));
                }
            }
        }
    } else if (keyMode === 'newonly') {
        keys.length = 0;
        keys.push(...newMemberKeys);
    }

    // Append 加入統計
    report.push(
        '',
        t('admin.patreon_import_stats_header'),
        t('admin.patreon_import_stats_active_total', { count: activeTotal })
    );
    const activeTiers = Object.keys(activeByTier).sort();
    for (const tierName of activeTiers) {
        report.push(t('admin.patreon_import_stats_tier_line', { tier: tierName, count: activeByTier[tierName] }));
    }
    report.push(t('admin.patreon_import_stats_former_total', { count: formerTotal }));
    const formerTiers = Object.keys(formerByTier).sort();
    for (const tierName of formerTiers) {
        report.push(t('admin.patreon_import_stats_tier_line', { tier: tierName, count: formerByTier[tierName] }));
    }

    summary.activeTotal = activeTotal;
    summary.formerTotal = formerTotal;
    summary.errors = errors.length;

    const emailContent = generateEmail ? emailBlocks.join('\n') : null;

    return { report, keys, errors, summary, keyMessages, emailContent };
}

module.exports = {
    parseCSV,
    parseCSVLine,
    parseLastUpdated,
    validateCSVHeaders,
    runImport
};
