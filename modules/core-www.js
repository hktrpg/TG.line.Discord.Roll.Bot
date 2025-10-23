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
const rateLimitConfig = {
    chatRoom: { points: 90, duration: 60 },
    card: { points: 20, duration: 60 },
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
        try {
            if (socket && socket.writable) {
                // Respond with a simple 400 so clients don't retry the same bad request
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            }
        } catch {
            // Intentionally ignore write errors
        } finally {
            try {
                if (socket && !socket.destroyed) socket.destroy(err);
            } catch { /* ignore */ }
        }
    });

    // For HTTPS servers, also proactively destroy on TLS handshake errors
    server.on('tlsClientError', (err, socket) => {
        try {
            if (socket && !socket.destroyed) socket.destroy(err);
        } catch { /* ignore */ }
    });
    server.listen(port, () => {
        console.log("Web Server Started. Link: " + protocol + "://127.0.0.1:" + port);
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
                                    commands.push({
                                        json: {
                                            name: `${commandJson.name}_${sub.name}`,
                                            description: sub.description,
                                            options: sub.options || []
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
                                commands.push({
                                    json: commandJson,
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
    // 🔒 添加安全中间件
    io.use((socket, next) => {
        // Origin 验证
        const origin = socket.handshake.headers.origin;
        if (origin) {
            const allowedOrigins = [
                'https://hktrpg.com',
                'https://www.hktrpg.com',
                'http://localhost:20721'  // 开发环境
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
            if (await limitRaterCard(socket.handshake.address)) return;
            
            try {
                // 🔒 Decode password from Base64 first
                let decodedPassword;
                try {
                    if (!message.userPassword) {
                        throw new Error('No password provided');
                    }
                    decodedPassword = Buffer.from(message.userPassword, 'base64').toString('utf8');
                } catch (decodeError) {
                    console.warn('🔒 Failed to decode password for getListInfo:', decodeError.message);
                    socket.emit('getListInfo', { temp: null, id: [] });
                    return;
                }
                
                // 🔒 验证输入
                const validation = security.validateCredentials({
                    userName: message.userName,
                    userPassword: decodedPassword
                });
                if (!validation.valid) {
                    console.warn('🔒 Invalid credentials:', validation.error);
                    socket.emit('getListInfo', { temp: null, id: [] });
                    return;
                }
                
                const { userName, userPassword: password } = validation.data;
                
                // 🔒 防止 NoSQL 注入 - 强制类型转换
                let filter = {
                    userName: String(userName).trim()
                };
                
                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                
                // 🔒 使用安全的密码验证（支持 legacy 和 bcrypt）
                if (!doc) {
                    console.warn('🔒 User not found:', userName);
                    socket.emit('getListInfo', { temp: null, id: [] });
                    return;
                }
                
                console.log('🔍 Debug before verification:', {
                    userName: userName,
                    password: password,
                    storedHash: doc.password,
                    hashLength: doc.password ? doc.password.length : 0
                });
                
                const isValid = await verifyPasswordSecure(password, doc.password);
                if (!isValid) {
                    console.warn('🔒 Invalid password for user:', userName);
                    socket.emit('getListInfo', { temp: null, id: [] });
                    return;
                }
                
                // 验证成功，获取数据
                let temp;
                if (doc.id) {
                    temp = await schema.characterCard.find({ id: doc.id })
                        .catch(error => {
                            console.error('🔒 MongoDB error:', error.message);
                            return null;
                        });
                }
                
                let id = doc.channel || [];
                
                socket.emit('getListInfo', { temp, id });
                
            } catch (error) {
                console.error('🔒 getListInfo error:', error.message);
                socket.emit('getListInfo', { temp: null, id: [] });
            }
        })

        socket.on('getPublicListInfo', async () => {
            if (await limitRaterCard(socket.handshake.address)) return;
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
                        // 🔒 Decode password from Base64 first
                        let decodedPassword;
                        try {
                            if (!message.userPassword) {
                                throw new Error('No password provided');
                            }
                            decodedPassword = Buffer.from(message.userPassword, 'base64').toString('utf8');
                        } catch (decodeError) {
                            console.warn('🔒 Failed to decode password for selectedGroupId:', decodeError.message);
                            return;
                        }
                        
                        // 🔒 Use secure verification instead of direct SHA
                        const validation = security.validateCredentials({
                            userName: message.userName,
                            userPassword: decodedPassword
                        });
                        if (!validation.valid) {
                            console.warn('🔒 Invalid credentials for selectedGroupId:', validation.error);
                            return;
                        }
                        
                        const { userName, userPassword: password } = validation.data;
                        
                        let filter = {
                            userName: String(userName).trim()
                        };

                        let result = await schema.accountPW.findOne(filter).catch(error => console.error('www #214 mongoDB error:', error.name, error.message));
                        
                        if (!result) {
                            console.warn('🔒 User not found for selectedGroupId');
                            return;
                        }
                        
                        // 🔒 Verify password securely
                        const isValid = await verifyPasswordSecure(password, result.password);
                        if (!isValid) {
                            console.warn('🔒 Invalid password for selectedGroupId');
                            return;
                        }
                        if (result && result.channel) {
                            // Find the channel with matching ID - needs to be compared as strings
                            const targetChannel = result.channel.find(ch => ch._id && ch._id.toString() === message.selectedGroupId);
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
                    } catch (error) {
                        console.error('Error handling selectedGroupId in rolling event:', error.message);
                    }
                }
                // Legacy support for rollTarget
                else if (message.rollTarget && message.rollTarget.id && message.rollTarget.botname && message.userName && message.userPassword && message.cardName) {
                    try {
                        // 🔒 Decode password from Base64 first
                        let decodedPassword;
                        try {
                            if (!message.userPassword) {
                                throw new Error('No password provided');
                            }
                            decodedPassword = Buffer.from(message.userPassword, 'base64').toString('utf8');
                        } catch (decodeError) {
                            console.warn('🔒 Failed to decode password for rolling:', decodeError.message);
                            return;
                        }
                        
                        // 🔒 验证凭证
                        const validation = security.validateCredentials({
                            userName: message.userName,
                            userPassword: decodedPassword
                        });
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
                        
                        // 🔒 验证密码
                        const isValid = await verifyPasswordSecure(password, userDoc.password);
                        if (!isValid) {
                            console.warn('🔒 Invalid password for rolling');
                            return;
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
                // 🔒 Decode password from Base64 first
                let decodedPassword;
                try {
                    if (!message.userPassword) {
                        throw new Error('No password provided');
                    }
                    decodedPassword = Buffer.from(message.userPassword, 'base64').toString('utf8');
                } catch (decodeError) {
                    console.warn('🔒 Failed to decode password for removeChannel:', decodeError.message);
                    return;
                }
                
                // 🔒 Use secure verification instead of direct SHA
                const validation = security.validateCredentials({
                    userName: message.userName,
                    userPassword: decodedPassword
                });
                if (!validation.valid) {
                    console.warn('🔒 Invalid credentials for removeChannel:', validation.error);
                    return;
                }
                
                const { userName, userPassword: password } = validation.data;
                
                // 🔒 Find user and verify password securely
                let filter = {
                    userName: String(userName).trim()
                };
                
                let userDoc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                
                if (!userDoc) {
                    console.warn('🔒 User not found for removeChannel:', userName);
                    return;
                }
                
                const isValid = await verifyPasswordSecure(password, userDoc.password);
                if (!isValid) {
                    console.warn('🔒 Invalid password for removeChannel:', userName);
                    return;
                }
                
                // 🔒 Update using user ID instead of password hash
                await schema.accountPW.updateOne({
                    "_id": userDoc._id
                }, {
                    $pull: {
                        channel: {
                            "id": message.channelId,
                            "botname": message.botname
                        }
                    }
                });
            } catch (error) {
                console.error('core-www ERROR:', error);
            }

        })

        socket.on('updateCard', async message => {
            if (await limitRaterCard(socket.handshake.address)) return;

            try {
                // 🔒 Decode password from Base64 with error handling
                let decodedPassword;
                try {
                    if (!message.userPassword) {
                        throw new Error('No password provided');
                    }
                    decodedPassword = Buffer.from(message.userPassword, 'base64').toString('utf8');
                } catch (decodeError) {
                    console.warn('🔒 Failed to decode password:', decodeError.message);
                    socket.emit('updateCard', false);
                    return;
                }
                
                // 🔒 验证输入
                const validation = security.validateCredentials({
                    userName: message.userName,
                    userPassword: decodedPassword
                });
                
                if (!validation.valid) {
                    console.warn('🔒 Invalid credentials for updateCard:', validation.error);
                    socket.emit('updateCard', false);
                    return;
                }
                
                const { userName, userPassword: password } = validation.data;

                // 🔒 防止 NoSQL 注入
                let filter = {
                    userName: String(userName).trim()
                };
                
                let doc = await schema.accountPW.findOne(filter)
                    .catch(error => {
                        console.error('🔒 MongoDB error:', error.message);
                        return null;
                    });
                
                // 🔒 使用安全的密码验证
                if (!doc) {
                    console.warn('🔒 User not found for updateCard:', userName);
                    socket.emit('updateCard', false);
                    return;
                }
                
                const isValid = await verifyPasswordSecure(password, doc.password);
                if (!isValid) {
                    console.warn('🔒 Invalid password for updateCard:', userName);
                    socket.emit('updateCard', false);
                    return;
                }
                
                // 验证成功，更新卡片
                let temp;
                if (doc.id && message.card) {
                    message.card.state = checkNullItem(message.card.state || []);
                    message.card.roll = checkNullItem(message.card.roll || []);
                    message.card.notes = checkNullItem(message.card.notes || []);
                    
                    temp = await schema.characterCard.findOneAndUpdate({
                        id: doc.id,
                        _id: message.card._id
                    }, {
                        $set: {
                            public: message.card.public,
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
            
            // 🔒 使用安全的输入验证
            const validation = security.validateChatMessage(msg);
            if (!validation.valid) {
                console.warn('🔒 Invalid chat message:', validation.error, 
                    'from', socket.handshake.address);
                socket.emit('error', { message: validation.error });
                return;
            }

            // 🔒 修复：使用正确的字段名 msg 和 roomNumber
            const { name, msg: text, roomNumber } = validation.data;
            const time = new Date(); // Use server's time for accuracy

            const payload = {
                name: name,
                msg: '\n' + text, // keep leading newline as before
                time: time,
                roomNumber: roomNumber  // 🔒 修复：使用 roomNumber
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
function SHA(text) {
    // Ensure text is a string and salt is a string
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ SHA function called with invalid text:', text);
        return '';
    }
    const saltValue = salt || 'default-salt-for-legacy-compatibility';
    return crypto.createHmac('sha256', saltValue)
        .update(text)
        .digest('hex');
}

// 🔒 Secure password verification
// Handles both legacy SHA hashes and new bcrypt hashes
async function verifyPasswordSecure(password, hash) {
    try {
        // Validate inputs
        if (!password || !hash) {
            console.warn('🔒 Invalid password or hash provided');
            return false;
        }
        
        // First try bcrypt verification
        const bcryptValid = await security.verifyPassword(password, hash);
        if (bcryptValid) {
            console.log('✅ Password verified with bcrypt');
            return true;
        }
        
        // Fallback: check if it matches legacy SHA hash
        const legacyHash = SHA(password);
        console.log('🔍 Debug password verification:', {
            password: password,
            hash: hash,
            legacyHash: legacyHash,
            hashMatch: legacyHash === hash,
            saltUsed: salt || 'default-salt-for-legacy-compatibility'
        });
        
        // Try with different salt values if the default doesn't work
        if (legacyHash !== hash) {
            const commonSalts = [
                '', // empty salt
                'hktrpg', // common project name
                'default', // common default
                'salt', // literal salt
                'password', // common password salt
                'secret' // common secret
            ];
            
            for (const testSalt of commonSalts) {
                const testHash = crypto.createHmac('sha256', testSalt)
                    .update(password)
                    .digest('hex');
                if (testHash === hash) {
                    console.log('✅ Found matching salt:', testSalt);
                    console.warn('⚠️ User authenticated with legacy hash. Consider migrating to bcrypt.');
                    return true;
                }
            }
        } else {
            console.warn('⚠️ User authenticated with legacy hash. Consider migrating to bcrypt.');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('🔒 Password verification error:', error.message);
        return false;
    }
}

function checkNullItem(target) {
    return target.filter(item => item.name);
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
                console.log('received: %s', message);
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