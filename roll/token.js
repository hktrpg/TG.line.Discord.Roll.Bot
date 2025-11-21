"use strict";

const initialize = function () {
    if (!process.env.DISCORD_CHANNEL_SECRET) {
        return;
    }
    return variables;
}

const variables = {};
const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const sharp = require('sharp');
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios').default;
const GeoPattern = require('geopattern');
const { imgbox } = require("imgbox");
const { getPool } = require('../modules/pool');
const imagePool = getPool('image');

const gameName = function () {
    return '【製作Token】.token .token2 .token3 .tokenupload'
}

const gameType = function () {
    return 'Tool:Token:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.token$|^\.token2$|^\.token3$|^\.tokenupload$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【🎭Token製作系統】
╭────── 🖼️基本功能 ──────
│ 製作指令:
│ 　• .token  - 方形相片風格
│ 　• .token2 - 透明底圓形
│ 　• .token3 - 彩色邊框圓形
│
├────── 🎨Token生成 ──────
│ 圖片來源:
│ 　• 回覆含圖片的訊息
│ 　• 直接傳送圖片
│ 　• 無圖片時使用個人頭像
│
│ 文字設定:
│ 　• 可輸入兩行自訂文字
│
├────── 🌈特殊功能 ──────
│ Token3邊框顏色:
│ 　• 自動採用Discord暱稱色彩
│ 　• 可指定特定顏色
│
├────── 📤圖片上傳 ──────
│ • .tokenupload
│ 　- 將圖片上傳至imgur
│ 　- 自動產生分享連結
│
├────── 📝使用範例 ──────
│ 基本製作:
│ 上傳或回覆圖片並輸入
│ 　.token
│ 　Sad
│ 　HKTRPG
│
│ 圖片上傳:
│ 　.tokenupload
│ 　[回覆圖片或直接傳送]
╰──────────────`
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    discordClient,
    discordMessage,
    displaynameDiscord
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]): {
            rply.text = getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.tokenupload$/.test(mainMsg[0]): {
            return await uploadImage(discordMessage, discordClient);
        }
        case /^\.token2$/.test(mainMsg[0]): {
            //get avatar  or reply message image
            return await circleTokernMaker(discordMessage, inputStr, mainMsg, discordClient);
        }
        case /^\.token3$/.test(mainMsg[0]): {
            //get avatar  or reply message image
            return await circleTokernMaker3(discordMessage, inputStr, mainMsg, discordClient, displaynameDiscord);
        }
        case /^\S/.test(mainMsg[1]) || !mainMsg[1]: {
            //get avatar  or reply message image
            const result = await polaroidTokernMaker(discordMessage, inputStr, mainMsg, discordClient);
            if (!result.text && !result.sendImage) {
                result.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`;
            }
            return result;
        }
        default: {
            break;
        }
    }
}


const uploadImage = async (discordMessage, discordClient) => {
    let rply = { text: '', sendImage: '' };
    const avatar = await getAvatar(discordMessage, discordClient)

    if (!avatar) {
        rply.text = `沒有找到reply裡有圖片, 請再次檢查 }`;
        return rply;
    }
    //reject if url  not JPEG PNGGIFAPNGTIFFMP4MPEGAVIWEBMquicktimex-matroskax-flvx-msvideox-ms-wmv
    if (avatar && !/\.(jpg|jpeg|png|gif)/i.test(avatar)) {
        rply.text = '上傳失敗，請檢查圖片格式\n 可能支持的格式\njpg|jpeg|png|gif';
        return rply;
    }

    try {
        const file = [{
            filename: `temp_${Date.now()}.${getFileExtension(avatar)}`,
            url: avatar
        }]

        const response = await imgbox(file);

        rply.text = (response.ok && response.files && response.files[0].url) ? response.files[0].original_url : '上傳失敗，請檢查圖片內容\n';
    } catch (error) {
        console.error('Error uploading image:', error);
        rply.text = '上傳失敗，請檢查圖片內容\n';
    }

    return rply;
}

const circleTokernMaker = async (discordMessage, inputStr, mainMsg, discordClient) => {
    let rply = { text: '', sendImage: '' };
    try {
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `沒有找到reply 的圖示, 請再次檢查 \n\n${getHelpMessage()}`;
            return rply;
        }
        const response = await getImage(avatar);

        const d = new Date();
        let time = d.getTime();
        // Sanitize filename to remove invalid characters
        let sanitizedText = text.text.replaceAll(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
        let name = `temp_${time}_${sanitizedText}.png`

        const token = await tokernMaker2(response, name);
        const circleToken = await maskImage(token, './assets/token/tokenCircleMask.png');
        let newImage = await addTextOnImage2(circleToken, text.text, text.secondLine, name)
        if (!newImage) {
            rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`
            return rply;
        }
        rply.sendImage = `./temp/finally_${name}`;
        return rply;
    } catch (error) {
        console.error('error', error)
        rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`
        return rply;
    }
}
const circleTokernMaker3 = async (discordMessage, inputStr, mainMsg, discordClient, displaynameDiscord) => {
    let rply = { text: '', sendImage: '' };
    try {
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `沒有找到reply 的圖示, 請再次檢查 \n\n${getHelpMessage()}`;
            return rply;
        }
        const response = await getImage(avatar);
        const d = new Date();
        let time = d.getTime();
        // Sanitize filename to remove invalid characters
        let sanitizedText = text.text.replaceAll(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
        let name = `temp_${time}_${sanitizedText}.png`

        const token = await tokernMaker3(response, name);
        const circleToken = await maskImage(token, './assets/token/tokenCircleMask3.png');

        const pattern = GeoPattern.generate((text.text || displaynameDiscord || 'HKTRPG')).toString().replace('width="188" height="70"', 'width="520" height="520"')
        let url = Buffer.from(
            pattern
        )
        let coloredBase = await sharp(url)
            .resize(520, 520)
            .toBuffer();

        coloredBase = await maskImage(coloredBase, './assets/token/ONLINE_TOKEN_BACKGROUND_COLOR3.png');
        const circleToken2 = await sharp(coloredBase)
            .composite(
                [
                    { input: circleToken, top: 0, left: 0 },
                ])
            .toBuffer()
        let newImage = await addTextOnImage2(circleToken2, text.text, text.secondLine, name)
        if (!newImage) {
            rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`
            return rply;
        }
        rply.sendImage = `./temp/finally_${name}`;
        return rply;
    } catch (error) {
        console.error('error', error)
        rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`
        return rply;
    }
}

async function maskImage(path, maskPath) {
    const image = await imagePool.run(() => jimp.read(path));
    const mask = await imagePool.run(() => jimp.read(maskPath));
    image.mask(mask, 0, 0)
    return await imagePool.run(() => image.getBufferAsync(jimp.MIME_PNG));
    //    return await image.writeAsync('./assets/token/test2345.png'); // Returns Promise
}

const polaroidTokernMaker = async (discordMessage, inputStr, mainMsg, discordClient) => {
    let rply = { text: '', sendImage: '' };
    try {
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`;
            return rply;
        }

        const response = await getImage(avatar);
        if (!response) {
            rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`;
            return rply;
        }

        const d = new Date();
        let time = d.getTime();
        // Sanitize filename to remove invalid characters
        let sanitizedText = text.text.replaceAll(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
        let name = `temp_${time}_${sanitizedText}.png`

        const token = await tokernMaker(response, name);

        let newImage = await addTextOnImage(token, text.text, text.secondLine, name)
        if (!newImage) {
            rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`;
            return rply;
        }
        rply.sendImage = `./temp/finally_${name}`;
        return rply;
    } catch (error) {
        console.error('error', error)
        rply.text = `製作失敗，可能出現某些錯誤。 \n\n${getHelpMessage()}`
        return rply;
    }
}

const getAvatar = async (discordMessage, discordClient) => {
    // Handle slash command interactions
    if (discordMessage.interaction) {
        // Check for attachments in the interaction
        if (discordMessage.attachments && discordMessage.attachments.size > 0) {
            const attachmentsArray = [...discordMessage.attachments.values()];
            const url = attachmentsArray.find(data => data.contentType.match(/image/i));
            return (url && url.url) || null;
        }

        // Check for referenced message (reply)
        if (discordMessage.reference) {
            try {
                const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
                const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId);

                // Check for attachments in the referenced message
                if (referenceMessage.attachments && referenceMessage.attachments.size > 0) {
                    const attachmentsArray = [...referenceMessage.attachments.values()];
                    const url = attachmentsArray.find(data => data.contentType.match(/image/i));
                    if (url && url.url) {
                        return url.url;
                    }
                }

                // Check for embeds with images in the referenced message
                if (referenceMessage.embeds && referenceMessage.embeds.length > 0) {
                    for (const embed of referenceMessage.embeds) {
                        if (embed.image && embed.image.url) {
                            return embed.image.url;
                        }
                        if (embed.thumbnail && embed.thumbnail.url) {
                            return embed.thumbnail.url;
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching referenced message:', error);
            }
        }

        // Use user's avatar as fallback
        if (discordMessage.author) {
            return discordMessage.author.displayAvatarURL();
        }

        return null;
    }

    // Original code for regular messages
    if (discordMessage.type === 0 && discordMessage.attachments.size === 0) {
        if (!discordMessage.author || !discordMessage.author.displayAvatarURL) {
            return null;
        }
        const member = (discordMessage.guild && await discordMessage.guild.members.fetch(discordMessage.author) || discordMessage.author)
        return member.displayAvatarURL();
    }
    if (discordMessage.type === 0 && discordMessage.attachments.size > 0) {
        const attachmentsArray = [...discordMessage.attachments.values()];
        const url = attachmentsArray.find(data => data.contentType.match(/image/i));
        return (url && url.url) || null;
    }
    //19 = reply
    if (discordMessage.type === 19) {
        const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
        const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId)
        const attachmentsArray = [...referenceMessage.attachments.values()];
        const url = attachmentsArray.find(data => data.contentType.match(/image/i));
        return (url && url.url) || null;
    }
    return null;
}

const getName = async (discordMessage, inputStr) => {
    /**  if (!mainMsg[1]) {
          const member = await discordMessage.guild.members.fetch(discordMessage.author)
          let nickname = member ? member.displayName : discordMessage.author.username;
          return { text: nickname, secondLine: '' }
      }
      else */
    {
        let line = inputStr.replace(/^\s?\S+\s?/, '').split("\n");
        if (line[2]) line.shift();
        return { text: line[0], secondLine: line[1] || '' }
    }

}


const getImage = async url => {
    try {
        const response = await axios({ url, responseType: "arraybuffer" });
        return response.data;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}
const tokernMaker = async (imageLocation, name) => {
    try {

        let image = await imagePool.run(() => sharp(imageLocation).resize({ height: 387, width: 375, fit: 'outside' }))
        await imagePool.run(() => image.toFile(`./temp/new_${name}`))
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await imagePool.run(() => newImage.metadata());
        const width = Math.min(metadata.width, 375);
        const height = Math.min(metadata.height, 387);
        const left = ((metadata.width - 375) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.width - 375) / 2);
        const top = ((metadata.height - 387) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.height - 387) / 2);
        newImage = await imagePool.run(() => newImage.extract({ left, top, width, height }).toBuffer())
        newImage = await imagePool.run(() => sharp('./views/image/ONLINE_TOKEN.png')
            .composite(
                [{ input: newImage, blend: 'saturate', top: 28, left: 73 }
                ]
            )
            .toBuffer())
        fs.unlinkSync(`./temp/new_${name}`);
        return newImage;
    } catch (error) {
        console.error('#token 142 error', error)
    }
}


const tokernMaker2 = async (imageLocation, name) => {
    try {

        let image = await imagePool.run(() => sharp(imageLocation).resize({ height: 520, width: 520, fit: 'outside' }))
        await imagePool.run(() => image.toFile(`./temp/new_${name}`))
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await imagePool.run(() => newImage.metadata());
        const width = Math.min(metadata.width, 520);
        const height = Math.min(metadata.height, 520);
        const left = ((metadata.width - 520) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.width - 520) / 2);
        const top = ((metadata.height - 520) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.height - 520) / 2);
        newImage = await imagePool.run(() => newImage.extract({ left, top, width, height }).toBuffer())
        newImage = await imagePool.run(() => sharp('./views/image/ONLINE TOKEN_BASE.png')
            .composite(
                [{ input: newImage, blend: 'saturate', top: 0, left: 0 }
                ]
            )
            .toBuffer())
        fs.unlinkSync(`./temp/new_${name}`);
        return newImage;
    } catch (error) {
        console.error('#token 142 error', error)
    }
}

const tokernMaker3 = async (imageLocation, name) => {
    try {

        let image = await imagePool.run(() => sharp(imageLocation).resize({ height: 520, width: 520, fit: 'outside' }))
        await imagePool.run(() => image.toFile(`./temp/new_${name}`))
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await imagePool.run(() => newImage.metadata());
        const width = Math.min(metadata.width, 520);
        const height = Math.min(metadata.height, 520);
        const left = ((metadata.width - 520) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.width - 520) / 2);
        const top = ((metadata.height - 520) / 2) < 0 ? sharp.gravity.center : Number.parseInt((metadata.height - 520) / 2);
        newImage = await imagePool.run(() => newImage.extract({ left, top, width, height }).toBuffer())
        newImage = await imagePool.run(() => sharp('./views/image/ONLINE TOKEN_BASE.png')
            .composite(
                [
                    { input: newImage, blend: 'saturate', top: 0, left: 0 },
                ])
            .toBuffer())
        fs.unlinkSync(`./temp/new_${name}`);
        return newImage;
    } catch (error) {
        console.error('#token 142 error', error)
    }
}

async function addTextOnImage(token, text = '', text2 = '', name) {
    try {
        const svgBuffer = colorTextBuilder({ text, text2, size: [92, 61], position: 96 });
        let image = await sharp(token)
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                },
            ])
        await imagePool.run(() => image.toFile(`./temp/finally_${name}`))
        return true;
    } catch {
        return null;
    }
}

async function addTextOnImage2(token, text = ' ', text2 = ' ', name) {
    try {
        const svgBuffer = colorTextBuilder({ text, text2, size: [96, 66], position: 96 });
        let image = await sharp(token)
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                },
            ])
        await imagePool.run(() => image.toFile(`./temp/finally_${name}`))
        return true;
    } catch {
        return null;
    }
}
const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('token')
            .setDescription('【方形相片風格】製作Token')
            .addAttachmentOption(option => option.setName('image').setDescription('上傳圖片').setRequired(true))
            .addStringOption(option => option.setName('text').setDescription('第一行文字').setRequired(false))
            .addStringOption(option => option.setName('text2').setDescription('第二行文字').setRequired(false)),
        async execute(interaction) {
            try {
                // Only defer if not already deferred
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }

                const text = interaction.options.getString('text') || '';
                const text2 = interaction.options.getString('text2') || '';
                const attachment = interaction.options.getAttachment('image');

                // Create a message-like object for the token maker
                const messageObj = {
                    interaction: true,
                    author: interaction.user,
                    attachments: new Map([['0', attachment]]),
                    content: `.token\n${text}\n${text2}`
                };

                // Call the token maker with the message object
                const result = await polaroidTokernMaker(messageObj, messageObj.content, ['.token', text, text2], interaction.client);

                if (result.sendImage) {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    } else if (!interaction.replied) {
                        await interaction.reply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    }
                    return null;
                } else {
                    const responseContent = result.text || '製作失敗，請檢查圖片格式或內容';
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: responseContent });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: responseContent });
                    }
                    return null;
                }
            } catch (error) {
                console.error('Error in token command:', error);
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: '製作失敗，請檢查圖片格式或內容' });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: '製作失敗，請檢查圖片格式或內容' });
                    }
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
                return null;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('token2')
            .setDescription('【透明底圓形】製作Token')
            .addAttachmentOption(option => option.setName('image').setDescription('上傳圖片').setRequired(true))
            .addStringOption(option => option.setName('text').setDescription('第一行文字').setRequired(false))
            .addStringOption(option => option.setName('text2').setDescription('第二行文字').setRequired(false)),
        async execute(interaction) {
            try {
                // Only defer if not already deferred
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }

                const text = interaction.options.getString('text') || '';
                const text2 = interaction.options.getString('text2') || '';
                const attachment = interaction.options.getAttachment('image');

                // Create a message-like object for the token maker
                const messageObj = {
                    interaction: true,
                    author: interaction.user,
                    attachments: new Map([['0', attachment]]),
                    content: `.token2\n${text}\n${text2}`
                };

                // Call the token maker with the message object
                const result = await circleTokernMaker(messageObj, messageObj.content, ['.token2', text, text2], interaction.client);

                if (result.sendImage) {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    } else if (!interaction.replied) {
                        await interaction.reply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    }
                    return null;
                } else {
                    const responseContent = result.text || '製作失敗，請檢查圖片格式或內容';
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: responseContent });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: responseContent });
                    }
                    return null;
                }
            } catch (error) {
                console.error('Error in token2 command:', error);
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: '製作失敗，請檢查圖片格式或內容' });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: '製作失敗，請檢查圖片格式或內容' });
                    }
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
                return null;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('token3')
            .setDescription('【彩色邊框圓形】製作Token')
            .addAttachmentOption(option => option.setName('image').setDescription('上傳圖片').setRequired(true))
            .addStringOption(option => option.setName('text').setDescription('第一行文字').setRequired(false))
            .addStringOption(option => option.setName('text2').setDescription('第二行文字').setRequired(false)),
        async execute(interaction) {
            try {
                // Only defer if not already deferred
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }

                const text = interaction.options.getString('text') || '';
                const text2 = interaction.options.getString('text2') || '';
                const attachment = interaction.options.getAttachment('image');

                // Create a message-like object for the token maker
                const messageObj = {
                    interaction: true,
                    author: interaction.user,
                    attachments: new Map([['0', attachment]]),
                    content: `.token3\n${text}\n${text2}`
                };

                // Call the token maker with the message object
                const result = await circleTokernMaker3(messageObj, messageObj.content, ['.token3', text, text2], interaction.client, interaction.member.displayName);

                if (result.sendImage) {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    } else if (!interaction.replied) {
                        await interaction.reply({ 
                            content: `你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, 
                            files: [result.sendImage] 
                        });
                        // Delete the temporary file after sending
                        fs.unlinkSync(result.sendImage);
                    }
                    return null;
                } else {
                    const responseContent = result.text || '製作失敗，請檢查圖片格式或內容';
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: responseContent });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: responseContent });
                    }
                    return null;
                }
            } catch (error) {
                console.error('Error in token3 command:', error);
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: '製作失敗，請檢查圖片格式或內容' });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: '製作失敗，請檢查圖片格式或內容' });
                    }
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
                return null;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('tokenupload')
            .setDescription('【圖片上傳】將圖片上傳至imgur')
            .addAttachmentOption(option => option.setName('image').setDescription('上傳圖片').setRequired(true)),
        async execute(interaction) {
            try {
                // Only defer if not already deferred
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }
                
                const attachment = interaction.options.getAttachment('image');
                
                // Create a message-like object for the upload function
                const messageObj = {
                    interaction: true,
                    author: interaction.user,
                    attachments: new Map([['0', attachment]])
                };
                
                // Call the upload function with the message object
                const result = await uploadImage(messageObj, interaction.client);
                
                // Always respond to the interaction
                if (result.text && result.text.includes('http')) {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: result.text });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: result.text });
                    }
                } else {
                    const responseContent = result.text || '上傳失敗，請檢查圖片格式或內容';
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: responseContent });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: responseContent });
                    }
                }
                return null;
            } catch (error) {
                console.error('Error in tokenupload command:', error);
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: '上傳失敗，請檢查圖片格式或內容' });
                    } else if (!interaction.replied) {
                        await interaction.reply({ content: '上傳失敗，請檢查圖片格式或內容' });
                    }
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
                return null;
            }
        }
    }
];


function colorTextBuilder({ size, text, text2, position }) {
    const singleLine = text2 ? false : true;
    const textSize = singleLine ? size[0] : size[1];
    let svgScript = `
    <svg width="520" height="520">
      <style>
      .outline {     paint-order: stroke;     stroke: black;     stroke-width: 5px; }
      .title { fill: #bbafaf; font-size: ${textSize}px; font-weight: bold;}
      .shadow {
          -webkit-filter: drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7));
          filter: drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7));
          /* Similar syntax to box-shadow */
        }
      </style>
    `;
    svgScript += singleLine ? `<text x="50%" y="${position}%" text-anchor="middle" class="title shadow outline">${text}</text></svg>` :
        `<text x="50%" y="84%" text-anchor="middle" class="title shadow outline">${text}</text>
  <text x="50%" y="97%" text-anchor="middle" class="title shadow outline">${text2}</text></svg>`;

    return singleLine ? Buffer.from(svgScript) : Buffer.from(svgScript);
}
function getFileExtension(imageUrl) {
    const parsedUrl = new URL(imageUrl);
    const pathname = parsedUrl.pathname;
    const extname = path.extname(pathname);
    return extname;
}

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand,
    // Export helper functions for testing
    getAvatar,
    getName,
    getFileExtension,
    colorTextBuilder
};

/**
 * 
 * 
 *    const colors = await getColors(circleToken, {
            count: 1,
            type: 'image/png'
        });
        const rgbColor = colors[0]._rgb;
        let hexColor = rgbToHex(rgbColor[0], rgbColor[1], rgbColor[2])
        const fineColors = generate('#' + hexColor);
        let rgbFineColors = fineColors.map((color) => {
            return hexToRgb(color)
        })
        console.log('rgbFineColors', rgbFineColors)
 */