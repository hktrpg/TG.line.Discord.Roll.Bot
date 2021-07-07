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
        console.log(profile);
        plurkID = profile.id;
    })
    .catch(err => console.error(err));

Plurk_Client.startComet();

Plurk_Client.on('new_plurk', async response => {
    if (response.type != 'new_plurk') return;
    let message = response.content_raw;
    if (!message.match(/^@HKTRPG\s+/i)) {
        return;
    }
    let mainMsg = message.match(msgSplitor); // 定義輸入字串
    if (mainMsg.length > 1)
        mainMsg.shift();
    else return;

    // 訊息來到後, 會自動跳到analytics.js進行骰組分析
    // 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
    let rplyVal = await exports.analytics.parseInput({
        inputStr: mainMsg.join(' '),
        botname: "Plurk"
    });
    if (rplyVal && rplyVal.text) {
        Plurk_Client.request('Responses/responseAdd', { plurk_id: response.plurk_id, content: rplyVal.text, qualifier: 'says' })
    }
});

Plurk_Client.on('new_response', async response => {
    if (response.user[plurkID]) return;
    if (response.type != 'new_response') return;
    let message = response.response.content_raw;
    if (!message.match(/^@HKTRPG\s+/i)) {
        return;
    }
    let mainMsg = message.match(msgSplitor); // 定義輸入字串
    if (mainMsg.length > 1)
        mainMsg.shift();
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
        Plurk_Client.request('Responses/responseAdd', { plurk_id: response.plurk.plurk_id, content: rplyVal.text, qualifier: 'says' })
    }
})