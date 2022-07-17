"use strict";
const schema = require('./schema.js');

const MAX_ERR_RETRY = 3;
const RETRY_TIME = 1000 * 60;

let dbConnErr = {
    timeStamp: Date.now(),
    retry: 0
}
let timer = -1;
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
const randomNumber = Math.random()
function __init() {
    console.log('timer', timer)
    if (timer < 0) {
        console.log('setInterval')
        timer = setInterval(
            async () => {
                console.log("Hi I am " + randomNumber + " timer!!\n");
                if (!isDbOnline()) {
                    await __updateRecords();
                }
            },
            RETRY_TIME
        );
        console.log('timer2', timer)
    }
}

module.exports = {
    dbErrOccurs,
    isDbOnline,
};