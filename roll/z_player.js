"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};
const yts = require('yt-search')
var gameName = function () {
    return '【Demo】'
}

var gameType = function () {
    return 'Demo:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^YT$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【示範】" + "\
	\n  只是一個Demo\
		\n "
}
var initialize = function () {
    return rply;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
    rply.text = '';
    let ytResult = {};
    let videos = "";
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /^([\S]+)/.test(mainMsg[1] || ''):
            ytResult = await yts(inputStr.replace(mainMsg[0]));
            videos = ytResult.videos
            // playlists = ytResult.playlists || ytResult.lists
            if (Object.keys(videos).length) {
                rply.text = videos[0].url;
            }

            return rply;
        default:
            break;
    }
}
/**
 * { type: 'video',
 
  title: 'Superman Theme',
  description: 'The theme song from Superman: The Movie.',
 
  url: 'https://youtube.com/watch?v=e9vrfEoc8_g',
 
  videoId: 'e9vrfEoc8_g',
 
  seconds: 253,
  timestamp: '4:13',
 
  duration:
   { toString: [Function: toString],
     seconds: 253,
     timestamp: '4:13' },
 
  views: 36195691,
 
  thumbnail: 'https://i.ytimg.com/vi/e9vrfEoc8_g/default.jpg',
  image: 'https://i.ytimg.com/vi/e9vrfEoc8_g/hqdefault.jpg',
 
  ago: '10 years ago',
 
  author:
   { name: 'Super Man',
     id: 'Redmario2569',
     url: '/user/Redmario2569',
     userId: 'Redmario2569',
     userName: 'Super Man',
     userUrl: '/user/Redmario2569',
     channelId: '',
     channelUrl: '',
     channelName: '' } }
 */

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};