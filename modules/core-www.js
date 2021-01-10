"use strict";
if (!process.env.LINE_CHANNEL_ACCESSTOKEN || !process.env.mongoURL) {
    return;
}
const schema = require('./core-schema.js');
const webSite = (process.env.SITE) ? process.env.SITE : null;
const privateKey = (process.env.KEY_PRIKEY) ? process.env.KEY_PRIKEY : null;
const certificate = (process.env.KEY_CERT) ? process.env.KEY_CERT : null;
const ca = (process.env.KEY_CA) ? process.env.KEY_CA : null;
const www = require('./core-Line').app;
const fs = require('fs');
var options = {
    key: null,
    cert: null,
    ca: null
};

async function read() {
    if (privateKey)
        try {
            options = {
                key: (fs.readFileSync(privateKey)) ? fs.readFileSync(privateKey) : null,
                cert: (fs.readFileSync(certificate)) ? fs.readFileSync(certificate) : null,
                ca: (fs.readFileSync(ca)) ? fs.readFileSync(ca) : null
            };
        } catch (error) {
            console.log('error of key')
        }
}

(async () => {
    read()
})();

var server;
if (!options.key) {
    server = require('http').createServer(www);
    console.log('http server');
} else {
    server = require('https').createServer(options, www);
    console.log('https server');
}

//const server = require('./www.js').http;
//var express = require('express');
//var www = require('express')();
//var http = require('http').createServer(www);
const io = require('socket.io')(server);
const records = require('./records.js');
const port = process.env.PORT || 20721;
var channelKeyword = '';
exports.analytics = require('./core-analytics');

// 加入線上人數計數
let onlineCount = 0;

if (webSite)
    www.get('/', (req, res) => {
        //  console.log('req: ', req, 'res: ', res)
        res.sendFile(process.cwd() + '/views/index.html');
    });
if (process.env.DISCORD_CHANNEL_SECRET)
    www.get('/app/discord/:id', (req, res) => {
        if (req.originalUrl.match(/html$/))
            res.sendFile(process.cwd() + '/tmp/' + req.originalUrl.replace('/app/discord/', ''));
    });
//if (process.env.DISCORD_CHANNEL_SECRET)
www.get('/card', (req, res) => {
    res.sendFile(process.cwd() + '/views/characterCard.html');
});

io.on('connection', (socket) => {
    socket.on('getInfo', async message => {
        //回傳 message 給發送訊息的 Client
        console.log(message);
        let filter = {
            id: "399923142468042763"
        }
        let doc = await schema.characterCard.findOne(filter);
        console.log(doc)
        socket.emit('getInfo', doc)
    })

    socket.on('getListInfo', async message => {
        //回傳 message 給發送訊息的 Client
        console.log(message);
        let filter = {
            id: "399923142468042763"
        }
        let doc = await schema.characterCard.find(filter);
        console.log(doc)
        socket.emit('getListInfo', doc)
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

    socket.on("send", (msg) => {
        // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
        // 因此我們直接 return ，終止函式執行。
        if (Object.keys(msg).length < 2) return;
        msg.msg = '\n' + msg.msg
        records.chatRoomPush(msg);
    });

    socket.on("newRoom", (msg) => {
        // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
        // 因此我們直接 return ，終止函式執行。
        if (!msg) return;
        var roomNumber = msg || "公共房間";
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

records.on("new_message", async (message) => {
    // 廣播訊息到聊天室
    if (message.msg && message.name.match(/^HKTRPG/ig)) {
        return;
    }
    // console.log(message)
    io.emit(message.roomNumber, message);
    let rplyVal = {}
    let msgSplitor = (/\S+/ig)
    var mainMsg = message.msg.match(msgSplitor); // 定義輸入字串
    if (mainMsg && mainMsg[0])
        var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
        rplyVal = await exports.analytics.parseInput({
            inputStr: mainMsg.join(' '),
            botname: "WWW"
        })
        //rplyVal = await exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid)
    } else {
        if (channelKeyword == '') {
            rplyVal = await exports.analytics.parseInput({
                inputStr: mainMsg.join(' '),
                botname: "WWW"
            })
        }
    }
    if (rplyVal && rplyVal.text) {
        //console.log('rplyVal.text:' + rplyVal.text)
        //console.log('Telegram Roll: ' + WWWcountroll + ', Telegram Text: ' + WWWcounttext, " content: ", message.text);
        rplyVal.text = '\n' + rplyVal.text
        loadb(io, records, rplyVal, message);
    }
});

server.listen(port, () => {
    console.log("Web Server Started. port:" + port);
});

async function loadb(io, records, rplyVal, message) {
    for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
        io.emit(message.roomNumber, {
            name: 'HKTRPG -> ' + (message.name || 'Sad'),
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i],
            time: new Date(Date.now() + 5),
            roomNumber: message.roomNumber
        });
        records.chatRoomPush({
            name: 'HKTRPG -> ' + (message.name || 'Sad'),
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i],
            time: new Date(Date.now() + 5),
            roomNumber: message.roomNumber
        });
        //message.reply.text(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
    }
}