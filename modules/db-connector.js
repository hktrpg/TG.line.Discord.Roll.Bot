"use strict";

// Requirements
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
const schedule = require('node-schedule');

// Config
const mongoUrl = process.env.mongoURL;
if (!mongoUrl) return;

const restartTime = '30 04 */3 * *';
const master = require.main?.filename.includes('index');

// MongoDB Connection
mongoose.set('strictQuery', false);
cachegoose(mongoose, {
    engine: 'memory'
});

async function connect() {
    try {
        await mongoose.connect(mongoUrl, {
            connectTimeoutMS: 1000 * 60 * 2,
            socketTimeoutMS: 1000 * 60 * 2
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
    console.log('Restarting MongoDB...');
    await mongoose.connection.close();
    await connect();
}

// Handle connection errors
mongoose.connection.on('error', async (error) => {
    console.error('MongoDB Connection Error:', error);
    await restart();
});

// Export mongoose
module.exports = {
    mongoose
};