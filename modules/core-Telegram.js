"use strict";
if (!process.env.TELEGRAM_CHANNEL_SECRET) {
    return;
}
const { Bot, GrammyError, HttpError } = require('grammy');
const WebSocket = require('ws');
const candle = require('../modules/candleDays.js');
const agenda = require('../modules/schedule')
const rollText = require('./getRoll').rollText;
exports.analytics = require('./analytics');
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const TGclient = new Bot(process.env.TELEGRAM_CHANNEL_SECRET);
const newMessage = require('./message');
const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || '';
//let TGcountroll = 0;
//let TGcounttext = 0;
const MESSAGE_SPLITOR = (/\S+/ig);

let robotName = ""


let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

TGclient.on('message:text', (ctx) => {
    if (ctx.from.is_bot) return;

    (async () => {
        let inputStr = ctx.message.text;
        let trigger = "",
            mainMsg = "",
            userid = "";
        if (!robotName) {
            let botInfo = await TGclient.api.getMe();
            robotName = botInfo.username;
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
            mainMsg = inputStr.match(MESSAGE_SPLITOR); // 定義輸入字串
        }
        if (mainMsg && mainMsg[0]) {
            trigger = mainMsg[0].toString().toLowerCase();
        }
        //指定啟動詞在第一個詞&把大階強制轉成細階
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
            titleName = (ctx.chat && ctx.chat.title) ? ctx.chat.title : '';
        let TargetGMTempID = [];
        let TargetGMTempdiyName = [];
        let TargetGMTempdisplayname = [];
        let tgDisplayname = (ctx.from.first_name) ? ctx.from.first_name : '';
        //得到暗骰的數據, GM的位置
        if (ctx.from.username) displayname = ctx.from.username;
        //是不是自己.ME 訊息
        //TRUE 即正常
        let displaynamecheck = true;
        let userrole = 1;
        //頻道人數
        if (ctx.chat && ctx.chat.id) {
            membercount = await TGclient.api.getChatMemberCount(ctx.chat.id).catch(() => {
                return 0;
            });
        }
        //285083923223
        //userrole = 3

        if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
            (await isAdmin(groupid, userid)) ? userrole = 3 : null;
        }
        let rplyVal = {};

        // 訊息來到後, 會自動跳到analytics.js進行骰組分析
        // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
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
        // Handle .me messages
        if (rplyVal.myspeck) {
            return await __sendMeMessage({ ctx, rplyVal, userid });
        }
        if (!rplyVal.text && !rplyVal.LevelUp)
            return;
        if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Telegram")) {
            TGclient.api.sendMessage(userid, newMessage.firstTimeMessage()).catch((error) => {
                console.error("Telegram newUserChecker error:", error.message);
            });
        }

        //LevelUp功能
        if (groupid && rplyVal && rplyVal.LevelUp) {
            let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}${(candle.checker(userid)) ? ' ' + candle.checker(userid) : ''}\n\t\t${rplyVal.LevelUp}`
            SendToId(groupid, text, options);

        }

        if (!rplyVal.text) {
            return;
        }
        //TGcountroll++;
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
                // 輸入dr  (指令) 私訊自己
                //
                if (ctx.chat.type != 'private') {
                    SendToId(groupid, "@" + displayname + ' 暗骰給自己', options);
                }
                rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
                SendToId(userid, rplyVal.text, options);
                break;
            }
            case privatemsg == 2: {
                //輸入ddr(指令) 私訊GM及自己
                if (ctx.chat.type != 'private') {
                    let targetGMNameTemp = "";
                    for (let i = 0; i < TargetGMTempID.length; i++) {
                        targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                    }
                    SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp, options);
                }
                rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
                SendToId(userid, rplyVal.text);
                for (const element of TargetGMTempID) {
                    if (userid != element)
                        SendToId(element, rplyVal.text);
                }
                break;
            }
            case privatemsg == 3: {
                //輸入dddr(指令) 私訊GM
                if (ctx.chat.type != 'private') {
                    let targetGMNameTemp = "";
                    for (let i = 0; i < TargetGMTempID.length; i++) {
                        targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
                    }
                    SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp, options);
                }
                rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
                for (const element of TargetGMTempID) {
                    SendToId(element, rplyVal.text);
                }
                break;
            }
            default: {
                if (displaynamecheck && displayname) {
                    //285083923223
                    displayname = "@" + ctx.from.username + ((rplyVal.statue) ? ' ' + rplyVal.statue : '') + ((candle.checker(userid)) ? ' ' + candle.checker(userid) : '') + "\n";
                    rplyVal.text = displayname + rplyVal.text;
                }
                SendToId((groupid || userid), rplyVal.text, options);
                break;
            }
        }
    })().catch(error => console.error(`Error in message handler for ${ctx.update.update_id}:`, error));
})

function SendToId(targetid, text, options) {
    try {
        for (let i = 0; i < text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
            if (i == 0 || i == 1 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
                TGclient.api.sendMessage(targetid, text.toString().match(/[\s\S]{1,2000}/g)[i], options).catch((error) => {
                    console.error("Telegram SendToId error:", error.message);
                });
            }
        }
    } catch (error) {
        console.error('tg 277 SendToId error:', (error && (error.message || error.name)));
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
            TGclient.api.sendMessage(object.target.id, object.text).catch((error) => {
                console.error("Telegram sendMessage error:", error.message);
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
                membercount = await TGclient.api.getChatMemberCount(ctx.chat.id).catch(() => {
                    return 0;
                });

            }
            let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, tgDisplayname);
            if (groupid && LevelUp && LevelUp.text) {
                SendToId(groupid, `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`);
            }
        }
        return null;
    } catch (error) {
        console.error('tg 287 nonDice error:', (error && (error.message || error.name)));
    }
}


TGclient.on('message:new_chat_members', async (ctx) => {
    let newUser = await TGclient.api.getMe();
    if (ctx.message.new_chat_member.username == newUser.username) {
        console.log("Telegram joined");
        SendToId(ctx.chat.id, newMessage.joinMessage());
    }
});

TGclient.on('message:group_chat_created', async (ctx) => {
    SendToId(ctx.chat.id, newMessage.joinMessage());
});
TGclient.on('message:supergroup_chat_created', async (ctx) => {
    SendToId(ctx.chat.id, newMessage.joinMessage());
});


TGclient.on('message:audio', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
});
TGclient.on('message:document', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})
TGclient.on('message:photo', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})
TGclient.on('message:sticker', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})
TGclient.on('message:video', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})
TGclient.on('message:voice', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})
TGclient.on('channel_post', async (ctx) => {
    if (ctx.from.is_bot) return;
    await nonDice(ctx);
    return null;
})

async function privateMsgFinder(groupid) {
    if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
    let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
        data.groupid == groupid
    )
    return groupInfo && groupInfo.trpgDarkRollingfunction ? groupInfo.trpgDarkRollingfunction : [];
}

if (agenda && agenda.agenda) {
    agenda.agenda.define("scheduleAtMessageTelegram", async (job) => {
        //指定時間一次
        let data = job.attrs.data;
        let text = await rollText(data.replyText);
        //SendToReply(ctx, text)
        SendToId(
            data.groupid, text
        )
        try {
            await job.remove();
        } catch (error) {
            console.error("TG Error removing job from collection:scheduleAtMessageTelegram", error);
        }

    });
    agenda.agenda.define("scheduleCronMessageTelegram", async (job) => {
        //指定時間
        let data = job.attrs.data;
        let text = await rollText(data.replyText);
        //SendToReply(ctx, text)
        SendToId(
            data.groupid, text
        )
        try {
            if ((new Date(Date.now()) - data.createAt) >= SIX_MONTH) {
                await job.remove();
                SendToId(
                    data.groupid, "已運行六個月, 移除此定時訊息"
                )
            }
        } catch (error) {
            console.error("Error removing job from collection:scheduleCronMessageTelegram", error);
        }

    });


}


async function isAdmin(gpId, chatid) {
    let member = await TGclient.api.getChatMember(gpId, chatid).catch(() => { });
    if (member?.status === "creator") return true
    if (member?.status === "administrator") return true
    return false;
}

function sendNewstoAll(rply) {
    for (let index = 0; index < rply.target.length; index++) {
        SendToId(rply.target[index].userID, rply.sendNews);
    }
}

TGclient.catch((error) => {
    const ctx = error.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = error.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});


/*
bot.command('pipe', (ctx) => ctx.replyWithPhoto({
    url: 'https://picsum.photos/200/300/?random'
}))
*/

async function __sendMeMessage({ ctx, rplyVal, }) {
    SendToId(ctx.chat.id || ctx.from.id, rplyVal.myspeck.content);
    return;
}

TGclient.start({
    onStart: (botInfo) => {
        console.log(`[Telegram] Bot started as ${botInfo.username}`);
    },
    onError: (error) => {
        console.error(`[Telegram] Bot error: ${error.message}`);
    }
});