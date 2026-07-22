"use strict";

const JOB_NAME = 'dailyDiscordMaintenance';
const AGENDA_TIMEZONE = process.env.AGENDA_TIMEZONE || 'Asia/Hong_Kong';
const SCHEDULE_DOC_KEY = 'default';

/**
 * Build cron from day/hour/minute. dayOfWeek: 0=Sunday … 6=Saturday.
 * @param {{ dayOfWeek: number, hour: number, minute: number }} config
 * @returns {string}
 */
function buildCronExpression({ dayOfWeek, hour, minute }) {
    return `${minute} ${hour} * * ${dayOfWeek}`;
}

let agenda = null;
let getRespawnScheduleDoc = async () => null;
let syncDiscordMaintenanceSchedule = async () => ({ cancelled: false, registered: false });

if (process.env.mongoURL) {
    const Agenda = require("agenda");
    const dbConnector = require('./db-connector.js');
    const mongoose = dbConnector.mongoose;

    agenda = new Agenda({
        db: {
            address: process.env.mongoURL,
            collection: 'agendaAtHKTRPG',
            options: {
                maxPoolSize: 50,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 30_000,
                socketTimeoutMS: 45_000,
                connectTimeoutMS: 30_000
            }
        },
        maxConcurrency: 1000,
        defaultConcurrency: 50,
        processEvery: '30 seconds',
        lockLifetime: 10 * 60 * 1000,
        defaultLockLifetime: 10 * 60 * 1000
    });

    /**
     * Load schedule document from MongoDB (singleton).
     * @returns {Promise<object|null>}
     */
    getRespawnScheduleDoc = async function getRespawnScheduleDocImpl() {
        try {
            const schema = require('./schema.js');
            if (!schema.discordRespawnSchedule) return null;
            return await schema.discordRespawnSchedule.findOne({ key: SCHEDULE_DOC_KEY }).lean();
        } catch (error) {
            console.error('[Schedule] Failed to load respawn schedule:', error.message);
            return null;
        }
    };

    /**
     * Cancel existing job and optionally re-register from config.
     * Enabled only when enabled===true and day/hour/minute are valid.
     * @param {object} [doc] - Optional schedule doc; loads from DB if omitted.
     * @returns {Promise<{ cancelled: boolean, registered: boolean, cron?: string }>}
     */
    syncDiscordMaintenanceSchedule = async function syncDiscordMaintenanceScheduleImpl(doc) {
        const result = { cancelled: false, registered: false };
        try {
            await agenda.cancel({ name: JOB_NAME });
            result.cancelled = true;
        } catch (error) {
            console.error('[Schedule] Failed to cancel maintenance job:', error.message);
        }

        const config = doc === undefined ? await getRespawnScheduleDoc() : doc;
        if (!config || !config.enabled) {
            return result;
        }

        const dayOfWeek = Number(config.dayOfWeek);
        const hour = Number(config.hour);
        const minute = Number(config.minute);
        if (
            !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6
            || !Number.isInteger(hour) || hour < 0 || hour > 23
            || !Number.isInteger(minute) || minute < 0 || minute > 59
        ) {
            console.warn('[Schedule] Invalid respawn schedule config, job not registered');
            return result;
        }

        const cron = buildCronExpression({ dayOfWeek, hour, minute });
        try {
            await agenda.every(
                cron,
                JOB_NAME,
                {},
                {
                    skipImmediate: true,
                    timezone: AGENDA_TIMEZONE
                }
            );
            result.registered = true;
            result.cron = cron;
            console.log(`[Schedule] Discord respawn schedule registered: cron="${cron}" tz=${AGENDA_TIMEZONE}`);
        } catch (error) {
            console.error('[Schedule] Failed to register respawn schedule:', error.message);
        }
        return result;
    };

    (async function () {
        try {
            // Wait for MongoDB connection with improved check (compatible with Mongoose 9)
            let isConnectionReady = false;
            let attempts = 0;
            const maxAttempts = 30;

            while (!isConnectionReady && attempts < maxAttempts) {
                try {
                    const health = dbConnector.checkHealth();
                    isConnectionReady = health.isConnected && (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
                } catch {
                    isConnectionReady = mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;
                }

                if (!isConnectionReady) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                }
            }

            if (!isConnectionReady) {
                const readyState = mongoose.connection.readyState;
                if (readyState === 0 || readyState === 3 || readyState === 4) {
                    console.error(`[Schedule] MongoDB connection not ready (state: ${readyState}), cannot start Agenda`);
                } else {
                    console.warn(`[Schedule] MongoDB connection still connecting (state: ${readyState}), attempting to start Agenda anyway`);
                }

                if (readyState === 0 || readyState === 3 || readyState === 4) {
                    return;
                }
            }

            await agenda.start();
            // Opt-in only: cancel legacy hardcoded daily job, then sync from DB if enabled.
            await syncDiscordMaintenanceSchedule();
        } catch (error) {
            console.error(`[Schedule] Agenda start error:`, error);
            console.error(`[Schedule] Error stack:`, error.stack);
        }
    })();

    agenda.on("fail", (err, job) => {
        console.error(`[Schedule] Job '${job.attrs.name}' failed: ${err.message}`);
        if (job.attrs.failCount >= 3) {
            console.error(`[Schedule] Job '${job.attrs.name}' failed after 3 attempts`);
        }
    });

    agenda.on("error", (err) => {
        console.error(`[Schedule] Agenda error: ${err.message}`);
    });
}

module.exports = {
    agenda,
    JOB_NAME,
    AGENDA_TIMEZONE,
    SCHEDULE_DOC_KEY,
    buildCronExpression,
    getRespawnScheduleDoc,
    syncDiscordMaintenanceSchedule
};
