"use strict";
if (!process.env.PLURK_SWITCH) {
    return;
}
let plurkID = '';
const { PlurkClient } = require('plurk2');
const EXPUP = require('./chat/level').EXPUP || function () {};
const courtMessage = require('./chat/logs').courtMessage || function () {};
const i18n = require('./i18n/i18n.js');
const SIX_MINUTES = 360_000;
const MESSAGE_SPLITOR = (/\S+/ig);
const Plurk_Client = new PlurkClient(process.env.PLURK_APPKEY, process.env.PLURK_APPSECRET, process.env.PLURK_TOKENKEY, process.env.PLURK_TOKENSECRET);
exports.analytics = require('./analytics');
const parseRouter = require('./roll-worker/parse-router');
const deferQueue = require('./roll-worker/defer-queue');

deferQueue.registerDeliverer('Plurk', async (job, result) => {
	const plurkId = job.replyTarget?.plurkId || job.replyTarget?.chatId;
	if (!plurkId) return;
	let rplyText = '';
	const display = job.params?.displayname || '';
	if (display) rplyText += `${display}\n`;
	if (result?.text) rplyText += `${result.text}\n`;
	if (result?.LevelUp) rplyText += `${result.LevelUp}`;
	if (!rplyText.trim()) return;
	await sendMessage(plurkId, rplyText);
});

Plurk_Client.request('Users/me')
    .then(profile => {
        console.log(`[Plurk] Plurk 名稱: ${profile.full_name}`);
        plurkID = profile.id;
    })
    .catch(error => console.error('[Plurk] Error:', error.error_text));



// Comet connection management with error handling
let cometConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 30_000; // 30 seconds

function startCometConnection() {
    try {
        if (cometConnected) {
            //console.log('Plurk comet already connected');
            return;
        }

        Plurk_Client.startComet();
        cometConnected = true;
        reconnectAttempts = 0;
        //console.log('Plurk comet connection started');
    } catch (error) {
        console.error('[Plurk] Failed to start comet connection:', error.message);
        scheduleReconnect();
    }
}

function stopCometConnection() {
    try {
        if (!cometConnected) return;
        Plurk_Client.stopComet();
        cometConnected = false;
        //console.log('Plurk comet connection stopped');
    } catch (error) {
        console.error('[Plurk] Error stopping comet connection:', error.message);
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`[Plurk] Comet reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        return;
    }

    reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
    //console.log(`Scheduling Plurk comet reconnection in ${delay}ms (attempt ${reconnectAttempts})`);

    setTimeout(() => {
        startCometConnection();
    }, delay);
}

startCometConnection();

// Add error handling for comet connection
Plurk_Client.on('error', (error) => {
    console.error('[Plurk] Comet connection error:', error.message);
    cometConnected = false;
    scheduleReconnect();
});

Plurk_Client.on('close', () => {
    //console.log('Plurk comet connection closed');
    cometConnected = false;
    scheduleReconnect();
});

// Initial alerts setup with error handling
Plurk_Client.request('Alerts/addAllAsFriends')
    .catch(error => {
        console.error('[Plurk] Failed to add all as friends:', error.message || error.error_text);
    });

function intervalFunc() {
    Plurk_Client.request('Alerts/addAllAsFriends')
        .catch(error => {
            console.error('[Plurk] Failed to refresh alerts:', error.message || error.error_text);
        });

    // Restart comet connection periodically to prevent timeouts
    stopCometConnection();
    setTimeout(startCometConnection, 5000); // Restart after 5 seconds
}

setInterval(intervalFunc, SIX_MINUTES);


Plurk_Client.on('new_plurk', async response => {
    if (response.type != 'new_plurk') return;
    // if (response.limited_to && response.limited_to.length == 1 && response.limited_to[0] == 0) return;

    let groupid = response.owner_id,
        userid = response.user_id,
        displayname = "",
        channelid = response.owner_id,
        userrole = 1,
        message = response.content_raw,
        inputStr = message.replace(/^\s*@hktrpg\s+/i, '');

    let target = true;
    if (!parseRouter.shouldSkipLocalFindRollList('Plurk')) {
        target = await exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
    }

    if (!target) {
        await nonDice(groupid, userid, displayname, response.plurk_id)
        return null
    }

    if (!message) return;
    let mainMsg = message.match(MESSAGE_SPLITOR); // 定義輸入字串
    if (mainMsg && mainMsg.length > 1) {
        if (!/@HKTRPG/i.test(mainMsg[0])) {
            // Worker mode skips findRollList — still award EXP for non-mention chatter.
            if (parseRouter.shouldSkipLocalFindRollList('Plurk')) {
                await nonDice(groupid, userid, displayname, response.plurk_id);
            }
            return;
        }
        mainMsg.shift();
    }
    else {
        if (parseRouter.shouldSkipLocalFindRollList('Plurk')) {
            await nonDice(groupid, userid, displayname, response.plurk_id);
        }
        return;
    }

    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    const locale = await i18n.resolveLocale({ groupid, userid, botname: 'Plurk' });
    const t = i18n.createTranslator(locale);
    const plurkReplyTarget = {
        botname: 'Plurk',
        plurkId: response.plurk_id,
        chatId: response.plurk_id,
        userid,
    };
    let rplyVal = await parseRouter.parseInput({
        inputStr: message.replace(/^\s*@hktrpg\s+/i, ''),
        groupid: groupid,
        userid: userid,
        userrole: userrole,
        botname: "Plurk",
        displayname: displayname,
        channelid: channelid,
        locale,
        t
    }, { replyTarget: plurkReplyTarget });
    if (rplyVal?.deferred) return;
    if (!rplyVal.text && !rplyVal.LevelUp) {
        return;
    }

    let rplyText = '';
    if (displayname) rplyText += `${displayname}\n`
    if (rplyVal.text) rplyText += `${rplyVal.text}\n`
    if (rplyVal.LevelUp) rplyText += `${rplyVal.LevelUp}`

    return await sendMessage(response.plurk_id, rplyText);

});

Plurk_Client.on('new_response', async response => {
    //防止自己回應自己
    if (response.user[plurkID]) return;
    if (response.type != 'new_response') return;
    //   if (response.limited_to && response.limited_to.length == 1 && response.limited_to[0] == 0) return;
    let message = response.response.content_raw;

    let groupid = response.plurk.owner_id,
        userid = response.response.user_id,
        displayname = response.user[userid].display_name,
        channelid = response.plurk.owner_id,
        userrole = 1,
        inputStr = message.replace(/^\s*@hktrpg\s+/i, '');

    let target = true;
    if (!parseRouter.shouldSkipLocalFindRollList('Plurk')) {
        target = await exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
    }

    if (!target) {
        await nonDice(groupid, userid, displayname, response.plurk_id)
        return null
    }
    if (!message) return;
    let mainMsg = message.match(MESSAGE_SPLITOR); // 定義輸入字串


    if (mainMsg && mainMsg.length > 1) {
        if (!/@HKTRPG/i.test(mainMsg[0])) {
            if (parseRouter.shouldSkipLocalFindRollList('Plurk')) {
                await nonDice(groupid, userid, displayname, response.plurk.plurk_id);
            }
            return;
        }
        mainMsg.shift();
    }
    else {
        if (parseRouter.shouldSkipLocalFindRollList('Plurk')) {
            await nonDice(groupid, userid, displayname, response.plurk.plurk_id);
        }
        return;
    }


    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    const locale = await i18n.resolveLocale({ groupid, userid, botname: 'Plurk' });
    const t = i18n.createTranslator(locale);
    const plurkReplyTarget = {
        botname: 'Plurk',
        plurkId: response.plurk.plurk_id,
        chatId: response.plurk.plurk_id,
        userid,
    };
    let rplyVal = await parseRouter.parseInput({
        inputStr: inputStr,
        groupid: groupid,
        userid: userid,
        userrole: userrole,
        botname: "Plurk",
        displayname: displayname,
        channelid: channelid,
        locale,
        t
    }, { replyTarget: plurkReplyTarget });
    if (rplyVal?.deferred) return;
    if (!rplyVal.text && !rplyVal.LevelUp) {
        return;
    }

    let displayName = '';
    for (let i in response.user) {
        if (i == response.response.user_id)
            displayName = `${response.user[i].display_name}`

    }
    let rplyText = '';
    if (displayName) rplyText += `${displayName}\n`
    if (rplyVal.text) rplyText += `${rplyVal.text}\n`
    if (rplyVal.LevelUp) rplyText += `${rplyVal.LevelUp}`
    return await sendMessage(response.plurk.plurk_id, rplyText);

})

async function sendMessage(response, rplyVal) {
    try {
        await Plurk_Client.request('Responses/responseAdd', { plurk_id: response, content: rplyVal.toString().match(/[\s\S]{1,300}/g)[0], qualifier: 'says' })
    } catch (error) {
        if (error.error_text !== "anti-flood-same-content")
            console.error('[Plurk] Error:', error.error_text);
    }
    return;

}
async function nonDice(groupid, userid, displayname, plurk_id) {
    await courtMessage({ result: "", botname: "Plurk", inputStr: "" })
    if (!groupid || !userid) return;
    const locale = await i18n.resolveLocale({ groupid, userid, botname: 'Plurk' });
    let LevelUp = await EXPUP(groupid, userid, displayname, "", null, "", null, locale);
    if (groupid && LevelUp && LevelUp.text) {
        await sendMessage(plurk_id, LevelUp.text);
    }

    return null;
}