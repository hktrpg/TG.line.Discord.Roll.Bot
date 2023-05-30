"use strict";
if (!process.env.OPENAI_BASEPATH && !process.env.OPENAI_SECRET_1) return;
const { Configuration, OpenAIApi } = require('openai');
const fetch = require('node-fetch');
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
        first: /^([.]ai)|(^[.]aimage)|(^[.]ait)$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【OpenAi】
.aimage [描述] - 產生DALL-E圖片
.ai [對話] - 使用gpt-3.5-turbo產生對話
.ait [內容] 或 附件 - 使用 gpt-3.5-turbo進行正體中文翻譯

使用: https://github.com/PawanOsman/ChatGPT#nodejs
`
}
const initialize = function () {
    return variables;
}





const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    discordMessage,
    userid,
    discordClient,
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
        case /^.ait$/i.test(mainMsg[0]): {
            rply.text = await translateAi.handleTranslate(inputStr, discordMessage, discordClient);
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]) && /^.aimage$/i.test(mainMsg[0]): {
            rply.text = await imageAi.handleImageAi(inputStr);
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]): {
            rply.text = await chatAi.handleChatAi(inputStr);
            rply.quotes = true;
            return rply;
        }
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
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


class OpenAI {
    constructor() {
        this.apiKeys = [];
        this.addApiKey();
        this.configuration = new Configuration({
            apiKey: this.apiKeys[0],
            basePath: process.env.OPENAI_BASEPATH,
        });
        this.openai = new OpenAIApi(this.configuration);
        this.currentApiKeyIndex = 0;
        this.errorCount = 0;
    }
    addApiKey() {
        for (let index = 0; index < 99; index++) {
            if (!process.env[`OPENAI_SECRET_${index}`]) continue;
            this.apiKeys.push(process.env[`OPENAI_SECRET_${index}`]);
        }
    }
    handleError(error) {
        this.errorCount++;
        if (error.response?.status === 401) {
            console.error('remove api key 401', this.apiKeys[this.currentApiKeyIndex])
            this.apiKeys.splice(this.currentApiKeyIndex, 1);
            this.currentApiKeyIndex--;
            this.errorCount--;
        }
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
        this.openai = new OpenAIApi(new Configuration({
            apiKey: this.apiKeys[this.currentApiKeyIndex],
            basePath: process.env.OPENAI_BASEPATH,
        }));
    }
}

class ImageAi extends OpenAI {
    constructor() {
        super();
    }
    async handleImageAi(inputStr) {
        let input = inputStr.replace(/^\.aimage/i, '');
        try {
            let response = await this.openai.createImage({
                "prompt": `${input}`,
                "n": 1,
                "size": "1024x1024"

            })
            response = await this.handleImage(response, input)
            // if (response?.data?.error) return '可能是輸入太長了，或是有不支援的字元，請重新輸入'
            this.errorCount = 0;
            return response;
        } catch (error) {
            if (this.errorCount < this.apiKeys.length) {
                await super.handleError(error);
                return await this.handleImageAi(inputStr);
            } else {
                this.errorCount = 0;
                console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
                return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
            }
        }
    }
    handleImage(data, input) {
        if (data?.data?.data?.length === 0) return '沒有輸出的圖片, 請重新輸入描述';
        let response = `${input}:\n`;
        for (let index = 0; index < data.data.data.length; index++) {
            response += data.data.data[index].url + "\n";
        }
        return response;
    }

}

class TranslateAi extends OpenAI {
    constructor() {
        super();
    }
    async getText(str, discordMessage, discordClient) {
        let text = [];
        if (str.replace(/^\S?\.ait\S+$/i, '').length > 0) text.push(str.replace(/^\S?\.ait\S+$/i, ''));
        console.log(discordMessage,)

        if (discordMessage?.type === 0 && discordMessage?.attachments?.size > 0) {
            const url = Array.from(discordMessage.attachments.filter(data => data.contentType.match(/text/i))?.values());
            for (let index = 0; index < url.length; index++) {
                const response = await fetch(url[index].url);
                const data = await response.text();
                text.push(data);
            }
        }
        //19 = reply
        if (discordMessage?.type === 19) {
            const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
            const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId)
            const url = Array.from(referenceMessage.attachments.filter(data => data.contentType.match(/text/i))?.values());
            for (let index = 0; index < url.length; index++) {
                const response = await fetch(url[index].url);
                const data = await response.text();
                text.push(data);
            }
        }
        let result = this.splitStringByLength(text.join('\n'), 1900);
        return result;

    }

    async handleTranslate(inputStr, discordMessage, discordClient) {
        let text = await this.getText(inputStr, discordMessage, discordClient);
        console.log(text);
        try {
            let response = [];
            for (let index = 0; index < text.length; index++) {
                let result = await openai.createChatCompletion({
                    "model": "gpt-3.5-turbo",
                    "max_tokens": 2100,
                    "messages": [
                        {
                            "role": "system",
                            "content": "你叫HKTRPG TRPG助手。你以正體中文回答所有問題."
                        },
                        {
                            "role": "user",
                            "content": `${text[index]}\n\n以上內容翻譯成正體中文`
                        }
                    ]

                })
                response.push(result?.data?.choices[0]?.message?.content);
            }

            this.errorCount = 0;
            return response;
        } catch (error) {
            console.log('error', error)
            if (this.errorCount < this.apiKeys.length) {
                await super.handleError(error);
                return await this.handleTranslate(inputStr);
            } else {
                this.errorCount = 0;
                console.error('AI error', error.response?.status, error.response?.statusText, `${inputStr.replace(/^\.ait/i, '')}`)
                return 'AI error', error.response?.status + error.response?.statusText + ` ${inputStr.replace(/^\.ait/i, '')}`;
            }
        }
    }
    splitStringByLength(str, length) {
        let result = [];
        let currentLine = 0;
        let currentStringLength = 0;
        const lines = str.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let lineLength = line.length;
            if (lineLength > length) {
                let lineSplit = line.split(/.{1,10}/g);
                for (let j = 0; j < lineSplit.length; j++) {
                    currentLine++;
                    result[currentLine] = lineSplit[j];
                }
                currentStringLength = 0;
            }
            if (currentStringLength + lineLength > length) {
                currentLine++;
                result[currentLine] = line;
                currentStringLength = 0;
            }
            if (currentStringLength + lineLength < length) {
                result[currentLine] += line + '\n';
                currentStringLength += lineLength;
            }

        }
        return result.filter(a => a.length > 0);
    }

}

class ChatAi extends OpenAI {
    constructor() {
        super();
    }
    async handleChatAi(inputStr) {
        try {
            let response = await this.openai.createChatCompletion({
                "model": "gpt-3.5-turbo",
                "max_tokens": 3100,
                "messages": [
                    {
                        "role": "system",
                        "content": "你叫HKTRPG TRPG助手。你以正體中文回答所有問題."
                    },
                    {
                        "role": "user",
                        "content": `${inputStr.replace(/^\.ai/i, '')}`
                    }
                ]

            })
            this.errorCount = 0;
            return response?.data?.choices[0]?.message?.content;
        } catch (error) {
            if (this.errorCount < this.apiKeys.length) {
                await super.handleError(error);
                return await this.handleChatAi(inputStr);
            } else {
                this.errorCount = 0;
                console.error('AI error', error.response.status, error.response.statusText, `${inputStr.replace(/^\.ai/i, '')}`)
                return 'AI error', error.response.status + error.response.statusText + ` ${inputStr.replace(/^\.ai/i, '')}`;
            }
        }
    }
}

const openai = new OpenAI();
const chatAi = new ChatAi();
const imageAi = new ImageAi();
const translateAi = new TranslateAi();


