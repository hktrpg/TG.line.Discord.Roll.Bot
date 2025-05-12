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
const GPT3 = { name: "gpt-4o-mini", token: 12000, input_price: 0.0018, output_price: 0.0072 };
const GPT4 = { name: "gpt-4o", token: 16000, input_price: 0.06, output_price: 0.18 };
const DALLE3 = { name: "dall-e-2", price: 0.20, size1: "1024x1024", size2: "512×512" };
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
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^([.]ai)|(^[.]aimage)|(^[.]ait)|(^[.]ai4)|(^[.]ait4)|(^[.]doc)$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【🤖OpenAI助手】
╭────── 🗣️對話功能 ──────
│ • .ai [訊息]
│ • 或回覆(Reply)要討論的內容
│ • 使用gpt-4o-mini模型
│
├────── 📝翻譯功能 ──────
│ • .ait [文字內容]
│ • 或上傳.txt附件
│ • 使用gpt-4o-mini進行翻譯
│ • 轉換為正體中文
│
├────── 📄文件分析功能 ──────
│ • .doc [檔案]
│ • 上傳文件(PDF、DOCX等)
│ • 分析並轉換文件格式
│ • 支援匯出為JSON、Markdown等
│
├────── ⚠️使用限制 ──────
│ 一般用戶:
│ 　• 文字上限500字
│
│ VIP用戶:
│ 　• 享有更高文字上限
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
        case /^.doc/i.test(mainMsg[0]): {
            if (!adminSecret) return rply;
            if (userid !== adminSecret) return rply;
            let lv = await VIP.viplevelCheckUser(userid);
            if (lv < 1) {
                rply.text = `這是實驗功能，現在只有VIP才能使用，\n支援HKTRPG及升級請到\nhttps://www.patreon.com/hktrpg`
                return rply;
            }
            
            rply.text = await doclingHandler.handleDocument(inputStr, discordMessage, discordClient);
            rply.quotes = true;
            return rply;
        }
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
            if (!adminSecret) return rply;
            if (userid !== adminSecret) return rply;
            let lv = await VIP.viplevelCheckUser(userid);
            if (lv < 1) {
                rply.text = `這是實驗功能，現在只有VIP才能使用，\n支援HKTRPG及升級請到\nhttps://www.patreon.com/hktrpg`
                return rply;
            }

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
            if (botname === "Discord") {

                const replyContent = await handleMessage.getReplyContent(discordMessage);
                inputStr = `${replyContent}\n${inputStr.replace(/^\.ai\d?/i, '')} `;
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

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('ai')
            .setDescription('OpenAI助手對話功能')
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('要討論的內容')
                    .setRequired(true)),
        async execute(interaction) {
            return `.ai ${interaction.options.getString('message')}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('tran')
            .setDescription('OpenAI翻譯功能')
            .addStringOption(option => 
                option.setName('text')
                    .setDescription('要翻譯的文字內容')
                    .setRequired(true)),
        async execute(interaction) {
            return `.ait ${interaction.options.getString('text')}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('doc')
            .setDescription('使用Docling分析文件')
            .addAttachmentOption(option => 
                option.setName('file')
                    .setDescription('要分析的文件 (PDF, DOCX, PPTX等)')
                    .setRequired(true)),
        async execute(interaction) {
            if (interaction.options.getAttachment('file')) {
                return `.doc 分析附件文件`;
            } else {
                return `.doc`;
            }
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


class OpenAI {
    constructor() {
        this.apiKeys = [];
        this.addApiKey();
        this.watchEnvironment();
        this.configuration = {
            apiKey: this.apiKeys[0]?.apiKey,
            baseURL: this.apiKeys[0]?.baseURL,
        };
        this.model = GPT3.name;
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
}

class ImageAi extends OpenAI {
    constructor() {
        super();
    }
    async handleImageAi(inputStr) {
        let input = inputStr.replace(/^\.aimage/i, '');
        try {
            let response = await this.openai.images.generate({
                "model": DALLE3.name,
                "prompt": `${input}`,
                "n": 1,
                "size": DALLE3.size1,

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
            
            // Check for document files that could be processed by Docling
            const docAttachments = Array.from(discordMessage.attachments.filter(data => 
                data.contentType?.includes('application/pdf') || 
                data.contentType?.includes('application/vnd.openxmlformats-officedocument')
            )?.values());
            
            // Process text files as before
            for (let index = 0; index < url.length; index++) {
                const response = await fetch(url[index].url);
                const data = await response.text();
                textLength += data.length;
                text.push(data);
            }
            
            // Try to process document files with Docling if available
            if (docAttachments.length > 0) {
                try {
                    // Create a temporary directory
                    const tempDir = `./docling/temp_translate_${Date.now()}`;
                    if (!fs2.existsSync(tempDir)) {
                        fs2.mkdirSync(tempDir, { recursive: true });
                    }
                    
                    for (let index = 0; index < docAttachments.length; index++) {
                        const attachment = docAttachments[index];
                        const filePath = `${tempDir}/${attachment.name}`;
                        
                        // Download the file
                        const fileResponse = await fetch(attachment.url);
                        const fileBuffer = await fileResponse.arrayBuffer();
                        await fs.writeFile(filePath, Buffer.from(fileBuffer));
                        
                        // Process with Docling via Python script
                        const outputDir = `${tempDir}/output`;
                        const { spawn } = require('child_process');
                        const pythonExec = process.env.PYTHON_PATH || 'python';
                        
                        // Create promise to handle Python process
                        const doclingResult = await new Promise((resolve, reject) => {
                            const pythonProcess = spawn(pythonExec, [
                                `./docling/doc_processor.py`,
                                filePath,
                                outputDir,
                                'text'
                            ]);
                            
                            let output = '';
                            let errorOutput = '';
                            
                            pythonProcess.stdout.on('data', (data) => {
                                output += data.toString();
                            });
                            
                            pythonProcess.stderr.on('data', (data) => {
                                errorOutput += data.toString();
                            });
                            
                            pythonProcess.on('close', (code) => {
                                if (code !== 0) {
                                    console.error(`Python process exited with code ${code}`);
                                    resolve(null); // Return null on error
                                    return;
                                }
                                
                                try {
                                    // Parse Python output
                                    const result = JSON.parse(output);
                                    resolve(result);
                                } catch (err) {
                                    console.error('Error parsing Python output:', err);
                                    resolve(null);
                                }
                            });
                        });
                        
                        // If Docling processing was successful, add the text to the array
                        if (doclingResult?.success && doclingResult.outputs?.text) {
                            const extractedText = doclingResult.outputs.text;
                            text.push(`[來自文件: ${attachment.name}]\n${extractedText}`);
                            textLength += extractedText.length;
                        }
                    }
                } catch (error) {
                    console.error('Error processing document with Docling:', error);
                    // Continue without Docling if there's an error
                }
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
            if (this.errorCount < (this.apiKeys.length * 5)) {
                if (((this.errorCount !== 0) && this.errorCount % this.apiKeys.length) === 0) {
                    await super.waitMins(1);
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

class DoclingHandler {
    constructor() {
        this.isEnabled = process.env.DOCLING_ENABLED === 'true';
        this.pythonExec = process.env.PYTHON_PATH || 'python';
        this.workingDir = './docling';
        
        if (this.isEnabled) {
            console.log('Docling document processing enabled');
            this.setupFiles();
        } else {
            console.log('Docling document processing disabled. Set DOCLING_ENABLED=true in .env to enable');
        }
    }

    async setupFiles() {
        try {
            // Create docling directory if it doesn't exist
            if (!fs2.existsSync(this.workingDir)) {
                fs2.mkdirSync(this.workingDir, { recursive: true });
                console.log('Created docling directory');
            }
            
            // Create Python script
            await this.createPythonScript();
            
            // Create requirements.txt
            await this.createRequirementsFile();
            
            // Install dependencies if needed (commented out for safety)
            // await this.installDependencies();
        } catch (error) {
            console.error('Error setting up Docling:', error);
        }
    }

    async createPythonScript() {
        const scriptPath = `${this.workingDir}/doc_processor.py`;
        const scriptContent = `
import sys
import json
import os
from pathlib import Path
import traceback

# Check if docling is installed
try:
    from docling.document_converter import DocumentConverter
    from docling.datamodel.base_models import InputFormat
    from docling_core.transforms.chunker import HierarchicalChunker
except ImportError:
    print(json.dumps({
        "error": "Docling not installed. Please run 'pip install docling' first."
    }))
    sys.exit(1)

def process_document(file_path, output_dir, formats=None):
    """Process document with Docling"""
    try:
        # Set default formats if not provided
        if not formats:
            formats = ["text", "markdown", "json"]
        
        # Create output directory if not exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize converter
        converter = DocumentConverter()
        
        # Convert document
        result = converter.convert(file_path)
        document = result.document
        
        # Process outputs based on requested formats
        outputs = {}
        file_name = Path(file_path).stem
        
        # Generate and save outputs
        if "text" in formats:
            text_content = document.export_to_text()
            outputs["text"] = text_content
            text_path = Path(output_dir) / f"{file_name}.txt"
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(text_content)
            outputs["text_path"] = str(text_path)
        
        if "html" in formats:
            html_content = document.export_to_html()
            html_path = Path(output_dir) / f"{file_name}.html"
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            outputs["html_path"] = str(html_path)
        
        if "markdown" in formats:
            md_content = document.export_to_markdown()
            outputs["markdown"] = md_content
            md_path = Path(output_dir) / f"{file_name}.md"
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            outputs["markdown_path"] = str(md_path)
        
        if "json" in formats:
            json_content = document.export_to_dict()
            json_path = Path(output_dir) / f"{file_name}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(json_content, f, ensure_ascii=False, indent=2)
            outputs["json_path"] = str(json_path)
            
        # Generate chunks for RAG if requested
        if "chunks" in formats:
            chunks = list(HierarchicalChunker().chunk(document))
            chunks_text = [chunk.text for chunk in chunks]
            outputs["chunks"] = chunks_text
            chunks_path = Path(output_dir) / f"{file_name}_chunks.json"
            with open(chunks_path, "w", encoding="utf-8") as f:
                json.dump(chunks_text, f, ensure_ascii=False, indent=2)
            outputs["chunks_path"] = str(chunks_path)
        
        # Add metadata about the document
        outputs["metadata"] = {
            "title": getattr(document, "title", file_name),
            "page_count": getattr(document, "page_count", 1),
            "format": str(result.format)
        }
        
        return {
            "success": True,
            "outputs": outputs
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python doc_processor.py <file_path> <output_dir> [format1,format2,...]"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    output_dir = sys.argv[2]
    formats = sys.argv[3].split(",") if len(sys.argv) > 3 else None
    
    result = process_document(file_path, output_dir, formats)
    print(json.dumps(result, ensure_ascii=False))
`;
        
        await fs.writeFile(scriptPath, scriptContent, { encoding: 'utf8' });
        return scriptPath;
    }

    async createRequirementsFile() {
        const reqPath = `${this.workingDir}/requirements.txt`;
        const reqContent = 'docling>=2.17.0';
        await fs.writeFile(reqPath, reqContent, { encoding: 'utf8' });
        return reqPath;
    }

    async installDependencies() {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`${this.pythonExec} -m pip install -r ${this.workingDir}/requirements.txt`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error installing dependencies: ${error.message}`);
                    reject(error);
                    return;
                }
                console.log('Installed Docling dependencies');
                resolve(stdout);
            });
        });
    }

    async handleDocument(inputStr, discordMessage, discordClient) {
        if (!this.isEnabled) {
            return 'Docling文件處理功能未啟用。請在.env中設置DOCLING_ENABLED=true來啟用此功能。';
        }
        
        // Validate the Python environment before processing
        const validation = await this.validatePythonEnvironment();
        if (!validation.valid) {
            return `無法處理文件: ${validation.message}`;
        }
        
        try {
            // Check for file attachments
            if (!discordMessage?.attachments?.size) {
                return '請上傳文件進行分析（支援PDF、DOCX、PPTX、XLSX等格式）';
            }

            const { spawn } = require('child_process');
            const attachments = Array.from(discordMessage.attachments.values());
            const supportedFormats = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                                      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                      'text/html', 'text/markdown'];
            
            // Find supported attachments
            const attachment = attachments.find(a => {
                return supportedFormats.some(format => a.contentType?.includes(format));
            });
            
            if (!attachment) {
                return '不支援的文件格式。目前支援PDF、DOCX、PPTX、XLSX、HTML、Markdown等格式。';
            }
            
            // Inform user that processing has started
            if (discordMessage.channel) {
                await discordMessage.channel.send(`⏳ 開始處理文件: ${attachment.name}，這可能需要幾分鐘...`);
            }
            
            // Create temp directory for this file
            const tempDir = `${this.workingDir}/temp_${Date.now()}`;
            if (!fs2.existsSync(tempDir)) {
                fs2.mkdirSync(tempDir, { recursive: true });
            }
            
            // Download the file
            const filePath = `${tempDir}/${attachment.name}`;
            const response = await fetch(attachment.url);
            const fileBuffer = await response.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(fileBuffer));
            
            // Process with Python script
            const outputDir = `${tempDir}/output`;
            const formats = ['text', 'markdown', 'json']; // You can customize formats here
            
            return new Promise((resolve, reject) => {
                const pythonProcess = spawn(this.pythonExec, [
                    `${this.workingDir}/doc_processor.py`,
                    filePath,
                    outputDir,
                    formats.join(',')
                ]);
                
                let output = '';
                let errorOutput = '';
                
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                    console.error(`Docling Python error: ${data.toString()}`);
                });
                
                // Set a timeout in case the process hangs
                const timeoutId = setTimeout(() => {
                    pythonProcess.kill();
                    resolve(`處理文件超時。這可能是因為文件太大或格式複雜。請嘗試較小的文件。`);
                }, 5 * 60 * 1000); // 5 minutes timeout
                
                pythonProcess.on('close', async (code) => {
                    clearTimeout(timeoutId);
                    
                    try {
                        if (code !== 0) {
                            console.error(`Python process exited with code ${code}`);
                            console.error(errorOutput);
                            throw new Error(`處理文件時發生錯誤 (錯誤碼: ${code})`);
                        }
                        
                        // Parse Python output
                        let result;
                        try {
                            result = JSON.parse(output);
                        } catch (error) {
                            console.error('Error parsing Python output:', error);
                            console.error('Python output:', output);
                            throw new Error('無法解析Python輸出。這可能是因為Docling處理時出錯。');
                        }
                        
                        if (!result.success) {
                            throw new Error(`Docling處理失敗: ${result.error}`);
                        }
                        
                        // Prepare response message
                        let responseMsg = `📄 文件分析完成: ${attachment.name}\n\n`;
                        
                        // If markdown content is short enough, include it directly
                        if (result.outputs.markdown && result.outputs.markdown.length < 1500) {
                            responseMsg += `預覽內容:\n${result.outputs.markdown.substring(0, 1500)}`;
                        } else if (result.outputs.text) {
                            // Otherwise show a snippet of the text
                            responseMsg += `預覽內容:\n${result.outputs.text.substring(0, 1500)}`;
                            if (result.outputs.text.length > 1500) {
                                responseMsg += '...(更多內容請查看生成的文件)';
                            }
                        }
                        
                        responseMsg += '\n\n已生成以下格式:';
                        
                        // Create list of files to send
                        const filesToSend = [];
                        
                        if (result.outputs.text_path) {
                            responseMsg += '\n- 純文字格式 (TXT)';
                            filesToSend.push(result.outputs.text_path);
                        }
                        
                        if (result.outputs.markdown_path) {
                            responseMsg += '\n- Markdown 格式 (MD)';
                            filesToSend.push(result.outputs.markdown_path);
                        }
                        
                        if (result.outputs.json_path) {
                            responseMsg += '\n- JSON 格式';
                            filesToSend.push(result.outputs.json_path);
                        }
                        
                        // Return text response
                        resolve(responseMsg);
                        
                        // Send files separately through Discord client
                        if (filesToSend.length > 0 && discordMessage.channel) {
                            try {
                                await discordMessage.channel.send({
                                    content: `✅ ${attachment.name} 的分析結果檔案:`,
                                    files: filesToSend.map(file => ({ attachment: file, name: file.split('/').pop() }))
                                });
                            } catch (err) {
                                console.error('Error sending files:', err);
                                // Try to send files one by one if batch send fails
                                for (const file of filesToSend) {
                                    try {
                                        await discordMessage.channel.send({
                                            content: `✅ ${attachment.name} 的${file.split('.').pop()}格式分析結果:`,
                                            files: [{ attachment: file, name: file.split('/').pop() }]
                                        });
                                    } catch (fileErr) {
                                        console.error(`Error sending individual file ${file}:`, fileErr);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error processing Python result:', error);
                        resolve(`處理文件時發生錯誤: ${error.message}`);
                    } finally {
                        // Clean up temp files (optional)
                        setTimeout(() => {
                            try {
                                fs.rm(tempDir, { recursive: true, force: true })
                                    .catch(err => console.error('Error cleaning up temp files:', err));
                            } catch (err) {
                                console.error('Error cleaning up temp files:', err);
                            }
                        }, 60000); // Delete after 1 minute
                    }
                });
            });
        } catch (error) {
            console.error('Docling handler error:', error);
            return `處理文件時發生錯誤: ${error.message}`;
        }
    }

    async validatePythonEnvironment() {
        if (!this.isEnabled) return { valid: false, message: 'Docling is disabled' };
        
        const { exec } = require('child_process');
        
        return new Promise((resolve) => {
            exec(`${this.pythonExec} -c "import sys; print(sys.version)"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error validating Python: ${error.message}`);
                    resolve({ 
                        valid: false, 
                        message: `找不到Python執行環境: ${error.message}. 請確保安裝了Python並在.env中正確設置PYTHON_PATH` 
                    });
                    return;
                }
                
                exec(`${this.pythonExec} -c "try: import docling; print('Docling installed'); except ImportError: print('Docling not installed')"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error checking Docling: ${error.message}`);
                        resolve({ 
                            valid: false, 
                            message: `無法檢查Docling是否已安裝: ${error.message}` 
                        });
                        return;
                    }
                    
                    if (stdout.trim() === 'Docling installed') {
                        resolve({ valid: true, message: 'Docling已正確安裝' });
                    } else {
                        console.log('Docling not installed, attempting to use installation helper');
                        
                        // Try running the installation helper
                        exec(`${this.pythonExec} ${this.workingDir}/install_docling.py`, (error, stdout, stderr) => {
                            console.log('Installation helper output:', stdout);
                            if (error) {
                                console.error(`Error running installation helper: ${error.message}`);
                                resolve({ 
                                    valid: false, 
                                    message: `Docling未安裝，自動安裝失敗: ${error.message}. 請手動運行 python ${this.workingDir}/install_docling.py` 
                                });
                                return;
                            }
                            
                            // Check if installation was successful
                            if (stdout.includes('Successfully installed docling')) {
                                resolve({ valid: true, message: 'Docling已成功安裝' });
                            } else {
                                resolve({ 
                                    valid: false, 
                                    message: `Docling未安裝. 請手動運行 pip install docling` 
                                });
                            }
                        });
                    }
                });
            });
        });
    }
}

const openai = new OpenAI();
const chatAi = new ChatAi();
const imageAi = new ImageAi();
const translateAi = new TranslateAi();
const doclingHandler = new DoclingHandler();


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


