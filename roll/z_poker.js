"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return 'Poker Game'
}

const gameType = function () {
    return 'Poker:funny:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^poker$/i,
        second: /^啊$/i
    }]
}
const getHelpMessage = function () {
    return `【示範】
功能: 
1. 定義一副牌，
2. 加入不同的牌
    i. 牌有名字，內容，擁有者
3.  開始遊戲
    i. 定義使用的牌，派多少張牌，是不是隱藏
    ii. 不同玩家報名
    iii. 遊戲開始
    iv. 遊戲結束
 4. 玩家可以進行下列動作
    i. 抽牌
    ii. 出牌
    iii. 投降
    iv. 查看牌
    v. 查看玩家
    vi. 查看遊戲
    vii. 遊戲結束
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

class Game {
    constructor() {
        this.variables = initialize();
        this.gameName = gameName;
        this.gameType = gameType;
        this.prefixs = prefixs;
        this.getHelpMessage = getHelpMessage;
        this.rollDiceCommand = rollDiceCommand;
    }
}

class Deck {
    constructor() {
        this.deck = [];
        this.reset();
    }

    put(card) {
        this.deck.push(card);
    }

    postion(card) {
        return this.deck.indexOf(card);
    }

    post(card) {
        this.deck.push(card);
    }

    delete(card) {
        this.deck.splice(this.deck.indexOf(card), 1);
    }

    reset() {
        for (let i = 0; i < this.deck.length; i++) {
            this.deck[i].owner = null;
        }
    }
    shuffle() {
        let m = this.deck.length,
            t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = this.deck[m];
            this.deck[m] = this.deck[i];
            this.deck[i] = t;
        }
    }
    deal() {
        return this.deck.pop();
    }
}

class Card {
    constructor(name, value) {
        this.value = value;
        this.name = name;
        this.owner = null;
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