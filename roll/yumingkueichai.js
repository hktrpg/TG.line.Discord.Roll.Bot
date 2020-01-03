var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

gameName = function () {
    return '貓貓鬼差'
}

gameType = function () {
    return 'yumingkueichai:hktrpg'
}
prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [/^.KC$/i, /^[|5|4]d+((\d+)|)$/i]
}
getHelpMessage = function () {
    return "【貓貓鬼差】" + "\
	\n .kr xDy z \
    \n x 投擲多少粒六面骰 留空為4, 只可輸入4,5或留空 \
    \n y 修正值 1-20\
        \n z 目標值 1-20\
        \n 十八啦玩法, 只要出現一個對子就成功, 達成值視為另外兩顆骰子加總\
        \n 若出現兩對子, 則選較高者\
        \n 另外, 若達成值為3, 視為戲劇性失敗."
}
initialize = function () {
    return rply;
}

rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
    rply.text = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /^\d+$/i.test(mainMsg[0]):
            rply.text = 'Demo' + mainMsg[1]
            return rply;
        case /^(?![\s\S])/.test(mainMsg[0] || ''):
            rply.text = 'Demo'
            return rply;
        default:
            break;
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