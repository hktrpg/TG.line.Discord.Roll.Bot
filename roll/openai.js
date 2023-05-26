"use strict";
if (!process.env.OPENAI_BASEPATH && !process.env.OPENAI_SECRET_1) return;

const { Configuration, OpenAIApi } = require('openai');
const apiKeys = [
];

const addApiKey = () => {
    for (let index = 0; index < 99; index++) {
        if (!process.env[`OPENAI_SECRET_${index}`]) continue;
        apiKeys.push(process.env[`OPENAI_SECRET_${index}`]);
    }
}
addApiKey();

let configuration = new Configuration({
    apiKey: apiKeys[0],
    basePath: process.env.OPENAI_BASEPATH,
});
let openai = new OpenAIApi(configuration);
let currentApiKeyIndex = 0;
let errorCount = 0;



const variables = {};
const { SlashCommandBuilder } = require('discord.js');

const gameName = function () {
    return '【OpenAi】'
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
        first: /^([.]ai)|(^[.]aimage)$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【OpenAi】
.aimage [描述] - 產生DALL-E圖片
.ai [對話] - 使用gpt-3.5-turbo產生對話

使用: https://github.com/PawanOsman/ChatGPT#nodejs
`
}
const initialize = function () {
    return variables;
}
async function handleImageAi(inputStr) {
    let input = inputStr.replace(/^\.aimage/i, '');
    try {
        let response = await openai.createImage({

            "prompt": `${input}`,
            "n": 1,
            "size": "1024x1024"

        })
        response = await handleImage(response, input)
        // if (response?.data?.error) return '可能是輸入太長了，或是有不支援的字元，請重新輸入'
        errorCount = 0;
        return response;
    } catch (error) {
        if (errorCount < apiKeys.length) {
            await handleError(error);
            return await handleImageAi(inputStr);
        } else {
            errorCount = 0;
            console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
            return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
        }
    }
}
async function handleImage(data, input) {
    if (data?.data?.data?.length === 0) return '沒有輸出的圖片, 請重新輸入描述';
    let response = `${input}:\n`;
    for (let index = 0; index < data.data.data.length; index++) {
        response += data.data.data[index].url + "\n";
    }
    return response;
}

async function handleError(error) {
    errorCount++;
    if (error.response.status === 401) {
        console.error('remove api key 401', apiKeys[currentApiKeyIndex])
        apiKeys.splice(currentApiKeyIndex, 1);
        currentApiKeyIndex--;
        errorCount--;
    }
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    openai = new OpenAIApi(new Configuration({
        apiKey: apiKeys[currentApiKeyIndex],
        basePath: process.env.OPENAI_BASEPATH,
    }));
}
async function handleChatAi(inputStr) {
    try {
        let response = await openai.createChatCompletion({
            "model": "gpt-3.5-turbo",
            "max_tokens": 3100,
            "messages": [
                {
                    "role": "system",
                    "content": "你叫HKTRPG TRPG助手。你的所有回答以正體中文為準."
                },
                {
                    "role": "user",
                    "content": `${inputStr.replace(/^\.ai/i, '')}`
                }
            ]

        })
        errorCount = 0;
        return response?.data?.choices[0]?.message?.content;
    } catch (error) {
        if (errorCount < apiKeys.length) {
            await handleError(error);
            return await handleChatAi(inputStr);
        } else {
            errorCount = 0;
            console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
            return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
        }
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
        case /^\S/.test(mainMsg[1]) && /^.aimage/i.test(mainMsg[0]): {
            rply.text = await handleImageAi(inputStr);
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]): {
            rply.text = await handleChatAi(inputStr);
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



// 建立apiKey的陣列

