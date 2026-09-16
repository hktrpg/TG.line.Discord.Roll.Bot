'use strict';

/* eslint-disable n/no-process-exit -- CLI seed script */

/**
 * Seed local/dev Session Log test author + admin accounts.
 *
 * Usage:
 *   node scripts/seed-session-log-accounts.js
 *   node scripts/seed-session-log-accounts.js --force   # reset passwords / isAdmin
 *
 * Defaults (override with env):
 *   SESSION_LOG_TEST_USER=testauthor
 *   SESSION_LOG_TEST_PASSWORD=TestAuthor123!
 *   SESSION_LOG_TEST2_USER=testauthor2
 *   SESSION_LOG_TEST2_PASSWORD=TestAuthor123!
 *   SESSION_LOG_ADMIN_USER=admin
 *   SESSION_LOG_ADMIN_PASSWORD=AdminTest123!
 */

require('dotenv').config({ quiet: true });

const crypto = require('node:crypto');
const security = require('../utils/security.js');

const force = process.argv.includes('--force');

const ACCOUNTS = [
    {
        userName: process.env.SESSION_LOG_TEST_USER || 'testauthor',
        password: process.env.SESSION_LOG_TEST_PASSWORD || 'TestAuthor123!',
        isAdmin: false,
        idPrefix: 'test-author',
    },
    {
        userName: process.env.SESSION_LOG_TEST2_USER || 'testauthor2',
        password: process.env.SESSION_LOG_TEST2_PASSWORD || 'TestAuthor123!',
        isAdmin: false,
        idPrefix: 'test-author-2',
    },
    {
        userName: process.env.SESSION_LOG_ADMIN_USER || 'admin',
        password: process.env.SESSION_LOG_ADMIN_PASSWORD || 'AdminTest123!',
        isAdmin: true,
        idPrefix: 'test-admin',
    },
];

async function upsertAccount(schema, account) {
    const existing = await schema.accountPW.findOne({ userName: account.userName });
    const hash = await security.hashPassword(account.password);

    if (existing) {
        if (!force) {
            console.log(`skip existing: ${account.userName} (isAdmin=${Boolean(existing.isAdmin)})`);
            return { userName: account.userName, created: false, isAdmin: Boolean(existing.isAdmin) };
        }
        existing.password = hash;
        existing.isAdmin = account.isAdmin;
        if (!existing.id) {
            existing.id = `${account.idPrefix}-${crypto.randomBytes(4).toString('hex')}`;
        }
        await existing.save();
        console.log(`updated: ${account.userName} (isAdmin=${account.isAdmin})`);
        return { userName: account.userName, created: false, updated: true, isAdmin: account.isAdmin };
    }

    await schema.accountPW.create({
        id: `${account.idPrefix}-${crypto.randomBytes(4).toString('hex')}`,
        userName: account.userName,
        password: hash,
        isAdmin: account.isAdmin,
        channel: [],
    });
    console.log(`created: ${account.userName} (isAdmin=${account.isAdmin})`);
    return { userName: account.userName, created: true, isAdmin: account.isAdmin };
}

async function main() {
    if (!process.env.mongoURL) {
        console.error('mongoURL not set in environment / .env');
        process.exit(1);
    }
    if (!security.hashPassword) {
        console.error('security.hashPassword unavailable');
        process.exit(1);
    }

    const schema = require('../modules/db/schema.js');
    await new Promise((resolve) => setTimeout(resolve, 2500));

    console.log(force ? 'Seeding with --force (passwords/isAdmin reset)…' : 'Seeding (skip existing)…');
    const results = [];
    for (const account of ACCOUNTS) {
        results.push(await upsertAccount(schema, account));
    }

    console.log('\nAccounts ready:');
    for (const account of ACCOUNTS) {
        console.log(`  ${account.userName} / ${account.password}  [${account.isAdmin ? 'ADMIN' : 'author'}]`);
    }
    console.log('\nAdmin console: /logs/admin');
    console.log('Author console: /logs');
    console.log(`Done. ${results.filter((item) => item.created).length} created, ${results.filter((item) => item.updated).length} updated.`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
