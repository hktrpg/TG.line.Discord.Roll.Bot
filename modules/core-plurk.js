"use strict";
if (!process.env.PLURK_SWITCH) {
    return;
}
var plurkID = '';
const { PlurkClient } = require('plurk2');
const msgSplitor = (/\S+/ig);
const Plurk_Client = new PlurkClient(process.env.PLURK_APPKEY, process.env.PLURK_APPSECRET, process.env.PLURK_TOKENKEY, process.env.PLURK_TOKENSECRET);
exports.analytics = require('./core-analytics');
Plurk_Client.request('Users/me')
    .then(profile => {
        console.log('RUN', profile.full_name);
        plurkID = profile.id;
    })
    .catch(err => console.error(err));

setInterval(function () {
    console.log('START?')
    Plurk_Client.startComet();

    Plurk_Client.on('new_plurk', async response => {
        if (response.type != 'new_plurk') return;
        if (response.limited_to && response.limited_to.length == 1 && response.limited_to[0] == 0) return;
        let message = response.content_raw;
        if (!message) return;
        let mainMsg = message.match(msgSplitor); // 定義輸入字串
        if (mainMsg.length > 1) {
            if (!mainMsg[0].match(/@HKTRPG/i)) return;
            mainMsg.shift();
        }
        else return;

        // 訊息來到後, 會自動跳到analytics.js進行骰組分析
        // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
        let rplyVal = await exports.analytics.parseInput({
            inputStr: mainMsg.join(' '),
            botname: "Plurk"
        });
        if (rplyVal && rplyVal.text) {
            return await sendMessage(response.plurk_id, rplyVal.text);
        }
    });

    Plurk_Client.on('new_response', async response => {
        if (response.user[plurkID]) return;
        if (response.type != 'new_response') return;
        if (response.limited_to && response.limited_to.length == 1 && response.limited_to[0] == 0) return;
        let message = response.response.content_raw;
        if (!message) return;
        let mainMsg = message.match(msgSplitor); // 定義輸入字串

        if (mainMsg.length > 1) {
            if (!mainMsg[0].match(/@HKTRPG/i)) return;
            mainMsg.shift();
        }
        else return;

        // 訊息來到後, 會自動跳到analytics.js進行骰組分析
        // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
        let rplyVal = await exports.analytics.parseInput({
            inputStr: mainMsg.join(' '),
            botname: "Plurk"
        });

        if (rplyVal && rplyVal.text) {
            let displayName = '';
            for (var i in response.user) {
                if (i == response.response.user_id)
                    displayName = `${response.user[i].display_name}\n`

            }
            rplyVal.text = `${displayName}${rplyVal.text}`
            await sendMessage(response.plurk.plurk_id, rplyVal.text);
        }
    })
}, 60 * 1000 * 30); // 60 * 1000 milsec




async function sendMessage(response, rplyVal) {
    try {
        await Plurk_Client.request('Responses/responseAdd', { plurk_id: response, content: rplyVal.toString().match(/[\s\S]{1,300}/g)[0], qualifier: 'says' })
    } catch (error) {
        if (!error.error_text == "anti-flood-same-content")
            console.error(error);
    }

}