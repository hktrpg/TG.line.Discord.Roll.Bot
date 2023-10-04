"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.DISCORD_CHANNEL_SECRET) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Permission... Remove this comment to see the full error message
const { PermissionFlagsBits, PermissionsBitField } = require('discord.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'variables'... Remove this comment to see the full error message
let variables = {};
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'oneMinuts'... Remove this comment to see the full error message
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const sevenDay = (process.env.DEBUG) ? 1 : 60 * 24 * 7 * 60000;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkTools... Remove this comment to see the full error message
const checkTools = require('../modules/check.js');

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'gameName'.
const gameName = function () {
    return '【Discord 頻道輸出工具】'
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'opt'.
const opt = {
    upsert: true,
    runValidators: true
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'VIP'.
const VIP = require('../modules/veryImportantPerson');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'FUNCTION_L... Remove this comment to see the full error message
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
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('../modules/schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('fs').promises;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'moment'.
const moment = require('moment-timezone');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const CryptoJS = require("crypto-js");
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'gameType'.
const gameType = function () {
    return 'Tool:Export:hktrpg'
}
// @ts-expect-error TS(2304): Cannot find name '__dirname'.
const dir = __dirname + '/../tmp/';
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'prefixs'.
const prefixs = function () {
    return [{
        first: /^[.]discord$/i,
        second: null
    }];
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'getHelpMes... Remove this comment to see the full error message
const getHelpMessage = async function () {
    return `測試進行中【聊天紀錄】
.discord html 可以輸出有分析功能的聊天紀錄
.discord txt 可以輸出純文字的聊天紀錄
.discord txt -withouttime 可以輸出【沒有時間標記的】純文字的聊天紀錄
需要使用者及rollbot 都有閱讀頻道聊天紀錄的權限
然後會私訊你紀錄
注意 使用此功能，你需要有管理此頻道的權限或管理員權限。
另外網頁版內容經過AES加密，後者是純文字檔案
因為經過server處理，擔心個資外洩請勿使用。

因為資源限制，普通使用者 每個群組 每120分鐘可以使用一次,
每個ACC可以一星期使用一次

經patreon解鎖功能的話可以一星期使用20次以上，
及可以一分鐘使用一次。

另外這是開發團錄功能的副產品，團錄功能敬請期待(?)`
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'initialize... Remove this comment to see the full error message
const initialize = function () {
    return variables;
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollDiceCo... Remove this comment to see the full error message
const rollDiceCommand = async function(
    this: any,
    {
        inputStr,
        mainMsg,
        discordClient,
        discordMessage,
        channelid,
        groupid,
        botname,
        userid,
        userrole
    }: any
) {
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
    let channelName = discordMessage.channel.name || '';
    let date = new Date;
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();
    let tempA = channelid + '_' + hour + minutes + seconds;
    let hasReadPermission, gpLimitTime;
    let update, gpRemainingTime, userRemainingTime;
    let theTime = new Date();
    let demoMode = false;
    if (groupid) {
        hasReadPermission = discordMessage.channel.permissionsFor(discordMessage.guild.members.me).has(PermissionFlagsBits.ReadMessageHistory) || discordMessage.guild.members.me.permissions.has(PermissionFlagsBits.Administrator);
    }

    function replacer(first: any, second: any) {
        let users = discordClient.users.fetch(second);
        if (users && users.username) {
            return '@' + users.username;
        } else return first;
    }

    async function lots_of_messages_getter_HTML(channel: any, demo: any) {
        const sum_messages: any = [];
        let last_id;
        let totalSize = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const options = {
                limit: 100
            };
            if (last_id) {
                // @ts-expect-error TS(2339): Property 'before' does not exist on type '{ limit:... Remove this comment to see the full error message
                options.before = last_id;
            }
            const messages = await channel.messages.fetch(options);
            totalSize += (messages.size) ? messages.size : 0;
            messages.forEach((element: any) => {
                let temp;
                if (element.type === 0) {
                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: element.content.replace(/<@(.*?)>/ig, replacer),
                        userName: element.author.username,
                        isbot: element.author.bot
                    }
                } else
                    if (element.type !== 0) {
                        temp = {
                            timestamp: element.createdTimestamp,
                            contact: element.author.username + '\n' + element.type,
                            userName: '系統信息',
                            isbot: true
                        }
                    }
                sum_messages.push(temp)
            });
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
    async function lots_of_messages_getter_TXT(channel: any, demo: any) {
        const sum_messages: any = [];
        let last_id;
        let totalSize = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const options = {
                limit: 100
            };
            if (last_id) {
                // @ts-expect-error TS(2339): Property 'before' does not exist on type '{ limit:... Remove this comment to see the full error message
                options.before = last_id;
            }
            const messages = await channel.messages.fetch(options);
            totalSize += (messages.size) ? messages.size : 0;
            messages.forEach((element: any) => {
                let temp;
                // if (element.attachments && element.attachments.size) console.log('element.attachments',element.attachments.map(attachment => attachment.proxyURL))
                if (element.type === 0) {
                    temp = {
                        timestamp: element.createdTimestamp,
                        contact: element.content.replace(/<@(.*?)>/ig, replacer),
                        userName: element.author.username,
                        isbot: element.author.bot,
                        attachments: (element.attachments && element.attachments.size) ? element.attachments.map((attachment: any) => attachment.proxyURL) : [],
                        embeds: (element.embeds && element.embeds.length) ? element.embeds.map((embed: any) => embed.description) : []
                    }
                } else
                    if (element.type !== 0) {
                        temp = {
                            timestamp: element.createdTimestamp,
                            contact: element.author.username + '\n' + element.type,
                            userName: '系統信息',
                            isbot: true,
                            attachments: (element.attachments && element.attachments.size) ? element.attachments.map((attachment: any) => attachment.proxyURL) : [],
                            embeds: (element.embeds && element.embeds.length) ? element.embeds.map((embed: any) => embed.description) : []
                        }
                    }
                sum_messages.push(temp)
            });
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
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = await this.getHelpMessage();
            // @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{ defaul... Remove this comment to see the full error message
            rply.quotes = true;
            return rply;
        case /^html$/i.test(mainMsg[1]):
            rply.text = "功能暫停，請先使用TXT版 .discord txt"
            return rply;
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
            // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
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


            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            M = await lots_of_messages_getter_HTML(C, demoMode);
            if (M.length == 0) {
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
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            // @ts-expect-error TS(2304): Cannot find name '__dirname'.
            data = await fs.readFile(__dirname + '/../views/discordLog.html', 'utf-8')
            let key = makeid(32);
            let randomLink = makeid(7);
            let newAESDate = AES(key, key, JSON.stringify(newRawDate));
            //aesData = [];
            newValue = data.replace(/aesData\s=\s\[\]/, 'aesData = ' + JSON.stringify(newAESDate.toString('base64'))).replace(/<h1>聊天紀錄<\/h1>/, '<h1>' + channelName + ' 的聊天紀錄</h1>');
            let tempB = key;
            await fs.writeFile(dir + channelid + '_' + hour + minutes + seconds + '_' + randomLink + '.html', newValue); // need to be in an async function
            // @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
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
            lv = (gpLv > lv) ? gpLv : lv;
            limit = FUNCTION_LIMIT[lv];
            checkUser = await schema.exportUser.findOne({
                userID: userid
            }).catch((error: any) => console.error('export #372 mongoDB error: ', error.name, error.reson));
            checkGP = await schema.exportGp.findOne({
                groupID: userid
            }).catch((error: any) => console.error('export #375 mongoDB error: ', error.name, error.reson));
            gpLimitTime = (lv > 0) ? oneMinuts : oneMinuts * 120;
            // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
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
                }, opt).catch((error: any) => console.error('export #408 mongoDB error: ', error.name, error.reson));
            } else {
                checkGP.lastActiveAt = theTime;
                await checkGP.save();
            }


            console.log('USE EXPORT TXT')
            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            M = await lots_of_messages_getter_TXT(C, demoMode);
            // @ts-expect-error TS(2339): Property 'length' does not exist on type '{ sum_me... Remove this comment to see the full error message
            if (M.length == 0) {
                rply.text = "未能讀取信息";
                return rply;
            }
            if (!checkUser) {
                checkUser = await schema.exportUser.updateOne({
                    userID: userid
                }, {
                    lastActiveAt: new Date(),
                    times: 1
                }, opt).catch((error: any) => console.error('export #428 mongoDB error: ', error.name, error.reson));
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
                    }, update, opt).catch((error: any) => console.error('export #446 mongoDB error: ', error.name, error.reson));
            }
            totalSize = M.totalSize;
            M = M.sum_messages;
            // @ts-expect-error TS(7006): Parameter 'b' implicitly has an 'any' type.
            M.sort(function (b, a) {
                return a.timestamp - b.timestamp;
            });
            let withouttime = (((/-withouttime/i))).test(inputStr);
            //加不加時間標記下去
            for (let index = M.length - 1; index >= 0; index--) {
                if (withouttime) {
                    if (M[index].isbot) {
                        data += '(🤖)'
                    }
                    data += M[index].userName + '	' + '\n';
                    data += M[index].contact.replace(/<@(.*?)>/ig, replacer)
                    data += '\n\n';
                } else {
                    let time = M[index].timestamp.toString().slice(0, -3);
                    const dateObj = moment
                        .unix(time)
                        .tz('Asia/Taipei')
                        .format('YYYY-MM-DD HH:mm:ss');
                    if (M[index].isbot) {
                        data += '(🤖)'
                    }
                    //dateObj  決定有沒有時間
                    data += M[index].userName + '	' + dateObj + '\n';
                    data += (M[index].contact) ? M[index].contact.replace(/<@(.*?)>/ig, replacer) + '\n' : '';
                    data += (M[index].embeds.length) ? `${M[index].embeds.join('\n')}` : '';
                    data += (M[index].attachments.length) ? `${M[index].attachments.join('\n')}` : '';
                    data += '\n';
                }
            }
            try {
                await fs.access(dir)
            } catch (error) {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            await fs.writeFile(dir + channelid + '_' + hour + minutes + seconds + '.txt', data); // need to be in an async function
            // @ts-expect-error TS(2339): Property 'discordExport' does not exist on type '{... Remove this comment to see the full error message
            rply.discordExport = channelid + '_' + hour + minutes + seconds;
            rply.text += `已私訊你 頻道  ${discordMessage.channel.name}  的聊天紀錄
            你的channel聊天紀錄 共有  ${totalSize}  項`
            console.log('EXPORT TXT DONE')
            return rply;
        } default:
            break;
    }
}



function getAesString(data: any, key: any, iv: any) { //加密
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


function AES(key: any, iv: any, data: any) {
    // @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
    let crypto = require('crypto');
    let algo = "aes-256-cbc"; // we are using 128 bit here because of the 16 byte key. use 256 is the key is 32 byte.
    // @ts-expect-error TS(2580): Cannot find name 'Buffer'. Do you need to install ... Remove this comment to see the full error message
    let cipher = crypto.createCipheriv(algo, Buffer.from(key, 'utf-8'), iv.slice(0, 16));
    // let encrypted = cipher.update(data, 'utf-8', 'base64'); // `base64` here represents output encoding
    //encrypted += cipher.final('base64');
    // @ts-expect-error TS(2580): Cannot find name 'Buffer'. Do you need to install ... Remove this comment to see the full error message
    let encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
    return encrypted;
}

function getAES(key: any, iv: any, data: any) { //加密
    let encrypted = getAesString(data, key, iv); //密文
    //    let encrypted1 = CryptoJS.enc.Utf8.parse(encrypted);
    return encrypted;
}

function makeid(length: any) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const millisToMinutesAndSeconds = (millis: any) => {
    millis = millis * -1;
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    //ES6 interpolated literals/template literals 
    //If seconds is less than 10 put a zero in front.
    // @ts-expect-error TS(2365): Operator '<' cannot be applied to types 'string' a... Remove this comment to see the full error message
    return `${minutes}分鐘${(seconds < 10 ? "0" : "")}${seconds}秒`;
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};