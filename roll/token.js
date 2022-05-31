"use strict";
const variables = {};
const sharp = require('sharp');

const Jimp = require('jimp');
const { SlashCommandBuilder } = require('@discordjs/builders');
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
    membercount
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
            await tokernMaker('./test/a.png');

            await tokernMaker('./test/b.png');
            await tokernMaker('./test/c.png');
            await tokernMaker('./test/d.jpg');
            await tokernMaker('./test/f.jpg');
            await tokernMaker('./test/g.jpg');
            await tokernMaker('./test/h.jpg');
            await tokernMaker('./test/i.jpg');

            return rply;
        }
        default: {
            break;
        }
    }
}

const tokernMaker = async (imageLocation) => {
    try {
        const d = new Date();
        let time = d.getTime();
        let image = await Jimp.read('./views/image/ONLINE_TOKEN.png')
        let targetImage = await Jimp.read(imageLocation)
        targetImage.resize(Jimp.AUTO, 390)
        if (targetImage.bitmap.width < 378)
            targetImage.resize(378, Jimp.AUTO)
        targetImage
            .write(`./TEST${time}_${imageLocation.replaceAll('/', '')}.png`);
        if (targetImage.bitmap.width > 378)
            targetImage.crop((targetImage.bitmap.width - 378) / 2, 0, 378, targetImage.bitmap.height);


        image.composite(targetImage, 70, 27, {
            mode: Jimp.BLEND_DESTINATION_OVER
        })
        image
            .write(`./testImageMaskImage_${time}_${imageLocation.replaceAll('/', '')}.png`);

        return image;
    } catch (error) {
        console.log('error', error)
    }
}


const discordCommand = []

function transparentmask(circle, app) {
    //fresh white sprite
    let sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.tint = 0xffffff;
    sprite.x = 0;
    sprite.y = 0;
    sprite.width = 200;
    sprite.height = 150;
    //this will do the trick
    sprite.blendMode = PIXI.BLEND_MODES.SRC_IN;

    let originalContainer = new PIXI.Container();
    originalContainer.addChild(circle);
    originalContainer.addChild(sprite);
    let genTexture = app.renderer.generateTexture(originalContainer);
    return new PIXI.Sprite(genTexture);
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