"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【選擇叢書】'
}

const gameType = function () {
    return 'StoryTeller:Funny:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.ST$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【選擇叢書】
這裡是書本的世界，你可以選擇一本書，並且開展它的內容。
輸入 .ST bothelp - 顯示說明
輸入 .ST start - 開始遊戲
輸入 .ST end - 結束遊戲
輸入 .ST book - 選擇書本
輸入 .ST setting - 設定遊戲
-------
輸入 .StoryMaker create - 創建故事
輸入 .StoryMaker delete - 刪除故事
輸入 .StoryMaker list - 列出故事
輸入 .StoryMaker edit - 編輯故事
輸入 .StoryMaker help - 故事說明
-------

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
{show}
{ask: XXXX}
{cal: Var 算式+-/*}
{title}
{content}
{time XXYYDD HH:MM} <--- 顯示時間 
輸入格式 
=====================
#setting
{cal: hp 100}
{cal: mp 20}
{cal: name none}
=====================
#1
{title} 這是標題(可留空)
{content} {ask: name} 這是內容 現在可以輸入名字: .st set name [名字]
{choice1} 選項1 {goto: #2} {cal: HP +1} {cal: SAN -2} {cal: MP *2}
{choice2} 選項2 {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#2
{title} 這是標題(可留空)
{content} 這是內容
{choice2} 選項2 {if: HP >=10} {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#end
{title} 這是標題(可留空)
{content} 這是內容 {show: HP} {show: MP} {show: varA}

=====================
 */