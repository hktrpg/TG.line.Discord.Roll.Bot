"use strict";
const winston = require('winston');
const path = require('path');
const { format } = require('logform');
const { combine, timestamp, printf, json } = format;
const schema = require('./schema.js');
const MAX_ERR_RETRY = 3;
const RETRY_TIME = 15 * 1000;// 每15秒更新;
const mongod_RETRY_TIME = 10 * 60 * 1000;// 每10分鐘更新;
const MAX_ERR_RESPAWN = 10;
let dbConnErr = {
    timeStamp: Date.now(),
    retry: 0
}
const severityLevelOnly = format(info => {
    info.severityLevel = info.level;
    delete info.level;
    delete info.service;
    delete info.severityLevel;
    return info;
});
__init();


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    format: combine(
        severityLevelOnly(),
        json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, "..", 'log/', 'hktrpg-mongod.log'),
            level: 'info',
            maxFiles: 5,
            maxsize: 5 * 1024 * 1024
        })
    ],
});




function dbErrOccurs() {
    dbConnErr.retry++;
    dbConnErr.timeStamp = Date.now();
    console.error('dbConnectionError dbErrOccurs #17 error times#', dbConnErr.retry);
}

function isDbOnline() {
    //console.log('!!', dbConnErr.retry < MAX_ERR_RETRY)
    return (dbConnErr.retry < MAX_ERR_RETRY);
}

function isDbRespawn() {
    return (dbConnErr.retry > MAX_ERR_RESPAWN)
}

function __dbErrorReset() {
    if (dbConnErr.retry > 0) {
        dbConnErr.retry = 0;
        console.error('dbConnectionError dbErrorReset #25 dbConnErr.retry Reset');
    }
}

async function __updateRecords() {
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

        __dbErrorReset();
    } catch (err) {
        console.error('dbConnectionError updateRecords #36 error: ', err.name);
        dbErrOccurs();
    }
}

function __init() {
    setInterval(
        async () => {
            if (!isDbOnline()) {
                await __updateRecords();
            }
        },
        RETRY_TIME
    );
    setInterval(
        async () => {
            let ans = await schema.mongodbState();
            if (!ans) return;
            console.log(ans)
            const currentdate = new Date();
            const datetime = "Time: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            try {
                logger.info(`${datetime}  mongodbState: ${JSON.stringify(ans.connections)}`);
            } catch (error) {

            }

        },
        mongod_RETRY_TIME
    );
}
function discordClientRespawn(discordClient, id) {
    discordClient.cluster.send({ respawn: true, id });
}

module.exports = {
    dbErrOccurs,
    isDbOnline,
    discordClientRespawn,
    isDbRespawn
};