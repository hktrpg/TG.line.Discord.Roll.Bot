/**
 * Global Setup for All Tests
 *
 * Sets up in-memory MongoDB for all tests to enable database testing
 * without requiring external MongoDB instances
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

async function globalSetup() {
    try {
        // Check if we should use real MongoDB (for production testing)
        if (process.env.USE_REAL_MONGODB === 'true' && process.env.mongoURL) {
            console.log('🗄️  Using real MongoDB for tests:', process.env.mongoURL);
            return;
        }

        // Start in-memory MongoDB server for all tests
        console.log('🗄️  Starting in-memory MongoDB server for all tests...');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Set environment variable for all tests
        process.env.mongoURL = mongoUri;
        process.env.MONGODB_MEMORY_SERVER_URI = mongoUri;

        // Store server instance for cleanup
        globalThis.__MONGOSERVER__ = mongoServer;

        console.log('✅ In-memory MongoDB server started successfully');
        console.log('📍 MongoDB URI:', mongoUri);

    } catch (error) {
        console.error('❌ Failed to start in-memory MongoDB server:', error);
        throw error;
    }
}

module.exports = globalSetup;