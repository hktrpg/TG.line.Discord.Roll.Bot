/**
 * Global Teardown for Integration Tests
 *
 * Cleans up MongoDB connection and test database
 */

const mongoose = require('mongoose');

module.exports = async () => {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Stop in-memory MongoDB server
    if (global.__MONGOSERVER__) {
        await global.__MONGOSERVER__.stop();
    }

    console.log('🗄️  Stopped in-memory MongoDB server');
};