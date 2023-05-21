"use strict";
if (!process.env.OPENAI_SECRET) return;

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_SECRET,
    basePath: "https://api.pawan.krd/v1",
});
const openai = new OpenAIApi(configuration);

const variables = {};
const { SlashCommandBuilder } = require('discord.js');

const gameName = function () {
    return '【Demo】'
}

const gameType = function () {
    return 'funny:openai:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.ai$/i,
        second: null
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

async function handleRequestAi(inputStr) {
    try {


        let response = await openai.createChatCompletion({
            "model": "gpt-3.5-turbo",
            "max_tokens": 100,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an helpful assistant."
                },
                {
                    "role": "user",
                    "content": "Who are you?"
                }
            ]

        })
        console.log(response)
        if (response?.data?.error) return '可能是輸入太長了，或是有不支援的字元，請重新輸入'
        return response?.data?.choices[0]?.text;
    } catch (error) {
        console.error(error)
    }
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

        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = await handleRequestAi(inputStr);
            rply.quotes = true;
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