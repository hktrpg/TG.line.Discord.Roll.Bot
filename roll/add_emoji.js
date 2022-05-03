"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【添加Emoji】.emoji'
}

const gameType = function () {
    return 'tool:addEmoji:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^[.]emoji$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【添加Emoji】
Discord 限定功能
用來自動加上不同的emoji
使用方法
reply 一個信息
輸入 .emoji 1 2 3 4 5 a b c heart cloud
就會尋找相關的emoji 並加入`
}
const initialize = function () {
    return variables;
}


const data = require('unicode-emoji-json')
const keywordSet = require('emojilib')
for (const emoji in data) {
    data[emoji]['keywords'] = keywordSet[emoji]
}
//console.log('data[]', data)
//let arr = Object.keys(data).map((k) => data[k])
const arrayEmoji = Object.entries(data);

//console.log('arr[]', arrayEmoji)
const findEmoji = (target) => {
    const emojis = [];
    target.forEach(element => {
        const keywords = element[1].keywords;
        (/^one_|_one$|^one$/i).test(keywords) ? emojis.push(keywords) : null;
    });
    console.log('emojis', emojis)
}
findEmoji(arrayEmoji)
//emoji.search('cof') 
/**
 * 
 * reference:{channelId: '628230419531169842', guildId: '628181436129607680', messageId: '967735222827352085'}
channelId:'628230419531169842'
guildId:'628181436129607680'
messageId:'967735222827352085
 */

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
    membercount,
    discordMessage
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
            if (discordMessage.type !== 'REPLY') {
                rply.text = '請Reply一個信息，來指定要增加emoji的對像'
                rply.quotes = true;
                //   return rply;
            }
            const emojis = [];
            const emojisText = mainMsg.slice(1)
            console.log('emojisText', emojisText)
            console.log(EmojiSet.search({ by_section: 'flags' }))
            // console.log(EmojiSet.search({ by_keyword: 'smile', first_match: true, only_emoji: true }))
            emojisText.forEach(element => {
                //  emojis.push(emoji(element))
                element = element.toString()
                try {
                    console.log('emoji(element)', EmojiSet.search({ by_keyword: element, first_match: true, only_emoji: true }))
                } catch (error) {
                    console.log(error)
                }

            });
            rply.emoji = discordMessage.reference;
            rply.emoji.emoji = emojis;
            console.log('emojis', emojis)
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