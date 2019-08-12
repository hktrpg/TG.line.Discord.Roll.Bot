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

gameName = function () {
    return '忍神 .sg (ST FT ET等各種表) (help 說明)'
}

gameType = function () {
    return 'ShinobiGami:hktrpg'
}
prefixs = function () {
    return [/^[.]sg$/i, /\S/]
}
getHelpMessage = function () {
    return "【忍神 ShinobiGami】" + "\
    \n・啓動語 .sg (指令) 如 .sg ST\
	\n・(無印)シーン表　ST／ファンブル表　FT／感情表　ET\
    　　　\n／変調表　WT／戦場表　BT／異形表　MT／ランダム特技決定表　RTT\
    　\n・(弐)都市シーン表　CST／館シーン表　　MST／出島シーン表　DST\
    　\n・(参)トラブルシーン表　TST／日常シーン表　NST／回想シーン表　KST\
    　\n・(死)東京シーン表　TKST／戦国シーン表　GST\
    　\n・(乱)戦国変調表　GWT\
    　\n・(リプレイ戦1〜2巻)学校シーン表　GAST／京都シーン表　KYST\
    　　　\n／神社仏閣シーン表　JBST\
    　\n・(怪)怪ファンブル表　KFT／怪変調表　KWT\
    　\n・（その他）秋空に雪舞えばシーン表　AKST／災厄シーン表　CLST\
    　　\n／出島EXシーン表　DXST／斜歯ラボシーン表　HLST\
    　　\n／夏の終わりシーン表　NTST／培養プラントシーン表　　PLST\
    　　\n・忍秘伝　　中忍試験シーン表　HC/滅びの塔シーン表　HT/影の街でシーン表　HK\
    　　\n/夜行列車シーン表　HY/病院シーン表　HO/龍動シーン表　HR/密室シーン表　HM/催眠シーン表　HS\
		\n "
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
    rply.text = '';
    let result = '';

    switch (true) {
        case /^help$/i.test(mainMsg[1]):
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