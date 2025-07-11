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
    io.on('connection', async (socket) => {
    socket.on('getListInfo', async message => {
        if (await limitRaterCard(socket.handshake.address)) return;
        //回傳 message 給發送訊息的 Client
        let filter = {
            userName: message.userName,
            password: SHA(message.userPassword)
        }
        let doc = await schema.accountPW.findOne(filter).catch(error => console.error('www #144 mongoDB error:', error.name, error.reason));
        let temp;
        if (doc && doc.id) {
            temp = await schema.characterCard.find({
                id: doc.id
            }).catch(error => console.error('www #149 mongoDB error:', error.name, error.reason));
        }
        let id = [];
        if (doc && doc.channel) {
            id = doc.channel;
        }
        socket.emit('getListInfo', {
            temp,
            id
        })
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
                    let filter = {
                        userName: message.userName,
                        password: SHA(message.userPassword),
                    };
                    
                    let result = await schema.accountPW.findOne(filter).catch(error => console.error('www #214 mongoDB error:', error.name, error.message));
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
                let filter = {
                    userName: message.userName,
                    password: SHA(message.userPassword),
                    "channel.id": message.rollTarget.id,
                    "channel.botname": message.rollTarget.botname
                }
                let result = await schema.accountPW.findOne(filter).catch(error => console.error('www #214 mongoDB error:', error.name, error.reason));
                if (!result) return;
                let filter2 = {
                    "botname": message.rollTarget.botname,
                    "id": message.rollTarget.id
                }
                let allowRollingResult = await schema.allowRolling.findOne(filter2).catch(error => console.error('www #220 mongoDB error:', error.name, error.reason));
                if (!allowRollingResult) return;
                rplyVal.text = '@' + message.cardName + ' - ' + message.item + '\n' + rplyVal.text;
                if (message.rollTarget.botname) {
                    if (!sendTo) return;
                    sendTo({
                        target: message.rollTarget,
                        text: rplyVal.text
                    })
                }
            }
        }
    })

    socket.on('removeChannel', async message => {
        if (await limitRaterCard(socket.handshake.address)) return;
        //回傳 message 給發送訊息的 Client
        try {
            await schema.accountPW.updateOne({
                "userName": message.userName,
                "password": SHA(message.userPassword)
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
        //回傳 message 給發送訊息的 Client
        let filter = {
            userName: message.userName,
            password: SHA(message.userPassword)
        }
        let doc = await schema.accountPW.findOne(filter).catch(error => console.error('www #246 mongoDB error:', error.name, error.reason));
        let temp;
        if (doc && doc.id) {
            message.card.state = checkNullItem(message.card.state);
            message.card.roll = checkNullItem(message.card.roll);
            message.card.notes = checkNullItem(message.card.notes);
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
            }).catch(error => console.error('www #262 mongoDB error:', error.name, error.reason));
        }
        if (temp) {
            socket.emit('updateCard', true)
        } else {
            socket.emit('updateCard', false)
        }
    })



    // 有連線發生時增加人數
    onlineCount++;
    // 發送人數給網頁
    io.emit("online", onlineCount);
    // 發送紀錄最大值
    socket.emit("maxRecord", records.chatRoomGetMax());
    // 發送紀錄
    //socket.emit("chatRecord", records.get());
    records.chatRoomGet("公共房間", (msgs) => {
        socket.emit("chatRecord", msgs);
    });


    socket.on("greet", () => {
        socket.emit("greet", onlineCount);
    });

    socket.on("send", async (msg) => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
        // 因此我們直接 return ，終止函式執行。
        if (Object.keys(msg).length < 2) return;
        msg.msg = '\n' + msg.msg
        records.chatRoomPush(msg);
    });

    socket.on("newRoom", async (msg) => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
        // 因此我們直接 return ，終止函式執行。
        if (!msg) return;
        let roomNumber = msg || "公共房間";
        records.chatRoomGet(roomNumber, (msgs) => {
            socket.emit("chatRecord", msgs);
        });

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

function SHA(text) {
    return crypto.createHmac('sha256', text)
        .update(salt)
        .digest('hex');
}

function checkNullItem(target) {
    return target.filter(item => item.name);
}
async function loadb(io, records, rplyVal, message) {
    const unixTimeZero = message.time ? (Date.parse(message.time) + 50) : Date.now();
    for (let i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
        io.emit(message.roomNumber, {
            name: 'HKTRPG -> ' + (message.name || 'Sad'),
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i],
            time: new Date(unixTimeZero),
            roomNumber: message.roomNumber
        });
        records.chatRoomPush({
            name: 'HKTRPG -> ' + (message.name || 'Sad'),
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i],
            time: new Date(unixTimeZero),
            roomNumber: message.roomNumber
        });
        //message.reply.text(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
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
    return str.replaceAll('\n', String.raw`\n`).replaceAll('\r', String.raw`\r`).replaceAll('\t', String.raw`\t`);
}
module.exports = {
    app: www
};