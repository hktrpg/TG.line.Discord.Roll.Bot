"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【成就系統】'
}

const gameType = function () {
    return 'funny:achievenment:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
const getHelpMessage = function () {
    return `【示範】
只是一個Demo的第一行
只是一個Demo末行`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = 'Demo' + mainMsg[1] + inputStr + groupid + userid + userrole + botname + displayname + channelid + displaynameDiscord + membercount;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};
/**
 成就系統
A. 分成四個部分
1. 成就系統
    i. 不同的身份
        1. TRPG玩家
        2. 占卜師
        3. 管理員
    ii. 不同的成就
        1. 玩家
            1. 玩家總數
2. 每日任務
    i. 每日簽到
    ii. 每日抽卡
    iii. 每日占卜
    iv. 每日獲得經驗值 
    v. 系統的每日任務
3. 每日抽獎
4. 定時訊息
5. 獎勵?

    1. 用戶可以自行設定公用成就
    2. 用戶可以自行設定私人成就
    3. 用戶可以自行設定每日任務
    4. 用戶可以自行設定每週任務
    3. 用戶可以自行打開成就列表，然後點擊表示已經完成
    4. 用戶可以自行設定成就的條件

 */