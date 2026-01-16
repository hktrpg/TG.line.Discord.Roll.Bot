/**
 * Setup file to run after Jest environment setup
 * Ensures MongoDB URL is set for all tests
 */

// Ensure mongoURL is set (should be set by global-setup.js)
// If not set, use the in-memory MongoDB URI
if (!process.env.mongoURL) {
    process.env.mongoURL = process.env.MONGODB_MEMORY_SERVER_URI || 'mongodb://localhost:27017/test';
}

console.log('🔧 Test environment setup complete - MongoDB URL:', process.env.mongoURL ? 'SET' : 'NOT SET');