/**
 * Global Teardown for Integration Tests
 *
 * Cleans up MongoDB connection and test database
 */

const mongoose = require('mongoose');

async function globalTeardown() {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Stop in-memory MongoDB server
    if (globalThis.__MONGOSERVER__) {
        await globalThis.__MONGOSERVER__.stop();
    }

    console.log('🗄️  Stopped in-memory MongoDB server');
}

module.exports = globalTeardown;