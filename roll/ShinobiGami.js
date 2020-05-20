"use strict";
const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();

function calldice(gameType, message) {
    bcdice.setGameByTitle(gameType)
    bcdice.setMessage(message)
    return bcdice.dice_command()
}
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

var gameName = function () {
    return '【忍神】 .sg (ST FT ET等各種表)'
}

var gameType = function() {
    return 'ShinobiGami:hktrpg'
}
var prefixs = function () {
    return [/^[.]sg$/i, ]
}
var getHelpMessage = function () {
    return "【忍神 ShinobiGami】" + "\
    \n・啓動語 .sg (指令) 如 .sg ST\
    \n・ 各種表・(無印) 場景表 ST／ 大失敗表 FUMBLE／ 感情表 ET／ 變調表 WRONG／ \
    \n戰場表 BT／ 異形表 MT／ 隨機特技決定表 RTT・(弐) 都市場景表 CITY／ \
   \n 館場景表 MST／ 出島場景表 DST・(参) トラブル場景表 TST／ 日常場景表 NST／ \
    \n回想場景表 KST・(死) 東京場景表 TKST／\
     \n戰國場景表 GST・(乱) 戰国變調表 GWT・(リプレイ戰1〜 2 巻) 學校場景表 GAST／\
      \n京都場景表 KYST／ 神社仏閣場景表 JBST・(怪) 怪ファンブル表 KFT／\
       \n怪變調表 KWT・（ その他） 秋空に雪舞えば場景表 AKST／ 災厄場景表 CLST／\
        \n出島EX場景表 DXST／ 斜歯ラボ場景表 HLST／ 夏の終わり場景表 NTST／ \
        \n培養プラント場景表 PLST・ 忍秘伝 中忍試験場景表 HC／ \
        \n滅びの塔場景表 HT／ 影の街で場景表 HK／ 夜行列車場景表 HY／\
         \n病院場景表 HO／ 龍動場景表 HR／ 密室場景表 CHAMBER／ 催眠場景表 HS／ \
		\n "
}
var initialize = function () {
    return rply;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    rply.text = '';
    let result = '';

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        default:
            result = calldice("ShinobiGami", mainMsg[1])
            if (result && result[0] != 1)
                rply.text = mainMsg[1] + result[0];
            return rply;
    }


}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};