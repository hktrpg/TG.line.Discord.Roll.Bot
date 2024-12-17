"use strict";
if (!process.env.mongoURL) {
    return;
}
const express = require('express');
const www = express();
const jwt = require('jsonwebtoken'); // Add JWT package
const {
    RateLimiterMemory
} = require('rate-limiter-flexible');
const candle = require('../modules/candleDays.js');
const MESSAGE_SPLITOR = (/\S+/ig)
const schema = require('./schema.js');
const privateKey = (process.env.KEY_PRIKEY) ? process.env.KEY_PRIKEY : null;
const certificate = (process.env.KEY_CERT) ? process.env.KEY_CERT : null;
const APIswitch = (process.env.API) ? process.env.API : null;
const ca = (process.env.KEY_CA) ? process.env.KEY_CA : null;
const isMaster = (process.env.MASTER) ? process.env.MASTER : null;
const salt = process.env.SALT;
const crypto = require('crypto');
const mainCharacter = require('../roll/z_character').mainCharacter;
const fs = require('fs');
let options = {
    key: null,
    cert: null,
    ca: null
};

// Middleware to verify JWT token
const verifyToken = async (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const rateLimiterChatRoom = new RateLimiterMemory({
    points: 90, // 5 points
    duration: 60, // per second
});
const rateLimiterCard = new RateLimiterMemory({
    points: 20, // 5 points
    duration: 60, // per second
});

const rateLimiterApi = new RateLimiterMemory({
    points: 10000, // 5 points
    duration: 10, // per second
});

async function read() {
    if (!privateKey) return;
    try {
        options = {
            key: (fs.readFileSync(privateKey)) ? fs.readFileSync(privateKey) : null,
            cert: (fs.readFileSync(certificate)) ? fs.readFileSync(certificate) : null,
            ca: (fs.readFileSync(ca)) ? fs.readFileSync(ca) : null
        };
    } catch (error) {
        console.error('error of key', error)
    }
}

(async () => {
    read()
})();
const http = require('http');
const https = require('https');

// Add login endpoint
www.post('/login', async (req, res) => {
    if (await limitRaterCard(req.ip)) return;

    const { userName, password } = req.body;
    const hashedPassword = SHA(password);

    try {
        const user = await schema.accountPW.findOne({
            userName: userName,
            password: hashedPassword
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                userName: user.userName 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


process.on('uncaughtException', (warning) => {
    console.error('uncaughtException', warning); // Print the warning name
    console.warn(warning.name); // Print the warning name
    console.warn(warning.message); // Print the warning message
    // const clock = setTimeout(createWebServer, 60000 * 5);
});

const records = require('./records.js');
const port = process.env.WWWPORT || 20721;
const channelKeyword = '';
exports.analytics = require('./analytics');

function createWebServer(options = {}, www) {
    if (!process.env.CREATEWEB) return;
    const server = options.key
        ? https.createServer(options, www)
        : http.createServer(www);

    const protocol = options.key ? 'https' : 'http';
    console.log(`${protocol} server`);
    server.listen(port, () => {
        console.log("Web Server Started. port:" + port);
    });

    return server;
}
const server = createWebServer(options, www);
const io = require('socket.io')(server);


// 加入線上人數計數
let onlineCount = 0;

// Add login endpoint
www.post('/login', async (req, res) => {
    if (await limitRaterCard(req.ip)) return;

    const { userName, password } = req.body;
    const hashedPassword = SHA(password);

    try {
        const user = await schema.accountPW.findOne({
            userName: userName,
            password: hashedPassword
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                userName: user.userName 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


www.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
});
www.get('/api', async (req, res) => {
    if (!APIswitch || await limitRaterApi(req.ip)) return;

    if (
        !req || !req.query || !req.query.msg
    ) {
        res.writeHead(200, { 'Content-type': 'application/json' })
        res.end('{"message":"welcome to HKTRPG API.\\n To use, please enter the content in query: msg \\n like https://api.hktrpg.com?msg=1d100\\n command bothelp for tutorials."}')
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
www.use('/:path/css/', express.static(process.cwd() + '/views/css/'));
www.use('/css/', express.static(process.cwd() + '/views/css/'));
// 將/publiccard/includes/設置為靜態資源的路徑
www.use('/:path/includes/', express.static(process.cwd() + '/views/includes/'));
www.use('/:path/scripts/', express.static(process.cwd() + '/views/scripts/'));
www.use('/includes/', express.static(process.cwd() + '/views/includes/'));
www.use('/scripts/', express.static(process.cwd() + '/views/scripts/'));


www.get('/card', (req, res) => {
    res.sendFile(process.cwd() + '/views/characterCard.html');
});
www.get('/publiccard', (req, res) => {
    res.sendFile(process.cwd() + '/views/characterCardPublic.html');
});
www.get('/signal', (req, res) => {
    res.sendFile(process.cwd() + '/views/signalToNoise.html');
});


if (process.env.DISCORD_CHANNEL_SECRET) {
    www.get('/app/discord/:id', (req, res) => {
        if (req.originalUrl.match(/html$/))
            res.sendFile(process.cwd() + '/tmp/' + req.originalUrl.replace('/app/discord/', ''));
    });
}
www.get('/:xx', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
});

function SHA(text) {
    return crypto.createHmac('sha256', text)
        .update(salt)
        .digest('hex');
}

function checkNullItem(target) {
    return target = target.filter(function (item) {
        return item.name;
    });
}

io.on('connection', async (socket) => {
    // 加入驗證事件處理
    socket.on('authenticate', async token => {
        const decoded = await verifyToken(token);
        if (decoded) {
            socket.user = decoded;
            socket.emit('authenticated');
        } else {
            socket.emit('unauthorized');
        }
    });

    socket.on('getListInfo', async message => {
        if (await limitRaterCard(socket.handshake.address)) return;

        const decoded = await verifyToken(message.token);
        if (!decoded) {
            socket.emit('unauthorized');
            return;
        }

        let doc = await schema.accountPW.findOne({
            id: decoded.userId
        }).catch(error => console.error('mongoDB error: ', error.name, error.reason));
        
        let temp;
        if (doc && doc.id) {
            temp = await schema.characterCard.find({
                id: doc.id
            }).catch(error => console.error('mongoDB error: ', error.name, error.reason));
        }
        
        let id = [];
        if (doc && doc.channel) {
            id = doc.channel;
        }
        
        socket.emit('getListInfo', {
            temp,
            id
        });
    });

    socket.on('getPublicListInfo', async () => {
        if (await limitRaterCard(socket.handshake.address)) return;
        
        let filter = {
            public: true
        }
        let temp = await schema.characterCard.find(filter);
        try {
            socket.emit('getPublicListInfo', {
                temp
            });
        } catch (error) {
            console.error('mongoDB error: ', error.name, error.reason);
        }
    });

    socket.on('publicRolling', async message => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        if (!message.item || !message.doc) return;

        let rplyVal = {}
        let result = await mainCharacter(message.doc, ['', message.item], `.ch ${message.item}`)
        if (result && result.characterReRoll) {
            rplyVal = await exports.analytics.parseInput({
                inputStr: result.characterReRollItem,
                botname: "WWW"
            });
        }

        if (rplyVal && rplyVal.text) {
            socket.emit('publicRolling', result.characterReRollName + '：\n' + rplyVal.text)
        }
    });

    socket.on('rolling', async message => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        
        const decoded = await verifyToken(message.token);
        if (!decoded) {
            socket.emit('unauthorized');
            return;
        }

        if (!message.item || !message.doc) return;

        let rplyVal = {}
        let result = await mainCharacter(message.doc, ['', message.item], `.ch ${message.item}`)
        if (result && result.characterReRoll) {
            rplyVal = await exports.analytics.parseInput({
                inputStr: result.characterReRollItem,
                botname: "WWW"
            });
        }

        if (rplyVal && rplyVal.text) {
            socket.emit('rolling', result.characterReRollName + '：\n' + rplyVal.text + candle.checker());
            
            if (message.rollTarget && message.rollTarget.id && message.rollTarget.botname && message.cardName) {
                let filter = {
                    id: decoded.userId,
                    "channel.id": message.rollTarget.id,
                    "channel.botname": message.rollTarget.botname
                }
                let result = await schema.accountPW.findOne(filter)
                    .catch(error => console.error('mongoDB error: ', error.name, error.reason));
                
                if (!result) return;

                let filter2 = {
                    "botname": message.rollTarget.botname,
                    "id": message.rollTarget.id
                }
                let allowRollingResult = await schema.allowRolling.findOne(filter2)
                    .catch(error => console.error('mongoDB error: ', error.name, error.reason));
                
                if (!allowRollingResult) return;

                rplyVal.text = '@' + message.cardName + ' - ' + message.item + '\n' + rplyVal.text;
                if (message.rollTarget.botname && sendTo) {
                    sendTo({
                        target: message.rollTarget,
                        text: rplyVal.text
                    });
                }
            }
        }
    });

    socket.on('removeChannel', async message => {
        if (await limitRaterCard(socket.handshake.address)) return;
        
        const decoded = await verifyToken(message.token);
        if (!decoded) {
            socket.emit('unauthorized');
            return;
        }

        try {
            await schema.accountPW.updateOne({
                id: decoded.userId
            }, {
                $pull: {
                    channel: {
                        "id": message.channelId,
                        "botname": message.botname
                    }
                }
            });
        } catch (error) {
            console.error('ERROR:', error);
        }
    });

    socket.on('updateCard', async message => {
        if (await limitRaterCard(socket.handshake.address)) return;
        
        const decoded = await verifyToken(message.token);
        if (!decoded) {
            socket.emit('unauthorized');
            return;
        }

        message.card.state = checkNullItem(message.card.state);
        message.card.roll = checkNullItem(message.card.roll);
        message.card.notes = checkNullItem(message.card.notes);

        try {
            const temp = await schema.characterCard.findOneAndUpdate({
                id: decoded.userId,
                _id: message.card._id
            }, {
                $set: {
                    public: message.card.public,
                    state: message.card.state,
                    roll: message.card.roll,
                    notes: message.card.notes,
                }
            });

            socket.emit('updateCard', !!temp);
        } catch (error) {
            console.error('mongoDB error: ', error.name, error.reason);
            socket.emit('updateCard', false);
        }
    });

    // 聊天室相關功能
    onlineCount++;
    io.emit("online", onlineCount);
    socket.emit("maxRecord", records.chatRoomGetMax());
    
    records.chatRoomGet("公共房間", (msgs) => {
        socket.emit("chatRecord", msgs);
    });

    socket.on("greet", () => {
        socket.emit("greet", onlineCount);
    });

    socket.on("send", async (msg) => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        if (Object.keys(msg).length < 2) return;
        msg.msg = '\n' + msg.msg;
        records.chatRoomPush(msg);
    });

    socket.on("newRoom", async (msg) => {
        if (await limitRaterChatRoom(socket.handshake.address)) return;
        if (!msg) return;
        let roomNumber = msg || "公共房間";
        records.chatRoomGet(roomNumber, (msgs) => {
            socket.emit("chatRecord", msgs);
        });
    });

    socket.on('disconnect', () => {
        onlineCount = (onlineCount < 0) ? 0 : onlineCount -= 1;
        io.emit("online", onlineCount);
    });
});

records.on("new_message", async (message) => {
    // 廣播訊息到聊天室
    if (message.msg && message.name.match(/^HKTRPG/ig)) {
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
    return target = target.filter(function (item) {
        return item.name;
    });
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
    try {
        await rateLimiterChatRoom.consume(address)
        return false;
    } catch (error) {
        return true;
    }
}


async function limitRaterCard(address) {
    try {
        await rateLimiterCard.consume(address)
        return false;
    } catch (error) {
        return true;
    }
}

async function limitRaterApi(address) {
    try {
        await rateLimiterApi.consume(address)
        return false;
    } catch (error) {
        return true;
    }
}

/**
 * 
 */
let sendTo;
if (isMaster) {
    const WebSocket = require('ws');
    //將 express 放進 http 中開啟 Server 的 3000 port ，正確開啟後會在 console 中印出訊息
    const wss = new WebSocket.Server({
        port: 53589
    }, () => {
        console.log('open server 53589!')
    });
    wss.on('connection', function connection(ws) {
        if (!ws._socket.remoteAddress == "::ffff:127.0.0.1") return;

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });
        sendTo = function (params) {
            let object = {
                botname: params.target.botname,
                message: params
            }
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(object));
                }
            });
        }
    });
}

function jsonEscape(str) {
    return str.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
module.exports = {
    app: www
};