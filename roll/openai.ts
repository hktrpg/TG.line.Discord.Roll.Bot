"use strict";
if (!process.env.OPENAI_SWITCH) return;

const OpenAIApi = require('openai');
const dotenv = require('dotenv');
dotenv.config({ override: true });
const fetch = require('node-fetch');
const fs = require('fs').promises;
const fs2 = require('fs');
const VIP = require('../modules/veryImportantPerson');
const GPT3 = "gpt-3.5-turbo-0613";
const GPT4 = "gpt-4-0613";
const adminSecret = process.env.ADMIN_SECRET;
const TRANSLATE_LIMIT_PERSONAL = [500, 100000, 200000, 300000, 400000, 500000, 600000, 700000];
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const splitLength = 1000;
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
        first: /^([.]ai)|(^[.]aimage)|(^[.]ait)|(^[.]ai4)|(^[.]ait4)$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【OpenAi】
    .ai [對話] - 使用gpt-3.5產生對話
    .ait [內容] 或 附件 - 使用 gpt-3.5進行正體中文翻譯

    
附件需要使用.txt檔案上傳，普通使用者限500字內容，升級VIP後上限會提升，
AI翻譯需時，請耐心等待，也可能會出錯而失敗，10000字可能需要十分鐘以上。
超過1900字會以.TXT附件形式回覆，請注意查收。
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
        case /^.ait/i.test(mainMsg[0]): {
            const mode = mainMsg[0].includes('4') ? GPT4 : GPT3;
            if (mode === GPT4) {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
            }
            const { filetext, sendfile, text } = await translateAi.handleTranslate(inputStr, discordMessage, discordClient, userid, mode);
            filetext && (rply.fileText = filetext);
            sendfile && (rply.fileLink = [sendfile]);
            text && (rply.text = text);
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]) && /^.aimage$/i.test(mainMsg[0]): {
            rply.text = await imageAi.handleImageAi(inputStr);
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]): {
            const mode = mainMsg[0].includes('4') ? GPT4 : GPT3;
            if (mode === GPT4) {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
            }
            rply.text = await chatAi.handleChatAi(inputStr, mode, userid);
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
        this.watchEnvironment();
        this.configuration = {
            apiKey: this.apiKeys[0]?.apiKey,
            baseURL: this.apiKeys[0]?.baseURL,
        };
        this.model = process.env.OPENAI_MODEL || "gpt-4";
        if (this.apiKeys.length === 0) return;
        this.openai = new OpenAIApi(this.configuration);
        this.currentApiKeyIndex = 0;
        this.errorCount = 0;
    }
    addApiKey() {
        this.apiKeys = [];
        let base = 0;
        for (let index = 1; index < 100; index++) {
            if (index % 10 === 0) base++;
            if (!process.env[`OPENAI_SECRET_${index}`]) continue;
            this.apiKeys.push({
                apiKey: process.env[`OPENAI_SECRET_${index}`],
                baseURL: process.env[`OPENAI_BASEPATH_${base}1_${base + 1}0`]
                    || process.env.OPENAI_BASEPATH
                    || 'https://api.openai.com/v1'
            });
        }
    }
    watchEnvironment() {
        fs2.watch('.env', (eventType, filename) => {
            if (eventType === 'change') {
                let tempEnv = dotenv.config({ override: true })
                process.env = tempEnv.parsed;
                console.log('.env Changed')
                this.currentApiKeyIndex = 0;
                this.errorCount = 0;
                this.addApiKey();
                if (this.apiKeys.length === 0) return;
                this.openai = new OpenAIApi({
                    apiKey: this.apiKeys[0]?.apiKey,
                    baseURL: this.apiKeys[0]?.baseURL,
                });
            }
        });
    }
    handleError(error) {
        this.errorCount++;
        if (error.status === 401) {
            console.error('remove api key 401', this.apiKeys[this.currentApiKeyIndex])
            this.apiKeys.splice(this.currentApiKeyIndex, 1);
            this.currentApiKeyIndex--;
            this.errorCount--;
        }
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
        this.openai = new OpenAIApi({
            apiKey: this.apiKeys[this.currentApiKeyIndex].apiKey,
            baseURL: this.apiKeys[this.currentApiKeyIndex].baseURL,
        });
    }
    wait(minutes = 1) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, minutes * 60 * 1000); // 1 minute = 60 seconds * 1000 milliseconds
        });
    }
}

class ImageAi extends OpenAI {
    constructor() {
        super();
    }
    async handleImageAi(inputStr) {
        let input = inputStr.replace(/^\.aimage/i, '');
        try {
            let response = await this.openai.images.generate({
                "prompt": `${input}`,
                "n": 1,
                "size": "1024x1024"

            })
            response = await this.handleImage(response, input)
            // if (response?.data?.error) return '可能是輸入太長了，或是有不支援的字元，請重新輸入'
            this.errorCount = 0;
            return response;
        } catch (error) {
            if (this.errorCount < (this.apiKeys.length * 5)) {
                await super.handleError(error);
                return await this.handleImageAi(inputStr);
            } else {
                this.errorCount = 0;
                if (error instanceof OpenAIApi.APIError) {
                    return 'AI error: ' + error.status + `.\n ${inputStr.replace(/^\.aimage/i, '')}`;
                } else {
                    return 'AI error ' + `.\n ${inputStr.replace(/^\.aimage/i, '')}`;
                }
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
        let textLength = 0;
        str = str.replace(/^\s*\.ait\d?\s*/i, '');
        if (str.length > 0) {
            text.push(str);
            textLength += str.length;
        }
        if (discordMessage?.type === 0 && discordMessage?.attachments?.size > 0) {
            const url = Array.from(discordMessage.attachments.filter(data => data.contentType.match(/text/i))?.values());
            for (let index = 0; index < url.length; index++) {
                const response = await fetch(url[index].url);
                const data = await response.text();
                text.push(data);
                textLength += data.length;
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
                textLength += data.length;
            }
        }


        let result = this.splitStringByLength(text.join('\n'), splitLength);

        return { translateScript: result, textLength };

    }
    async createFile(data) {
        try {
            const d = new Date();
            let time = d.getTime();
            let name = `translated_${time}.txt`
            await fs.writeFile(`./temp/${name}`, data, { encoding: 'utf8' });
            return `./temp/${name}`;
        } catch (err) {
            console.error(err);
        }
    }
    async translateChat(inputStr, mode) {
        try {
            let response = await this.openai.chat.completions.create({
                "model": mode,
                "messages": [
                    {
                        "role": "system",
                        "content": "你叫HKTRPG TRPG助手。你的責任是把所有輸入的內容翻譯成正體中文。名詞表: KEEPERS=KP，INVESTIGATORS為調查員，ROLL是擲骰。GAME MASTER是GM。劇本是模組。日文漢字人名不需翻譯。"
                    },
                    {
                        "role": "user",
                        "content": `${inputStr}\n\n`
                    }
                ]

            })
            this.errorCount = 0;
            if (response.status === 200 && (typeof response.data === 'string' || response.data instanceof String)) {
                const dataStr = response.data;
                const dataArray = dataStr.split('\n\n').filter(Boolean); // 將字符串分割成數組
                const parsedData = [];

                dataArray.forEach((str) => {
                    const obj = JSON.parse(str.substring(6)); // 將子字符串轉換為對象
                    parsedData.push(obj);
                });
                const contents = parsedData.map((obj) => obj.choices[0].delta.content);
                const mergedContent = contents.join('');
                return mergedContent;
            }
            return response.choices[0].message.content;
        } catch (error) {
            if (this.errorCount < (this.apiKeys.length * 5)) {
                if (((this.errorCount !== 0) && this.errorCount % this.apiKeys.length) === 0) {
                    await super.wait(2);
                }
                await super.handleError(error);
                return await this.translateChat(inputStr, mode);
            } else {
                this.errorCount = 0;
                if (error instanceof OpenAIApi.APIError) {
                    return 'AI error: ' + error.status + `.\n ${inputStr.replace(/^\.ait\d?/i, '')}`;
                } else {
                    return 'AI error ' + `.\n ${inputStr.replace(/^\.ait\d?/i, '')}`;
                }
            }
        }
    }
    async translateText(translateScript, mode) {
        let response = [];
        for (let index = 0; index < translateScript.length; index++) {
            let result = await this.translateChat(translateScript[index], mode);
            response.push(result);
        }
        return response;

    }
    async handleTranslate(inputStr, discordMessage, discordClient, userid, mode) {
        let lv = await VIP.viplevelCheckUser(userid);
        if (mode === GPT4 && lv < 1) return { text: `GPT-4是實驗功能，現在只有VIP才能使用，\n支援HKTRPG及升級請到\nhttps://www.patreon.com/hktrpg` };
        let limit = TRANSLATE_LIMIT_PERSONAL[lv];
        let { translateScript, textLength } = await this.getText(inputStr, discordMessage, discordClient);
        if (textLength > limit) return { text: `輸入的文字太多了，請分批輸入，你是VIP LV${lv}，限制為${limit}字` };
        let response = await this.translateText(translateScript, mode);
        response = response.join('\n');
        if (textLength > 1900) {
            let sendfile = await this.createFile(response);
            return { fileText: '輸出的文字太多了，請看附件', sendfile };
        }
        return { text: response }

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
                let lineSplit = line.split(`/.{1,${length}}/g`);
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
                (result[currentLine] === undefined) ? result[currentLine] = line + '\n' : result[currentLine] += line + '\n';
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
    async handleChatAi(inputStr, mode, userid) {
        try {
            let response = await this.openai.chat.completions.create({
                "model": mode,
                "messages": [
                    {
                        "role": "system",
                        "content": "你的責任是把以正體中文回答所有問題.你現在叫HKTRPG TRPG助手。"
                    },
                    {
                        "role": "user",
                        "content": `${inputStr.replace(/^\.ai\d?/i, '')}`
                    }
                ]

            })
            this.errorCount = 0;

            if (response.status === 200 && (typeof response.data === 'string' || response.data instanceof String)) {
                const dataStr = response.data;
                const dataArray = dataStr.split('\n\n').filter(Boolean); // 將字符串分割成數組
                const parsedData = [];
                dataArray.forEach((str) => {
                    const obj = JSON.parse(str.substring(6)); // 將子字符串轉換為對象
                    parsedData.push(obj);
                });
                const contents = parsedData.map((obj) => obj.choices[0].delta.content);
                const mergedContent = contents.join('');
                return mergedContent;
            }
            return response.choices[0].message.content;
        } catch (error) {
            if (this.errorCount < (this.apiKeys.length * 5)) {
                await super.handleError(error);
                return await this.handleChatAi(inputStr);
            } else {
                this.errorCount = 0;
                if (error instanceof OpenAIApi.APIError) {
                    return 'AI error: ' + error.status + `.\n ${inputStr.replace(/^\.ai\d?/i, '')}`;
                } else {
                    return 'AI error ' + `.\n ${inputStr.replace(/^\.ai\d?/i, '')}`;
                }

            }
        }
    }
}

const openai = new OpenAI();
const chatAi = new ChatAi();
const imageAi = new ImageAi();
const translateAi = new TranslateAi();


