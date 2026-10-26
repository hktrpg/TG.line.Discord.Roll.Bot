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
    // Preserve shared connector startup, but Agenda owns a separate Mongo client:
    // Mongoose's readyState cannot tell us whether Agenda's collection is ready.
    require('../db/connector.js');

    let resolveReady;
    let rejectReady;
    const databaseReady = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
    });
    // Initialization can fail before a command awaits readiness. Handle that
    // rejection immediately, without converting the original promise to success.
    databaseReady.catch(() => {});

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
    }, error => {
        // Agenda 4 throws asynchronous connection errors when this callback is
        // omitted; an `error` event listener alone cannot intercept that path.
        if (error) rejectReady(error);
        else resolveReady();
    });
    // Agenda's default _ready only resolves on "ready" and never rejects. Keep
    // one rejectable boundary for startup, ensureAgendaReady(), and Agenda
    // operations that wait on _ready.
    agenda._ready = databaseReady;

    /**
     * Load schedule document from MongoDB (singleton).
     * @returns {Promise<object|null>}
     */
    getRespawnScheduleDoc = async function getRespawnScheduleDocImpl() {
        try {
            const schema = require('../db/schema.js');
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
            await databaseReady;

            // Roll Worker must not process Agenda jobs (platform Send handlers live on gateways).
            // Still await Agenda Mongo ready — z_schedule.schedule()/jobs() need _collection.
            if (process.env.ROLL_WORKER_MODE === 'true') {
                return;
            }

            await agenda.start();
            // Silent on success — Agenda processor start is expected on every Gateway boot.
            await syncDiscordMaintenanceSchedule();
        } catch (error) {
            // Driver messages may contain connection details. Report the category
            // without printing a URI, credentials, or an unfiltered error object.
            console.error('[Schedule] Agenda initialization/start failed:', error?.code || error?.name || 'Error');
        }
    })();

    agenda.on("fail", (err, job) => {
        console.error(`[Schedule] Job '${job.attrs.name}' failed: ${err.message}`);
        if (job.attrs.failCount >= 3) {
            console.error(`[Schedule] Job '${job.attrs.name}' failed after 3 attempts`);
        }
    });

    agenda.on("error", (err) => {
        rejectReady(err);
        console.error('[Schedule] Agenda error:', err?.code || err?.name || 'Error');
    });
}

/**
 * Wait until Agenda's Mongo collection is usable (schedule/jobs/create).
 * Safe on Gateway (after start) and Roll Worker (API-only, no processor).
 */
async function ensureAgendaReady() {
    if (!agenda) {
        throw new Error('Agenda is not configured (mongoURL missing)');
    }
    await agenda._ready;
    if (!agenda._collection) {
        throw new Error('Agenda Mongo collection is not ready');
    }
    return agenda;
}

module.exports = {
    agenda,
    ensureAgendaReady,
    JOB_NAME,
    AGENDA_TIMEZONE,
    SCHEDULE_DOC_KEY,
    buildCronExpression,
    getRespawnScheduleDoc,
    syncDiscordMaintenanceSchedule
};
