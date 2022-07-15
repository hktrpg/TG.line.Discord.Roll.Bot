"use strict";
const schema = require('./schema.js');
const MAX_ERR_RETRY = 3;
const RETRY_TIME = 1000 * 60 * 5;
const dbConnErrRetry = {
    LastTimeLog: Date.now(),
    errorCount: 0
}
__init();




function dbErrorCourtPlus() {
    dbConnErrRetry.errorCount++;
    dbConnErrRetry.LastTimeLog = Date.now();
}

function IsDbOnline() {
    if (dbConnErrRetry.errorCount >= MAX_ERR_RETRY) return false
    else true;

}
function __dbErrorReset() {
    dbConnErrRetry.errorCount = 0;
}
async function __updateRecords() {
    try {
        await schema.mongodbState.updateOne({}, { $set: { errorDate: Date.now() } }, { upsert: true })
        __dbErrorReset();
    } catch (error) {
        console.error('dbConnectionError updateRecords #36 error: ', error.name, error.reson);
    }

}

function __init() {
    setInterval(async () => {
        if (IsDbOnline) return;
        else {
            await __updateRecords();
        }

    }, RETRY_TIME)
}

module.exports = {
    dbErrorCourtPlus,
    IsDbOnline
};