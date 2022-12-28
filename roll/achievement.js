"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【成就Bingo遊戲】.bingo'
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
        first: /^\.bingo|\.bingos$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【成就Bingo遊戲】
這是以成就為主題的Bingo遊戲，
每個Bingo遊戲都有一個標題，並且有3X3 到5X5 的內容。
當你開始一個Bingo遊戲時，會以那些成就內容拼出Bingo圖案，
當你看到那個成就是你已達成的，就可以點擊它，
下面會出現分數計算。
所有人都可以點擊，並進行分數計算。
--------------------------------
【私人群組版】
.bingo button - 顯示Bingo遊戲按鈕
.bingo help - 查看說明
.bingo achievement - 查看你已達成的成就列表
.bingo achievement 標題 - 查看你已達成的成就列表
.bingo list - 查看現在有的Bingo遊戲列表
.bingo list 標題 - 查看該Bingo遊戲的內容列表
.bingo add  標題 內容1 內容2 .... 內容N (至少9個或以上) - 新增一個Bingo遊戲
.bingo remove 標題 - 刪除一個Bingo遊戲 (限HKTRPG管理員)
.bingo 標題名字 - 開始bingo遊戲
--------------------------------
【公用版】
.bingos button - 顯示Bingo遊戲按鈕
.bingos help - 查看說明
.bingos achievement - 查看你已達成的成就列表
.bingos list - 查看現在有的Bingo遊戲列表
.bingos list 標題 - 查看該Bingo遊戲的內容列表
.bingos add  標題 內容1 內容2 .... 內容N (至少9個或以上) - 新增一個Bingo遊戲
.bingos remove 標題 - 刪除一個Bingo遊戲 (限頻道管理員)
.bingos 標題名字 - 開始bingo遊戲
`
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