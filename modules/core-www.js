"use strict";
if (!process.env.mongoURL) {
    return;
}
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const cors = require('cors');
const express = require('express');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const {
    RateLimiterMemory
} = require('rate-limiter-flexible');

const candle = require('../modules/candleDays.js');
const cspConfig = require('../modules/config/csp.js');
const mainCharacter = require('../roll/z_character').mainCharacter;
const security = require('../utils/security.js');
const schema = require('./schema.js');

const www = express();
//const loglink = (LOGLINK) ? LOGLINK + '/tmp/' : process.cwd() + '/tmp/';
const LOGLINK = (process.env.LOGLINK) ? process.env.LOGLINK + '/tmp/' : process.cwd() + '/tmp/';
const MESSAGE_SPLITOR = (/\S+/ig)
const privateKey = (process.env.KEY_PRIKEY) ? process.env.KEY_PRIKEY : null;
const certificate = (process.env.KEY_CERT) ? process.env.KEY_CERT : null;
const APIswitch = (process.env.API) ? process.env.API : null;
const ca = (process.env.KEY_CA) ? process.env.KEY_CA : null;
const isMaster = (process.env.MASTER) ? process.env.MASTER : null;
const salt = process.env.SALT;
let options = {
    key: null,
    cert: null,
    ca: null
};

// ============= Rate Limiter Configuration =============
// Adjusted limits to be more permissive for testing while still protecting against attacks
const rateLimitConfig = {
    chatRoom: { points: 90, duration: 60 },
    card: { points: 300, duration: 60 }, // Increased from 120 to 300 for better testing experience
    cardRead: { points: 500, duration: 60 }, // Separate limit for read operations (public cards, list info)
    api: { points: 10_000, duration: 10 }
};

const rateLimits = Object.entries(rateLimitConfig).reduce((acc, [key, config]) => {
    acc[key] = new RateLimiterMemory(config);
    return acc;
}, {});

const checkRateLimit = async (type, address) => {
    try {
        await rateLimits[type].consume(address);
        return false;
    } catch {
        return true;
    }
};

// ============= SSL Configuration =============
const initSSL = () => {
    if (!privateKey) return {};
    try {
        return {
            key: privateKey ? fs.readFileSync(privateKey) : null,
            cert: certificate ? fs.readFileSync(certificate) : null,
            ca: ca ? fs.readFileSync(ca) : null
        };
    } catch (error) {
        console.error('SSL key reading error:', error.message);
        return {};
    }
};

(async () => {
    options = initSSL();
})();



process.on('uncaughtException', (warning) => {
    console.error('uncaughtException', warning); // Print the warning name
    console.warn(warning.name); // Print the warning name
    console.warn(warning.message); // Print the warning message
    // const clock = setTimeout(createWebServer, 60000 * 5);
});

const records = require('./records.js');
const port = process.env.WWWPORT || 20_721;
const channelKeyword = '';
exports.analytics = require('./analytics');

// ============= Web Server Creation =============
function createWebServer(options = {}, www) {
    if (!process.env.CREATEWEB) return;
    const server = options.key
        ? https.createServer(options, www)
        : http.createServer(www);

    const protocol = options.key ? 'https' : 'http';
    console.log(`${protocol} server`);
    // Ensure malformed requests/sockets are closed and not left hanging
    // to avoid double-emitted socket errors from Node's http(s) server.
    server.on('clientError', (err, socket) => {
        // Immediately destroy the socket to prevent double error emission
        // Do not attempt to send responses when handling clientError
        try {
            if (socket && !socket.destroyed) {
                socket.destroy(err);
            }
        } catch (error) {
            // Log the destruction error but don't re-throw
            console.error('Error destroying socket in clientError handler:', error.message);
        }
    });

    // For HTTPS servers, also proactively destroy on TLS handshake errors
    server.on('tlsClientError', (err, socket) => {
        try {
            if (socket && !socket.destroyed) {
                socket.destroy(err);
            }
        } catch (error) {
            // Log the destruction error but don't re-throw
            console.error('Error destroying socket in tlsClientError handler:', error.message);
        }
    });
    server.listen(port, () => {
        console.log("[www] Web Server Started. Link: " + protocol + "://127.0.0.1:" + port);
    });

    return server;
}
const server = createWebServer(options, www);

// 初始化 Socket.IO (只有在 server 存在時)
const io = server ? require('socket.io')(server) : null;

// 加入線上人數計數
let onlineCount = 0;


www.use(helmet({
    contentSecurityPolicy: {
        directives: cspConfig
    }
}));
www.use(cors({
    origin: /\.hktrpg\.com$/, // Accepts all subdomains of hktrpg.com
    methods: ['GET', 'POST'],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],
    credentials: true,
    maxAge: 86_400,
    optionsSuccessStatus: 200
}));

www.get('*/favicon.ico', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(path.join(process.cwd(), 'views/image', 'favicon.ico'));
});
www.use(favicon(path.join(process.cwd(), 'views/image', 'favicon.ico')));

www.get('/', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/index.html');
});
www.get('/api', async (req, res) => {
    if (!APIswitch || await limitRaterApi(req.ip)) return;

    if (
        !req || !req.query || !req.query.msg
    ) {
        res.writeHead(200, { 'Content-type': 'application/json' })
        res.end(String.raw`{"message":"welcome to HKTRPG API.\n To use, please enter the content in query: msg \n like https://api.hktrpg.com?msg=1d100\n command bothelp for tutorials."}`)
        return;
    }

    let ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
    if (ip && await limitRaterApi(ip)) return;
    let rplyVal = {}
    let trigger = '';
    let mainMsg = req.query.msg.match(MESSAGE_SPLITOR); // 定義輸入字串
    if (mainMsg && mainMsg[0])
        trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
        rplyVal = await exports.analytics.parseInput({
            inputStr: mainMsg.join(' '),
            botname: "Api"
        })

    } else {
        if (channelKeyword == '') {
            rplyVal = await exports.analytics.parseInput({
                inputStr: mainMsg.join(' '),
                botname: "Api"
            })
        }
    }

    if (!rplyVal || !rplyVal.text) rplyVal.text = '';
    res.writeHead(200, { 'Content-type': 'application/json' })
    res.end(`{"message":"${jsonEscape(rplyVal.text)}"}`)
    return;


});

// Local bot endpoint for personal room (no broadcasting/records)
www.get('/api/local', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    try {
        const q = (req && req.query && typeof req.query.msg === 'string') ? req.query.msg : '';
        if (!q) {
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(String.raw`{"message":""}`);
            return;
        }

        const mainMsg = q.match(MESSAGE_SPLITOR);
        let rplyVal = {};
        if (mainMsg && mainMsg.length > 0) {
            const processedInput = mainMsg.join(' ');
            rplyVal = await exports.analytics.parseInput({
                inputStr: processedInput,
                botname: "Local"
            });
        }
        if (!rplyVal || !rplyVal.text) rplyVal = { text: '' };
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(`{"message":"${jsonEscape(rplyVal.text)}"}`);
    } catch (error) {
        console.error('Error in /api/local:', error.message);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(String.raw`{"message":""}`);
    }
});

www.get('/api/dice-commands', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    const rollDir = path.join(process.cwd(), 'roll');
    const files = fs.readdirSync(rollDir);
    const commandsData = [];

    const ignoredFiles = ['z_', 'rollbase', 'demo', 'export', 'forward', 'help', 'init', 'request-rolling', 'token', 'edit'];

    for (const file of files) {
        if (file.endsWith('.js') && !ignoredFiles.some(prefix => file.startsWith(prefix))) {
            try {
                const modulePath = path.join(rollDir, file);
                const commandModule = require(modulePath);

                if (commandModule.webCommand !== false && commandModule.discordCommand && commandModule.gameName && commandModule.getHelpMessage) {
                    const gameName = commandModule.gameName();
                    const helpMessage = await commandModule.getHelpMessage();
                    const commands = [];

                    for (const cmd of commandModule.discordCommand) {
                        const commandJson = cmd.data.toJSON();
                        const subcommands = commandJson.options ? commandJson.options.filter(opt => opt.type === 1) : [];

                        if (subcommands.length > 0) {
                            for (const sub of subcommands) {
                                const mockInteraction = {
                                    options: {
                                        getSubcommand: () => sub.name,
                                        getString: (name) => {
                                            return sub.options?.find(o => o.name === name)
                                                ? `PLACEHOLDER_STRING_${name}`
                                                : null;
                                        },
                                        getInteger: (name) => {
                                            return sub.options?.find(o => o.name === name)
                                                ? `PLACEHOLDER_INTEGER_${name}`
                                                : null;
                                        },
                                        getBoolean: () => {
                                            return false;
                                        },
                                        getNumber: (name) => {
                                            return sub.options?.find(o => o.name === name)
                                                ? `PLACEHOLDER_NUMBER_${name}`
                                                : null;
                                        },
                                    }
                                };

                                try {
                                    const executeTemplate = await cmd.execute(mockInteraction);
                                    
                                    // 為支持自動完成的選項添加配置
                                    const optionsWithAutocomplete = (sub.options || []).map(option => {
                                        if (option.autocomplete === true) {
                                            return {
                                                ...option,
                                                autocomplete: {
                                                    enabled: true,
                                                    module: option.autocompleteModule || 'default',
                                                    searchFields: option.autocompleteSearchFields || ['display', 'value'],
                                                    limit: option.autocompleteLimit || 8,
                                                    minQueryLength: option.autocompleteMinQueryLength || 1,
                                                    placeholder: option.description,
                                                    noResultsText: option.autocompleteNoResultsText || '找不到相關結果'
                                                }
                                            };
                                        }
                                        return option;
                                    });
                                    
                                    commands.push({
                                        json: {
                                            name: `${commandJson.name}_${sub.name}`,
                                            description: sub.description,
                                            options: optionsWithAutocomplete
                                        },
                                        execute: executeTemplate,
                                        flagMap: cmd.flagMap || {}
                                    });
                                } catch { /* Ignore errors in mock execution */ }
                            }
                        } else {
                            const mockInteraction = {
                                options: {
                                    getSubcommand: () => null,
                                    getString: (name) => {
                                        return commandJson.options?.find(o => o.name === name)
                                            ? `PLACEHOLDER_STRING_${name}`
                                            : null;
                                    },
                                    getInteger: (name) => {
                                        return commandJson.options?.find(o => o.name === name)
                                            ? `PLACEHOLDER_INTEGER_${name}`
                                            : null;
                                    },
                                    getBoolean: () => {
                                        return false;
                                    },
                                    getNumber: (name) => {
                                        return commandJson.options?.find(o => o.name === name)
                                            ? `PLACEHOLDER_NUMBER_${name}`
                                            : null;
                                    },
                                }
                            };
                            try {
                                const executeTemplate = await cmd.execute(mockInteraction);
                                
                                // 為支持自動完成的選項添加配置
                                const optionsWithAutocomplete = (commandJson.options || []).map(option => {
                                    if (option.autocomplete === true) {
                                        return {
                                            ...option,
                                            autocomplete: {
                                                enabled: true,
                                                module: option.autocompleteModule || 'default',
                                                searchFields: option.autocompleteSearchFields || ['display', 'value'],
                                                limit: option.autocompleteLimit || 8,
                                                minQueryLength: option.autocompleteMinQueryLength || 1,
                                                placeholder: option.description,
                                                noResultsText: option.autocompleteNoResultsText || '找不到相關結果'
                                            }
                                        };
                                    }
                                    return option;
                                });
                                
                                commands.push({
                                    json: {
                                        ...commandJson,
                                        options: optionsWithAutocomplete
                                    },
                                    execute: executeTemplate,
                                    flagMap: cmd.flagMap || {}
                                });
                            } catch { /* Ignore errors in mock execution */ }
                        }
                    }

                    commandsData.push({
                        fileName: file,
                        gameName: gameName,
                        helpMessage: helpMessage,
                        commands: commands
                    });
                }
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }
    }

    res.json(commandsData);
});

// 自動完成模組註冊系統
const autocompleteModules = {};

// 快取配置
const CACHE_CONFIG = {
    TTL: 5 * 60 * 1000, // 5分鐘
    MAX_SIZE: 1000, // 最大快取項目數
    SEARCH_TTL: 2 * 60 * 1000, // 搜尋結果快取2分鐘
    MAX_SEARCH_CACHE: 500 // 最大搜尋快取數
};

// 速率限制配置 (保留用於未來擴展)
// const RATE_LIMIT_CONFIG = {
//     autocomplete: {
//         windowMs: 60_000, // 1分鐘
//         max: 100, // 每分鐘最多100次請求
//         skipSuccessfulRequests: false
//     }
// };

// 效能監控
class AutocompleteMonitor {
    constructor() {
        this.stats = new Map();
    }
    
    recordRequest(module, type, duration, success) {
        if (!this.stats.has(module)) {
            this.stats.set(module, {
                requests: 0,
                errors: 0,
                totalDuration: 0,
                cacheHits: 0,
                cacheMisses: 0,
                lastRequest: Date.now()
            });
        }
        
        const stats = this.stats.get(module);
        stats.requests++;
        stats.totalDuration += duration;
        stats.lastRequest = Date.now();
        
        if (!success) stats.errors++;
        if (type === 'cache_hit') stats.cacheHits++;
        if (type === 'cache_miss') stats.cacheMisses++;
    }
    
    getStats(module) {
        return this.stats.get(module) || null;
    }
    
    getAllStats() {
        return Object.fromEntries(this.stats);
    }
}

const monitor = new AutocompleteMonitor();

// 快取管理
class AutocompleteCache {
    constructor() {
        this.cache = new Map();
        this.searchCache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60_000); // 每分鐘清理一次
    }
    
    set(key, value, ttl = CACHE_CONFIG.TTL) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        
        // 限制快取大小
        if (this.cache.size > CACHE_CONFIG.MAX_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    setSearch(key, value, ttl = CACHE_CONFIG.SEARCH_TTL) {
        this.searchCache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        
        // 限制搜尋快取大小
        if (this.searchCache.size > CACHE_CONFIG.MAX_SEARCH_CACHE) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
    }
    
    getSearch(key) {
        const item = this.searchCache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.searchCache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    cleanup() {
        const now = Date.now();
        
        // 清理過期快取
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
        
        for (const [key, item] of this.searchCache.entries()) {
            if (now > item.expires) {
                this.searchCache.delete(key);
            }
        }
    }
    
    clear() {
        this.cache.clear();
        this.searchCache.clear();
    }
}

const cache = new AutocompleteCache();

// 動態註冊自動完成模組
const registerAutocompleteModules = () => {
    const rollDir = path.join(process.cwd(), 'roll');
    const files = fs.readdirSync(rollDir);
    
    const ignoredFiles = ['z_', 'rollbase', 'demo', 'export', 'forward', 'help', 'init', 'request-rolling', 'token', 'edit'];
    
    for (const file of files) {
        if (file.endsWith('.js') && !ignoredFiles.some(prefix => file.startsWith(prefix))) {
            try {
                const modulePath = path.join(rollDir, file);
                const commandModule = require(modulePath);
                
                // 檢查模組是否有自動完成功能
                if (commandModule.autocomplete && typeof commandModule.autocomplete === 'object') {
                    const moduleName = commandModule.autocomplete.moduleName || file.replace('.js', '');
                    autocompleteModules[moduleName] = commandModule.autocomplete;
                    console.log(`[www] Registered autocomplete module: ${moduleName}`);
                }
                
                // 檢查模組是否有其他自動完成功能（如招式自動完成）
                for (const key of Object.keys(commandModule)) {
                    if (key.endsWith('Autocomplete') && typeof commandModule[key] === 'object') {
                        const moduleName = commandModule[key].moduleName || key;
                        autocompleteModules[moduleName] = commandModule[key];
                        console.log(`[www] Registered autocomplete module: ${moduleName}`);
                    }
                }
            } catch (error) {
                console.error(`Failed to register autocomplete module from ${file}:`, error);
            }
        }
    }
};

// 初始化時註冊所有模組
registerAutocompleteModules();

// 通用自動完成API端點
www.get('/api/autocomplete/:module', async (req, res) => {
    const startTime = Date.now();
    const { module } = req.params;
    const { q, limit = 10 } = req.query;
    
    // 檢查速率限制
    if (await checkRateLimit('api', req.ip)) {
        monitor.recordRequest(module, 'rate_limited', Date.now() - startTime, false);
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
    }
    
    if (!autocompleteModules[module]) {
        monitor.recordRequest(module, 'not_found', Date.now() - startTime, false);
        return res.status(404).json({ error: 'Module not found' });
    }
    
    try {
        const moduleConfig = autocompleteModules[module];
        const limitNum = Math.min(Number.parseInt(limit, 10), 50); // 限制最大結果數
        let results;
        
        if (q && q.trim().length > 0) {
            // 搜尋請求
            const searchKey = `${module}:search:${q.trim()}:${limitNum}`;
            const cachedResults = cache.getSearch(searchKey);
            
            if (cachedResults) {
                monitor.recordRequest(module, 'cache_hit', Date.now() - startTime, true);
                return res.json(cachedResults);
            }
            
            monitor.recordRequest(module, 'cache_miss', 0, true);
            results = await moduleConfig.search(q.trim(), limitNum);
            
            // 快取搜尋結果
            const transformed = results.map(moduleConfig.transform);
            cache.setSearch(searchKey, transformed);
            res.json(transformed);
        } else {
            // 獲取所有數據請求
            const dataKey = `${module}:data:${limitNum}`;
            const cachedData = cache.get(dataKey);
            
            if (cachedData) {
                monitor.recordRequest(module, 'cache_hit', Date.now() - startTime, true);
                return res.json(cachedData);
            }
            
            monitor.recordRequest(module, 'cache_miss', 0, true);
            results = await moduleConfig.getData();
            results = results.slice(0, limitNum);
            
            // 快取數據
            const transformed = results.map(moduleConfig.transform);
            cache.set(dataKey, transformed);
            res.json(transformed);
        }
        
        monitor.recordRequest(module, 'success', Date.now() - startTime, true);
    } catch (error) {
        console.error('Autocomplete search error:', error);
        monitor.recordRequest(module, 'error', Date.now() - startTime, false);
        res.status(500).json({ error: 'Search failed' });
    }
});


// 將/publiccard/css/設置為靜態資源的路徑
www.use('/:path/css/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/css/'));

www.use('/css/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/css/'));

// 將/publiccard/includes/設置為靜態資源的路徑
www.use('/:path/includes/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/includes/'));

www.use('/:path/scripts/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/scripts/'));

www.use('/includes/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/includes/'));

www.use('/scripts/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/scripts/'));

// Add common files route
www.use('/:path/common/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/common/'));

www.use('/common/', async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    next();
}, express.static(process.cwd() + '/views/common/'));

www.get('/card', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/characterCard.html');
});
www.get('/publiccard', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/characterCardPublic.html');
});

www.get('/cardtest', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/cardtest-direct.html');
});
www.get('/signal', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/signalToNoise.html');
});

www.get('/character', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/namecard/namecard_character.html');
});
www.get('/player', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/namecard/namecard_player.html');
});

www.get('/busstop', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/busstop.html');
});




www.get('/log/:id', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    if (req.originalUrl.endsWith('html')) {
        // Sanitize and validate the file path
        const logPath = path.resolve(LOGLINK, req.params.id);

        // Ensure the resolved path is within the allowed directory and file exists
        if (!logPath.startsWith(path.resolve(LOGLINK)) || !fs.existsSync(logPath)) {
            res.sendFile(process.cwd() + '/views/includes/error.html');
            return;
        }

        // Send the validated file path
        res.sendFile(logPath);
    } else {
        // Send error.html for non-html requests
        res.sendFile(process.cwd() + '/views/includes/error.html');
    }
});

www.get('/:xx', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(process.cwd() + '/views/index.html');
});

// Socket.IO 連接處理 (只有在 server 存在時)
if (io) {
    // 🔒 新增安全中介軟體
    io.use((socket, next) => {
        // Origin 驗證
        const origin = socket.handshake.headers.origin;
        if (origin) {
            const allowedOrigins = [
                'https://hktrpg.com',
                'https://www.hktrpg.com',
                'http://localhost:20721',  // 開發環境
                'http://127.0.0.1:20721'   // 本機IP開發環境
            ];
            
            const isAllowed = allowedOrigins.includes(origin) || 
                             origin.match(/^https?:\/\/.*\.hktrpg\.com$/);
            
            if (!isAllowed) {
                console.warn('🔒 Rejected connection from invalid origin:', origin);
                return next(new Error('Invalid origin'));
            }
        }
        
        next();
    });
    
    io.on('connection', async (socket) => {
        socket.on('getListInfo', async message => {
            // Use cardRead limit for list info (less restrictive)
            if (await limitRaterCardRead(socket.handshake.address)) return;

            try {
                // 🔒 驗證輸入
                const validation = security.validateCredentials(message);
                if (!validation.valid) {
                    console.warn('🔒 Invalid credentials format:', validation.error, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: 'Invalid credentials format',
                        code: 'INVALID_FORMAT'
                    });
                    return;
                }

                const { userName, userPassword: password } = validation.data;

                // 🔒 防止 NoSQL 注入 - 強制型別轉換
                let filter = {
                    userName: String(userName).trim()
                };

                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error during authentication:', error.message);
                        socket.emit('getListInfo', {
                            temp: null,
                            id: [],
                            error: 'Database connection error',
                            code: 'DB_ERROR'
                        });
                        return null;
                    });

                if (!doc) {
                    console.warn('🔒 User not found:', userName, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                    return;
                }

                const isValid = await verifyPasswordSecure(password, doc.password);
                if (!isValid) {
                    console.warn('🔒 Invalid password for user:', userName, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: 'Invalid password',
                        code: 'INVALID_PASSWORD'
                    });
                    return;
                }
                
                // 🔄 自動升級密碼（如果使用舊密碼）
                try {
                    const upgraded = await security.upgradePasswordIfLegacy(userName, password, doc.password);
                    if (upgraded) {
                        console.log(`[www] 🔄 Password automatically upgraded for user: ${userName}`);
                        // 重新獲取用戶數據（包含升級後的密碼）
                        doc = await schema.accountPW.findOne({ userName: userName });
                    }
                } catch (error) {
                    console.error('🔄 Password upgrade failed:', error.message);
                    // 升級失敗不影響登入流程
                }
                
                // 驗證成功，獲取數據
                let temp;
                if (doc.id) {
                    temp = await schema.characterCard.find({ id: doc.id })
                        .catch(error => {
                            console.error('🔒 MongoDB error:', error.message);
                            return null;
                        });
                }
                
                let id = doc.channel || [];
                
                // 🔐 生成JWT token
                let jwtToken = null;
                if (security.generateToken) {
                    try {
                        jwtToken = security.generateToken({
                            id: doc._id.toString(),
                            userName: userName
                        });
                        console.log(`[www] 🔐 JWT token generated for user: ${userName}`);
                    } catch (error) {
                        console.error('🔐 JWT token generation failed:', error.message);
                    }
                }
                
                socket.emit('getListInfo', { temp, id, token: jwtToken });
                
            } catch (error) {
                console.error('🔒 getListInfo error:', error.message);
                socket.emit('getListInfo', { temp: null, id: [] });
            }
        })

        socket.on('getPublicListInfo', async () => {
            // Public list info is read-only, use less restrictive limit
            if (await limitRaterCardRead(socket.handshake.address)) return;
            //回傳 message 給發送訊息的 Client
            let filter = {
                public: true
            }
            let temp = await schema.characterCard.find(filter);
            try {
                socket.emit('getPublicListInfo', {
                    temp
                })
            } catch (error) {
                console.error('www #170 mongoDB error:', error.name, error.reason)
            }

        })

        socket.on('publicRolling', async message => {
            if (await limitRaterChatRoom(socket.handshake.address)) return;
            if (!message.item || !message.doc) return;
            let rplyVal = {}
            let result = await mainCharacter(message.doc, ['', message.item], `.ch ${message.item}`)
            if (result && result.characterReRoll) {
                rplyVal = await exports.analytics.parseInput({
                    inputStr: result.characterReRollItem,
                    botname: "WWW"
                })
            }

            // 訊息來到後, 會自動跳到analytics.js進行骰組分析
            // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
            if (rplyVal && rplyVal.text) {
                socket.emit('publicRolling', result.characterReRollName + '：\n' + rplyVal.text)
            }
        })
        socket.on('rolling', async message => {
            if (await limitRaterChatRoom(socket.handshake.address)) return;
            if (!message.item || !message.doc) return;
            let rplyVal = {}
            let result = await mainCharacter(message.doc, ['', message.item], `.ch ${message.item}`)
            if (result && result.characterReRoll) {
                rplyVal = await exports.analytics.parseInput({
                    inputStr: result.characterReRollItem,
                    botname: "WWW"
                })
            }

            // 訊息來到後, 會自動跳到analytics.js進行骰組分析
            // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
            if (rplyVal && rplyVal.text) {
                socket.emit('rolling', result.characterReRollName + '：\n' + rplyVal.text + candle.checker())

                // If a selectedGroupId is provided, use it as the target for the roll
                if (message.selectedGroupId && message.selectedGroupId !== "") {
                    try {
                        // 🔒 使用JWT Token驗證
                        const validation = security.validateJWTAuth({
                            token: message.token,
                            userName: message.userName
                        });
                        if (!validation.valid) {
                            console.warn('🔒 Invalid JWT auth for rolling:', validation.error);
                            return;
                        }
                        
                        const { userName } = validation.data;
                        
                        let filter = {
                            userName: String(userName).trim()
                        };

                        let doc = await schema.accountPW.findOne(filter).catch(error => console.error('www #214 mongoDB error:', error.name, error.message));
                        
                        if (doc) {
                            // 🔒 JWT token已經驗證了用戶身份，不需要密碼驗證
                            if (doc.channel) {
                                // Find the channel with matching ID - needs to be compared as strings
                                const targetChannel = doc.channel.find(ch => ch._id && ch._id.toString() === message.selectedGroupId);
                                if (targetChannel) {
                                    rplyVal.text = '@' + message.cardName + ' - ' + message.item + '\n' + rplyVal.text;
                                    if (targetChannel.botname) {
                                        if (!sendTo) return;
                                        sendTo({
                                            target: {
                                                id: targetChannel.id,
                                                botname: targetChannel.botname
                                            },
                                            text: rplyVal.text
                                        });
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error handling selectedGroupId in rolling event:', error.message);
                    }
                }
                // Legacy support for rollTarget
                else if (message.rollTarget && message.rollTarget.id && message.rollTarget.botname && message.userName && message.userPassword && message.cardName) {
                    try {
                        // 🔒 驗證憑證
                        const validation = security.validateCredentials(message);
                        if (!validation.valid) {
                            console.warn('🔒 Invalid credentials for rolling:', validation.error);
                            return;
                        }
                        
                        const { userName, userPassword: password } = validation.data;
                        
                        // 🔒 防止 NoSQL 注入
                        let filter = {
                            userName: String(userName).trim(),
                            "channel.id": String(message.rollTarget.id).trim(),
                            "channel.botname": String(message.rollTarget.botname).trim()
                        };
                        
                        let userDoc = await schema.accountPW.findOne(filter)
                            .catch(error => {
                                console.error('🔒 MongoDB error:', error.message);
                                return null;
                            });
                        
                        if (!userDoc) {
                            console.warn('🔒 User not found for rolling');
                            return;
                        }
                        
                        // 🔒 驗證密碼
                        const isValid = await verifyPasswordSecure(password, userDoc.password);
                        if (!isValid) {
                            console.warn('🔒 Invalid password for rolling');
                            return;
                        }
                        
                        // 🔄 自動升級密碼（如果使用舊密碼）
                        try {
                            const upgraded = await security.upgradePasswordIfLegacy(userName, password, userDoc.password);
                            if (upgraded) {
                                console.log(`[www] 🔄 Password automatically upgraded for rolling user: ${userName}`);
                                // 重新獲取用戶數據（包含升級後的密碼）
                                userDoc = await schema.accountPW.findOne(filter);
                            }
                        } catch (error) {
                            console.error('🔄 Password upgrade failed for rolling:', error.message);
                            // 升級失敗不影響擲骰流程
                        }
                        
                        let filter2 = {
                            "botname": String(message.rollTarget.botname).trim(),
                            "id": String(message.rollTarget.id).trim()
                        };
                        
                        let allowRollingResult = await schema.allowRolling.findOne(filter2)
                            .catch(error => {
                                console.error('🔒 MongoDB error:', error.message);
                                return null;
                            });
                        
                        if (!allowRollingResult) {
                            console.warn('🔒 Rolling not allowed for this target');
                            return;
                        }
                        
                        rplyVal.text = '@' + message.cardName + ' - ' + message.item + '\n' + rplyVal.text;
                        if (message.rollTarget.botname && sendTo) {
                            sendTo({
                                target: message.rollTarget,
                                text: rplyVal.text
                            });
                        }
                    } catch (error) {
                        console.error('🔒 Rolling error:', error.message);
                    }
                }
            }
        })

        socket.on('removeChannel', async message => {
            if (await limitRaterCard(socket.handshake.address)) return;
            //回傳 message 給發送訊息的 Client
            try {
                // 🔒 使用JWT Token驗證
                const validation = security.validateJWTAuth({
                    token: message.token,
                    userName: message.userName
                });
                if (!validation.valid) {
                    socket.emit('removeChannel', { success: false, message: 'Invalid JWT auth' });
                    return;
                }
                
                const { userName } = validation.data;
                
                // 🔒 防止 NoSQL 注入 - 強制型別轉換
                let filter = {
                    userName: String(userName).trim()
                };
                
                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                
                // 🔒 JWT token已經驗證了用戶身份，不需要密碼驗證
                if (!doc) {
                    socket.emit('removeChannel', { success: false, message: 'User not found' });
                    return;
                }
                
                const result = await schema.accountPW.updateOne({
                    "userName": userName
                }, {
                    $pull: {
                        channel: {
                            "id": message.channelId
                        }
                    }
                });
                
                // Send response back to client
                if (result.modifiedCount > 0) {
                    socket.emit('removeChannel', { success: true, message: 'Channel removed successfully' });
                } else {
                    socket.emit('removeChannel', { success: false, message: 'Channel not found or already removed' });
                }
            } catch (error) {
                console.error('core-www removeChannel ERROR:', error);
                socket.emit('removeChannel', { success: false, message: 'Database error: ' + error.message });
            }

        })

        socket.on('updateCard', async message => {
            if (await limitRaterCard(socket.handshake.address)) return;

            try {
                // 🔒 使用JWT Token驗證
                const validation = security.validateJWTAuth({
                    token: message.token,
                    userName: message.userName
                });
                
                if (!validation.valid) {
                    console.warn('🔒 Invalid JWT auth for updateCard:', validation.error);
                    socket.emit('updateCard', false);
                    return;
                }
                
                const { userName } = validation.data;

                // 🔒 防止 NoSQL 注入
                let filter = {
                    userName: String(userName).trim()
                };
                
                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                
                // 🔒 JWT token已經驗證了用戶身份，不需要密碼驗證
                if (!doc) {
                    console.warn('🔒 User not found for updateCard:', userName);
                    socket.emit('updateCard', false);
                    return;
                }
                
                // 驗證成功，更新卡片
                let temp;
                if (doc.id && message.card) {
                    // 後端驗證：禁止同名與超長內容
                    const validationError = validateCardPayload(message.card);
                    if (validationError) {
                        console.warn('updateCard validation failed:', validationError);
                        socket.emit('updateCard', false);
                        return;
                    }
                    message.card.state = checkNullItem(message.card.state || []);
                    message.card.roll = checkNullItem(message.card.roll || []);
                    message.card.notes = checkNullItem(message.card.notes || []);
                    
                    temp = await schema.characterCard.findOneAndUpdate({
                        id: doc.id,
                        _id: message.card._id
                    }, {
                        $set: {
                            public: message.card.public,
                            image: message.card.image,
                            state: message.card.state,
                            roll: message.card.roll,
                            notes: message.card.notes,
                        }
                    }).catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                }
                
                socket.emit('updateCard', !!temp);
                
            } catch (error) {
                console.error('🔒 updateCard error:', error.message);
                socket.emit('updateCard', false);
            }
        })



        // 有連線發生時增加人數
        onlineCount++;
        // 發送人數給網頁
        io.emit("online", onlineCount);
        // 發送紀錄最大值
        socket.emit("maxRecord", records.chatRoomGetMax());
        setTimeout(() => {
            records.chatRoomGet("公共房間", (msgs) => {
                socket.emit("chatRecord", msgs);
            });
        }, 200);


        socket.on("greet", () => {
            socket.emit("greet", onlineCount);
        });

        socket.on("send", async (msg) => {
            if (await limitRaterChatRoom(socket.handshake.address)) return;
            
            // 🔒 使用安全的輸入驗證
            const validation = security.validateChatMessage(msg);
            if (!validation.valid) {
                console.warn('🔒 Invalid chat message:', validation.error,
                    'from IP:', socket.handshake.address,
                    'msg data:', JSON.stringify(msg).slice(0, 200));

                // Send user-friendly error message to client
                const userFriendlyError = getUserFriendlyError(validation.error);
                socket.emit('error', {
                    message: userFriendlyError,
                    code: validation.error.replaceAll(/\s+/g, '_').toUpperCase(),
                    originalError: validation.error
                });
                return;
            }

            // 🔒 修復：使用正確的欄位名 msg 和 roomNumber
            const { name, msg: text, roomNumber } = validation.data;
            const time = new Date(); // Use server's time for accuracy

            const payload = {
                name: name,
                msg: '\n' + text, // keep leading newline as before
                time: time,
                roomNumber: roomNumber  // 🔒 修復：使用 roomNumber
            };

            records.chatRoomPush(payload);
        });

        socket.on("newRoom", async (msg) => {
            if (await limitRaterChatRoom(socket.handshake.address)) return;
            // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
            // 因此我們直接 return ，終止函式執行。
            if (!msg) return;
            let roomNumber = msg || "公共房間";
            setTimeout(() => {
                records.chatRoomGet(roomNumber, (msgs) => {
                    socket.emit("chatRecord", msgs);
                });
            }, 150);

        });

        socket.on('disconnect', () => {
            // 有人離線了，扣人
            onlineCount = (onlineCount < 0) ? 0 : onlineCount -= 1;
            io.emit("online", onlineCount);
        });
    });
}

records.on("new_message", async (message) => {
    // 廣播訊息到聊天室
    if (message.msg && /^HKTRPG/ig.test(message.name)) {
        return;
    }

    io.emit(message.roomNumber, message);
    let rplyVal = {}
    let trigger = '';
    let mainMsg = message.msg.match(MESSAGE_SPLITOR); // 定義輸入字串
    if (mainMsg && mainMsg[0])
        trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
        rplyVal = await exports.analytics.parseInput({
            inputStr: mainMsg.join(' '),
            botname: "WWW"
        })

    } else {
        if (channelKeyword == '') {
            rplyVal = await exports.analytics.parseInput({
                inputStr: mainMsg.join(' '),
                botname: "WWW"
            })
        }
    }
    if (rplyVal && rplyVal.text) {
        rplyVal.text = '\n' + rplyVal.text
        loadb(io, records, rplyVal, message);
    }
});

// ⚠️ DEPRECATED: Legacy password hashing - insecure!
// This function is kept for backward compatibility with existing password hashes
// New code should use security.hashPassword() and security.verifyPassword()
// eslint-disable-next-line no-unused-vars
function SHA(text) {
    return crypto.createHmac('sha256', text)
        .update(salt)
        .digest('hex');
}

// 🔒 Secure password verification
// Handles both legacy SHA hashes and new bcrypt hashes
async function verifyPasswordSecure(password, hash) {
    try {
        // Use the security module which handles both legacy and new hashes
        return await security.verifyPassword(password, hash);
    } catch (error) {
        console.error('🔒 Password verification error:', error.message);
        return false;
    }
}

function checkNullItem(target) {
    return target.filter(item => item.name);
}
function validateCardPayload(card) {
    try {
        if (!card) return '資料無效';
        const name = (card.name || '').toString().trim();
        if (!name) return '角色卡名稱不可為空';
        if (name.length > 50) return '角色卡名稱長度不可超過 50 字元';

        const norm = (s) => (s || '').toString().trim().toLowerCase();
        const tooLong = (v, m) => (v || '').toString().length > m;
        const findDups = (arr) => {
            const seen = new Set();
            const d = new Set();
            for (const it of (arr || [])) {
                const k = norm(it && it.name);
                if (!k) continue;
                if (seen.has(k)) d.add((it.name || '').toString()); else seen.add(k);
            }
            return [...d];
        };

        const sD = findDups(card.state);
        const rD = findDups(card.roll);
        const nD = findDups(card.notes);
        if (sD.length > 0 || rD.length > 0 || nD.length > 0) return '存在重複的項目名稱';

        for (const it of (card.state || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '狀態項目名稱不可為空';
            if (tooLong(it.name, 50)) return `狀態「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 50)) return `狀態「${it.name}」當前值超過 50 字元`;
            if (tooLong(it.itemB, 50)) return `狀態「${it.name}」最大值超過 50 字元`;
        }
        for (const it of (card.roll || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '擲骰項目名稱不可為空';
            if (tooLong(it.name, 50)) return `擲骰「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 150)) return `擲骰「${it.name}」內容超過 150 字元`;
        }
        for (const it of (card.notes || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '備註項目名稱不可為空';
            if (tooLong(it.name, 50)) return `備註「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 1500)) return `備註「${it.name}」內容超過 1500 字元`;
        }
        return null;
    } catch {
        return '驗證失敗';
    }
}
async function loadb(io, records, rplyVal, message) {
    const baseTime = new Date(message.time).getTime(); // Ensure message.time is parsed as a Date object
    const messages = rplyVal.text.toString().match(/[\s\S]{1,2000}/g) || [];

    for (let i = 0; i < messages.length; i++) {
        const messageTime = new Date(baseTime + 1 + i); // Increment time by 1ms for each part
        const botMessage = {
            name: 'HKTRPG -> ' + (message.name || 'Sad'),
            msg: messages[i],
            time: messageTime,
            roomNumber: message.roomNumber
        };

        io.emit(message.roomNumber, botMessage);
        records.chatRoomPush(botMessage);
    }
}
async function limitRaterChatRoom(address) {
    return await checkRateLimit('chatRoom', address);
}

async function limitRaterCard(address) {
    return await checkRateLimit('card', address);
}

async function limitRaterCardRead(address) {
    return await checkRateLimit('cardRead', address);
}

async function limitRaterApi(address) {
    return await checkRateLimit('api', address);
}

/**
 * 
 */
let sendTo;
if (isMaster) {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({
        port: 53_589,
        verifyClient: (info) => {
            return info.req.socket.remoteAddress === "::ffff:127.0.0.1";
        }
    });

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            try {
                console.log('[www] received: %s', message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });

        sendTo = function (params) {
            const payload = JSON.stringify({
                botname: params.target.botname,
                message: params
            });

            for (const client of wss.clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                }
            }
        }
    });
}

// Convert technical validation errors to user-friendly messages
function getUserFriendlyError(error) {
    const errorMap = {
        'Invalid message format': 'Message format is invalid',
        'Invalid name type': 'Name must be text',
        'Invalid message type': 'Message content is invalid',
        'Invalid room number type': 'Room number is invalid',
        'Invalid name length (1-50 characters)': 'Name must be 1-50 characters long',
        'Invalid message length (1-2000 characters)': 'Message must be 1-2000 characters long',
        'Suspicious content detected': 'Message contains suspicious content and was blocked'
    };

    return errorMap[error] || 'Invalid message: ' + error;
}

function jsonEscape(str) {
    if (typeof str !== 'string') return '';
    return str
        .replaceAll('\\', String.raw`\\`)
        .replaceAll('"', String.raw`\"`)
        .replaceAll('\n', String.raw`\n`)
        .replaceAll('\r', String.raw`\r`)
        .replaceAll('\t', String.raw`\t`);
}
module.exports = {
    app: www
};