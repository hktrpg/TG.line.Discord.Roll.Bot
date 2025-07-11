"use strict";
if (!process.env.TELEGRAM_CHANNEL_SECRET) {
    return;
}

const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const WebSocket = require('ws');
const candle = require('../modules/candleDays.js');
const agenda = require('../modules/schedule')
const rollText = require('./getRoll').rollText;
exports.analytics = require('./analytics');
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;

// Bot configuration with timeout settings
const botOptions = {
    telegram: {
        agent: null, // Will use default agent
        webhookReply: true,
        apiMode: 'bot'
    },
    handlerTimeout: 90_000, // 90 seconds timeout for handlers
    contextType: 'default'
};

const bot = new Telegraf(process.env.TELEGRAM_CHANNEL_SECRET, botOptions);

// Configure telegram instance with timeout
if (bot.telegram) {
    // Override the default timeout
    const originalCallApi = bot.telegram.callApi;
    bot.telegram.callApi = function(method, payload = {}) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`API call timeout: ${method}`));
            }, 30_000); // 30 seconds timeout
            
            originalCallApi.call(this, method, payload)
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    };
}

const newMessage = require('./message');
const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || '';
const MESSAGE_SPLITOR = (/\S+/ig);

let robotName = ""
let botReady = false;

// Retry mechanism for bot initialization
async function initializeBot(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting to initialize bot (attempt ${i + 1}/${retries})...`);
            const botInfo = await bot.telegram.getMe();
            robotName = botInfo.username;
            botReady = true;
            console.log(`Bot initialized successfully: @${robotName}`);
            return true;
        } catch (error) {
            console.error(`Bot initialization attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) {
                console.error('All initialization attempts failed. Bot will continue without initial validation.');
                // Don't throw error, allow bot to continue
                return false;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () {};
const courtMessage = require('./logs').courtMessage || function () {};

// Text message handler
bot.on(message('text'), async (ctx) => {
    if (ctx.from.is_bot) return;
    let inputStr = ctx.message.text;
    let trigger = "",
        mainMsg = "",
        userid = "";
    
    if (!robotName && !botReady) {
        try {
            let botInfo = await ctx.telegram.getMe();
            robotName = botInfo.username;
            botReady = true;
        } catch (error) {
            console.error('Failed to get bot info in message handler:', error.message);
        }
    }
    
    if (ctx.from.id) userid = ctx.from.id;
    const options = {};
    if (ctx.message.is_topic_message) {
        options.message_thread_id = ctx.message.message_thread_id;
    }
    
    if (inputStr) {
        if (robotName && /^[/]/.test(inputStr))
            inputStr = inputStr
                .replace(new RegExp('@' + robotName + '$', 'i'), '')
                .replace(new RegExp('^/', 'i'), '');
        mainMsg = inputStr.match(MESSAGE_SPLITOR);
    }
    if (mainMsg && mainMsg[0]) {
        trigger = mainMsg[0].toString().toLowerCase();
    }
    
    let groupid = ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && userid && ctx.chat.id) ? ctx.chat.id : '';
    let privatemsg = 0;

    (function privateMsg() {
        if (/^dr$/i.test(trigger) && mainMsg && mainMsg[1]) {
            privatemsg = 1;
            inputStr = inputStr.replace(/^dr\s+/i, '');
        }
        if (/^ddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
            privatemsg = 2;
            inputStr = inputStr.replace(/^ddr\s+/i, '');
        }
        if (/^dddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
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
        membercount = await ctx.telegram.getChatMembersCount(ctx.chat.id).catch(() => {
            return 0;
        });
    }

    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        (await isAdmin(groupid, userid, ctx)) ? userrole = 3 : null;
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
    
    if (rplyVal.myspeck) {
        return await __sendMeMessage({ ctx, rplyVal, userid });
    }
    if (!rplyVal.text && !rplyVal.LevelUp)
        return;
    if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Telegram")) {
        SendToId(userid, newMessage.firstTimeMessage(), ctx).catch((error) => {
            console.error('Error sending first time message:', error);
        });
    }

    if (groupid && rplyVal && rplyVal.LevelUp) {
        let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}${(candle.checker(userid)) ? ' ' + candle.checker(userid) : ''}
		${rplyVal.LevelUp}`
        SendToId(groupid, text, ctx, options);
    }

    if (!rplyVal.text) {
        return;
    }
    
    if (privatemsg > 1 && TargetGM) {
        let groupInfo = await privateMsgFinder(groupid) || [];
        for (const item of groupInfo) {
            TargetGMTempID.push(item.userid);
            TargetGMTempdiyName.push(item.diyName);
            TargetGMTempdisplayname.push(item.displayname);
        }
    }

    switch (true) {
        case privatemsg == 1: {
            if (ctx.chat.type != 'private') {
                SendToId(groupid, "@" + displayname + ' 暗骰給自己', ctx, options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
            SendToId(userid, rplyVal.text, ctx, options);
            break;
        }
        case privatemsg == 2: {
            if (ctx.chat.type != 'private') {
                let targetGMNameTemp = "";
                for (let i = 0; i < TargetGMTempID.length; i++) {
                    targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                }
                SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp, ctx, options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
            SendToId(userid, rplyVal.text, ctx);
            for (const element of TargetGMTempID) {
                if (userid != element)
                    SendToId(element, rplyVal.text, ctx);
            }
            break;
        }
        case privatemsg == 3: {
            if (ctx.chat.type != 'private') {
                let targetGMNameTemp = "";
                for (let i = 0; i < TargetGMTempID.length; i++) {
                    targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                }
                SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp, ctx, options);
            }
            rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
            for (const element of TargetGMTempID) {
                SendToId(element, rplyVal.text, ctx);
            }
            break;
        }
        default: {
            if (displaynamecheck && displayname) {
                displayname = "@" + ctx.from.username + ((rplyVal.statue) ? ' ' + rplyVal.statue : '') + ((candle.checker(userid)) ? ' ' + candle.checker(userid) : '') + "\n";
                rplyVal.text = displayname + rplyVal.text;
            }
            SendToId((groupid || userid), rplyVal.text, ctx, options);
            break;
        }
    }
});

function SendToId(targetid, text, ctx, options = {}) {
    try {
        for (let i = 0; i < text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
            if (i == 0 || i == 1 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
                ctx.telegram.sendMessage(targetid, text.toString().match(/[\s\S]{1,2000}/g)[i], options).catch((error) => {
                    console.error('Error sending message:', error);
                });
            }
        }
    } catch (error) {
        console.error('tg SendToId error:', (error && (error.message || error.name)));
    }
}

const RECONNECT_INTERVAL = 1 * 1000 * 60;
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
            // Create a minimal context for telegram API access
            const telegramCtx = { telegram: bot.telegram };
            SendToId(object.target.id, object.text, telegramCtx);
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

async function nonDice(ctx) {
    try {
        await courtMessage({ result: "", botname: "Telegram", inputStr: "" })
        if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.from.id && ctx.chat.id) {
            let groupid = (ctx.chat.id) ? ctx.chat.id.toString() : '',
                userid = (ctx.from.id) ? ctx.from.id.toString() : '',
                displayname = (ctx.from.username) ? ctx.from.username.toString() : '',
                membercount = null;
            let tgDisplayname = (ctx.from.first_name) ? ctx.from.first_name : '';
            if (ctx.chat && ctx.chat.id) {
                membercount = await ctx.telegram.getChatMembersCount(ctx.chat.id).catch(() => {
                    return 0;
                });
            }
            let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, tgDisplayname);
            if (groupid && LevelUp && LevelUp.text) {
                SendToId(groupid, `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`, ctx);
            }
        }
        return null;
    } catch (error) {
        console.error('tg nonDice error:', (error && (error.message || error.name)));
    }
}

// New chat members handler
bot.on('new_chat_members', async (ctx) => {
    let newUser = await ctx.telegram.getMe();
    if (ctx.message.new_chat_members.some(member => member.username === newUser.username)) {
        console.log("Telegram joined");
        SendToId(ctx.chat.id, newMessage.joinMessage(), ctx);
    }
});

// Group created handlers
bot.on('group_chat_created', async (ctx) => {
    SendToId(ctx.chat.id, newMessage.joinMessage(), ctx);
});

bot.on('supergroup_chat_created', async (ctx) => {
    SendToId(ctx.chat.id, newMessage.joinMessage(), ctx);
});

// Media handlers
bot.on(message('audio'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('document'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('photo'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('sticker'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('video'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('voice'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

bot.on(message('forward_date'), async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});

async function privateMsgFinder(groupid) {
    if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
    let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
        data.groupid == groupid
    )
    return groupInfo && groupInfo.trpgDarkRollingfunction ? groupInfo.trpgDarkRollingfunction : [];
}

if (agenda && agenda.agenda) {
    agenda.agenda.define("scheduleAtMessageTelegram", async (job) => {
        let data = job.attrs.data;
        let text = await rollText(data.replyText);
        // Create a minimal context for telegram API access
        const telegramCtx = { telegram: bot.telegram };
        SendToId(data.groupid, text, telegramCtx);
        try {
            await job.remove();
        } catch (error) {
            console.error("TG Error removing job from collection:scheduleAtMessageTelegram", error);
        }
    });
    
    agenda.agenda.define("scheduleCronMessageTelegram", async (job) => {
        let data = job.attrs.data;
        let text = await rollText(data.replyText);
        const telegramCtx = { telegram: bot.telegram };
        SendToId(data.groupid, text, telegramCtx);
        try {
            if ((new Date(Date.now()) - data.createAt) >= SIX_MONTH) {
                await job.remove();
                SendToId(data.groupid, "已運行六個月, 移除此定時訊息", telegramCtx);
            }
        } catch (error) {
            console.error("Error removing job from collection:scheduleCronMessageTelegram", error);
        }
    });
}

async function isAdmin(gpId, chatid, ctx) {
    let member = await ctx.telegram.getChatMember(gpId, chatid).catch(() => {});
    if (member?.status === "creator") return true
    if (member?.status === "administrator") return true
    return false;
}

function sendNewstoAll(rply) {
    const telegramCtx = { telegram: bot.telegram };
    for (let index = 0; index < rply.target.length; index++) {
        SendToId(rply.target[index].userID, rply.sendNews, telegramCtx);
    }
}

// Error handlers
bot.catch((error) => {
    console.error('Bot error:', error);
});

async function __sendMeMessage({ ctx, rplyVal }) {
    SendToId(ctx.chat.id || ctx.from.id, rplyVal.myspeck.content, ctx);
    return;
}

// Start the bot with initialization
async function startBot() {
    try {
        console.log('Starting Telegram bot...');
        
        // Try to initialize bot info first
        await initializeBot();
        
        // Launch the bot
        await bot.launch();
        console.log('Telegram bot started successfully with Telegraf');
    } catch (error) {
        console.error('Failed to start Telegram bot:', error.message);
        // Continue running even if launch fails initially
        console.log('Bot will continue running and retry connections...');
    }
}

// Start the bot
startBot();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
