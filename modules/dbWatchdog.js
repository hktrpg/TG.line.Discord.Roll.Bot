"use strict";
const path = require('path');
const winston = require('winston');
const { format } = winston;
const schema = require('./schema.js');

// 常數配置
const CONFIG = {
    MAX_ERR_RETRY: 3,
    RETRY_TIME: 15 * 1000,
    MONGOD_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes
    MAX_ERR_RESPAWN: 10,
    LOG_FILE_SIZE: 5 * 1024 * 1024,
    MAX_LOG_FILES: 5
};

// 建立自定義 logger
const createLogger = () => {
    const severityLevelOnly = format(info => {
        info.severityLevel = info.level;
        delete info.level;
        delete info.service;
        delete info.severityLevel;
        return info;
    });

    return winston.createLogger({
        level: 'info',
        format: format.combine(
            severityLevelOnly(),
            format.json()
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: path.join(__dirname, '..', 'log', 'hktrpg-mongod.log'),
                level: 'info',
                maxFiles: CONFIG.MAX_LOG_FILES,
                maxsize: CONFIG.LOG_FILE_SIZE
            })
        ]
    });
};

class DbWatchdog {
    constructor() {
        this.dbConnErr = {
            timeStamp: Date.now(),
            retry: 0
        };
        this.logger = createLogger();
        this.init();
    }

    dbErrOccurs() {
        this.dbConnErr.retry++;
        this.dbConnErr.timeStamp = Date.now();
        console.error(`[dbWatchdog] Database connection error occurred. Error count: ${this.dbConnErr.retry}`);
    }

    isDbOnline() {
        return (this.dbConnErr.retry < CONFIG.MAX_ERR_RETRY);
    }

    isDbRespawn() {
        return (this.dbConnErr.retry > CONFIG.MAX_ERR_RESPAWN);
    }

    __dbErrorReset() {
        if (this.dbConnErr.retry > 0) {
            this.dbConnErr.retry = 0;
            console.log('[dbWatchdog] Database connection error counter reset');
        }
    }

    async __updateRecords() {
        if (!schema || !schema.mongodbState) {
            console.warn('[dbWatchdog] Schema or mongodbState model not available, skipping update');
            return;
        }

        const dbConnector = require('./db-connector.js');
        const mongoose = dbConnector.mongoose;

        // Check if mongoose connection is actually ready before attempting update
        if (mongoose.connection.readyState !== 1) {
            console.warn('[dbWatchdog] MongoDB connection not ready, skipping error record update');
            return;
        }

        try {
            // Wait for connection to be fully ready (with timeout)
            const maxWaitTime = 5000; // 5 seconds
            const startTime = Date.now();
            while (mongoose.connection.readyState !== 1 && (Date.now() - startTime) < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (mongoose.connection.readyState !== 1) {
                console.warn('[dbWatchdog] MongoDB connection not ready after waiting, skipping update');
                return;
            }

            // Use the model correctly - mongodbState is a Mongoose model
            const MongoDBState = schema.mongodbState;
            if (!MongoDBState || typeof MongoDBState.updateOne !== 'function') {
                console.warn('[dbWatchdog] mongodbState.updateOne is not a function, model may not be initialized');
                return;
            }

            await MongoDBState.updateOne(
                {},
                {
                    $set: {
                        errorDate: Date.now()
                    }
                },
                {
                    upsert: true
                }
            );

            this.__dbErrorReset();
        } catch (error) {
            // DB is likely down, just log it but DO NOT increment retry count here
            // causing a double count (one from original error, one from this update failure)
            console.warn('[dbWatchdog] Failed to update error record (DB likely offline):', error.message);
            // Removed: this.dbErrOccurs();
        }
    }

    init() {
        setInterval(
            async () => {
                if (!this.isDbOnline()) {
                    await this.__updateRecords();
                }
            },
            CONFIG.RETRY_TIME
        );
        setInterval(
            async () => {
                let ans = await schema.mongodbStateCheck();
                if (!ans) return;
                const currentdate = new Date();
                const datetime = "Time: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
                try {
                    // Only log if there's an error or connection is not successful
                    if (!ans.ok || ans.status !== "connected") {
                        this.logger.error(`${datetime}  mongodbState: ${JSON.stringify(ans)}`);
                    }
                } catch (error) {
                    this.logger.error(`Error logging MongoDB state: ${error.message}`);
                }
            },
            CONFIG.MONGOD_CHECK_INTERVAL
        );
    }

    discordClientRespawn(discordClient, id) {
        discordClient.cluster.send({ respawn: true, id });
    }
}

module.exports = new DbWatchdog();