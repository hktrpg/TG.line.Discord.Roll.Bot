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
const i18n = require('./i18n.js');
const mainCharacter = require('../roll/z_character').mainCharacter;
const security = require('../utils/security.js');
const schema = require('./schema.js');
const patreonTiers = require('./patreon-tiers.js');
const patreonSync = require('./patreon-sync.js');
const { buildBusEtaShortcut } = require('./bus-shortcut.js');

const www = express();
const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

function resolveWwwLocale(req) {
    const fromQuery = req?.query?.lang;
    const fromHeader = req?.headers?.['accept-language']?.split(',')[0];
    return i18n.normalizeLocale(fromQuery || fromHeader);
}

function getWwwT(req) {
    return i18n.createTranslator(resolveWwwLocale(req));
}

function getSocketT(socket) {
    return i18n.createTranslator(socket?._hktrpgLocale || i18n.DEFAULT_LOCALE);
}

function flattenI18nSection(section, prefix, output) {
    if (!section || typeof section !== 'object') {
        return;
    }
    for (const [key, value] of Object.entries(section)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenI18nSection(value, path, output);
        } else {
            output[path] = value;
        }
    }
}

function buildWwwI18nBundle(locale) {
    const normalized = i18n.normalizeLocale(locale);
    const t = i18n.createTranslator(normalized);
    const tZh = i18n.createTranslator('zh-tw');
    const strings = {};
    const fallback = {};
    flattenI18nSection(t('www.views', { returnObjects: true }), 'www.views', strings);
    flattenI18nSection(t('www.busstop', { returnObjects: true }), 'www.busstop', strings);
    const character = t('character', { returnObjects: true });
    if (character && typeof character === 'object') {
        for (const [key, value] of Object.entries(character)) {
            if (key.startsWith('validation_') && typeof value === 'string') {
                strings[`character.${key}`] = value;
            }
        }
    }
    flattenI18nSection(tZh('www.views', { returnObjects: true }), 'www.views', fallback);
    flattenI18nSection(tZh('www.busstop', { returnObjects: true }), 'www.busstop', fallback);
    const characterZh = tZh('character', { returnObjects: true });
    if (characterZh && typeof characterZh === 'object') {
        for (const [key, value] of Object.entries(characterZh)) {
            if (key.startsWith('validation_') && typeof value === 'string') {
                fallback[`character.${key}`] = value;
            }
        }
    }
    return { locale: normalized, strings, fallback };
}
// Base directory for exported HTML logs, shared with other services.
// LOGLINK may be configured as a public URL; local file serving must always use a filesystem path.
const exportBaseDir = (!process.env.LOGLINK || isHttpUrl(process.env.LOGLINK))
    ? path.join(process.cwd(), 'export')
    : path.resolve(process.env.LOGLINK, 'export');
const exportHtmlRedirectHosts = (() => {
    const hosts = new Set();
    // Preferred: explicit host list for portability across deployments.
    const configuredHosts = String(process.env.EXPORT_HTML_REDIRECT_HOSTS || '')
        .split(',')
        .map(host => host.trim().toLowerCase())
        .filter(Boolean);
    for (const host of configuredHosts) {
        hosts.add(host);
    }

    // Fallback: infer from WEB_LINK (e.g. https://log.example.com/).
    if (hosts.size === 0 && process.env.WEB_LINK) {
        try {
            const url = new URL(process.env.WEB_LINK);
            if (url.hostname) {
                hosts.add(url.hostname.toLowerCase());
            }
        } catch (error) {
            console.warn('[Web Server] Invalid WEB_LINK for export redirect host inference:', error.message);
        }
    }
    // Also infer from LOGLINK when it is configured as a URL.
    if (process.env.LOGLINK && isHttpUrl(process.env.LOGLINK)) {
        try {
            const url = new URL(process.env.LOGLINK);
            if (url.hostname) {
                hosts.add(url.hostname.toLowerCase());
            }
        } catch (error) {
            console.warn('[Web Server] Invalid LOGLINK for export redirect host inference:', error.message);
        }
    }
    return hosts;
})();
const MESSAGE_SPLITOR = (/\S+/ig)
const privateKey = (process.env.KEY_PRIKEY) ? process.env.KEY_PRIKEY : null;
const certificate = (process.env.KEY_CERT) ? process.env.KEY_CERT : null;
const APIswitch = (process.env.API) ? process.env.API : null;
const ca = (process.env.KEY_CA) ? process.env.KEY_CA : null;
const isMaster = (process.env.MASTER) ? process.env.MASTER : null;
const wsPort = Number(process.env.WWW_WS_PORT) || 53_589;
const wsAllowNonLocal = String(process.env.WWW_WS_ALLOW_NON_LOCAL || '').toLowerCase() === 'true';
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
    api: { points: 10_000, duration: 10 },
    // Bus speak/shortcut hit external KMB API — keep much tighter than generic api
    busSpeak: { points: 60, duration: 60 },
    patreon: { points: 30, duration: 60 }  // Stricter for key-based endpoints
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
        console.error('[Web Server] SSL key reading error:', error.message);
        return {};
    }
};

(async () => {
    options = initSSL();
})();



process.on('uncaughtException', (warning) => {
    console.error('[Web Server] Uncaught exception:', warning);
    console.warn('[Web Server] Error name:', warning.name);
    console.warn('[Web Server] Error message:', warning.message);
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
    // Ensure malformed requests/sockets are closed and not left hanging
    // to avoid double-emitted socket errors from Node's http(s) server.
    server.on('clientError', (err, socket) => {
        // Immediately destroy the socket to prevent double error emission
        // Do not attempt to send responses when handling clientError
        try {
            if (socket && !socket.destroyed) {
                // Don't pass the error to destroy() if socket is already errored
                socket.destroy();
            }
        } catch (error) {
            // Log the destruction error but don't re-throw
            console.error('[Web Server] Error destroying socket in clientError handler:', error.message);
        }
    });

    // For HTTPS servers, also proactively destroy on TLS handshake errors
    server.on('tlsClientError', (err, socket) => {
        try {
            if (socket && !socket.destroyed) {
                // Don't pass the error to destroy() if socket is already errored
                socket.destroy();
            }
        } catch (error) {
            // Log the destruction error but don't re-throw
            console.error('[Web Server] Error destroying socket in tlsClientError handler:', error.message);
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
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-line-signature'
    ],
    credentials: true,
    maxAge: 86_400,
    optionsSuccessStatus: 200
}));
// Line webhook needs raw body for signature verification - must skip express.json
www.use((req, res, next) => {
    if (req.method === 'POST' && req.headers['x-line-signature']) {
        return next();
    }
    express.json({ limit: '100kb' })(req, res, next);
});

www.get('*/favicon.ico', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(path.join(process.cwd(), 'views/image', 'favicon.ico'));
});
www.use(favicon(path.join(process.cwd(), 'views/image', 'favicon.ico')));
www.use('/image', express.static(path.join(process.cwd(), 'views/image'), {
    maxAge: '7d'
}));

async function handleApiRequest(req, res) {
    if (!APIswitch || await limitRaterApi(req.ip)) return;

    if (
        !req || !req.query || !req.query.msg
    ) {
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(String.raw`{"message":"welcome to HKTRPG API.\n To use, please enter the content in query: msg \n like https://api.hktrpg.com?msg=1d100\n command bothelp for tutorials."}`);
        return;
    }

    let ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
    if (ip && await limitRaterApi(ip)) return;
    let rplyVal = {};
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
        });
    } else {
        if (channelKeyword == '') {
            rplyVal = await exports.analytics.parseInput({
                inputStr: mainMsg.join(' '),
                botname: "Api"
            });
        }
    }

    if (!rplyVal || !rplyVal.text) rplyVal.text = '';
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(`{"message":"${jsonEscape(rplyVal.text)}"}`);
    return;
}

www.get('/', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    const hostHeader = req.headers.host || '';
    const hostname = hostHeader.split(':')[0].toLowerCase();

    // Keep URL on root for api host: https://api.hktrpg.com/?msg=...
    if (hostname.startsWith('api.') || hostname.startsWith('api2.')) {
        await handleApiRequest(req, res);
        return;
    }

    // Map subdomains to specific pages.
    // This only depends on the Host header, so localhost/127.0.0.1 keep existing behavior.
    if (hostname.startsWith('card.') || hostname.startsWith('card2.')) {
        res.sendFile(process.cwd() + '/views/characterCard.html');
        return;
    }

    if (hostname.startsWith('publiccard.') || hostname.startsWith('publiccard2.')) {
        res.sendFile(process.cwd() + '/views/characterCardPublic.html');
        return;
    }

    if (hostname.startsWith('player.') || hostname.startsWith('player2.')) {
        res.sendFile(process.cwd() + '/views/namecard/namecard_player.html');
        return;
    }

    if (hostname.startsWith('character.') || hostname.startsWith('character2.')) {
        res.sendFile(process.cwd() + '/views/namecard/namecard_character.html');
        return;
    }

    if (hostname.startsWith('signal.') || hostname.startsWith('signal2.')) {
        res.sendFile(process.cwd() + '/views/signalToNoise.html');
        return;
    }

    if (hostname.startsWith('roll.') || hostname.startsWith('roll2.')) {
        res.sendFile(process.cwd() + '/views/roll.html');
        return;
    }

    if (hostname.startsWith('patreon.') || hostname.startsWith('patreon2.')) {
        res.sendFile(process.cwd() + '/views/patreon.html');
        return;
    }

    if (hostname.startsWith('bus.') || hostname.startsWith('bus2.')) {
        res.sendFile(process.cwd() + '/views/busstop.html');
        return;
    }

    if (hostname.startsWith('rollbot.') || hostname.startsWith('rollbot2.') ) {
        res.sendFile(process.cwd() + '/views/index.html');
        return;
    }

    // Default: original behavior (www.hktrpg.com, localhost, 127.0.0.1, others)
    res.sendFile(process.cwd() + '/views/index.html');
});
www.get('/api', async (req, res) => {
    await handleApiRequest(req, res);
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
            const locale = resolveWwwLocale(req);
            rplyVal = await exports.analytics.parseInput({
                inputStr: processedInput,
                botname: "Local",
                locale,
                t: i18n.createTranslator(locale)
            });
        }
        if (!rplyVal || !rplyVal.text) rplyVal = { text: '' };
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(`{"message":"${jsonEscape(rplyVal.text)}"}`);
    } catch (error) {
        console.error('[Web Server] Error in /api/local:', error.message);
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(String.raw`{"message":""}`);
    }
});

www.get('/api/dice-commands', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    await i18n.init();
    const locale = resolveWwwLocale(req);
    const t = i18n.createTranslator(locale);
    const i18nParams = { locale, t };
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
                    const gameName = commandModule.gameName(i18nParams);
                    const helpMessage = await commandModule.getHelpMessage(i18nParams);
                    const commands = [];

                    for (const cmd of commandModule.discordCommand) {
                        const commandJson = i18n.enrichSlashCommandLocalizations(cmd.data.toJSON());
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

                                    const optionsWithAutocomplete = mapSlashOptionsForWeb(
                                        sub.options,
                                        cmd,
                                        locale,
                                        t,
                                        sub.name
                                    );

                                    commands.push({
                                        json: {
                                            name: `${commandJson.name}_${sub.name}`,
                                            description: pickSlashLocalizedField(sub, locale, 'description'),
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

                                const optionsWithAutocomplete = mapSlashOptionsForWeb(
                                    commandJson.options,
                                    cmd,
                                    locale,
                                    t
                                );

                                commands.push({
                                    json: {
                                        ...commandJson,
                                        description: pickSlashLocalizedField(commandJson, locale, 'description'),
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
                console.error(`[Web Server] Error processing file ${file}:`, error);
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
                    //console.log(`[www] Registered autocomplete module: ${moduleName}`);
                }

                // 檢查模組是否有其他自動完成功能（如招式自動完成）
                for (const key of Object.keys(commandModule)) {
                    if (key.endsWith('Autocomplete') && typeof commandModule[key] === 'object') {
                        const moduleName = commandModule[key].moduleName || key;
                        autocompleteModules[moduleName] = commandModule[key];
                        //console.log(`[www] Registered autocomplete module: ${moduleName}`);
                    }
                }
            } catch (error) {
                console.error(`[Web Server] Failed to register autocomplete module from ${file}:`, error);
            }
        }
    }
};

// 初始化時註冊所有模組
registerAutocompleteModules();

// 通用自動完成API端點
www.get('/api/www-i18n', async (req, res) => {
    try {
        await i18n.init();
        res.json(buildWwwI18nBundle(resolveWwwLocale(req)));
    } catch (error) {
        console.error('[Web Server] www-i18n bundle error:', error.message);
        res.status(500).json({ locale: 'zh-tw', strings: {}, fallback: {} });
    }
});

www.get('/api/autocomplete/:module', async (req, res) => {
    const startTime = Date.now();
    const { module } = req.params;
    const { q, limit = 10 } = req.query;
    const t = getWwwT(req);

    // 檢查速率限制
    if (await checkRateLimit('api', req.ip)) {
        monitor.recordRequest(module, 'rate_limited', Date.now() - startTime, false);
        res.status(429).json({ error: t('www.api.rate_limit') });
        return;
    }

    if (!autocompleteModules[module]) {
        monitor.recordRequest(module, 'not_found', Date.now() - startTime, false);
        return res.status(404).json({ error: t('www.api.module_not_found') });
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
        console.error('[Web Server] Autocomplete search error:', error);
        monitor.recordRequest(module, 'error', Date.now() - startTime, false);
        res.status(500).json({ error: t('www.api.search_failed') });
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

/**
 * Plain-text KMB/LWB ETA for iOS Shortcuts (Get Contents of URL → Speak Text).
 * Single: ?route=&stop=&service_type=&bound=
 * Multi:  ?stop=&routes=251A:1:O,64K:1:I  or 251A:1:O:STOPID (BBI bay)
 */
www.get('/busstop/speak', async (req, res) => {
    if (await checkRateLimit('busSpeak', req.ip)) {
        res.status(429).end();
        return;
    }

    const t = getWwwT(req);
    const stop = sanitizeBusStopId(req.query.stop);
    const multiRoutes = parseBusSpeakRoutesParam(req.query.routes);
    const route = sanitizeBusRouteToken(req.query.route);
    const serviceType = sanitizeBusServiceType(req.query.service_type || req.query.direction);
    const bound = sanitizeBusBound(req.query.bound);

    if (!stop || (multiRoutes.length === 0 && !route)) {
        res.status(400).type('text/plain; charset=utf-8')
            .send(t('www.busstop.error_missing_params'));
        return;
    }
    if (route && !isValidBusRouteToken(route)) {
        res.status(400).type('text/plain; charset=utf-8')
            .send(t('www.busstop.error_invalid_route'));
        return;
    }

    res.set('Cache-Control', 'no-store');

    try {
        if (multiRoutes.length > 0) {
            const text = await Promise.race([
                buildMultiRouteSpeakText(stop, multiRoutes, t),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('bus speak upstream timeout')), BUS_SPEAK_WALL_MS);
                })
            ]);
            res.type('text/plain; charset=utf-8').send(text);
            return;
        }

        const apiUrl = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${encodeURIComponent(stop)}/${encodeURIComponent(route)}/${encodeURIComponent(serviceType)}`;
        const payload = await fetchJsonOverHttps(apiUrl);
        let rows = Array.isArray(payload?.data) ? payload.data.filter(row => row?.eta) : [];
        if (bound === 'O' || bound === 'I') {
            rows = rows.filter(row => row.dir === bound);
        }
        rows.sort((a, b) => Number(a.eta_seq) - Number(b.eta_seq));

        const minutes = rows.map((row) => {
            const diff = Math.round((new Date(row.eta) - Date.now()) / 60_000);
            return Math.max(0, diff);
        });
        res.type('text/plain; charset=utf-8').send(formatBusSpeakMessage(route, minutes, t));
    } catch (error) {
        console.error('[busstop/speak]', error?.message || error);
        const label = multiRoutes[0]?.route || route || t('www.busstop.bus_default');
        res.status(502).type('text/plain; charset=utf-8')
            .send(t('www.busstop.eta_unavailable', { route: label }));
    }
});

/**
 * Downloadable/importable iOS Shortcut (.shortcut binary plist).
 * Used by: shortcuts://import-shortcut?url=https://.../busstop/shortcut?...
 */
www.get('/busstop/shortcut', async (req, res) => {
    if (await checkRateLimit('busSpeak', req.ip)) {
        res.status(429).end();
        return;
    }

    const t = getWwwT(req);
    const route = sanitizeBusRouteToken(req.query.route);
    const stop = sanitizeBusStopId(req.query.stop);
    const serviceType = sanitizeBusServiceType(req.query.service_type || req.query.direction);
    const bound = sanitizeBusBound(req.query.bound);
    const multiRoutes = parseBusSpeakRoutesParam(req.query.routes);
    // Keep shortcut name ASCII-only for iOS import-shortcut URL compatibility
    const defaultName = multiRoutes.length > 0
        ? `${multiRoutes.map(r => r.route).slice(0, 3).join('+')}-ETA`
        : `${route}-ETA`;
    const rawName = String(req.query.name || defaultName).trim() || defaultName;
    const name = rawName.replaceAll(/[^\w.+-]+/g, '-') || defaultName;

    if (!stop || (multiRoutes.length === 0 && !route)) {
        res.status(400).type('text/plain; charset=utf-8')
            .send(t('www.busstop.error_missing_params'));
        return;
    }
    if (route && !isValidBusRouteToken(route)) {
        res.status(400).type('text/plain; charset=utf-8')
            .send(t('www.busstop.error_invalid_route'));
        return;
    }

    try {
        // Never trust raw Host / X-Forwarded-* for URLs embedded in downloadable shortcuts
        // (host-header poisoning would make the shortcut fetch an attacker URL).
        const speakUrl = new URL('/busstop/speak', resolveBusPublicOrigin(req));
        speakUrl.searchParams.set('stop', stop);
        if (multiRoutes.length > 0) {
            speakUrl.searchParams.set(
                'routes',
                multiRoutes.map((r) => {
                    const base = `${r.route}:${r.service_type}:${r.dir}`;
                    return r.stopId ? `${base}:${r.stopId}` : base;
                }).join(',')
            );
        } else {
            speakUrl.searchParams.set('route', route);
            speakUrl.searchParams.set('service_type', serviceType);
            if (bound) speakUrl.searchParams.set('bound', bound);
        }

        const shortcutBuffer = buildBusEtaShortcut(speakUrl.toString(), name);
        // Content-Disposition must be Latin-1; Chinese names crash Express header set.
        const asciiName = `${(multiRoutes[0]?.route || route || 'bus')}-eta.shortcut`;
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${asciiName}"`,
            'Cache-Control': 'no-store'
        });
        res.send(shortcutBuffer);
    } catch (error) {
        console.error('[busstop/shortcut]', error);
        res.status(500).type('text/plain; charset=utf-8')
            .send(t('www.busstop.shortcut_failed'));
    }
});

function formatBusMinutesPhrase(minutesList, t) {
    const translate = t || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    const mins = (minutesList || []).filter(m => m !== null && m !== undefined);
    if (mins.length === 0) return '';
    if (mins.length === 1) return translate('www.busstop.minute_one', { n: mins[0] });
    if (mins.length === 2) return translate('www.busstop.minute_and', { a: mins[0], b: mins[1] });
    const head = mins.slice(0, -1).map(m => translate('www.busstop.minute_unit', { n: m })).join('、');
    return translate('www.busstop.minutes_joined', { head, last: mins.at(-1) });
}

function formatBusSpeakMessage(route, minutesList, t) {
    const translate = t || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    const mins = (minutesList || []).filter(m => m !== null && m !== undefined);
    if (mins.length === 0) return translate('www.busstop.no_eta', { route });
    return translate('www.busstop.arrives_in', {
        route,
        minutes: formatBusMinutesPhrase(mins, translate)
    });
}

/** Strip user-controlled route tokens to safe A-Z / 0-9 / hyphen only (XSS-safe for plain-text responses). */
function sanitizeBusRouteToken(raw) {
    const normalized = String(raw || '').trim().toUpperCase();
    return normalized.replaceAll(/[^A-Z0-9-]/g, '');
}

function isValidBusRouteToken(route) {
    return /^[A-Z0-9][A-Z0-9-]{0,9}$/.test(route);
}

/** KMB/LWB stop IDs are alphanumeric (typically 16-char hex-like). */
function sanitizeBusStopId(raw) {
    const stop = String(raw || '').trim();
    return /^[A-Za-z0-9]{1,32}$/.test(stop) ? stop : '';
}

function sanitizeBusServiceType(raw) {
    const value = String(raw || '1').trim();
    return /^\d{1,3}$/.test(value) ? value : '1';
}

function sanitizeBusBound(raw) {
    const bound = String(raw || '').trim().toUpperCase();
    return bound === 'O' || bound === 'I' ? bound : '';
}

/**
 * Public origin embedded into downloadable iOS shortcuts.
 * Prefer BUS_PUBLIC_ORIGIN (https + allowlisted host only); never trust raw X-Forwarded-Host alone.
 */
function getBusAllowedPublicHosts() {
    return new Set([
        ...exportHtmlRedirectHosts,
        'bus.hktrpg.com',
        'www.hktrpg.com',
        'hktrpg.com'
    ]);
}

function resolveBusPublicOrigin(req) {
    const allowedHosts = getBusAllowedPublicHosts();
    const configured = String(process.env.BUS_PUBLIC_ORIGIN || '').trim();
    if (configured) {
        try {
            const url = new URL(configured);
            const hostname = String(url.hostname || '').toLowerCase();
            if (url.protocol === 'https:' && hostname && allowedHosts.has(hostname)) {
                return `https://${url.host}`;
            }
            console.warn('[busstop/shortcut] BUS_PUBLIC_ORIGIN rejected (need https + allowlisted host):', configured);
        } catch {
            console.warn('[busstop/shortcut] Invalid BUS_PUBLIC_ORIGIN, falling back to allowlist');
        }
    }

    const forwardedHost = String(req.get('x-forwarded-host') || req.get('host') || '')
        .split(',')[0]
        .trim()
        .toLowerCase();
    const hostname = forwardedHost.split(':')[0];
    if (hostname && allowedHosts.has(hostname)) {
        return `https://${forwardedHost}`;
    }

    return 'https://bus.hktrpg.com';
}

const BUS_SPEAK_MAX_ROUTES = 8;
const BUS_SPEAK_WALL_MS = 12_000;
const BUS_API_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Parse routes=251A:1:O,64K:1:I or 251A:1:O:STOPID */
function parseBusSpeakRoutesParam(raw) {
    return String(raw || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .slice(0, BUS_SPEAK_MAX_ROUTES)
        .map((part) => {
            const [routeRaw, serviceRaw = '1', dirRaw = '', stopRaw = ''] = part.split(':');
            const route = sanitizeBusRouteToken(routeRaw);
            const service_type = sanitizeBusServiceType(serviceRaw);
            const dir = sanitizeBusBound(dirRaw);
            const stopId = sanitizeBusStopId(stopRaw);
            if (!route || !isValidBusRouteToken(route)) return null;
            return {
                route,
                service_type,
                dir,
                stopId,
                key: `${route}|${service_type}|${dir}`
            };
        })
        .filter(Boolean);
}

function minutesUntilEta(eta) {
    const diff = Math.round((new Date(eta) - Date.now()) / 60_000);
    return Math.max(0, diff);
}

/**
 * Each selected route ≥1 bus; fill to ≥3 total; order by soonest.
 * Mirrors views/busstop.html pickBusesForSpeak + formatMultiRouteSpeak.
 */
function pickBusesForMultiSpeak(routeEntries) {
    const selected = routeEntries.filter(entry => entry.buses.length);
    if (selected.length === 0) return [];

    const allBuses = [];
    for (const entry of selected) {
        for (const bus of entry.buses) {
            allBuses.push({
                key: entry.key,
                route: entry.route,
                minutes: bus.minutes,
                etaMs: bus.etaMs
            });
        }
    }
    allBuses.sort((a, b) => a.etaMs - b.etaMs || a.minutes - b.minutes);

    const picked = [];
    const pickedIds = new Set();
    const busId = (b) => `${b.key}@${b.etaMs}@${b.minutes}`;

    for (const entry of selected) {
        const soonest = entry.buses.reduce((best, bus) =>
            (!best || bus.etaMs < best.etaMs) ? bus : best, null);
        if (!soonest) continue;
        const item = {
            key: entry.key,
            route: entry.route,
            minutes: soonest.minutes,
            etaMs: soonest.etaMs
        };
        const id = busId(item);
        if (!pickedIds.has(id)) {
            picked.push(item);
            pickedIds.add(id);
        }
    }

    for (const bus of allBuses) {
        if (picked.length >= 3) break;
        const id = busId(bus);
        if (pickedIds.has(id)) continue;
        picked.push(bus);
        pickedIds.add(id);
    }

    picked.sort((a, b) => a.etaMs - b.etaMs || a.minutes - b.minutes);
    return picked;
}

function formatMultiRouteSpeakMessage(pickedBuses, t) {
    const translate = t || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    if (pickedBuses.length === 0) return translate('www.busstop.no_eta_any');

    const order = [];
    const groups = new Map();
    for (const bus of pickedBuses) {
        if (!groups.has(bus.key)) {
            groups.set(bus.key, { route: bus.route, minutes: [] });
            order.push(bus.key);
        }
        groups.get(bus.key).minutes.push(bus.minutes);
    }

    const parts = order.map((key, index) => {
        const group = groups.get(key);
        const mins = [...group.minutes].sort((a, b) => a - b);
        const minsText = formatBusMinutesPhrase(mins, translate);
        if (index === 0) {
            return translate('www.busstop.arrives_first', { route: group.route, minutes: minsText });
        }
        return translate('www.busstop.arrives_next', { route: group.route, minutes: minsText });
    });
    return parts.join(', ');
}

async function buildMultiRouteSpeakText(stop, wantedRoutes, t) {
    const wantedKeys = new Set(wantedRoutes.map(r => r.key));
    // Preserve request order for grouping preference when ETAs tie
    const map = new Map();
    for (const wanted of wantedRoutes) {
        map.set(wanted.key, {
            key: wanted.key,
            route: wanted.route,
            buses: []
        });
    }

    // Group by bay stop id (fallback to main stop) so BBI multi-route works
    const byStop = new Map();
    for (const wanted of wantedRoutes) {
        const sid = wanted.stopId || stop;
        if (!byStop.has(sid)) byStop.set(sid, []);
        byStop.get(sid).push(wanted);
    }

    for (const [sid] of byStop) {
        const apiUrl = `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${encodeURIComponent(sid)}`;
        const payload = await fetchJsonOverHttps(apiUrl);
        const rows = Array.isArray(payload?.data) ? payload.data.filter(row => row?.eta) : [];
        for (const row of rows) {
            const key = `${String(row.route || '').toUpperCase()}|${String(row.service_type || '1')}|${String(row.dir || '').toUpperCase()}`;
            if (!wantedKeys.has(key) || !map.has(key)) continue;
            // Only accept ETA from this route's intended bay when stopId was provided
            const intended = wantedRoutes.find(r => r.key === key);
            if (intended?.stopId && intended.stopId !== sid) continue;
            const entry = map.get(key);
            entry.buses.push({
                minutes: minutesUntilEta(row.eta),
                etaMs: new Date(row.eta).getTime()
            });
        }
    }

    const entries = [...map.values()].map((entry) => {
        entry.buses.sort((a, b) => a.etaMs - b.etaMs);
        const seen = new Set();
        entry.buses = entry.buses.filter((bus) => {
            const id = `${bus.etaMs}`;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        return entry;
    });

    const picked = pickBusesForMultiSpeak(entries);
    return formatMultiRouteSpeakMessage(picked, t);
}

function fetchJsonOverHttps(url) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(url);
        } catch (error) {
            reject(error);
            return;
        }
        if (parsed.protocol !== 'https:') {
            reject(new Error('Only HTTPS upstream is allowed'));
            return;
        }
        if (parsed.hostname !== 'data.etabus.gov.hk') {
            reject(new Error('Unexpected upstream host'));
            return;
        }

        const request = https.get(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'HKTRPG-BusStop/1.0'
            },
            timeout: 10_000
        }, (response) => {
            if (response.statusCode && response.statusCode >= 400) {
                response.resume();
                reject(new Error(`KMB API HTTP ${response.statusCode}`));
                return;
            }
            const chunks = [];
            let total = 0;
            response.on('data', (chunk) => {
                total += chunk.length;
                if (total > BUS_API_MAX_RESPONSE_BYTES) {
                    request.destroy(new Error('KMB API response too large'));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                } catch (error) {
                    reject(error);
                }
            });
        });
        request.on('timeout', () => {
            request.destroy(new Error('KMB API timeout'));
        });
        request.on('error', reject);
    });
}

// ---------- Patreon dashboard and API ----------
// Key only from header to avoid leaking via URL (query), Referer, or logs.
function getPatreonKeyFromRequest(req) {
    const raw = req.headers['x-patreon-key'];
    return (typeof raw === 'string' ? raw : '') || '';
}

// Ignore dashes and spaces so "Y8YW-JQIP-WDJ3-LB1Q" and "Y8YWJQIPWDJ3LB1Q" both work.
function normalizePatreonKey(key) {
    return (typeof key === 'string' ? key : '').replaceAll(/[\s-]/g, '').toUpperCase();
}

/** Find member by key (allowed to log in even when switch is false). */
async function findPatreonMemberByKey(key) {
    const normalized = normalizePatreonKey(key);
    if (!normalized || normalized.length !== 16) return null;
    const hashed = security.hashPatreonKey(normalized);
    return await schema.patreonMember.findOne({ keyHash: hashed }).lean();
}

function toMemberResponse(doc, locale) {
    if (!doc) return null;
    const maxSlots = patreonTiers.getMaxSlotsForLevel(doc.level);
    const tierLabel = patreonTiers.getTierLabel(doc.level, locale);
    return {
        patreonName: doc.patreonName,
        level: doc.level,
        tierLabel,
        name: doc.name,
        notes: doc.notes,
        switch: doc.switch,
        vipGraceUntil: doc.vipGraceUntil || null,
        startDate: doc.startDate,
        history: doc.history || [],
        slots: doc.slots || [],
        maxSlots
    };
}

const PATREON_SLOT_RULES = {
    TARGET_ID_MAX: 64,
    NAME_MAX: 50,
    ALLOWED_PLATFORMS: ['discord', 'line', 'telegram', 'whatsapp'],
    // Allow common ID tokens only; no whitespace or control chars.
    TARGET_ID_PATTERN: /^[A-Za-z0-9_.:@-]+$/
};

/**
 * Normalize and validate one Patreon slot payload.
 * Empty targetId is allowed (unused slot), consistent with current UI.
 * @param {any} rawSlot
 * @param {number} index - 0-based slot index
 * @returns {{ valid: boolean, slot?: object, error?: string }}
 */
function normalizeAndValidatePatreonSlot(rawSlot, index, locale) {
    const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
    const slot = rawSlot || {};
    const targetId = String(slot.targetId || '').trim();
    const targetTypeRaw = String(slot.targetType || '').trim();
    const targetType = targetTypeRaw === 'channel' ? 'channel' : (targetTypeRaw === 'user' ? 'user' : '');
    const platform = String(slot.platform || '').trim();
    const name = String(slot.name || '').trim();
    const sw = !!(slot.switch !== false);

    if (targetId.length > PATREON_SLOT_RULES.TARGET_ID_MAX) {
        return {
            valid: false,
            error: t('www.patreon.slot_target_id_too_long', { index: index + 1, max: PATREON_SLOT_RULES.TARGET_ID_MAX })
        };
    }
    if (name.length > PATREON_SLOT_RULES.NAME_MAX) {
        return {
            valid: false,
            error: t('www.patreon.slot_name_too_long', { index: index + 1, max: PATREON_SLOT_RULES.NAME_MAX })
        };
    }

    // For non-empty IDs, enforce a safe token format.
    if (targetId && !PATREON_SLOT_RULES.TARGET_ID_PATTERN.test(targetId)) {
        return {
            valid: false,
            error: t('www.patreon.slot_target_id_invalid', { index: index + 1 })
        };
    }

    // Empty targetId means this slot is unused: don't force platform selection.
    if (!targetId) {
        return {
            valid: true,
            slot: {
                targetId: '',
                targetType: '',
                platform: '',
                name,
                switch: sw
            }
        };
    }

    if (!targetType) {
        return {
            valid: false,
            error: t('www.patreon.slot_target_type_required', { index: index + 1 })
        };
    }

    // For used slots, keep platform strict to current supported list.
    if (!PATREON_SLOT_RULES.ALLOWED_PLATFORMS.includes(platform.toLowerCase())) {
        return {
            valid: false,
            error: t('www.patreon.slot_invalid_platform', { index: index + 1 })
        };
    }

    return {
        valid: true,
        slot: {
            targetId,
            targetType,
            platform,
            name,
            switch: sw
        }
    };
}

function slotHasTarget(slot) {
    return !!(slot && String(slot.targetId || '').trim());
}

function formatSlotDetail(slot, index) {
    const targetId = String((slot && slot.targetId) || '').trim() || '-';
    const targetType = String((slot && slot.targetType) || '').trim() || '-';
    const platform = String((slot && slot.platform) || '').trim() || '-';
    const name = String((slot && slot.name) || '').trim() || '-';
    return `slot#${index + 1} ${targetId} - ${targetType} - ${platform} - ${name}`;
}

function buildSlotHistoryEntries(oldSlots, newSlots) {
    const entries = [];
    const maxLen = Math.max(oldSlots.length, newSlots.length);
    for (let i = 0; i < maxLen; i++) {
        const oldRaw = oldSlots[i];
        const newRaw = newSlots[i];
        const oldSlot = oldRaw ? {
            targetId: oldRaw.targetId || '',
            targetType: oldRaw.targetType || '',
            platform: oldRaw.platform || '',
            name: oldRaw.name || '',
            switch: oldRaw.switch !== false
        } : { targetId: '', targetType: '', platform: '', name: '', switch: true };
        const newSlot = newRaw ? {
            targetId: newRaw.targetId || '',
            targetType: newRaw.targetType || '',
            platform: newRaw.platform || '',
            name: newRaw.name || '',
            switch: newRaw.switch !== false
        } : { targetId: '', targetType: '', platform: '', name: '', switch: true };
        const oldHas = slotHasTarget(oldSlot);
        const newHas = slotHasTarget(newSlot);

        if (!oldHas && newHas) {
            entries.push({
                at: new Date(),
                action: 'add',
                source: 'web',
                reason: 'slot_add',
                detail: formatSlotDetail(newSlot, i)
            });
            continue;
        }
        if (oldHas && !newHas) {
            entries.push({
                at: new Date(),
                action: 'remove',
                source: 'web',
                reason: 'slot_remove',
                detail: formatSlotDetail(oldSlot, i)
            });
            continue;
        }
        if (!oldHas && !newHas) continue;

        const changedMeta = (
            String(oldSlot.targetId || '') !== String(newSlot.targetId || '') ||
            String(oldSlot.targetType || '') !== String(newSlot.targetType || '') ||
            String(oldSlot.platform || '') !== String(newSlot.platform || '') ||
            String(oldSlot.name || '') !== String(newSlot.name || '')
        );
        if (changedMeta) {
            entries.push({
                at: new Date(),
                action: 'update',
                source: 'web',
                reason: 'slot_update',
                detail: `${formatSlotDetail(oldSlot, i)} -> ${formatSlotDetail(newSlot, i)}`
            });
        }

        const oldSwitch = oldSlot.switch;
        const newSwitch = newSlot.switch;
        if (oldSwitch !== newSwitch) {
            entries.push({
                at: new Date(),
                action: newSwitch ? 'on' : 'off',
                source: 'web',
                reason: 'slot_toggle',
                detail: formatSlotDetail(newSlot, i)
            });
        }
    }
    return entries;
}

www.get('/patreon', async (req, res) => {
    if (await checkRateLimit('card', req.ip)) {
        res.status(429).end();
        return;
    }
    res.sendFile(path.join(process.cwd(), 'views', 'patreon.html'));
});

www.post('/api/patreon/validate', async (req, res) => {
    const t = getWwwT(req);
    if (await checkRateLimit('patreon', req.ip)) {
        res.status(429).json({ error: t('www.patreon.too_many_requests') });
        return;
    }
    try {
        const key = getPatreonKeyFromRequest(req);
        const member = await findPatreonMemberByKey(key);
        if (!member) {
            res.status(401).json({ error: t('www.patreon.invalid_key') });
            return;
        }
        res.json(toMemberResponse(member, resolveWwwLocale(req)));
    } catch (error) {
        console.error('[Web Server] Patreon validate error:', error.message);
        res.status(500).json({ error: t('www.patreon.server_error') });
    }
});

www.get('/api/patreon/me', async (req, res) => {
    const t = getWwwT(req);
    if (await checkRateLimit('patreon', req.ip)) {
        res.status(429).json({ error: t('www.patreon.too_many_requests') });
        return;
    }
    try {
        const key = getPatreonKeyFromRequest(req);
        const member = await findPatreonMemberByKey(key);
        if (!member) {
            res.status(401).json({ error: t('www.patreon.invalid_key') });
            return;
        }
        res.json(toMemberResponse(member, resolveWwwLocale(req)));
    } catch (error) {
        console.error('[Web Server] Patreon me error:', error.message);
        res.status(500).json({ error: t('www.patreon.server_error') });
    }
});

www.put('/api/patreon/me/slots', async (req, res) => {
    const locale = resolveWwwLocale(req);
    const t = getWwwT(req);
    if (await checkRateLimit('patreon', req.ip)) {
        res.status(429).json({ error: t('www.patreon.too_many_requests') });
        return;
    }
    try {
        const key = getPatreonKeyFromRequest(req);
        const member = await findPatreonMemberByKey(key);
        if (!member) {
            res.status(401).json({ error: t('www.patreon.invalid_key') });
            return;
        }
        const graceOk = member.vipGraceUntil && new Date(member.vipGraceUntil) > new Date();
        if (!member.switch && !graceOk) {
            res.status(403).json({ error: t('www.patreon.membership_disabled') });
            return;
        }
        const slots = req.body && Array.isArray(req.body.slots) ? req.body.slots : [];
        const maxSlots = patreonTiers.getMaxSlotsForLevel(member.level);
        if (slots.length > maxSlots) {
            res.status(400).json({ error: t('www.patreon.slots_exceed_limit', { max: maxSlots }) });
            return;
        }
        const trimmedSlots = slots.slice(0, maxSlots);
        const normalizedSlots = [];
        for (let i = 0; i < trimmedSlots.length; i++) {
            const validated = normalizeAndValidatePatreonSlot(trimmedSlots[i], i, locale);
            if (!validated.valid) {
                res.status(400).json({ error: validated.error || t('www.patreon.invalid_slot_payload') });
                return;
            }
            normalizedSlots.push(validated.slot);
        }
        const oldSlots = Array.isArray(member.slots) ? member.slots : [];
        const historyEntries = buildSlotHistoryEntries(oldSlots, normalizedSlots);
        const updateDoc = { $set: { slots: normalizedSlots } };
        if (historyEntries.length > 0) {
            updateDoc.$push = { history: { $each: historyEntries } };
        }
        await schema.patreonMember.updateOne(
            { _id: member._id },
            updateDoc
        );
        const updated = await schema.patreonMember.findOne({ _id: member._id }).lean();
        await patreonSync.syncMemberSlotsToVip(updated);
        res.json(toMemberResponse(updated, resolveWwwLocale(req)));
    } catch (error) {
        console.error('[Web Server] Patreon slots update error:', error.message);
        res.status(500).json({ error: t('www.patreon.server_error') });
    }
});

www.patch('/api/patreon/me/slot/:index', async (req, res) => {
    const t = getWwwT(req);
    if (await checkRateLimit('patreon', req.ip)) {
        res.status(429).json({ error: t('www.patreon.too_many_requests') });
        return;
    }
    try {
        const key = getPatreonKeyFromRequest(req);
        const member = await findPatreonMemberByKey(key);
        if (!member) {
            res.status(401).json({ error: t('www.patreon.invalid_key') });
            return;
        }
        const graceOk = member.vipGraceUntil && new Date(member.vipGraceUntil) > new Date();
        if (!member.switch && !graceOk) {
            res.status(403).json({ error: t('www.patreon.membership_disabled') });
            return;
        }
        const index = Number.parseInt(req.params.index, 10);
        if (Number.isNaN(index) || index < 0 || index >= (member.slots || []).length) {
            res.status(400).json({ error: t('www.patreon.invalid_slot_index') });
            return;
        }
        const body = req.body || {};
        const currentSlotSwitch = member.slots[index] && member.slots[index].switch !== false;
        const newSwitch = body.switch !== undefined ? !!body.switch : !currentSlotSwitch;
        member.slots[index].switch = newSwitch;
        const toggleHistory = slotHasTarget(member.slots[index])
            ? [{
                at: new Date(),
                action: newSwitch ? 'on' : 'off',
                source: 'web',
                reason: 'slot_toggle',
                detail: formatSlotDetail(member.slots[index], index)
            }]
            : [];
        const updateDoc = { $set: { slots: member.slots } };
        if (toggleHistory.length > 0) {
            updateDoc.$push = { history: { $each: toggleHistory } };
        }
        await schema.patreonMember.updateOne(
            { _id: member._id },
            updateDoc
        );
        await patreonSync.syncSlotToVip(
            member.slots[index],
            member.level,
            member.keyHash,
            member.name || member.patreonName,
            member
        );
        const updated = await schema.patreonMember.findOne({ _id: member._id }).lean();
        res.json(toMemberResponse(updated, resolveWwwLocale(req)));
    } catch (error) {
        console.error('[Web Server] Patreon slot toggle error:', error.message);
        res.status(500).json({ error: t('www.patreon.server_error') });
    }
});

www.get('/log/:id', async (req, res) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }

    if (req.originalUrl.endsWith('html')) {
        // Sanitize and validate the file path
        const logPath = path.resolve(exportBaseDir, req.params.id);

        // Ensure the resolved path is within the allowed directory and file exists
        if (!logPath.startsWith(path.resolve(exportBaseDir)) || !fs.existsSync(logPath)) {
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

// Backward-compatible shortcut:
// /<file>.html -> /log/<file>.html
// This keeps old/shared links working while preserving /log path validation.
www.get(/^\/([^/]+\.html)$/i, async (req, res, next) => {
    if (await checkRateLimit('api', req.ip)) {
        res.status(429).end();
        return;
    }
    // Restrict shortcut redirect to configured export-link hosts only.
    // Use EXPORT_HTML_REDIRECT_HOSTS for multi-domain deployments.
    const requestHost = String(req.hostname || '').toLowerCase();
    if (!exportHtmlRedirectHosts.has(requestHost)) {
        next();
        return;
    }
    const fileName = req.params[0];
    res.redirect(`/log/${encodeURIComponent(fileName)}`);
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
                console.warn('[Web Server] 🔒 Rejected connection from invalid origin:', origin);
                return next(new Error('Invalid origin'));
            }
        }

        next();
    });

    io.on('connection', async (socket) => {
        socket._hktrpgLocale = i18n.normalizeLocale(
            socket.handshake.query?.lang || socket.handshake.headers?.['accept-language']?.split(',')[0]
        );
        socket.on('getListInfo', async message => {
            const t = getSocketT(socket);
            // Use cardRead limit for list info (less restrictive)
            if (await limitRaterCardRead(socket.handshake.address)) return;

            try {
                // 🔒 驗證輸入
                const validation = security.validateCredentials(message);
                if (!validation.valid) {
                    console.warn('[Web Server] 🔒 Invalid credentials format:', validation.error, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: t('www.socket.invalid_credentials_format'),
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
                        console.error('[Web Server] 🔒 MongoDB error during authentication:', error.message);
                        socket.emit('getListInfo', {
                            temp: null,
                            id: [],
                            error: t('www.socket.db_error'),
                            code: 'DB_ERROR'
                        });
                        return null;
                    });

                if (!doc) {
                    console.warn('[Web Server] 🔒 User not found:', userName, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: t('www.socket.user_not_found'),
                        code: 'USER_NOT_FOUND'
                    });
                    return;
                }

                const isValid = await verifyPasswordSecure(password, doc.password);
                if (!isValid) {
                    console.warn('[Web Server] 🔒 Invalid password for user:', userName, 'from IP:', socket.handshake.address);
                    socket.emit('getListInfo', {
                        temp: null,
                        id: [],
                        error: t('www.socket.invalid_password'),
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
                    console.error('[Web Server] 🔄 Password upgrade failed:', error.message);
                    // 升級失敗不影響登入流程
                }

                // 驗證成功，獲取數據
                let temp;
                if (doc.id) {
                    temp = await schema.characterCard.find({ id: doc.id })
                        .catch(error => {
                            console.error('[Web Server] 🔒 MongoDB error:', error.message);
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
                        console.error('[Web Server] 🔐 JWT token generation failed:', error.message);
                    }
                }

                socket.emit('getListInfo', { temp, id, token: jwtToken });

            } catch (error) {
                console.error('[Web Server] 🔒 getListInfo error:', error.message);
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
                console.error('[Web Server] MongoDB error:', error.name, error.reason)
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
                    botname: "WWW",
                    locale: socket._hktrpgLocale,
                    t: getSocketT(socket)
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
                    botname: "WWW",
                    locale: socket._hktrpgLocale,
                    t: getSocketT(socket)
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
                            console.warn('[Web Server] 🔒 Invalid JWT auth for rolling:', validation.error);
                            return;
                        }

                        const { userName } = validation.data;

                        let filter = {
                            userName: String(userName).trim()
                        };

                        let doc = await schema.accountPW.findOne(filter).catch(error => console.error('[Web Server] MongoDB error:', error.name, error.message));

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
                        console.error('[Web Server] Error handling selectedGroupId in rolling event:', error.message);
                    }
                }
                // Legacy support for rollTarget
                else if (message.rollTarget && message.rollTarget.id && message.rollTarget.botname && message.userName && message.userPassword && message.cardName) {
                    try {
                        // 🔒 驗證憑證
                        const validation = security.validateCredentials(message);
                        if (!validation.valid) {
                            console.warn('[Web Server] 🔒 Invalid credentials for rolling:', validation.error);
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
                                console.error('[Web Server] 🔒 MongoDB error:', error.message);
                                return null;
                            });

                        if (!userDoc) {
                            console.warn('[Web Server] 🔒 User not found for rolling');
                            return;
                        }

                        // 🔒 驗證密碼
                        const isValid = await verifyPasswordSecure(password, userDoc.password);
                        if (!isValid) {
                            console.warn('[Web Server] 🔒 Invalid password for rolling');
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
                            console.error('[Web Server] 🔄 Password upgrade failed for rolling:', error.message);
                            // 升級失敗不影響擲骰流程
                        }

                        let filter2 = {
                            "botname": String(message.rollTarget.botname).trim(),
                            "id": String(message.rollTarget.id).trim()
                        };

                        let allowRollingResult = await schema.allowRolling.findOne(filter2)
                            .catch(error => {
                                console.error('[Web Server] 🔒 MongoDB error:', error.message);
                                return null;
                            });

                        if (!allowRollingResult) {
                            console.warn('[Web Server] 🔒 Rolling not allowed for this target');
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
                        console.error('[Web Server] 🔒 Rolling error:', error.message);
                    }
                }
            }
        })

        socket.on('removeChannel', async message => {
            const t = getSocketT(socket);
            if (await limitRaterCard(socket.handshake.address)) return;
            //回傳 message 給發送訊息的 Client
            try {
                // 🔒 使用JWT Token驗證
                const validation = security.validateJWTAuth({
                    token: message.token,
                    userName: message.userName
                });
                if (!validation.valid) {
                    socket.emit('removeChannel', { success: false, message: t('www.socket.invalid_jwt') });
                    return;
                }

                const { userName } = validation.data;

                // 🔒 防止 NoSQL 注入 - 強制型別轉換
                let filter = {
                    userName: String(userName).trim()
                };

                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('[Web Server] 🔒 MongoDB error:', error.message);
                        return null;
                    });

                // 🔒 JWT token已經驗證了用戶身份，不需要密碼驗證
                if (!doc) {
                    socket.emit('removeChannel', { success: false, message: t('www.socket.user_not_found') });
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
                    socket.emit('removeChannel', { success: true, message: t('www.socket.channel_removed') });
                } else {
                    socket.emit('removeChannel', { success: false, message: t('www.socket.channel_not_found') });
                }
            } catch (error) {
                console.error('core-www removeChannel ERROR:', error);
                socket.emit('removeChannel', { success: false, message: t('www.socket.db_error_detail', { message: error.message }) });
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
                    console.warn('[Web Server] 🔒 Invalid JWT auth for updateCard:', validation.error);
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
                        console.error('[Web Server] 🔒 MongoDB error:', error.message);
                        return null;
                    });

                // 🔒 JWT token已經驗證了用戶身份，不需要密碼驗證
                if (!doc) {
                    console.warn('[Web Server] 🔒 User not found for updateCard:', userName);
                    socket.emit('updateCard', false);
                    return;
                }

                // 驗證成功，更新卡片
                let temp;
                if (doc.id && message.card) {
                    // 後端驗證：禁止同名與超長內容
                    const validationError = validateCardPayload(message.card, message.locale);
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
                        console.error('[Web Server] 🔒 MongoDB error:', error.message);
                        return null;
                    });
                }

                socket.emit('updateCard', !!temp);

            } catch (error) {
                console.error('[Web Server] 🔒 updateCard error:', error.message);
                socket.emit('updateCard', false);
            }
        })



        // 有連線發生時增加人數
        onlineCount++;
        // 發送人數給網頁
        io.emit("online", onlineCount);
        // 發送紀錄最大值
        socket.emit("maxRecord", records.chatRoomGetMax());
        setTimeout(async () => {
            try {
                const msgs = await records.chatRoomGet("公共房間");
                socket.emit("chatRecord", msgs, "公共房間");
            } catch (error) {
                console.error('[Web Server] Failed to get chat room messages:', error);
                socket.emit("chatRecord", [], "公共房間");
            }
        }, 200);


        socket.on("greet", () => {
            socket.emit("greet", onlineCount);
        });

        socket.on("send", async (msg) => {
            if (await limitRaterChatRoom(socket.handshake.address)) return;

            // 🔒 使用安全的輸入驗證
            const validation = security.validateChatMessage(msg);
            if (!validation.valid) {
                console.warn('[Web Server] 🔒 Invalid chat message:', validation.error,
                    'from IP:', socket.handshake.address,
                    'msg data:', JSON.stringify(msg).slice(0, 200));

                // Send user-friendly error message to client
                const userFriendlyError = getUserFriendlyError(validation.error, socket._hktrpgLocale);
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
            setTimeout(async () => {
                try {
                    const msgs = await records.chatRoomGet(roomNumber);
                    socket.emit("chatRecord", msgs, roomNumber);
                } catch (error) {
                    console.error('[Web Server] Failed to get chat room messages:', error);
                    socket.emit("chatRecord", [], roomNumber);
                }
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
        console.error('[Web Server] 🔒 Password verification error:', error.message);
        return false;
    }
}

function checkNullItem(target) {
    return target.filter(item => item.name);
}
function validateCardPayload(card, locale = i18n.DEFAULT_LOCALE) {
    const t = i18n.createTranslator(locale);
    try {
        if (!card) return t('character.validation_invalid_input');
        const name = (card.name || '').toString().trim();
        if (!name) return t('character.validation_name_empty');
        if (name.length > 50) return t('character.validation_name_too_long');

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
        if (sD.length > 0 || rD.length > 0 || nD.length > 0) return t('character.validation_duplicate_names');

        for (const it of (card.state || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return t('character.validation_state_name_empty');
            if (tooLong(it.name, 50)) return t('character.validation_state_name_too_long', { name: it.name });
            if (tooLong(it.itemA, 50)) return t('character.validation_state_value_a_too_long', { name: it.name });
            if (tooLong(it.itemB, 50)) return t('character.validation_state_value_b_too_long', { name: it.name });
        }
        for (const it of (card.roll || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return t('character.validation_roll_name_empty');
            if (tooLong(it.name, 50)) return t('character.validation_roll_name_too_long', { name: it.name });
            if (tooLong(it.itemA, 150)) return t('character.validation_roll_content_too_long', { name: it.name });
        }
        for (const it of (card.notes || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return t('character.validation_notes_name_empty');
            if (tooLong(it.name, 50)) return t('character.validation_notes_name_too_long', { name: it.name });
            if (tooLong(it.itemA, 1500)) return t('character.validation_notes_content_too_long', { name: it.name });
        }
        return null;
    } catch {
        return t('character.validation_failed');
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
        port: wsPort,
        verifyClient: (info) => {
            if (wsAllowNonLocal) {
                return true;
            }
            const remote = info.req.socket.remoteAddress;
            return remote === '::ffff:127.0.0.1' || remote === '127.0.0.1' || remote === '::1';
        }
    });

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            try {
                const text = String(message);
                // Routine shard handshake is noisy on every cluster boot
                if (!text.startsWith('connected To core-www')) {
                    console.log('[www] received: %s', text);
                }
            } catch (error) {
                console.error('[Web Server] WebSocket message error:', error);
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
function pickSlashLocalizedField(item, locale, field) {
    if (!item || typeof item !== 'object') {
        return '';
    }
    const locMapKey = field === 'name' ? 'name_localizations' : 'description_localizations';
    if (locale === 'en' && item[locMapKey] && typeof item[locMapKey] === 'object') {
        const discordLocale = i18n.toDiscordLocale(locale);
        return item[locMapKey][discordLocale] || item[locMapKey]['en-US'] || item[field];
    }
    return item[field];
}

function getBuilderSlashOptionMeta(cmd, subcommandName, optionName) {
    const data = cmd?.data;
    if (!data?.options) {
        return null;
    }
    const rootOptions = typeof data.options.find === 'function'
        ? data.options
        : Array.from(data.options.values?.() ?? data.options);
    if (subcommandName) {
        const sub = rootOptions.find((o) => o.name === subcommandName);
        const subOptions = sub?.options
            ? (typeof sub.options.find === 'function' ? sub.options : Array.from(sub.options.values?.() ?? sub.options))
            : [];
        return subOptions.find((o) => o.name === optionName) ?? null;
    }
    return rootOptions.find((o) => o.name === optionName) ?? null;
}

function mapSlashOptionsForWeb(rawOptions, cmd, locale, t, subcommandName = null) {
    return (rawOptions || []).map((option) => {
        const localized = {
            ...option,
            description: pickSlashLocalizedField(option, locale, 'description')
        };
        if (Array.isArray(option.choices)) {
            localized.choices = option.choices.map((choice) => ({
                ...choice,
                name: pickSlashLocalizedField(choice, locale, 'name')
            }));
        }
        const builderOpt = getBuilderSlashOptionMeta(cmd, subcommandName, option.name);
        if (builderOpt?.autocompleteModule) {
            localized.autocomplete = {
                enabled: true,
                module: builderOpt.autocompleteModule || 'default',
                searchFields: builderOpt.autocompleteSearchFields || ['display', 'value'],
                limit: builderOpt.autocompleteLimit || 8,
                minQueryLength: builderOpt.autocompleteMinQueryLength || 1,
                placeholder: localized.description,
                noResultsText: resolveAutocompleteNoResultsText(builderOpt, t)
            };
        }
        return localized;
    });
}

function resolveAutocompleteNoResultsText(option, t) {
    if (option.autocompleteNoResultsKey) {
        return t(option.autocompleteNoResultsKey);
    }
    return option.autocompleteNoResultsText || t('www.busstop.autocomplete_no_results');
}

function getUserFriendlyError(error, locale) {
    const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
    const errorKeyMap = {
        'Invalid message format': 'www.chat_validation.invalid_format',
        'Invalid name type': 'www.chat_validation.invalid_name_type',
        'Invalid message type': 'www.chat_validation.invalid_message_type',
        'Invalid room number type': 'www.chat_validation.invalid_room_type',
        'Invalid name length (1-50 characters)': 'www.chat_validation.invalid_name_length',
        'Invalid message length (1-2000 characters)': 'www.chat_validation.invalid_message_length',
        'Suspicious content detected': 'www.chat_validation.suspicious_content',
        'Invalid room number': 'www.chat_validation.invalid_room_number'
    };

    const key = errorKeyMap[error];
    if (key) {
        return t(key);
    }
    return t('www.chat_validation.invalid_generic', { error });
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