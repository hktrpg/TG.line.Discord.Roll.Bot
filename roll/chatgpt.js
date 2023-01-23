"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【ChatGpt】.chat'
}
let date = {
    conversationId: null,
    parentMessageId: null
}
const gameType = function () {
    return 'chatgpt:funny:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.chat$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【ChatGPT】.chat
.chat [訊息]
聊天機器人`
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
        case /^\S/.test(mainMsg[1]): {
            rply.text = await chat(inputStr.replace(/\.chat/i, ''))
            return rply;
        }
        default: {
            break;
        }
    }
}

async function chat(inputStr) {
    // To use ESM in CommonJS, you can use a dynamic import
    const { ChatGPTAPI, getOpenAIAuth } = await import('chatgpt')

    const openAIAuth = await getOpenAIAuth({
        email: process.env.OPENAI_EMAIL,
        password: process.env.OPENAI_PASSWORD
    })

    const api = new ChatGPTAPI({ ...openAIAuth })
    await api.initSession()
    const res = await api.sendMessage(inputStr, data)
    if (res && res.conversationId) data.conversationId = res.conversationId;
    if (res && res.messageId) data.parentMessageId = res.messageId;
    return (res && res.response) || ('沒有回應，請以後再試');
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