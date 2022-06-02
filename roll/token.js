"use strict";
const variables = {};
const sharp = require('sharp');
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
        case /^help$/i.test(mainMsg[1]): {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1]) || !mainMsg[1]: {
            //get avatar  or reply message image
            console.log('discordClient', discordMessage, inputStr, mainMsg)
            //attachments[0].value.attachment contentType.match('image')
            const text = await getName(discordMessage, inputStr, mainMsg)
            console.log('text', text)
            const avatar = await getAvatar(discordMessage)
            console.log('avatar', avatar)
            const response = await getImage(avatar);
            const token = await tokernMaker(response);
            console.log('token', token)
            let retries = 5;
            let success = false;
            while (retries-- > 0 && !(success = await addTextOnImage(token, text.text, text.secondLine))) {
                await sleep(500);
            }
            return rply;
        }
        default: {
            break;
        }
    }
}
const getAvatar = async (discordMessage, inputStr, mainMsg) => {
    console.log('discordMessage.attachments.length', discordMessage.attachments.size)
    if (discordMessage.type == 'DEFAULT' && discordMessage.attachments.size == 0) {
        const member = await discordMessage.guild.members.fetch(discordMessage.author)
        return member.displayAvatarURL();
    }
    if (discordMessage.type == 'DEFAULT' && discordMessage.attachments.size > 0) {
        const url = discordMessage.attachments.find(data => data.contentType.match(/image/i))
        return (url && url.url) || null;
    }
    if (discordMessage.type == 'REPLY') {

    }
}

const getName = async (discordMessage, inputStr, mainMsg) => {
    if (!mainMsg[1]) {
        const member = await discordMessage.guild.members.fetch(discordMessage.author)
        let nickname = member ? member.displayName : discordMessage.author.username;
        return { text: nickname, secondLine: '' }
    }
    else {
        return { text: inputStr.split("\n")[0].replace(/\w+\s?/, ''), secondLine: inputStr.split("\n")[1] || '' }
    }

}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const getImage = async url => {
    //	const response = await axios(url, { responseType: 'arraybuffer' })
    //	const buffer64 = Buffer.from(response.data, 'binary').toString('base64')
    //	return buffer64
    return (await axios({ url, responseType: "arraybuffer" })).data;
}
const tokernMaker = async (imageLocation) => {
    try {
        //	let imageSteam = await getImage('https://i1.sndcdn.com/artworks-RS7ebM7TRAFPHKKU-7mHBgg-t500x500.jpg')
        //		console.log('imageSteam', imageSteam)
        const d = new Date();
        let time = d.getTime();
        let name = `tempImage_${time}.png`
        let image = await sharp(imageLocation).resize({ height: 387, width: 375, fit: 'outside' })
        await image.toFile(`./test/new_${name}`)
        let newImage = await sharp((`./test/new_${name}`))
        let metadata = await newImage.metadata();
        let width = (metadata.width < 375) ? metadata.width : 375;
        let height = (metadata.height < 387) ? metadata.height : 387;
        newImage = await newImage.extract({ left: sharp.gravity.center, top: sharp.gravity.center, width, height }).toBuffer()
        newImage = await sharp('./views/image/ONLINE_TOKEN.png')
            .composite(
                [{ input: newImage, blend: 'saturate', top: 28, left: 73 }
                ]
            )
            .toBuffer()
        return newImage;
    } catch (error) {
        console.log('error', error)
    }
}

async function addTextOnImage(token, text = ' ', text2 = ' ') {
    try {
        const svgImage = `
	  <svg width="520" height="520">
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
        await sharp(token)
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                },
            ])
            .toFile(`./temp/token_a.png`);
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