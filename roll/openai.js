"use strict";
if (!process.env.OPENAI_SECRET) return;

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_SECRET,
    basePath: process.env.OPENAI_BASEPATH,
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
        return response;
    } catch (error) {
        console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
        return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
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
        if (response?.data?.error) return '可能是輸入太長了，或是有不支援的字元，請重新輸入'
        return response?.data?.choices[0]?.message?.content;
    } catch (error) {
        console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
        return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
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

const { Configuration, OpenAIApi } = require('openai');

// 建立apiKey的陣列
const apiKeys = [
  process.env.OPENAI_SECRET_1,
  process.env.OPENAI_SECRET_2,
  process.env.OPENAI_SECRET_3,
  process.env.OPENAI_SECRET_4,
  process.env.OPENAI_SECRET_5,
  process.env.OPENAI_SECRET_6,
  process.env.OPENAI_SECRET_7,
  process.env.OPENAI_SECRET_8,
  process.env.OPENAI_SECRET_9,
  process.env.OPENAI_SECRET_10,
];

// 設定最大重試次數
const maxRetries = 10;

// 建立 openai 實例的函式
function getOpenaiInstance(apiKeyIndex = 0, retryCount = 0) {
  // 設定 configuration
  const configuration = new Configuration({
    apiKey: apiKeys[apiKeyIndex],
    basePath: process.env.OPENAI_BASEPATH,
  });

  // 產生 openai 實例
  const openai = new OpenAIApi(configuration);

  // 設定 onError 事件，當發生錯誤時會觸發此事件
  openai.onError = async (error) => {
    if (error.response && error.response.status === 429 && retryCount < maxRetries) {
      // 如果是因為使用上限而發生錯誤，且還可以重試，就換下一個 apiKey 重試
      const nextApiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
      await wait(60 * 60); // 等待一小時
      return getOpenaiInstance(nextApiKeyIndex, retryCount + 1);
    } else {
      // 如果是其他錯誤，或已超過最大重試次數，就拋出錯誤
      throw error;
    }
  };

  return openai;
}

// 建立等待的函式
function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

// 使用方式
const openai = getOpenaiInstance();