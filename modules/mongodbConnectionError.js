"use strict";
const schema = require('./schema.js');
const mongodbConnectionErrorRetry = {
    LastTimeLog: Date.now(),
    error: 0
}
__init();




function mongodbErrorPlus() {
    mongodbConnectionErrorRetry.error++;
    mongodbConnectionErrorRetry.LastTimeLog = Date.now();
}

function mongodbIsOnline() {
    if (mongodbConnectionErrorRetry.error >= 5) return false
    else true;

}
function __mongodbErrorReset() {
    mongodbConnectionErrorRetry.error = 0;
}
async function __updateRecords() {
    try {
        await schema.mongodbState.updateOne({}, { $set: { errorDate: Date.now() } }, { upsert: true })
        __mongodbErrorReset();
    } catch (error) {
        console.error('mongodbConnectionError updateRecords #36 error: ', error.name, error.reson);
    }

}

function __init() {
    setInterval(async () => {
        if (mongodbIsOnline) return;
        else {
            await __updateRecords();
        }

    }, 1000 * 60 * 5)
}

module.exports = {
    mongodbErrorPlus,
    mongodbIsOnline
};