"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const variables = {};
const jimp = require('jimp');
const sharp = require('sharp');
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const getColors = require('get-image-colors')
const generate = require('@ant-design/colors').generate
const GeoPattern = require('geopattern');

const gameName = function () {
    return '【製作Token】.token'
}

const gameType = function () {
    return 'Tool:Token:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.token$|^\.token2$|^\.token3$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【製作Token】.token
用來製作跑團Token的功能
可以自定兩行名字和圖片內容

分別有兩種製作外框樣式
1. .token 為方形(相片型)
2. .token2 為透底圓形
3. .token3 為透底圓形，外框為根據你的Discord名字或輸入名字決定的顏色

使用方法:
reply一個有圖片的訊息 或傳送一張圖片時，輸入.token 
就可以產生一個token圖片
如果沒有指定圖片，則自動使用你的頭像 作為token

同時可以輸入兩行內容，作為圖片上的文字
如.token 
Sad
HKTRPG

`
}
const initialize = function () {
    return variables;
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
        case /^\.token2/.test(mainMsg[0]): {
            //get avatar  or reply message image
            return await circleTokernMaker(discordMessage, inputStr, mainMsg, discordClient);
        }
        case /^\.token3/.test(mainMsg[0]): {
            //get avatar  or reply message image
            return await circleTokernMaker3(discordMessage, inputStr, mainMsg, discordClient, displaynameDiscord);
        }
        case /^\S/.test(mainMsg[1]) || !mainMsg[1]: {
            //get avatar  or reply message image
            return await polaroidTokernMaker(discordMessage, inputStr, mainMsg, discordClient);
        }
        default: {
            break;
        }
    }
}

const circleTokernMaker = async (discordMessage, inputStr, mainMsg, discordClient) => {
    try {
        let rply = { text: '', sendImage: '' };
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `沒有找到reply 的圖示, 請再次檢查 \n\n${getHelpMessage()}`;
            return rply;
        }
        const response = await getImage(avatar);

        const d = new Date();
        let time = d.getTime();
        let name = `temp_${time}_${text.text}.png`

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
    }
    return rply;
}
const circleTokernMaker3 = async (discordMessage, inputStr, mainMsg, discordClient, displaynameDiscord) => {
    try {
        let rply = { text: '', sendImage: '' };
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `沒有找到reply 的圖示, 請再次檢查 \n\n${getHelpMessage()}`;
            return rply;
        }
        const response = await getImage(avatar);
        // `colors` is an array of color objects
        const d = new Date();
        let time = d.getTime();
        let name = `temp_${time}_${text.text}.png`

        const token = await tokernMaker3(response, name);
        const circleToken = await maskImage(token, './assets/token/tokenCircleMask3.png');

        const pattern = GeoPattern.generate((text.text || displaynameDiscord || 'HKTRPG')).toString().replace('width="188" height="70"', 'width="520" height="520"')
        let url = Buffer.from(
            pattern
        )
        let coloredBase = await sharp(url)
            .resize(520, 520)
            .toBuffer();
        //https://github.com/oliver-moran/jimp/issues/231

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
    }
    return rply;
}

async function maskImage(path, maskPath) {
    const image = await jimp.read(path);
    const mask = await jimp.read(maskPath);
    image.mask(mask, 0, 0)
    return await image.getBufferAsync(jimp.MIME_PNG);
    //    return await image.writeAsync('./assets/token/test2345.png'); // Returns Promise
}

const polaroidTokernMaker = async (discordMessage, inputStr, mainMsg, discordClient) => {
    try {
        let rply = { text: '', sendImage: '' };
        const text = await getName(discordMessage, inputStr, mainMsg)
        const avatar = await getAvatar(discordMessage, discordClient)
        if (!avatar) {
            rply.text = `沒有找到reply 的圖示, 請再次檢查 \n\n${getHelpMessage()}`;
            return rply;
        }

        const response = await getImage(avatar);

        const d = new Date();
        let time = d.getTime();
        let name = `temp_${time}_${text.text}.png`

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
    }
    return rply;
}

const getAvatar = async (discordMessage, discordClient) => {
    if (discordMessage.type === 0 && discordMessage.attachments.size === 0) {
        const member = (discordMessage.guild && await discordMessage.guild.members.fetch(discordMessage.author) || discordMessage.author)
        return member.displayAvatarURL();
    }
    if (discordMessage.type === 0 && discordMessage.attachments.size > 0) {
        const url = discordMessage.attachments.find(data => data.contentType.match(/image/i))
        return (url && url.url) || null;
    }
    //19 = reply
    if (discordMessage.type === 19) {
        const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
        const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId)
        const url = referenceMessage.attachments.find(data => data.contentType.match(/image/i))
        return (url && url.url) || null;
    }
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
    //	const response = await axios(url, { responseType: 'arraybuffer' })
    //	const buffer64 = Buffer.from(response.data, 'binary').toString('base64')
    //	return buffer64
    return (await axios({ url, responseType: "arraybuffer" })).data;
}
const tokernMaker = async (imageLocation, name) => {
    try {

        let image = await sharp(imageLocation).resize({ height: 387, width: 375, fit: 'outside' })
        await image.toFile(`./temp/new_${name}`)
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await newImage.metadata();
        const width = (metadata.width < 375) ? metadata.width : 375;
        const height = (metadata.height < 387) ? metadata.height : 387;
        const left = ((metadata.width - 375) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.width - 375) / 2);
        const top = ((metadata.height - 387) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.height - 387) / 2);
        newImage = await newImage.extract({ left, top, width, height }).toBuffer()
        newImage = await sharp('./views/image/ONLINE_TOKEN.png')
            .composite(
                [{ input: newImage, blend: 'saturate', top: 28, left: 73 }
                ]
            )
            .toBuffer()
        fs.unlinkSync(`./temp/new_${name}`);
        return newImage;
    } catch (error) {
        console.error('#token 142 error', error)
    }
}


const tokernMaker2 = async (imageLocation, name) => {
    try {

        let image = await sharp(imageLocation).resize({ height: 520, width: 520, fit: 'outside' })
        await image.toFile(`./temp/new_${name}`)
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await newImage.metadata();
        const width = (metadata.width < 520) ? metadata.width : 520;
        const height = (metadata.height < 520) ? metadata.height : 520;
        const left = ((metadata.width - 520) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.width - 520) / 2);
        const top = ((metadata.height - 520) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.height - 520) / 2);
        newImage = await newImage.extract({ left, top, width, height }).toBuffer()
        newImage = await sharp('./views/image/ONLINE TOKEN_BASE.png')
            .composite(
                [{ input: newImage, blend: 'saturate', top: 0, left: 0 }
                ]
            )
            .toBuffer()
        fs.unlinkSync(`./temp/new_${name}`);
        return newImage;
    } catch (error) {
        console.error('#token 142 error', error)
    }
}

const tokernMaker3 = async (imageLocation, name) => {
    try {

        let image = await sharp(imageLocation).resize({ height: 520, width: 520, fit: 'outside' })
        await image.toFile(`./temp/new_${name}`)
        let newImage = await sharp((`./temp/new_${name}`))
        let metadata = await newImage.metadata();
        const width = (metadata.width < 520) ? metadata.width : 520;
        const height = (metadata.height < 520) ? metadata.height : 520;
        const left = ((metadata.width - 520) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.width - 520) / 2);
        const top = ((metadata.height - 520) / 2) < 0 ? sharp.gravity.center : parseInt((metadata.height - 520) / 2);
        newImage = await newImage.extract({ left, top, width, height }).toBuffer()
        newImage = await sharp('./views/image/ONLINE TOKEN_BASE.png')
            .composite(
                [
                    { input: newImage, blend: 'saturate', top: 0, left: 0 },
                ])
            .toBuffer()
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
        await image.toFile(`./temp/finally_${name}`)
        return true;
    } catch (error) {
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
        await image.toFile(`./temp/finally_${name}`)
        return true;
    } catch (error) {
        return null;
    }
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return (valueToHex(r) + valueToHex(g) + valueToHex(b));
}
function valueToHex(c) {
    let hex = c.toString(16);
    return hex
}
const discordCommand = [

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