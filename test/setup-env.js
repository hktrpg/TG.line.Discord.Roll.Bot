/**
 * Setup file to run before Jest starts
 * Sets up environment variables before any module loading
 */

// Set MongoDB URL early to prevent schema.js from early return
process.env.mongoURL = process.env.mongoURL || 'mongodb://localhost:27017/test';

console.log('🚀 Early environment setup - MongoDB URL set');