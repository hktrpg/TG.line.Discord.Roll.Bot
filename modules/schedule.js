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
        // Wait for MongoDB connection with improved check (compatible with Mongoose 9)
        let isConnectionReady = false;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!isConnectionReady && attempts < maxAttempts) {
            try {
                // Check connection status using checkHealth
                const health = dbConnector.checkHealth();
                // Connection is ready if: readyState is 1 (connected) or 2 (connecting), and isConnected flag is true
                // State 2 (connecting) is acceptable as operations can be buffered
                isConnectionReady = health.isConnected && (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
            } catch {
                // Fallback: Check readyState directly (1 = connected, 2 = connecting)
                isConnectionReady = mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;
            }
            
            if (!isConnectionReady) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        
        // Final check before starting Agenda
        if (!isConnectionReady) {
            const readyState = mongoose.connection.readyState;
            // Only log error if connection is actually disconnected (state 0, 3, or 4)
            if (readyState === 0 || readyState === 3 || readyState === 4) {
                console.error(`[Schedule] MongoDB connection not ready (state: ${readyState}), cannot start Agenda`);
            } else {
                // If connecting (state 2), try to start anyway as Mongoose can buffer operations
                console.warn(`[Schedule] MongoDB connection still connecting (state: ${readyState}), attempting to start Agenda anyway`);
            }
            
            // If not connected and not connecting, return early
            if (readyState === 0 || readyState === 3 || readyState === 4) {
                return;
            }
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