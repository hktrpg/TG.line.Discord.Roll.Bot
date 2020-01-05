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
    return [/^.KC$/i, /^(|4|5)d+((\d+)|)$/i]
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
        case /^(|4|5)d+((\d+)|)$/i.test(mainMsg[1]):
            rply.text = 'Demo' + mainMsg[1]
            return rply;
        case /^(?![\s\S])/.test(mainMsg[0] || ''):
            rply.text = 'Demo'
            return rply;
        default:
            break;
    }
}

function compareAllValues(RollResult) {
    //找到一樣->report  剩下最大兩粒
    //如果5D 不會出現大失敗,  但211 會得到11
    //目標值 ≧ 12：
    //[1, 3, 5, 3, 3] → 達成值 6 [5,1] → 成功
    //[1, 3, 5, 3, 3] → 達成值 6 [5,1] → 失敗
    //[1, 3, 5, 3, 3] → 達成值 3 [1,2] → 戲劇性失敗
    //[1, 3, 5, 3, 3] → 達成值 [5,1] → 6
    //
    let temp = [1, 3, 5, 3, 3]
    let result = ""
    temp.sort(function (a, b) {
        return a - b
    });
    console.log(temp)
    for (var i = 0; i < temp.length; i++) {
        for (var j = 0; j < i; j++) {
            if (temp[j] == temp[i]) {

                if (temp.length == 5) {
                    if (temp[3] == 2 && temp[3] == 1) {
                        result = "成功 -> "
                    }

                } else
                    return false
            }
        }
    }

    return true;
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};