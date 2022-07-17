"use strict";
const schema = require('./schema.js');

const MAX_ERR_RETRY = 3;
const RETRY_TIME = 1000 * 60 * 5;

let dbConnErr = {
    timeStamp: Date.now(),
    retry: 0
}

__init();

function dbErrOccurs() {
    dbConnErr.retry++;
    dbConnErr.timeStamp = Date.now();
}

function isDbOnline() {
    return (dbConnErr.retry < MAX_ERR_RETRY);
}

function __dbErrorReset() {
    dbConnErr.retry = 0;
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
        console.error('dbConnectionError updateRecords #36 error: ', err.name, err.reson);
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
}

module.exports = {
    dbErrOccurs,
    isDbOnline,
};