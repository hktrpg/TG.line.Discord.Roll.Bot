"use strict";
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const winston = require('winston');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'path'.
const path = require('path');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const { format } = require('logform');
const { combine, timestamp, printf, json } = format;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
const MAX_ERR_RETRY = 3;
const RETRY_TIME = 15 * 1000;// 每15秒更新;
const mongod_RETRY_TIME = 10 * 60 * 1000;// 每10分鐘更新;
const MAX_ERR_RESPAWN = 10;
let dbConnErr = {
    timeStamp: Date.now(),
    retry: 0
}
const severityLevelOnly = format((info: any) => {
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
    // @ts-expect-error TS(1117): An object literal cannot have multiple properties ... Remove this comment to see the full error message
    format: combine(
        severityLevelOnly(),
        json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            // @ts-expect-error TS(2304): Cannot find name '__dirname'.
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
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
function discordClientRespawn(discordClient: any, id: any) {
    discordClient.cluster.send({ respawn: true, id });
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    dbErrOccurs,
    isDbOnline,
    discordClientRespawn,
    isDbRespawn
};