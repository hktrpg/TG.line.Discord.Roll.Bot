"use strict";

// Requirements
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'mongoose'.
const mongoose = require('mongoose');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const cachegoose = require('recachegoose');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const schedule = require('node-schedule');

// Config
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const mongoUrl = process.env.mongoURL;
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
if (!mongoUrl) return;

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'restartTim... Remove this comment to see the full error message
const restartTime = '30 04 */3 * *';
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const master = require.main?.filename.includes('index');

// MongoDB Connection
mongoose.set('strictQuery', false);
cachegoose(mongoose, {
    engine: 'memory'
});

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'connect'.
async function connect() {
    try {
        await mongoose.connect(mongoUrl, {
            socketTimeoutMS: 15000
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
    }
}

// Connect on start
(async () => {
    await connect();
})();

// Reconnect cron job
const restartMongo = schedule.scheduleJob(restartTime, async () => {
    console.log(`${restartTime}: Reconnecting MongoDB...`);
    await restart();
});

async function restart() {
    await mongoose.connection.close();
    await connect();
}

// Handle connection errors
mongoose.connection.on('error', async (error: any) => {
    console.error('MongoDB Connection Error:', error);
    await restart();
});

// Export mongoose
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    mongoose
};