"use strict";

require('dotenv').config({ override: true });
const fs = require('fs').promises;
const path = require('path');

// Configuration Management
const config = {
    modules: {
        directory: path.join(__dirname, 'modules'),
        pattern: /^core-.*\.js$/
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logFile: 'app.log',
        errorFile: 'error.log'
    }
};

// Logging System
class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.currentLevel = this.levels[config.logging.level] || this.levels.info;
        this.writeQueue = new Set();
        
        // 🔒 Sensitive fields to redact
        this.sensitiveFields = new Set([
            'password',
            'userPassword',
            'token',
            'secret',
            'apiKey',
            'accessToken',
            'refreshToken',
            'privateKey',
            'sessionId',
            'cookie',
            'authorization'
        ]);
    }

    // 🔒 Sanitize sensitive information from logs
    sanitizeData(data) {
        if (typeof data === 'string') {
            // Redact potential tokens/keys in strings
            return data.replace(/([a-zA-Z0-9_-]{20,})/g, (match) => {
                if (match.length > 30) {
                    return '[REDACTED_TOKEN]';
                }
                return match;
            });
        }
        
        if (data && typeof data === 'object') {
            const sanitized = Array.isArray(data) ? [...data] : { ...data };
            
            for (const key in sanitized) {
                const lowerKey = key.toLowerCase();
                
                // Check if key contains sensitive terms
                const isSensitive = Array.from(this.sensitiveFields).some(field => 
                    lowerKey.includes(field.toLowerCase())
                );
                
                if (isSensitive) {
                    sanitized[key] = '[REDACTED]';
                } else if (sanitized[key] && typeof sanitized[key] === 'object') {
                    sanitized[key] = this.sanitizeData(sanitized[key]);
                }
            }
            
            return sanitized;
        }
        
        return data;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        // 🔒 Sanitize meta data before logging
        const sanitizedMeta = this.sanitizeData(meta);
        const metaStr = Object.keys(sanitizedMeta).length > 0 ? ` ${JSON.stringify(sanitizedMeta)}` : '';
        // 🔒 Sanitize message
        const sanitizedMessage = this.sanitizeData(message);
        return `[${timestamp}] [${level.toUpperCase()}] ${sanitizedMessage}${metaStr}`;
    }

    async writeToFile(message, isError = false) {
        const file = isError ? config.logging.errorFile : config.logging.logFile;
        const writePromise = fs.appendFile(file, message + '\n', 'utf8')
            .catch(error => console.error('Failed to write to log file:', error))
            .finally(() => this.writeQueue.delete(writePromise));
        
        this.writeQueue.add(writePromise);
        return writePromise;
    }

    async error(message, meta = {}) {
        if (this.currentLevel >= this.levels.error) {
            const formattedMessage = this.formatMessage('error', message, meta);
            console.error(formattedMessage);
            this.writeToFile(formattedMessage, true);
        }
    }

    async warn(message, meta = {}) {
        if (this.currentLevel >= this.levels.warn) {
            const formattedMessage = this.formatMessage('warn', message, meta);
            console.warn(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    async info(message, meta = {}) {
        if (this.currentLevel >= this.levels.info) {
            const formattedMessage = this.formatMessage('info', message, meta);
            console.info(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    async debug(message, meta = {}) {
        if (this.currentLevel >= this.levels.debug) {
            const formattedMessage = this.formatMessage('debug', message, meta);
            console.debug(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    // 新增：等待所有日誌寫入完成
    async flush() {
        if (this.writeQueue.size > 0) {
            await Promise.all(this.writeQueue);
        }
    }
}

const logger = new Logger();

// Unified Error Handler
const errorHandler = (error, context) => {
    logger.error(`Error in ${context}:`, {
        error: error.message,
        stack: error.stack,
        context
    });
};

// Module Management
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
    }

    async loadModule(filePath, moduleName) {
        const startTime = process.hrtime();
        try {
            if (this.loadedModules.has(moduleName)) {
                logger.warn(`Module ${moduleName} is already loaded`);
                return;
            }

            const module = require(filePath);
            this.modules.set(moduleName, module);
            this.loadedModules.add(moduleName);
            
            // Call initialize method if available
            if (typeof module.initialize === 'function') {
                const initStartTime = process.hrtime();
                await module.initialize();
                const initEndTime = process.hrtime(initStartTime);
                logger.info(`Module ${moduleName} initialization took ${initEndTime[0]}s ${initEndTime[1] / 1_000_000}ms`);
            }

            const endTime = process.hrtime(startTime);
            logger.info(`Successfully loaded module: ${moduleName} (Total time: ${endTime[0]}s ${endTime[1] / 1_000_000}ms)`);
        } catch (error) {
            errorHandler(error, `Loading module ${moduleName}`);
            throw error;
        }
    }

    async unloadModule(moduleName) {
        try {
            const module = this.modules.get(moduleName);
            if (module && typeof module.shutdown === 'function') {
                await module.shutdown();
            }
            this.modules.delete(moduleName);
            this.loadedModules.delete(moduleName);
            logger.info(`Successfully unloaded module: ${moduleName}`);
        } catch (error) {
            errorHandler(error, `Unloading module ${moduleName}`);
            throw error;
        }
    }

    getModule(moduleName) {
        return this.modules.get(moduleName);
    }
}

// Asynchronous Module Loading
async function loadModules(moduleManager) {
    try {
        const files = await fs.readdir(config.modules.directory);
        const modulePromises = files
            .filter(file => file.match(config.modules.pattern))
            .map(async file => {
                const moduleName = file.replace('.js', '');
                const filePath = path.join(config.modules.directory, file);
                try {
                    await moduleManager.loadModule(filePath, moduleName);
                } catch (error) {
                    logger.error(`Failed to load module ${moduleName}:`, {
                        error: error.message,
                        stack: error.stack
                    });
                    // 不拋出錯誤，讓其他模塊繼續加載
                }
            });
        
        await Promise.all(modulePromises);
        logger.info('All modules loaded successfully');
    } catch (error) {
        errorHandler(error, 'Reading modules directory');
        throw error;
    }
}

// Graceful Shutdown
async function gracefulShutdown(moduleManager) {
    logger.info('Starting graceful shutdown...');
    
    // Unload all loaded modules in parallel
    const unloadPromises = [...moduleManager.loadedModules].map(moduleName => 
        moduleManager.unloadModule(moduleName).catch(error => {
            logger.error(`Failed to unload module ${moduleName}:`, {
                error: error.message,
                stack: error.stack
            });
        })
    );
    
    await Promise.all(unloadPromises);
    logger.info('Graceful shutdown completed');
    
    // Flush any pending logs before exit
    await logger.flush();
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
}

// Application Initialization
async function init() {
    const startTime = process.hrtime();
    const moduleManager = new ModuleManager();
    
    try {
        // Load modules
        const loadStartTime = process.hrtime();
        await loadModules(moduleManager);
        const loadEndTime = process.hrtime(loadStartTime);
        logger.info(`Module loading took ${loadEndTime[0]}s ${loadEndTime[1] / 1_000_000}ms`);

        logger.info('Application started successfully');

        // Setup shutdown handlers with delay to allow Discord modules to handle their own shutdown
        process.on('SIGTERM', () => {
            logger.info('Received SIGTERM signal, starting graceful shutdown...');
            // Give Discord modules time to handle their own shutdown
            setTimeout(() => gracefulShutdown(moduleManager), 5000);
        });
        process.on('SIGINT', () => {
            logger.info('Received SIGINT signal, starting graceful shutdown...');
            // Give Discord modules time to handle their own shutdown
            setTimeout(() => gracefulShutdown(moduleManager), 5000);
        });

        // Handle process warnings
        process.on('warning', (warning) => {
            errorHandler(warning, 'Process Warning');
        });

        // Handle stdout errors
        process.stdout.on('error', (err) => {
            if (err.code === "EPIPE") {
                errorHandler(err, 'STDOUT EPIPE');
            }
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            errorHandler(err, 'Uncaught Exception');
            gracefulShutdown(moduleManager);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason) => {
            // 檢查是否為數據庫相關錯誤
            if (reason.message && (
                reason.message.includes('MongoDB') ||
                reason.message.includes('bad auth') ||
                reason.message.includes('Authentication failed') ||
                reason.message.includes('connection timed out') ||
                reason.message.includes('MongoServerSelectionError')
            )) {
                errorHandler(reason, 'Database Connection Error');
                // 不關閉應用程序，讓重連機制處理
                return;
            }
            
            errorHandler(reason, 'Unhandled Promise Rejection');
            // 只有在非數據庫錯誤時才關閉應用程序
            if (!reason.message || !reason.message.includes('MongoDB')) {
                gracefulShutdown(moduleManager);
            }
        });

        const endTime = process.hrtime(startTime);
        logger.info(`Total initialization took ${endTime[0]}s ${endTime[1] / 1_000_000}ms`);

    } catch (error) {
        errorHandler(error, 'Initialization');
        // Flush logs before throwing error
        await logger.flush();
        throw new Error(`Application initialization failed: ${error.message}`);
    }
}

// Start Application
init();

/*
System Architecture Overview:

1. Module Loading System
   - Automatically loads all .js files starting with 'core-' from the modules directory
   - Supports module initialization (initialize) and cleanup (shutdown) methods
   - Prevents duplicate module loading

2. Error Handling
   - Unified error handling mechanism
   - Detailed error logging
   - Graceful error recovery

3. Logging System
   - Native console-based logging implementation
   - Supports multiple log levels (error, warn, info, debug)
   - Outputs to both console and files
   - Separate error and general log files

4. Configuration Management
   - Centralized system configuration
   - Environment variable override support
   - Extensible configuration structure

5. Graceful Shutdown
   - Handles SIGTERM and SIGINT signals
   - Ensures proper module cleanup
   - Prevents data loss

Usage Instructions:
1. Adding Dice Groups: Reference the DEMO dice group in the /roll directory
2. All BOTs (Discord, Line, Telegram) are processed through analytics.js
3. Ensure proper TOKEN environment variables are set

Important Notes:
1. Keep the code open source
2. Follow modular design principles
3. Ensure comprehensive error handling
*/