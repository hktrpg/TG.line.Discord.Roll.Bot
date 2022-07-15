"use strict";
const schema = require('./schema.js');
const maxErrorRetry = 3;
const retryTime = 1000 * 60 * 5;
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
    if (dbConnErrRetry.errorCount >= maxErrorRetry) return false
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

    }, retryTime)
}

module.exports = {
    dbErrorCourtPlus,
    IsDbOnline
};