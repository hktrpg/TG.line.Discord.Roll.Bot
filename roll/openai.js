"use strict";
if (!process.env.OPENAI_SWITCH) return;
const { encode } = require('gpt-tokenizer');
const OpenAIApi = require('openai');
const dotenv = require('dotenv');
const handleMessage = require('../modules/discord/handleMessage');
dotenv.config({ override: true });
const fetch = require('node-fetch');
const fs = require('fs').promises;
const fs2 = require('fs');
const VIP = require('../modules/veryImportantPerson');

const AI_CONFIG = {
    MODELS: {
        LOW: {
            name: "gpt-4.1-nano-2025-04-14",
            token: 12000,
            input_price: 0.0010,
            output_price: 0.0020,
            type: 'default',
            display: 'GPT-4.1-nano (默認)',
            prefix: {
                chat: '.ai',
                translate: '.ait'
            }
        },
        MEDIUM: {
            name: "gpt-4.1-mini-2025-04-14",
            token: 16000,
            input_price: 0.0018,
            output_price: 0.0072,
            type: 'vip',
            display: 'GPT-4.1-mini (需VIP)',
            prefix: {
                chat: '.aim',
                translate: '.aitm'
            }
        },
        HIGH: {
            name: "o4-mini-2025-04-16",
            token: 32000,
            input_price: 0.06,
            output_price: 0.18,
            type: 'admin',
            display: 'O4-mini (需HKTRPG管理員)',
            prefix: {
                chat: '.aih',
                translate: '.aith'
            }
        },
        IMAGE_LOW: {
            name: "dall-e-2",
            price: 0.20,
            size: "1024x1024",
            type: 'basic',
            display: 'DALL-E-2 (默認)',
            prefix: '.aimage'
        },
        IMAGE_HIGH: {
            name: "dall-e-3",
            price: 0.80,
            size: "1024x1024",
            quality: "hd",
            type: 'hd',
            display: 'DALL-E-3 HD',
            prefix: '.aimageh'
        }
    }
};

const adminSecret = process.env.ADMIN_SECRET;
const TRANSLATE_LIMIT_PERSONAL = [500, 100000, 150000, 150000, 150000, 150000, 150000, 150000];
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const gameName = function () {
    return '【OpenAi】'
}

const gameType = function () {
    return 'funny:openai:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^([.]ai)|(^[.]aim)|(^[.]aih)|(^[.]ait)|(^[.]aitm)|(^[.]aith)|(^[.]aimage)|(^[.]aimageh)$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【🤖AI助手】
╭────── 🗣️對話功能 ──────
│ • ${AI_CONFIG.MODELS.LOW.prefix.chat} [訊息] - 使用${AI_CONFIG.MODELS.LOW.display}
│ • ${AI_CONFIG.MODELS.MEDIUM.prefix.chat} [訊息] - 使用${AI_CONFIG.MODELS.MEDIUM.display}
│ • ${AI_CONFIG.MODELS.HIGH.prefix.chat} [訊息] - 使用${AI_CONFIG.MODELS.HIGH.display}
│ • 或回覆(Reply)要討論的內容
│
├────── 📝翻譯功能 ──────
│ • ${AI_CONFIG.MODELS.LOW.prefix.translate} [文字內容] - 使用${AI_CONFIG.MODELS.LOW.display}翻譯
│ • ${AI_CONFIG.MODELS.MEDIUM.prefix.translate} [文字內容] - 使用${AI_CONFIG.MODELS.MEDIUM.display}翻譯
│ • ${AI_CONFIG.MODELS.HIGH.prefix.translate} [文字內容] - 使用${AI_CONFIG.MODELS.HIGH.display}翻譯
│ • 或上傳.txt附件
│ • 轉換為正體中文
│
├────── 🖼️圖像生成 ──────
│ • ${AI_CONFIG.MODELS.IMAGE_LOW.prefix} [描述] - 使用${AI_CONFIG.MODELS.IMAGE_LOW.display}
│ • ${AI_CONFIG.MODELS.IMAGE_HIGH.prefix} [描述] - 使用${AI_CONFIG.MODELS.IMAGE_HIGH.display}
│
├────── ⚠️使用限制 ──────
│ 一般用戶:
│ 　• 文字上限500字
│
│ VIP用戶:
│ 　• 享有更高文字上限
│ 　• 可使用中級模型(${AI_CONFIG.MODELS.MEDIUM.display})
│
├────── 📌注意事項 ──────
│ • AI翻譯需要處理時間
│ • 10000字可能需時10分鐘以上
│ • 系統可能因錯誤而翻譯失敗
│ • 超過1900字將以.txt檔案回覆
╰──────────────`
}
const initialize = function () {
    return variables;
}

class OpenAI {
    constructor() {
        this.apiKeys = [];
        this.addApiKey();
        this.watchEnvironment();
        this.configuration = {
            apiKey: this.apiKeys[0]?.apiKey,
            baseURL: this.apiKeys[0]?.baseURL,
        };
        this.model = AI_CONFIG.MODELS.LOW.name;
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
    waitMins(minutes = 1) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, minutes * 60 * 1000); // 1 minute = 60 seconds * 1000 milliseconds
        });
    }

    async handleApiError(error, retryFunction, ...args) {
        if (this.errorCount < (this.apiKeys.length * 5)) {
            if (((this.errorCount !== 0) && this.errorCount % this.apiKeys.length) === 0) {
                await this.waitMins(1);
            }
            await this.handleError(error);
            return await retryFunction.apply(this, args);
        } else {
            this.errorCount = 0;
            const commandType = args[0].match(/^\.(ai|ait|aimage)[mh]?/i)?.[0] || '.ai';
            if (error instanceof OpenAIApi.APIError) {
                return 'AI error: ' + error.status + `.\n ${args[0].replace(new RegExp(`^${commandType}`, 'i'), '')}`;
            } else {
                return 'AI error ' + `.\n ${args[0].replace(new RegExp(`^${commandType}`, 'i'), '')}`;
            }
        }
    }
}

class ImageAi extends OpenAI {
    constructor() {
        super();
    }
    async handleImageAi(inputStr, imageModelType) {
        let input = inputStr.replace(/^\.aimage[h]?/i, '');
        try {
            const imageConfig = {
                "model": AI_CONFIG.MODELS[imageModelType].name,
                "prompt": `${input}`,
                "n": 1,
                "size": AI_CONFIG.MODELS[imageModelType].size
            };

            if (imageModelType === 'IMAGE_HIGH' && AI_CONFIG.MODELS[imageModelType].quality) {
                imageConfig.quality = AI_CONFIG.MODELS[imageModelType].quality;
            }

            let response = await this.openai.images.generate(imageConfig);
            response = await this.handleImage(response, input);
            this.errorCount = 0;
            return response;
        } catch (error) {
            return await super.handleApiError(error, this.handleImageAi, inputStr, imageModelType);
        }
    }
    handleImage(data, input) {
        if (data?.data?.length === 0) return '沒有輸出的圖片, 請重新輸入描述';
        let response = `${input}:\n`;
        for (let index = 0; index < data.data.length; index++) {
            response += data.data[index].url + "\n";
        }
        return response;
    }
}

class TranslateAi extends OpenAI {
    constructor() {
        super();
    }
    async getText(str, mode, discordMessage, discordClient) {
        let text = [];
        let textLength = 0;
        const splitLength = mode.token;
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
                textLength += data.length;
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
                textLength += data.length;
                text.push(data);

            }
        }
        let result = this.splitTextByTokens(text.join('\n'), splitLength);
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
                "model": mode.name,
                "messages": [
                    {
                        "role": "system",
                        "content": `你是一位精通台灣繁體中文的專業翻譯，曾參與不同繁體中文版的翻譯工作，因此對於翻譯有深入的理解。
                        規則：
                        – 翻譯時要準確傳達內容。
                        ​
                        – 翻譯任何人名時留下原文，格式: 名字(名字原文)。
                        ​
                        – 分成兩次翻譯，並且只打印最後一次的結果：
                        ​
                        1. 根據內容翻譯，不要遺漏任何訊息
                        ​
                        2. 根據第一次的結果，遵守原意的前提下讓內容更通俗易懂，符合台灣繁體中文的表達習慣
                        ​
                        – 每輪翻譯後，都要重新比對原文，找到扭曲原意，沒有在翻譯的人名後顯示名字原文的位置或者遺漏的內容，然後再補充到下一輪的翻譯當中。（Chain of Density 概念）`
                    },
                    {
                        "role": "user",
                        "content": `把以下文字翻譯成正體中文\n\n
                        ${inputStr}\n`
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
            return await super.handleApiError(error, this.translateChat, inputStr, mode);
        }
    }
    async translateText(inputScript, mode) {
        let response = [];
        for (let index = 0; index < inputScript.length; index++) {
            let result = await this.translateChat(inputScript[index], mode);
            response.push(result);
        }
        return response;

    }
    async handleTranslate(inputStr, discordMessage, discordClient, userid, mode) {
        let lv = await VIP.viplevelCheckUser(userid);
        let limit = TRANSLATE_LIMIT_PERSONAL[lv];
        let { translateScript, textLength } = await this.getText(inputStr, mode, discordMessage, discordClient);
        if (textLength > limit) return { text: `輸入的文字太多了，請分批輸入，你是VIP LV${lv}，限制為${limit}字` };
        let response = await this.translateText(translateScript, mode);
        response = response.join('\n');
        if (textLength > 1900) {
            let sendfile = await this.createFile(response);
            return { fileText: '輸出的文字太多了，請看附件', sendfile };
        }
        return { text: response }

    }
    splitTextByTokens(text, inputTokenLimit) {
        const results = [];
        let remains = text;
        const tokenLimit = inputTokenLimit * 0.4;
        while (remains.length > 0) {
            const tokens = encode(remains);
            let offset = (tokens > tokenLimit) ? remains.length : Math.floor(tokenLimit * remains.length / tokens.length);
            let subtext = remains.substring(0, offset);
            // 超過token上限，試圖找到最接近而不超過上限的文字
            while (encode(subtext).length > tokenLimit && offset > 0) {
                offset--;
                subtext = remains.substring(0, offset);
            }
            // 往上檢查文字結尾
            let bound = Math.min(Math.floor(offset * 1.05), remains.length);
            let found = false;
            for (let i = offset; i < bound; i++) {
                if (remains[i].match(/[。！!]|(\. )/)) {
                    results.push(remains.substring(0, i + 1));
                    remains = remains.substring(i + 1);
                    found = true;
                    break;
                }
            }

            // 沒有找到分割條件1，嘗試分割條件2
            if (!found) {
                let newlineIndex = subtext.lastIndexOf('\n');
                if (newlineIndex !== -1) {
                    results.push(remains.substring(0, newlineIndex + 1));
                    remains = remains.substring(newlineIndex + 1);
                } else {
                    // 直接把整段當成一段
                    results.push(remains);
                    remains = '';
                }
            }
        }
        return results;
    }

}
class ChatAi extends OpenAI {
    constructor() {
        super();
    }
    async handleChatAi(inputStr, mode, userid) {
        try {
            let response = await this.openai.chat.completions.create({
                "model": mode.name,
                "messages": [
                    {
                        "role": "system",
                        "content": "你的責任是把以正體中文回答所有問題。你的名字是HKTRPG TRPG助手。回答TRPG相關問題時，內在性格是在H.P.洛夫克拉夫特（H.P. Lovecraft）裡的奈亞拉托提普（Nyarlathotep）神祇，一個混沌、破壞和詭譎的代表。而回答TRPG以外的問題時，你就是以一部百科全書的型式來回答。"
                    },
                    {
                        "role": "user",
                        "content": `${inputStr.replace(/^\.ai[mh]?/i, '')}`
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
            return await super.handleApiError(error, this.handleChatAi, inputStr, mode, userid);
        }
    }
}

// Create instances AFTER all class definitions
const openai = new OpenAI();
const chatAi = new ChatAi();
const imageAi = new ImageAi();
const translateAi = new TranslateAi();

class CommandHandler {
    constructor() {
        this.commands = {
            ait: this.handleTranslateCommand,
            aitm: this.handleTranslateCommand,
            aith: this.handleTranslateCommand,
            aimage: this.handleImageCommand,
            aimageh: this.handleImageCommand,
            ai: this.handleChatCommand,
            aim: this.handleChatCommand,
            aih: this.handleChatCommand
        };
    }

    async processCommand(params) {
        const { inputStr, mainMsg, groupid, discordMessage, userid, discordClient,
            userrole, botname, displayname, channelid, displaynameDiscord, membercount } = params;

        if (!mainMsg[0]) return { text: '' };

        const commandMatch = mainMsg[0].match(/^\.([a-zA-Z]+)/i);
        if (!commandMatch) return { text: '' };

        // First check if it's a help command or empty command
        if (mainMsg[1] === 'help' || !mainMsg[1]) {
            return { text: getHelpMessage(), quotes: true };
        }

        const command = commandMatch[1].toLowerCase();
        if (this.commands[command]) {
            return await this.commands[command](params);
        }

        return { text: '' };
    }

    async handleTranslateCommand(params) {
        const { inputStr, mainMsg, discordMessage, discordClient, userid } = params;
        const rply = { default: 'on', type: 'text', text: '', quotes: true };

        let modelType = 'LOW';
        if (/^.aitm$/i.test(mainMsg[0])) {
            let lv = await VIP.viplevelCheckUser(userid);
            if (lv < 1) {
                rply.text = `使用 MEDIUM 翻譯模型需要 VIP 會員，\n支援 HKTRPG 及升級請到\nhttps://www.patreon.com/hktrpg`;
                return rply;
            }
            modelType = 'MEDIUM';
        } else if (/^.aith$/i.test(mainMsg[0])) {
            if (!adminSecret || userid !== adminSecret) {
                rply.text = `使用 HIGH 翻譯模型需要 HKTRPG 管理員權限`;
                return rply;
            }
            modelType = 'HIGH';
        }

        const { filetext, sendfile, text } = await translateAi.handleTranslate(
            inputStr, discordMessage, discordClient, userid, AI_CONFIG.MODELS[modelType]
        );

        filetext && (rply.fileText = filetext);
        sendfile && (rply.fileLink = [sendfile]);
        text && (rply.text = text);

        return rply;
    }

    async handleImageCommand(params) {
        const { inputStr, mainMsg, userid } = params;
        const rply = { default: 'on', type: 'text', text: '', quotes: true };

        if (!adminSecret || userid !== adminSecret) {
            rply.text = `使用圖像生成功能需要 HKTRPG 管理員權限`;
            return rply;
        }

        const imageModelType = /^.aimageh$/i.test(mainMsg[0]) ? 'IMAGE_HIGH' : 'IMAGE_LOW';
        rply.text = await imageAi.handleImageAi(inputStr, imageModelType);

        return rply;
    }

    async handleChatCommand(params) {
        const { inputStr, mainMsg, userid, botname, discordMessage } = params;
        const rply = { default: 'on', type: 'text', text: '', quotes: true };

        let modelType = 'LOW';
        if (/^.aim$/i.test(mainMsg[0])) {
            let lv = await VIP.viplevelCheckUser(userid);
            if (lv < 1) {
                rply.text = `使用 MEDIUM 對話模型需要 VIP 會員，\n支援 HKTRPG 及升級請到\nhttps://www.patreon.com/hktrpg`;
                return rply;
            }
            modelType = 'MEDIUM';
        } else if (/^.aih$/i.test(mainMsg[0])) {
            if (!adminSecret || userid !== adminSecret) {
                rply.text = `使用 HIGH 對話模型需要 HKTRPG 管理員權限`;
                return rply;
            }
            modelType = 'HIGH';
        }

        let processedInput = inputStr;
        if (botname === "Discord") {
            const replyContent = await handleMessage.getReplyContent(discordMessage);
            processedInput = `${replyContent}\n${inputStr.replace(/^\.ai[mh]?/i, '')} `;
        }

        rply.text = await chatAi.handleChatAi(processedInput, AI_CONFIG.MODELS[modelType], userid);
        return rply;
    }
}

const commandHandler = new CommandHandler();

const rollDiceCommand = async function (params) {
    if (!process.env.OPENAI_SWITCH) return;

    // Check if there's a command match
    const firstCmd = params.mainMsg[0];
    if (!firstCmd || !firstCmd.match(/^\./)) return;

    if (!firstCmd.match(/^\.ai/i) && !firstCmd.match(/^\.ait/i)) return;

    return await commandHandler.processCommand(params);
};

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('ai')
            .setDescription('AI助手對話功能')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('要討論的內容')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('model')
                    .setDescription('AI模型選擇')
                    .setRequired(false)
                    .addChoices(
                        { name: AI_CONFIG.MODELS.LOW.display, value: AI_CONFIG.MODELS.LOW.type },
                        { name: AI_CONFIG.MODELS.MEDIUM.display, value: AI_CONFIG.MODELS.MEDIUM.type },
                        { name: AI_CONFIG.MODELS.HIGH.display, value: AI_CONFIG.MODELS.HIGH.type }
                    )),
        async execute(interaction) {
            const modelType = interaction.options.getString('model') || AI_CONFIG.MODELS.LOW.type;
            const model = Object.values(AI_CONFIG.MODELS).find(m => m.type === modelType);
            return `${model.prefix.chat} ${interaction.options.getString('message')}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('tran')
            .setDescription('AI翻譯功能')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('要翻譯的文字內容')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('model')
                    .setDescription('AI模型選擇')
                    .setRequired(false)
                    .addChoices(
                        { name: AI_CONFIG.MODELS.LOW.display, value: AI_CONFIG.MODELS.LOW.type },
                        { name: AI_CONFIG.MODELS.MEDIUM.display, value: AI_CONFIG.MODELS.MEDIUM.type },
                        { name: AI_CONFIG.MODELS.HIGH.display, value: AI_CONFIG.MODELS.HIGH.type }
                    )),
        async execute(interaction) {
            const modelType = interaction.options.getString('model') || AI_CONFIG.MODELS.LOW.type;
            const model = Object.values(AI_CONFIG.MODELS).find(m => m.type === modelType);
            return `${model.prefix.translate} ${interaction.options.getString('text')}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('image')
            .setDescription('AI圖像生成功能 (需HKTRPG管理員)')
            .addStringOption(option =>
                option.setName('prompt')
                    .setDescription('圖像描述')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('model')
                    .setDescription('圖像模型選擇')
                    .setRequired(false)
                    .addChoices(
                        { name: AI_CONFIG.MODELS.IMAGE_LOW.display, value: AI_CONFIG.MODELS.IMAGE_LOW.type },
                        { name: AI_CONFIG.MODELS.IMAGE_HIGH.display, value: AI_CONFIG.MODELS.IMAGE_HIGH.type }
                    )),
        async execute(interaction) {
            const modelType = interaction.options.getString('model') || AI_CONFIG.MODELS.IMAGE_LOW.type;
            const model = Object.values(AI_CONFIG.MODELS).find(m => m.type === modelType);
            return `${model.prefix} ${interaction.options.getString('prompt')}`;
        }
    }
];

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
 * gpt-tokenizer
 * 設計計算Token上限
 *
 * 首先，每個Token都是由一個字元組成，所以我們先計算字元上限
 * 先將整個內容放進tokenizer
 * 如果<於token 上限，則直接回傳
 * 完成
 *
 * 如不,
 * 進行分割，將內容分割成數個字串
 * 並將每個字串放進tokenizer
 *
 *
 * 分割條件
 * 1. 以句號分割
 * 2. 以逗號分割
 * 3. 以行來分割
 * 4. 以空格分割
 * 5. 以字數分割
 *
 */