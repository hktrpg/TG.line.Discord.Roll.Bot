"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
let variables = {};
const oneMinuts = (process.env.DEBUG) ? 1 : 60_000;
const sevenDay = (process.env.DEBUG) ? 1 : 60 * 24 * 7 * 60_000;
const crypto = require('crypto');
const gameName = function () {
    return '【Discord 頻道輸出工具】'
}
const opt = {
    upsert: true,
    runValidators: true
}
const FUNCTION_LIMIT = (process.env.DEBUG) ? [99, 99, 99, 40, 40, 99, 99, 99] : [1, 20, 40, 40, 40, 99, 99, 99];
/**
 * 因為資源限制，
 * 每個guild 5分鐘可以使用一次,
 * 每個ACC可以一星期一次
 * 
 *  
 * 升級的話, 個人一星期20次
 * 只有一分鐘限制
 * 
 */
const fs = require('fs').promises;
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
const { createWriteStream } = require('fs');
const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const moment = require('moment-timezone');
const CryptoJS = require("crypto-js");
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const checkTools = require('../modules/check.js');
const gameType = function () {
    return 'Tool:Export:hktrpg'
}
const dir = __dirname + '/../tmp/';
const prefixs = function () {
    return [{
        first: /^[.]discord$/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【📑聊天紀錄匯出系統】測試進行中
╭────── 📤匯出格式 ──────
│ .discord html
│ 　• 含資料分析功能的網頁版
│ 　• 使用AES加密保護
│
│ .discord txt
│ 　• 純文字格式匯出
│ 　• 包含時間戳記
│
│ .discord txt -withouttime
│ 　• 純文字格式匯出
│ 　• 不含時間戳記
│
├────── ⚙️使用需求 ──────
│ 權限要求:
│ 　• 使用者需具備頻道管理權限
│ 　• 或擁有管理員權限
│ 　• Bot需有讀取頻道權限
│
│ 📨匯出方式:
│ 　• 系統將以私訊發送紀錄
│
├────── ⚠️使用限制 ──────
│ 一般用戶:
│ 　• 每群組120分鐘限用一次
│ 　• 每帳號一週限用一次
│
│ Patreon訂閱用戶:
│ 　• 每週可用20次以上
│ 　• 每分鐘可用一次
│
├────── 📌注意事項 ──────
│ • 紀錄會經過伺服器處理
│ • 若擔心隱私請謹慎使用
│ • 此為團錄系統開發測試版
╰──────────────`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    discordClient,
    discordMessage,
    channelid,
    groupid,
    botname,
    userid,
    userrole
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let C, M;
    let data = "";
    let totalSize = 0;
    let newRawDate = [];
    let newValue = "";
    let lv, limit, checkUser, checkGP;
    let channelName = discordMessage && discordMessage.channel ? discordMessage.channel.name || '' : '';
    let date = new Date;
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();
    let tempA = channelid + '_' + hour + minutes + seconds;
    let hasReadPermission, gpLimitTime;
    let update, gpRemainingTime, userRemainingTime;
    let theTime = new Date();
    let demoMode = false;
    // Check if the message is from an interaction
    if (discordMessage && discordMessage.isInteraction) {
        // For slash commands, set this flag to true
        discordMessage.isInteraction = true;
    }
    if (groupid && discordMessage && discordMessage.channel && discordMessage.guild && discordMessage.guild.members && discordMessage.guild.members.me) {
        hasReadPermission = discordMessage.channel.permissionsFor(discordMessage.guild.members.me).has(PermissionFlagsBits.ReadMessageHistory) || discordMessage.guild.members.me.permissions.has(PermissionFlagsBits.Administrator);
    }

    async function replacer(first, second) {
        let users = await discordClient.users.fetch(second);
        if (users && users.username) {
            return '@' + users.username;
        } else {
            return first;
        }
    }

    async function lots_of_messages_getter_HTML(channel, demo, members) {
        const sum_messages = [];
        let last_id;
        let totalSize = 0;

        while (true) {
            const options = {
                limit: 100
            };
            if (last_id) {
                options.before = last_id;
            }
            const messages = await channel.messages.fetch(options);
            totalSize += Math.max(messages.size, 0);

            for (const element of messages.values()) {
                let temp;
                if (element.type === 0 || element.type === 19) {
                    const content = await replaceMentions(element.content, members);
                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: content,
                        userName: element.author.username,
                        isbot: element.author.bot
                    };
                } else {
                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: element.author.username + '\n' + element.type,
                        userName: '系統信息',
                        isbot: true
                    };
                }
                sum_messages.push(temp);
            }

            last_id = messages.last().id;
            if (messages.size != 100) {
                break;
            }
            if (demo) {
                if (totalSize >= 500) {
                    break;
                }
            }
        }

        return {
            sum_messages: sum_messages,
            totalSize: totalSize
        };
    }
    async function lots_of_messages_getter_TXT(channel, demo, members) {
        const sum_messages = [];
        let last_id;
        let totalSize = 0;

        while (true) {
            const options = {
                limit: 100
            };
            if (last_id) {
                options.before = last_id;
            }
            const messages = await channel.messages.fetch(options);
            totalSize += Math.max(messages.size, 0);

            for (const element of messages.values()) {
                let temp;
                const content = await replaceMentions(element.content, members);
                const processedEmbeds = await Promise.all(
                    (element.embeds && element.embeds.length > 0) ? element.embeds.map(async embed => {
                        if (embed.description) {
                            return await replaceMentions(embed.description, members);
                        }
                        return embed.description;
                    }) : []
                );
                if (element.type === 0 || element.type === 19) {

                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: content,
                        userName: element.author.username,
                        isbot: element.author.bot,
                        attachments: (element.attachments && element.attachments.size > 0) ? element.attachments.map(attachment => attachment.proxyURL) : [],
                        embeds: processedEmbeds
                    };
                } else if (element.interaction && element.interaction.commandName) {
                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: (element.interaction.nickname || element.interaction.user.username) + '使用' + element.interaction.commandName + "\n",
                        userName: '系統信息',
                        isbot: true,
                        attachments: (element.attachments && element.attachments.size > 0) ? element.attachments.map(attachment => attachment.proxyURL) : [],
                        embeds: processedEmbeds
                    };
                }
                if (temp)
                    sum_messages.push(temp);
            }

            last_id = messages.last().id;
            if (messages.size != 100) {
                break;
            }
            if (demo) {
                if (totalSize >= 400) {
                    break;
                }
            }
        }

        return {
            sum_messages: sum_messages,
            totalSize: totalSize
        };
    }

    async function replaceMentions(content, members) {
        if (!content) return content;
        const mentionRegex = /<@(.*?)>/ig;
        const matches = content.match(mentionRegex);
        if (!matches) return content;


        const replacements = await Promise.all(matches.map(async (match) => {
            const userId = match.slice(2, -1); // 提取用戶 ID
            try {
                let name = "";
                // 嘗試獲取所有用戶
                const member = members.find(member => member.id === userId); // 嘗試獲取用戶
                if (member) name = member.nickname || member.displayName;
                if (!member) name = await discordClient.users.fetch(userId).then(user => user.username).catch(() => ""); // 嘗試獲取用戶名
                return name ? `@${name}` : match; // 如果用戶存在，返回用戶名
            } catch (error) {
                return match; // 如果出現錯誤，返回原始的 match
            }
        }));

        let replacedContent = content;
        for (const [index, match] of matches.entries()) {
            replacedContent = replacedContent.replace(match, replacements[index]);
        }

        return replacedContent;
    }


    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /^html$/i.test(mainMsg[1]):
            if (!channelid || !groupid) {
                rply.text = "這是頻道功能，需要在頻道上使用。"
                return rply;
            }
            if (!hasReadPermission) {
                rply.text = "HKTRPG沒有相關權限，禁止使用這功能。\nHKTRPG需要有查看此頻道對話歷史的權限。"
                return rply;
            }
            if (userrole < 2) {
                rply.text = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或管理員權限。"
                return rply;
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }
            lv = await VIP.viplevelCheckUser(userid);
            limit = FUNCTION_LIMIT[lv];
            checkUser = await schema.exportUser.findOne({
                userID: userid
            });
            checkGP = await schema.exportGp.findOne({
                groupID: userid
            });
            gpLimitTime = (lv > 0) ? oneMinuts : oneMinuts * 5;
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            userRemainingTime = (checkUser) ? theTime - checkUser.lastActiveAt - sevenDay : 1;
            try {
                C = await discordClient.channels.fetch(channelid);
            } catch (error) {
                if (error) {
                    rply.text = `出現錯誤(ERROR): 
                     ${error}`;
                    return rply;
                }
            }
            //<0 = DC 未過
            if (gpRemainingTime < 0) {
                rply.text = `此群組的冷卻時間未過，冷卻剩餘 ${millisToMinutesAndSeconds(gpRemainingTime)} 時間`;
                return rply;
            }
            if (userRemainingTime < 0 && checkUser && checkUser.times >= limit) {
                rply.text = `你每星期完整下載聊天紀錄的上限為 ${limit} 次，
                冷卻剩餘 ${millisToMinutesAndSeconds(userRemainingTime)} 時間，
                現在正處於Demo模式，可以輸出500條信息。

                支援及解鎖上限 https://www.patreon.com/HKTRPG`;
                demoMode = true;
            }
            /**
             * A. 檢查GP 資料, USER 資料 
             * 
             * B. 檢查 GP 5分鐘DC 時間 
             * PASS-> 檢查 
             * 
             * C. USER > 檢查時間
             * 超過一星期 -> 立即進行動作
             * 更新最新使用時間
             * 運行EXPORT
             * 
             * 
             * 檢查
             */
            console.log('USE EXPORT HTML')
            if (!checkGP) {
                checkGP = await schema.exportGp.updateOne({
                    groupID: userid
                }, {
                    lastActiveAt: new Date()
                }, opt);
            } else {
                checkGP.lastActiveAt = theTime;
                await checkGP.save();
            }


            if (discordMessage && discordMessage.channel && typeof discordMessage.channel.send === 'function') {
                discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            } else if (discordMessage && discordMessage.isInteraction) {
                await discordMessage.reply({ content: "<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間', ephemeral: false });
            }
            const members = discordMessage && discordMessage.guild && discordMessage.guild.members ? 
                discordMessage.guild.members.cache.map(member => member) : [];
            M = await lots_of_messages_getter_HTML(C, demoMode, members);
            if (!M || !M.sum_messages || M.sum_messages.length === 0) {
                rply.text = "未能讀取信息";
                return rply;
            }
            if (!checkUser) {
                checkUser = await schema.exportUser.updateOne({
                    userID: userid
                }, {
                    lastActiveAt: new Date(),
                    times: 1
                }, opt);
            } else {
                if (userRemainingTime && userRemainingTime > 0) {
                    update = {
                        times: 1,
                        lastActiveAt: new Date()
                    }
                } else {
                    if (!demoMode)
                        update = {
                            $inc: {
                                times: 1
                            }
                        }
                }
                if (update)
                    await schema.exportUser.updateOne({
                        userID: userid
                    }, update, opt);
            }
            totalSize = M.totalSize;
            newRawDate = M.sum_messages;

            try {
                await fs.access(dir)
            } catch (error) {
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            data = await fs.readFile(__dirname + '/../views/discordLog.html', 'utf8')
            // 在 rollDiceCommand 中使用
            let key = makeid(16); // 使用16位元的金鑰
            let randomLink = makeid(7);
            let encryptedData = lightEncrypt(newRawDate, key);
            newValue = data.replace(/aesData\s=\s\[\]/,
                'aesData = "' + encryptedData + '"')
                .replace(/<h1>聊天紀錄<\/h1>/,
                    '<h1>' + channelName + ' 的聊天紀錄</h1>');
            let tempB = key;
            const writeStream = createWriteStream(dir + channelid + '_' + hour + minutes + seconds + '_' + randomLink + '.html');
            const contentStream = new stream.Readable();
            contentStream.push(newValue, null);

            await pipeline(
                contentStream,
                writeStream
            );

            rply.discordExportHtml = [
                tempA + '_' + randomLink,
                tempB
            ]
            rply.text += `已私訊你 頻道 ${discordMessage.channel.name} 的聊天紀錄
            你的channel 聊天紀錄 共有 ${totalSize} 項`
            return rply;
        case /^txt$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkBot,
                gid: groupid,
                role: userrole,
                name: botname
            })) {
                return rply;
            }

            if (!hasReadPermission) {
                rply.text = `HKTRPG沒有相關權限，禁止使用這功能。
                    HKTRPG需要有查看此頻道對話歷史的權限。`
                return rply;
            }

            lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = Math.max(gpLv, lv);
            limit = FUNCTION_LIMIT[lv];
            checkUser = await schema.exportUser.findOne({
                userID: userid
            }).catch(error => console.error('export #372 mongoDB error:', error.name, error.reason));
            checkGP = await schema.exportGp.findOne({
                groupID: userid
            }).catch(error => console.error('export #375 mongoDB error:', error.name, error.reason));
            gpLimitTime = (lv > 0) ? oneMinuts : oneMinuts * 120;
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            userRemainingTime = (checkUser) ? theTime - checkUser.lastActiveAt - sevenDay : 1;
            try {
                C = await discordClient.channels.fetch(channelid);
            } catch (error) {
                if (error) {
                    rply.text = "出現錯誤(ERROR): " + '\n' + error;
                    return rply;
                }
            }
            //<0 = DC 未過
            if (gpRemainingTime < 0) {
                rply.text = "此群組的冷卻時間未過，冷卻剩餘" + millisToMinutesAndSeconds(gpRemainingTime) + '時間';
                return rply;
            }
            if (userRemainingTime < 0 && checkUser && checkUser.times >= limit) {
                rply.text = `你每星期完整下載聊天紀錄的上限為 ${limit} 次，
                    冷卻剩餘 ${millisToMinutesAndSeconds(userRemainingTime)} 時間，
                    現在正處於Demo模式，可以輸出500條信息，
                    
                    支援及解鎖上限 https://www.patreon.com/HKTRPG`;
                return rply;
            }

            if (!checkGP) {
                checkGP = await schema.exportGp.updateOne({
                    groupID: userid
                }, {
                    lastActiveAt: new Date()
                }, opt).catch(error => console.error('export #408 mongoDB error:', error.name, error.reason));
            } else {
                checkGP.lastActiveAt = theTime;
                await checkGP.save();
            }

            console.log('USE EXPORT TXT')
            if (discordMessage && discordMessage.channel && typeof discordMessage.channel.send === 'function') {
                discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            } else if (discordMessage && discordMessage.isInteraction) {
                await discordMessage.reply({ content: "<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間', ephemeral: false });
            }
            const members = discordMessage && discordMessage.guild && discordMessage.guild.members ? 
                discordMessage.guild.members.cache.map(member => member) : [];
            M = await lots_of_messages_getter_TXT(C, demoMode, members);
            if (!M || !M.sum_messages || M.sum_messages.length === 0) {
                rply.text = "未能讀取信息";
                return rply;
            }
            if (!checkUser) {
                checkUser = await schema.exportUser.updateOne({
                    userID: userid
                }, {
                    lastActiveAt: new Date(),
                    times: 1
                }, opt).catch(error => console.error('export #428 mongoDB error:', error.name, error.reason));
            } else {
                if (userRemainingTime && userRemainingTime > 0) {
                    update = {
                        times: 1,
                        lastActiveAt: new Date()
                    }
                } else {
                    if (!demoMode)
                        update = {
                            $inc: {
                                times: 1
                            }
                        }
                }
                if (update)
                    await schema.exportUser.updateOne({
                        userID: userid
                    }, update, opt).catch(error => console.error('export #446 mongoDB error:', error.name, error.reason));
            }
            totalSize = M.totalSize;
            M = M.sum_messages;
            M.sort(function (b, a) {
                return a.timestamp - b.timestamp;
            });
            let withouttime = (/-withouttime/i).test(inputStr);
            const writeStream = createWriteStream(dir + channelid + '_' + hour + minutes + seconds + '.txt');
            const contentStream = new stream.Readable();

            for (let index = M.length - 1; index >= 0; index--) {
                let line = '';
                if (withouttime) {
                    if (M[index].isbot) {
                        line += '(🤖)';
                    }
                    line += M[index].userName + '\t\n';
                    line += M[index].contact;
                    line += '\n\n';
                } else {
                    let time = M[index].timestamp.toString().slice(0, -3);
                    const dateObj = moment
                        .unix(time)
                        .tz('Asia/Taipei')
                        .format('YYYY-MM-DD HH:mm:ss');
                    if (M[index].isbot) {
                        line += '(🤖)';
                    }
                    line += M[index].userName + '\t' + dateObj + '\n';
                    line += (M[index].contact) ? (M[index].contact) + '\n' : '';
                    line += (M[index].embeds.length > 0) ? `${M[index].embeds.join('\n')}` : '';
                    line += (M[index].attachments.length > 0) ? `${M[index].attachments.join('\n')}` : '';
                    line += '\n';
                }
                contentStream.push(line);
            }
            contentStream.push(null);

            await pipeline(
                contentStream,
                writeStream
            );

            rply.discordExport = channelid + '_' + hour + minutes + seconds;
            rply.text += `已私訊你 頻道  ${discordMessage.channel.name}  的聊天紀錄
                你的channel聊天紀錄 共有  ${totalSize}  項`
            console.log('EXPORT TXT DONE')
            return rply;
        }
        default:
            break;
    }
}



function getAesString(data, key, iv) { //加密
    let keyy = CryptoJS.enc.Utf8.parse(key);
    //alert(key）;
    let ivv = CryptoJS.enc.Utf8.parse(iv);
    let encrypted = CryptoJS.AES.encrypt(data, keyy, {
        iv: ivv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString(); //返回的是base64格式的密文
}


function AES(key, iv, data) {
    let algo = "aes-256-cbc"; // we are using 128 bit here because of the 16 byte key. use 256 is the key is 32 byte.
    let cipher = crypto.createCipheriv(algo, Buffer.from(key, 'utf-8'), iv.slice(0, 16));
    // let encrypted = cipher.update(data, 'utf-8', 'base64'); // `base64` here represents output encoding
    //encrypted += cipher.final('base64');
    let encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
    return encrypted;
}

function getAES(key, iv, data) { //加密
    let encrypted = getAesString(data, key, iv); //密文
    //    let encrypted1 = CryptoJS.enc.Utf8.parse(encrypted);
    return encrypted;
}

function generateKey() {
    // 生成16字節的隨機密鑰
    return crypto.randomBytes(16).toString('hex');
}


function lightEncrypt(data, key) {
    try {
        const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createCipheriv('aes-128-cbc',
            Buffer.from(key.slice(0, 16)),
            iv);

        // 壓縮數據並轉換為字串
        const minData = data.map(item => ({
            t: item.timestamp,
            c: item.contact,
            u: item.userName,
            b: item.isbot
        }));
        const jsonString = JSON.stringify(minData);

        // 加密數據
        const encrypted = Buffer.concat([
            cipher.update(jsonString, 'utf8'),
            cipher.final()
        ]);

        // 轉換為 base64
        return encrypted.toString('base64');
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}




function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const millisToMinutesAndSeconds = (millis) => {
    millis = millis * -1;
    let minutes = Math.floor(millis / 60_000);
    let seconds = ((millis % 60_000) / 1000).toFixed(0);
    //ES6 interpolated literals/template literals 
    //If seconds is less than 10 put a zero in front.
    return `${minutes}分鐘${(seconds < 10 ? "0" : "")}${seconds}秒`;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('export')
            .setDescription('【聊天紀錄匯出系統】匯出Discord頻道聊天紀錄')
            .addStringOption(option => 
                option.setName('format')
                .setDescription('匯出格式')
                .setRequired(true)
                .addChoices(
                    { name: 'HTML格式(含資料分析)', value: 'html' },
                    { name: 'TXT格式(含時間戳記)', value: 'txt' },
                    { name: 'TXT格式(不含時間戳記)', value: 'txt -withouttime' }
                )),
        async execute(interaction) {
            const format = interaction.options.getString('format');
            // Instead of returning a command string, we'll use the interaction object
            // and make sure to store it in discordMessage for later use
            return {
                inputStr: `.discord ${format}`,
                discordMessage: interaction,
                isInteraction: true
            };
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand
};