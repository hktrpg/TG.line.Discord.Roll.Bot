"use strict";

// Requirements
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
const schedule = require('node-schedule');

// Config
const mongoUrl = process.env.mongoURL;
if (!mongoUrl) return;

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;
const restartTime = '30 04 */3 * *';
const master = require.main?.filename.includes('index');

// MongoDB Connection
mongoose.set('strictQuery', false);
cachegoose(mongoose, {
    engine: 'memory'
});

async function connect(retries = 0) {
    try {
        await mongoose.connect(mongoUrl, {
            connectTimeoutMS: 1000 * 60 * 2,
            socketTimeoutMS: 1000 * 60 * 2,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');
        
        // 監控連線狀態
        mongoose.connection.on('disconnected', handleDisconnect);
        mongoose.connection.on('error', handleError);
        
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        
        if (retries < MAX_RETRIES) {
            console.log(`Retrying connection... (${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            return connect(retries + 1);
        }
        
        throw new Error('Failed to connect to MongoDB after max retries');
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
    console.log('Restarting MongoDB connection...');
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        await connect();
    } catch (error) {
        console.error('Restart failed:', error);
    }
}

function handleDisconnect() {
    console.log('MongoDB disconnected');
    restart();
} 

function handleError(error) {
    console.error('MongoDB connection error:', error);
    restart();
}

// Export mongoose
module.exports = {
    mongoose
};