'use strict';

/**
 * Migrate existing sessionLog documents to commercial Work schema v2.
 *
 * Usage:
 *   node scripts/migrate-session-log-works.js --dry-run
 *   node scripts/migrate-session-log-works.js
 */

require('dotenv').config({ quiet: true });

const { buildChaptersFromEvents } = require('../modules/session-log/chapters.js');

const dryRun = process.argv.includes('--dry-run');

async function main() {
    if (!process.env.mongoURL) {
        console.error('mongoURL not set');
        process.exit(1);
    }

    const schema = require('../modules/db/schema.js');
    // Wait briefly for mongoose connection used by schema module
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cursor = schema.sessionLog.find({}).cursor();
    let scanned = 0;
    let updated = 0;

    for await (const doc of cursor) {
        scanned += 1;
        const patch = {};
        if (!doc.status) patch.status = 'published';
        if (!doc.rating) patch.rating = 'general';
        if (!doc.license) patch.license = 'all_rights_reserved';
        if (!doc.originality) patch.originality = 'original';
        if (!Array.isArray(doc.tags)) patch.tags = [];
        if (!Array.isArray(doc.contentWarnings)) patch.contentWarnings = [];
        if (!doc.stats) patch.stats = { views: 0, reads: 0 };
        if (!doc.moderation) patch.moderation = { state: 'ok' };
        if (!Array.isArray(doc.chapters) || doc.chapters.length === 0) {
            patch.chapters = buildChaptersFromEvents(doc.events || []);
        }
        if (doc.importSource === 'manual') {
            // keep as-is; optional remap to manual_md left to authors
        }

        if (Object.keys(patch).length === 0) continue;
        updated += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}update ${doc._id} ${doc.title}:`, Object.keys(patch).join(', '));
        if (!dryRun) {
            Object.assign(doc, patch);
            await doc.save();
        }
    }

    console.log(`Done. scanned=${scanned} updated=${updated} dryRun=${dryRun}`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
