"use strict";
if (process.env.LINE_CHANNEL_ACCESSTOKEN) {
    const express = require('./core-Line').express;
    const www = require('./core-Line').app;
    var server = require('http').createServer(www);
    //const server = require('./www.js').http;
    //var express = require('express');
    //var www = require('express')();
    //var http = require('http').createServer(www);
    const io = require('socket.io')(server);
    const records = require('./core-webrecords.js');
    const port = process.env.PORT || 5000;
    var channelKeyword = '';
    let WWWcounttext = 0;
    let WWWcountroll = 0
    exports.analytics = require('../modules/analytics');
    // 加入線上人數計數
    let onlineCount = 0;

    www.get('/', (req, res) => {
        //  console.log('req: ', req, 'res: ', res)
        res.sendFile(__dirname + '/views/index.html');
    });

    io.on('connection', (socket) => {

        // 有連線發生時增加人數
        onlineCount++;
        // 發送人數給網頁
        io.emit("online", onlineCount);
        // 發送紀錄最大值
        socket.emit("maxRecord", records.getMax());
        // 發送紀錄
        socket.emit("chatRecord", records.get());

        socket.on("greet", () => {
            socket.emit("greet", onlineCount);
        });

        socket.on("send", (msg) => {
            // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
            // 因此我們直接 return ，終止函式執行。
            if (Object.keys(msg).length < 2) return;
            msg.msg = '\n' + msg.msg
            records.push(msg);
        });

        socket.on('disconnect', () => {
            // 有人離線了，扣人
            onlineCount = (onlineCount < 0) ? 0 : onlineCount -= 1;
            io.emit("online", onlineCount);
        });
    });

    records.on("new_message", async (message) => {
        // 廣播訊息到聊天室

        if (message.msg && message.name.match(/HKTRPG/ig)) {
            return;
        }
        // console.log(message)
        io.emit("msg", message);
        let rplyVal = {}
        let msgSplitor = (/\S+/ig)
        var mainMsg = message.msg.match(msgSplitor); // 定義輸入字串
        if (mainMsg && mainMsg[0])
            var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

        // 訊息來到後, 會自動跳到analytics.js進行骰組分析
        // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.


        if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
            rplyVal = await exports.analytics.parseInput(mainMsg.join(' '), '', '', '', "www", "", "")
            //rplyVal = await exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid)
        } else {
            if (channelKeyword == '') {
                rplyVal = await exports.analytics.parseInput(mainMsg.join(' '), '', '', '', "www", "", "")

            }

        }

        if (rplyVal && rplyVal.text) {
            WWWcountroll++;
            //console.log('rplyVal.text:' + rplyVal.text)
            //console.log('Telegram Roll: ' + WWWcountroll + ', Telegram Text: ' + WWWcounttext, " content: ", message.text);
            rplyVal.text = '\n' + rplyVal.text

            loadb(io, records, rplyVal);


            // console.log("rplyVal: " + rplyVal)
        } else {
            //console.log(rplyVal.text, " ")
            WWWcounttext++;
            if (WWWcounttext % 500 == 0)
                console.log('WWW Roll: ' + WWWcountroll + ', WWW Text: ' + WWWcounttext);
        }


    });

    server.listen(port, () => {
        console.log("Web Server Started. port:" + port);
    });
}
async function loadb(io, records, rplyVal) {
    for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
        await io.emit("msg", {
            name: 'HKTRPG',
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]
        });
        records.push({
            name: 'HKTRPG',
            msg: rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]
        });
        //message.reply.text(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
    }
}