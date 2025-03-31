"use strict";

require('dotenv').config({ override: true });
const fs = require('fs').promises;
const path = require('path');

// Configuration Management
const config = {
    modules: {
        directory: path.join(__dirname, 'modules'),
        pattern: /^core-.*\.js$/,
        lazyLoading: {
            enabled: process.env.LAZY_LOADING === 'true',
            defaultLoad: process.env.DEFAULT_LOAD === 'true'
        }
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
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    async writeToFile(message, isError = false) {
        const file = isError ? config.logging.errorFile : config.logging.logFile;
        const writePromise = fs.appendFile(file, message + '\n', 'utf8')
            .catch(err => console.error('Failed to write to log file:', err))
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
            await Promise.all(Array.from(this.writeQueue));
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
        this.modulePaths = new Map();
        this.lazyLoadingEnabled = config.modules.lazyLoading.enabled;
    }

    async loadModule(filePath, moduleName, forceLoad = false) {
        const startTime = process.hrtime();
        try {
            if (this.loadedModules.has(moduleName)) {
                logger.warn(`Module ${moduleName} is already loaded`);
                return;
            }

            // Store module path for lazy loading
            this.modulePaths.set(moduleName, filePath);

            // If lazy loading is enabled and forceLoad is false, just store the path
            if (this.lazyLoadingEnabled && !forceLoad) {
                logger.info(`Module ${moduleName} registered for lazy loading`);
                return;
            }

            await this._loadModuleImplementation(filePath, moduleName, startTime);
        } catch (err) {
            errorHandler(err, `Loading module ${moduleName}`);
            throw err;
        }
    }

    async _loadModuleImplementation(filePath, moduleName, startTime) {
        const module = require(filePath);
        this.modules.set(moduleName, module);
        this.loadedModules.add(moduleName);
        
        if (typeof module.initialize === 'function') {
            const initStartTime = process.hrtime();
            await module.initialize();
            const initEndTime = process.hrtime(initStartTime);
            logger.info(`Module ${moduleName} initialization took ${initEndTime[0]}s ${initEndTime[1] / 1000000}ms`);
        }

        const endTime = process.hrtime(startTime);
        logger.info(`Successfully loaded module: ${moduleName} (Total time: ${endTime[0]}s ${endTime[1] / 1000000}ms)`);
    }

    async getModule(moduleName) {
        // If module is already loaded, return it
        if (this.loadedModules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        // If lazy loading is enabled and module path exists, load it
        if (this.lazyLoadingEnabled && this.modulePaths.has(moduleName)) {
            const filePath = this.modulePaths.get(moduleName);
            await this._loadModuleImplementation(filePath, moduleName, process.hrtime());
            return this.modules.get(moduleName);
        }

        throw new Error(`Module ${moduleName} not found or not available for lazy loading`);
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
        } catch (err) {
            errorHandler(err, `Unloading module ${moduleName}`);
            throw err;
        }
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
                    // Force load if lazy loading is disabled or defaultLoad is true
                    const forceLoad = !config.modules.lazyLoading.enabled || config.modules.lazyLoading.defaultLoad;
                    await moduleManager.loadModule(filePath, moduleName, forceLoad);
                } catch (err) {
                    logger.error(`Failed to load module ${moduleName}:`, {
                        error: err.message,
                        stack: err.stack
                    });
                }
            });
        
        await Promise.all(modulePromises);
        logger.info('All modules registered successfully');
    } catch (err) {
        errorHandler(err, 'Reading modules directory');
        throw err;
    }
}

// Graceful Shutdown
async function gracefulShutdown(moduleManager) {
    logger.info('Starting graceful shutdown...');
    
    // Unload all loaded modules in parallel
    const unloadPromises = Array.from(moduleManager.loadedModules).map(moduleName => 
        moduleManager.unloadModule(moduleName).catch(err => {
            logger.error(`Failed to unload module ${moduleName}:`, {
                error: err.message,
                stack: err.stack
            });
        })
    );
    
    await Promise.all(unloadPromises);
    logger.info('Graceful shutdown completed');
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
        logger.info(`Module loading took ${loadEndTime[0]}s ${loadEndTime[1] / 1000000}ms`);

        logger.info('Application started successfully');

        // Setup shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown(moduleManager));
        process.on('SIGINT', () => gracefulShutdown(moduleManager));

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
        process.on('unhandledRejection', (reason, promise) => {
            // 檢查是否為數據庫認證錯誤
            if (reason.message && (reason.message.includes('bad auth') || reason.message.includes('Authentication failed'))) {
                errorHandler(reason, 'Database Authentication Error');
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
        logger.info(`Total initialization took ${endTime[0]}s ${endTime[1] / 1000000}ms`);

    } catch (err) {
        errorHandler(err, 'Initialization');
        process.exit(1);
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