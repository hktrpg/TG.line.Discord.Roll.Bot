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
    },
    restart: {
        maxRetries: 5,
        retryInterval: 1000
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
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    async writeToFile(message, isError = false) {
        try {
            const file = isError ? config.logging.errorFile : config.logging.logFile;
            await fs.appendFile(file, message + '\n', 'utf8');
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }

    error(message, meta = {}) {
        if (this.currentLevel >= this.levels.error) {
            const formattedMessage = this.formatMessage('error', message, meta);
            console.error(formattedMessage);
            this.writeToFile(formattedMessage, true);
        }
    }

    warn(message, meta = {}) {
        if (this.currentLevel >= this.levels.warn) {
            const formattedMessage = this.formatMessage('warn', message, meta);
            console.warn(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    info(message, meta = {}) {
        if (this.currentLevel >= this.levels.info) {
            const formattedMessage = this.formatMessage('info', message, meta);
            console.info(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    debug(message, meta = {}) {
        if (this.currentLevel >= this.levels.debug) {
            const formattedMessage = this.formatMessage('debug', message, meta);
            console.debug(formattedMessage);
            this.writeToFile(formattedMessage);
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
        try {
            if (this.loadedModules.has(moduleName)) {
                logger.warn(`Module ${moduleName} is already loaded`);
                return;
            }

            const module = require(filePath);
            this.modules.set(moduleName, module);
            this.loadedModules.add(moduleName);
            logger.info(`Successfully loaded module: ${moduleName}`);

            // Call initialize method if available
            if (typeof module.initialize === 'function') {
                await module.initialize();
            }
        } catch (err) {
            errorHandler(err, `Loading module ${moduleName}`);
            throw err;
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
        } catch (err) {
            errorHandler(err, `Unloading module ${moduleName}`);
            throw err;
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
        
        for (const file of files) {
            if (file.match(config.modules.pattern)) {
                const moduleName = file.replace('.js', '');
                const filePath = path.join(config.modules.directory, file);
                await moduleManager.loadModule(filePath, moduleName);
            }
        }
    } catch (err) {
        errorHandler(err, 'Reading modules directory');
        throw err;
    }
}

// 重啟計數器
let restartCount = 0;

// Graceful Shutdown
async function gracefulShutdown(moduleManager, isError = false) {
    logger.info('Starting graceful shutdown...');
    
    // Unload all loaded modules
    for (const moduleName of moduleManager.loadedModules) {
        await moduleManager.unloadModule(moduleName);
    }

    logger.info('Graceful shutdown completed');
    
    if (isError) {
        // 檢查是否超過最大重試次數
        if (restartCount >= config.restart.maxRetries) {
            logger.error(`Max restart attempts (${config.restart.maxRetries}) reached. Stopping application.`);
            process.exit(1);
        }

        // 如果是錯誤導致的關閉，則重啟應用程序
        restartCount++;
        logger.info(`Restarting application due to error... (Attempt ${restartCount}/${config.restart.maxRetries})`);
        
        try {
            // 使用 spawn 來啟動新的進程
            const { spawn } = require('child_process');
            const args = process.argv.slice(1);
            const child = spawn(process.argv[0], args, {
                stdio: 'inherit',
                detached: true
            });
            
            // 設置子進程的錯誤處理
            child.on('error', (err) => {
                logger.error('Failed to restart application:', err);
                process.exit(1);
            });
            
            // 等待子進程啟動
            child.on('spawn', () => {
                logger.info('Application restarted successfully');
                process.exit(0);
            });
        } catch (err) {
            logger.error('Failed to restart application:', err);
            process.exit(1);
        }
    } else {
        // 正常關閉，重置重啟計數
        restartCount = 0;
        process.exit(0);
    }
}

// Application Initialization
async function init() {
    const moduleManager = new ModuleManager();
    
    try {
        // Load modules
        await loadModules(moduleManager);
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
            gracefulShutdown(moduleManager, true);
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
                gracefulShutdown(moduleManager, true);
            }
        });

    } catch (err) {
        errorHandler(err, 'Initialization');
        gracefulShutdown(moduleManager, true);
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