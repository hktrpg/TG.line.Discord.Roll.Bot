"use strict";
const winston = require('winston');
const path = require('path');
const { format } = require('logform');
const schema = require('./schema.js');

// 常數配置
const CONFIG = {
    MAX_ERR_RETRY: 3,
    RETRY_TIME: 15 * 1000,
    MONGOD_CHECK_INTERVAL: 10 * 60 * 1000,
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
        console.error('dbConnectionError dbErrOccurs #17 error times#', this.dbConnErr.retry);
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
            console.error('dbConnectionError dbErrorReset #25 dbConnErr.retry Reset');
        }
    }

    async __updateRecords() {
        try {
            await schema.mongodbState.updateOne(
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
        } catch (err) {
            console.error('dbConnectionError updateRecords #36 error: ', err.name);
            this.dbErrOccurs();
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
                let ans = await schema.mongodbState();
                if (!ans) return;
                const currentdate = new Date();
                const datetime = "Time: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
                try {
                    this.logger.info(`${datetime}  mongodbState: ${JSON.stringify(ans)}`);
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