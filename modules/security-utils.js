"use strict";

const validator = require('validator');

/**
 * Rate limiting tracker using Map
 * - key: IP or userId
 * - value: {lastRequest: timestamp, count: number}
 */
const rateLimitMap = new Map();

/**
 * Sanitizes chat message content to prevent XSS and NoSQL injection
 * @param {string} content - The string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeContent(content) {
    if (!content) return '';
    
    // Convert to string if not already
    const str = String(content);
    
    // Escape HTML to prevent XSS
    return validator.escape(str.trim());
}

/**
 * Sanitizes user input for MongoDB queries to prevent NoSQL injection
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeMongoDbInput(input) {
    if (!input) return '';
    
    const str = String(input);
    
    // Remove MongoDB operators
    return str.replace(/\$|\{|\}|\[|\]|\(|\)|\.{2,}|^\.|\.$|\\|\/\//g, '');
}

/**
 * Validates and sanitizes chat room message object
 * @param {Object} msg - The message object
 * @returns {Object} - Validated and sanitized message object
 */
function validateChatMessage(msg) {
    if (!msg) throw new Error('Message cannot be empty');
    
    const sanitized = {};
    
    // Sanitize all fields
    if (typeof msg.name === 'string') {
        sanitized.name = sanitizeContent(msg.name).substring(0, 50);
    } else {
        sanitized.name = 'Anonymous';
    }
    
    if (typeof msg.msg === 'string') {
        sanitized.msg = sanitizeContent(msg.msg).substring(0, 1000);
    } else {
        sanitized.msg = '';
    }
    
    if (typeof msg.roomNumber === 'string') {
        sanitized.roomNumber = sanitizeMongoDbInput(msg.roomNumber).substring(0, 50);
    } else {
        sanitized.roomNumber = 'public';
    }
    
    // Ensure time is a valid Date
    sanitized.time = msg.time && new Date(msg.time).toString() !== 'Invalid Date' 
        ? new Date(msg.time) 
        : new Date();
        
    return sanitized;
}

/**
 * Rate limiting function to prevent abuse
 * @param {string} identifier - User identifier (IP or userId)
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - true if not rate limited, false if rate limited
 */
function checkRateLimit(identifier, maxRequests = 5, windowMs = 5000) {
    const now = Date.now();
    const userLimit = rateLimitMap.get(identifier);
    
    if (!userLimit) {
        rateLimitMap.set(identifier, { lastRequest: now, count: 1 });
        return true;
    }
    
    // Reset counter if outside time window
    if (now - userLimit.lastRequest > windowMs) {
        rateLimitMap.set(identifier, { lastRequest: now, count: 1 });
        return true;
    }
    
    // Increment counter if within window
    if (userLimit.count < maxRequests) {
        rateLimitMap.set(identifier, { lastRequest: now, count: userLimit.count + 1 });
        return true;
    }
    
    // Rate limit exceeded
    return false;
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupRateLimits() {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.lastRequest > 60000) { // 1 minute
            rateLimitMap.delete(key);
        }
    }
}

// Clean up rate limit map every minute
setInterval(cleanupRateLimits, 60000);

module.exports = {
    sanitizeContent,
    sanitizeMongoDbInput,
    validateChatMessage,
    checkRateLimit
};
