"use strict";
var variables = {};

var gameName = function () {
    return '【StoryMaker】'
}

var gameType = function () {
    return 'fnnny:storyMaker:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
var getHelpMessage = function () {
    return `【示範】
只是一個Demo的第一行
只是一個Demo末行`
}
var initialize = function () {
    return variables;
}

var rollDiceCommand = async function ({
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


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};

/**
 *
 *輸入的格式

 */

/*
  設計
  A) 選擇圖書式
  可以使用{變數.A1}之類取代故事的某些字眼
  最後會給出頁數, 頁數可以隨機產生?
  可以擲骰?
  第一次通關前，只可以前進，不可後退
  99個變數
  變數: 名字 內容
  B)  問卷式
  根據選項，可以改變變數?
  變數運算
  顯示變數
  * {br}          <--隔一行\n\
* {ran:100}     <---隨機1-100\n\
* {random:5-20} <---隨機5-20\n\
* {server.member_count}  <---現在頻道中總人數 \n\
* {my.name}     <---顯示擲骰者名字\n\
以下需要開啓.level 功能\n\
* {allgp.name}  <---隨機全GP其中一人名字\n\
* {allgp.title}  <---隨機全GP其中一種稱號\n\
* {my.RankingPer}  <---現在排名百分比 \n\
* {my.Ranking}  <---顯示擲骰者現在排名 \n\
* {my.exp}      <---顯示擲骰者經驗值\n\
* {my.title}    <---顯示擲骰者稱號\n\
* {my.level}    <---顯示擲骰者等級\n\
  */

/*
    設計
    A) 選擇圖書式
    可以使用{變數.A1}之類取代故事的某些字眼
    最後會給出頁數, 頁數可以隨機產生?
    可以擲骰?
    第一次通關前，只可以前進，不可後退
    99個變數
    變數: 名字 內容

    B)  問卷式
    根據選項，可以改變變數?
    變數運算
    顯示變數

每個BOT 放置一個 CHECK TEMP
在storyMarker 中會檢查 USERID, CHANNELID, GPID

有的話, 會得到回應 TEMP 只是連接，不記錄應回應什麼

只記找那個結果的連結

    */