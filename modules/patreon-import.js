"use strict";

/**
 * Patreon CSV import: parse Patreon member export, sync addpatreon/on/off,
 * store Name + encrypted Email/Discord, report OFF reasons.
 * Uses CRYPTO_SECRET for encryption (utils/security), never regens KEY.
 */

const fs = require('fs');
const path = require('path');
const schema = require('./schema.js');
const patreonTiers = require('./patreon-tiers.js');
const patreonSync = require('./patreon-sync.js');
const security = require('../utils/security.js');

/** Patreon CSV column names we use */
const CSV_COLS = ['Name', 'Email', 'Discord', 'Patron Status', 'Tier', 'Last Updated'];

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
            fields.push(line.slice(i, end).replace(/""/g, '"'));
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
        headers.forEach((h, idx) => {
            row[h] = values[idx] !== undefined ? String(values[idx]).trim() : '';
        });
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
    const d = new Date(s.replace(' ', 'T'));
    return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Run Patreon CSV import: update DB (add/on/off), store encrypted Email/Discord,
 * return report and keys. Never regens KEY.
 * @param {string} csvPathOrContent - File path (relative to cwd) or raw CSV string
 * @param {{ keyMode: 'all'|'newonly' }} options - all: list all keys for members in CSV; newonly: only keys for newly added members
 * @returns {Promise<{ report: string[], keys: string[], errors: string[] }>}
 */
async function runImport(csvPathOrContent, options = {}) {
    const keyMode = options.keyMode || 'all';
    const report = [];
    const keys = [];
    const errors = [];
    const newMemberKeys = new Set(); // keys of members created in this run

    let csvContent;
    const resolved = path.resolve(process.cwd(), csvPathOrContent);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        try {
            csvContent = fs.readFileSync(resolved, 'utf8');
        } catch (e) {
            errors.push('Read file failed: ' + e.message);
            return { report, keys, errors };
        }
    } else {
        csvContent = csvPathOrContent;
    }

    const { rows } = parseCSV(csvContent);
    if (rows.length === 0) {
        report.push('CSV 無資料或格式錯誤');
        return { report, keys, errors };
    }

    // Sort by Last Updated descending (newest first)
    rows.sort((a, b) => parseLastUpdated(b['Last Updated']) - parseLastUpdated(a['Last Updated']));

    const encrypt = (text) => (text != null && text !== '') ? security.encryptWithCryptoSecret(String(text)) : '';

    for (const row of rows) {
        const name = (row['Name'] || '').trim();
        if (!name) continue;

        const patronStatus = (row['Patron Status'] || '').trim();
        const tierName = (row['Tier'] || '').trim();
        const level = patreonTiers.csvTierNameToLevel(tierName);
        const isActive = patronStatus === 'Active patron';
        const isFormer = patronStatus === 'Former patron';
        const lastUpdatedStr = row['Last Updated'] || '';
        const lastUpdatedDate = lastUpdatedStr ? new Date(lastUpdatedStr.replace(' ', 'T')) : null;

        const existing = await schema.patreonMember.findOne({ patreonName: name }).lean();

        // Former patron: do not add new KEY; if was ON -> turn OFF and report
        if (isFormer) {
            if (existing && existing.switch) {
                try {
                    await patreonSync.clearVipEntriesByPatreonKey(existing.key);
                    await schema.patreonMember.updateOne(
                        { patreonName: name },
                        { $set: { switch: false }, $push: { history: { at: new Date(), action: 'off' } } }
                    );
                    report.push(`[Former patron] ${name} → 已關閉權限`);
                } catch (e) {
                    errors.push(`OFF ${name}: ${e.message}`);
                }
            }
            continue;
        }

        // Not Active (e.g. Declined): if was ON -> turn OFF and report
        if (!isActive) {
            if (existing && existing.switch) {
                try {
                    await patreonSync.clearVipEntriesByPatreonKey(existing.key);
                    await schema.patreonMember.updateOne(
                        { patreonName: name },
                        { $set: { switch: false }, $push: { history: { at: new Date(), action: 'off' } } }
                    );
                    report.push(`[Not Active] ${name} → 已關閉權限`);
                } catch (e) {
                    errors.push(`OFF ${name}: ${e.message}`);
                }
            }
            continue;
        }

        // Active but tier not 調查員+ : do not add, do not create KEY; leave existing as-is (no auto OFF)
        if (level == null) continue;

        const emailEncrypted = encrypt(row['Email']);
        const discordEncrypted = encrypt(row['Discord']);

        if (!existing) {
            // New member: add with new KEY (never regen)
            const zAdmin = require('../roll/z_admin.js');
            const key = typeof zAdmin.generatePatreonKey === 'function' ? zAdmin.generatePatreonKey() : null;
            if (!key) {
                errors.push(`無法產生 KEY: ${name}`);
                continue;
            }
            try {
                const historyEntry = { at: new Date(), action: 'on' };
                await schema.patreonMember.create({
                    patreonName: name,
                    key,
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
                await patreonSync.syncMemberSlotsToVip({ key, level, name, patreonName: name, slots: [] });
                report.push(`[新增] ${name} Tier ${patreonTiers.getTierLabel(level)} → 已開啟`);
            } catch (e) {
                errors.push(`Add ${name}: ${e.message}`);
            }
            continue;
        }

        // Existing: update level, encrypted fields, lastUpdated; ensure ON (no KEY regen)
        try {
            const historyEntry = { at: new Date(), action: 'on' };
            await schema.patreonMember.updateOne(
                { patreonName: name },
                {
                    $set: {
                        level,
                        name: name,
                        switch: true,
                        emailEncrypted,
                        discordEncrypted,
                        lastUpdatedFromPatreon: lastUpdatedDate || new Date()
                    },
                    $push: { history: historyEntry }
                },
                { runValidators: true }
            );
            const doc = await schema.patreonMember.findOne({ patreonName: name });
            await patreonSync.syncMemberSlotsToVip(doc);
            if (keyMode === 'all') {
                keys.push(doc.key);
            }
            report.push(`[更新] ${name} Tier ${patreonTiers.getTierLabel(level)} → 已開啟`);
        } catch (e) {
            errors.push(`Update ${name}: ${e.message}`);
        }
    }

    if (keyMode === 'newonly') {
        keys.length = 0;
        keys.push(...newMemberKeys);
        report.push(`\n此匯入僅顯示新加入會員的 KEY（共 ${newMemberKeys.size} 個）`);
    } else {
        report.push(`\n已列出所有處理中會員的 KEY（共 ${keys.length} 個）`);
    }

    return { report, keys, errors };
}

module.exports = {
    parseCSV,
    parseCSVLine,
    parseLastUpdated,
    runImport
};
