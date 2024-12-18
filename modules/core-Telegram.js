"use strict";
if (!process.env.TELEGRAM_CHANNEL_SECRET) {
    return;
}
const { Bot, GrammyError, HttpError } = require("grammy");
const candle = require('../modules/candleDays.js');
const agenda = require('../modules/schedule')
const rollText = require('./getRoll').rollText;
exports.analytics = require('./analytics');
exports.z_stop = require('../roll/z_stop');
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const bot = new Bot(process.env.TELEGRAM_CHANNEL_SECRET);
const newMessage = require('./message');
const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || '';
const MESSAGE_SPLITOR = (/\S+/ig);

let robotName = "";

let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

bot.on('message:text', async (ctx) => {
    if (ctx.from.is_bot) return;
    let inputStr = ctx.message.text;
    let trigger = "",
        mainMsg = "",
        userid = "";
    if (!robotName) {
        let botInfo = await ctx.api.getMe();
        robotName = botInfo.username;
    }
    if (ctx.from.id) userid = ctx.from.id;
    const options = {};
    if (ctx.message.is_topic_message) {
        options.message_thread_id = ctx.message.message_thread_id;
    }
    if (inputStr) {
        if (robotName && inputStr.match(/^[/]/))
            inputStr = inputStr
                .replace(new RegExp('@' + robotName + '$', 'i'), '')
                .replace(new RegExp('^/', 'i'), '');
        mainMsg = inputStr.match(MESSAGE_SPLITOR);
    }
    if (mainMsg && mainMsg[0]) {
        trigger = mainMsg[0].toString().toLowerCase();
    }

    let groupid = ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && userid && ctx.chat.id) ? ctx.chat.id : '';
    if ((trigger == ".me" || trigger == ".mee") && !z_stop(mainMsg, groupid)) {
        inputStr = inputStr.replace(/^\.mee\s*/i, ' ').replace(/^\.me\s*/i, ' ');
        if (inputStr.match(/^\s+$/)) {
            inputStr = `.me 或 /mee 可以令HKTRPG機械人重覆你的說話\n請輸入復述內容`
        }
        await SendToId(ctx.chat.id || userid, inputStr, options);
        return;
    }
    let privatemsg = 0;

    (function privateMsg() {
        if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
            privatemsg = 1;
            inputStr = inputStr.replace(/^dr\s+/i, '');
        }
        if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
            privatemsg = 2;
            inputStr = inputStr.replace(/^ddr\s+/i, '');
        }
        if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
            privatemsg = 3;
            inputStr = inputStr.replace(/^dddr\s+/i, '');
        }
    })();
    let target = await exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
    if (!target) {
        await nonDice(ctx);
        return;
    }

    let displayname = '',
        membercount = 0,
        titleName = (ctx.message && ctx.chat && ctx.chat.title) ? ctx.chat.title : '';
    let TargetGMTempID = [];
    let TargetGMTempdiyName = [];
    let TargetGMTempdisplayname = [];
    let tgDisplayname = (ctx.from.first_name) ? ctx.from.first_name : '';

    if (ctx.from.username) displayname = ctx.from.username;
    let displaynamecheck = true;
    let userrole = 1;

    if (ctx.chat && ctx.chat.id) {
        membercount = await ctx.api.getChatMemberCount(ctx.chat.id) - 1;
    }

    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        (await isAdmin(groupid, userid)) ? userrole = 3 : null;
    }
    let rplyVal = {};

    if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
        mainMsg.shift();
        rplyVal = await exports.analytics.parseInput({
            inputStr: inputStr,
            groupid: groupid,
            userid: userid,
            userrole: userrole,
            botname: "Telegram",
            displayname: displayname,
            channelid: "",
            membercount: membercount,
            titleName: titleName,
            tgDisplayname: tgDisplayname
        })
    } else {
        if (channelKeyword == '') {
            rplyVal = await exports.analytics.parseInput({
                inputStr: inputStr,
                groupid: groupid,
                userid: userid,
                userrole: userrole,
                botname: "Telegram",
                displayname: displayname,
                channelid: "",
                membercount: membercount,
                titleName: titleName,
                tgDisplayname: tgDisplayname
            })
        }
    }

    if (rplyVal.sendNews) sendNewstoAll(rplyVal);
    if (!rplyVal.text && !rplyVal.LevelUp)
        return;
    if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Telegram")) {
        try {
            await ctx.api.sendMessage(userid, newMessage.firstTimeMessage());
        } catch (error) {
            console.error(error);
        }
    }

    if (groupid && rplyVal && rplyVal.LevelUp) {
        let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}${(candle.checker()) ? ' ' + candle.checker() : ''}
        ${rplyVal.LevelUp}`
        await SendToId(groupid, text, options);
    }
    if (!rplyVal.text) {
        return;
    }

    if (privatemsg > 1 && TargetGM) {
        let groupInfo = await privateMsgFinder(groupid) || [];
        groupInfo.forEach((item) => {
            TargetGMTempID.push(item.userid);
            TargetGMTempdiyName.push(item.diyName);
            TargetGMTempdisplayname.push(item.displayname);
        })
    }

    switch (true) {
        case privatemsg == 1:
            if (ctx.chat.type != 'private') {
                await SendToId(groupid, "@" + displayname + ' 暗骰給自己', options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
            await SendToId(userid, rplyVal.text, options);
            break;
        case privatemsg == 2:
            if (ctx.chat.type != 'private') {
                let targetGMNameTemp = "";
                for (let i = 0; i < TargetGMTempID.length; i++) {
                    targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                }
                await SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp, options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
            await SendToId(userid, rplyVal.text);
            for (let i = 0; i < TargetGMTempID.length; i++) {
                if (userid != TargetGMTempID[i])
                    await SendToId(TargetGMTempID[i], rplyVal.text);
            }
            break;
        case privatemsg == 3:
            if (ctx.chat.type != 'private') {
                let targetGMNameTemp = "";
                for (let i = 0; i < TargetGMTempID.length; i++) {
                    targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                }
                await SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp, options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
            for (let i = 0; i < TargetGMTempID.length; i++) {
                await SendToId(TargetGMTempID[i], rplyVal.text);
            }
            break;
        default:
            if (displaynamecheck && displayname) {
                displayname = "@" + ctx.from.username + ((rplyVal.statue) ? ' ' + rplyVal.statue : '') + ((candle.checker()) ? ' ' + candle.checker() : '') + "\n";
                rplyVal.text = displayname + rplyVal.text;
            }
            await SendToId((groupid || userid), rplyVal.text, options);
            break;
    }
});

async function SendToId(targetid, text, options = {}) {
    try {
        const chunks = text.toString().match(/[\s\S]{1,2000}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
            if (i == 0 || i == 1 || i == chunks.length - 2 || i == chunks.length - 1) {
                await bot.api.sendMessage(targetid, chunks[i], options);
            }
        }
    } catch (error) {
        console.error('SendToId error:', error);
    }
}

// WebSocket connection code remains the same

async function nonDice(ctx) {
    try {
        await courtMessage({ result: "", botname: "Telegram", inputStr: "" })
        if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.from.id && ctx.chat.id) {
            let groupid = ctx.chat.id.toString(),
                userid = ctx.from.id.toString(),
                displayname = ctx.from.username?.toString() || '',
                membercount = null;
            let tgDisplayname = ctx.from.first_name || '';
            if (ctx.chat && ctx.chat.id) {
                membercount = await ctx.api.getChatMemberCount(ctx.chat.id);
            }
            let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, tgDisplayname);
            if (groupid && LevelUp && LevelUp.text) {
                await SendToId(groupid, `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`);
            }
        }
        return null;
    } catch (error) {
        console.error('nonDice error:', error);
    }
}

// Event handlers for new members and group creation
bot.on('chat_member', async (ctx) => {
    if (ctx.chatMember.new_chat_member?.user.id === ctx.me.id) {
        console.log("Telegram joined");
        await SendToId(ctx.chat.id, newMessage.joinMessage());
    }
});

bot.on('message:group_chat_created', async (ctx) => {
    await SendToId(ctx.chat.id, newMessage.joinMessage());
});

// Media message handlers
const mediaTypes = ['audio', 'document', 'photo', 'sticker', 'video', 'voice'];
mediaTypes.forEach(type => {
    bot.on(`message:${type}`, async (ctx) => {
        if (ctx.from.is_bot) return;
        await nonDice(ctx);
        return null;
    });
});

// Other helper functions remain mostly the same
async function isAdmin(gpId, chatid) {
    try {
        let member = await bot.api.getChatMember(gpId, chatid);
        return member.status === "creator" || member.status === "administrator";
    } catch (error) {
        console.error('isAdmin error:', error);
        return false;
    }
}

// Error handling
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    if (err instanceof GrammyError) {
        console.error("Error in request:", err.description);
    } else if (err instanceof HttpError) {
        console.error("Could not contact Telegram:", err);
    } else {
        console.error("Unknown error:", err);
    }
});

const RECONNECT_INTERVAL = 1 * 1000 * 60;
const WebSocket = require('ws');
let ws;
let connect = function () {
    ws = new WebSocket('ws://127.0.0.1:53589');
    ws.on('open', function open() {
        console.log('connected To core-www from Telegram!')
        ws.send('connected To core-www from Telegram!');
    });
    ws.on('message', function incoming(data) {
        let object = JSON.parse(data);
        if (object.botname == 'Telegram') {
            if (!object.text) return;
            console.log('Telegram have message')
            TGclient.sendMessage(object.target.id, object.text).catch((error) => {
                console.log(error.code);  // => 'ETELEGRAM'
                console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
            });
            return;
        }
        if (object.botname == 'Line') {
            if (!object.text) return;
            console.log('Line have message')
            process.emit('Line', object.message);
            return;
        }

    });
    ws.on('error', (error) => {
        console.error('Telegram socket error', error);
    });

    ws.on('close', function () {
        console.log('Telegram socket close');
        setTimeout(connect, RECONNECT_INTERVAL);
    });
};
if (process.env.BROADCAST) connect();

// Start the bot
bot.start();