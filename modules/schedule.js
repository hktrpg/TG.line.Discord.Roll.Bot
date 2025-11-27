"use strict";
if (!process.env.mongoURL) {
    return;
}
const restartTime = '55 4 * * *';
const Agenda = require("agenda");
const dbConnector = require('./db-connector.js');
const mongoose = dbConnector.mongoose;

const agenda = new Agenda({ 
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

(async function () {
    try {
        const waitForConnection = dbConnector.waitForConnection;
        if (waitForConnection) {
            await waitForConnection(30_000);
        } else {
            let attempts = 0;
            while (mongoose.connection.readyState !== 1 && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        
        if (mongoose.connection.readyState !== 1) {
            console.error('[Schedule] MongoDB connection not ready, cannot start Agenda');
            return;
        }
        
        await agenda.start();
        await agenda.every(restartTime, '0455restartdiscord');
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

module.exports = {
    agenda
};