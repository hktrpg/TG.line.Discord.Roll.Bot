"use strict";
const variables = {};
const sharp = require('sharp');
const Jimp = require('jimp');
const webp = require('webp-converter');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const gameName = function () {
    return '【製作Token】.token'
}

const gameType = function () {
    return 'Tool:Token:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^token$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【製作Token】
只是一個Demo的第一行
只是一個Demo末行
`
}
const initialize = function () {
    return variables;
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
    membercount, discordMessage
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
        case /^\S/.test(mainMsg[1]): {
            //get avatar  or reply message image
            console.log('discordClient', discordMessage)
            const member = await discordMessage.guild.members.fetch(discordMessage.author)
            //   nickname
            let nickname = member ? member.displayName : discordMessage.author.username;
            let avatar = member.displayAvatarURL();
            console.log('avatar', avatar)
            console.log('nickname', nickname)
            const response = await axios.get(encodeURI(avatar), { timeout: 20000 });
            console.log('response', response)
            const result = await sharp(response).toFile("./temp/nodejs_logo.png");

            let name = await tokernMaker('./test/a.png');
            let retries = 5;
            let success = false;
            while (retries-- > 0 && !(success = await addTextOnImage(name, mainMsg[1], mainMsg[2]))) {
                await sleep(500);
            }
            //final send the image4
            return rply;
        }
        default: {
            break;
        }
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const tokernMaker = async (imageLocation) => {
    try {
        const d = new Date();
        let time = d.getTime();
        let name = `token_${time}_${imageLocation.replaceAll('/', '')}.png`
        let image = await Jimp.read('./views/image/ONLINE_TOKEN.png')
        let targetImage = await Jimp.read(imageLocation)
        targetImage.resize(Jimp.AUTO, 390)
        if (targetImage.bitmap.width < 378)
            targetImage.resize(378, Jimp.AUTO)
        if (targetImage.bitmap.width > 378)
            targetImage.crop((targetImage.bitmap.width - 378) / 2, 0, 378, targetImage.bitmap.height);
        await image.composite(targetImage, 70, 27, {
            mode: Jimp.BLEND_DESTINATION_OVER
        })
            .write(`./temp/temp_${name}`);
        return name;
    } catch (error) {
        console.log('error', error)
    }
}

async function addTextOnImage(name, text, text2) {
    try {
        let med = await sharp(`./temp/temp_${name}`).metadata();
        const width = med.width;
        const height = med.height;
        const svgImage = `
	  <svg width="${width}" height="${height}">
		<style>
		.outline {     paint-order: stroke;     stroke: black;     stroke-width: 5px; }
		.title { fill: #bbafaf; font-size: 62px; font-weight: bold;}
		.shadow {
			-webkit-filter: drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7));
			filter: drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7));
			/* Similar syntax to box-shadow */
		  }
		</style>
		<text x="50%" y="83%" text-anchor="middle" class="title shadow outline">${text}</text>
		<text x="50%" y="96%" text-anchor="middle" class="title shadow outline">${text2}</text>
	  </svg>
	  `;
        const svgBuffer = Buffer.from(svgImage);
        await sharp(`./temp/temp_${name}`)
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                },
            ])
            .toFile(`./temp/token_${name}`);
        return true;

    } catch (error) {
        // console.log(error);
        return false;
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