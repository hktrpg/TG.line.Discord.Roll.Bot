const rollbase = require('./rollbase.js');
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};
const mathjs = require('mathjs')
gameName = function () {
    return '【魔女狩獵之夜】.wn xDn(+-)y'
}

gameType = function () {
    return 'witch-hunting-night:hktrpg'
}
prefixs = function () {
    return [/^.wn$/i, ]
}
getHelpMessage = function () {
    return "【魔女狩獵之夜】" + "\
    \n.wn xDDn+-y  x骰池 n罪業值 y調整值 \
    \n有第二個D會使用成功數減去失敗數為最後的成功數(可負數)\
\可以沒有D，預設成功值為4\
    \n.wn x@n+-yD 魔改版 x骰池 n罪業值 y調整值\
		\n 魔改版 少於等於罪業值為失敗"
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
        case /^\d/i.test(mainMsg[1]):
            rply.text = await WN(mainMsg[1]).then(async (result) => {
                // console.log(result)
                return await WN2(result, mainMsg[2])
            });
            //console.log('rply.text', rply.text)
            return rply;
        default:
            break;
    }
}

async function WN(message) {
    //x@n(+-y)(D)
    //xD(D)n(+-y)
    //4
    //5d6
    //5d6d
    //5dd6
    //5dd
    //5d6+5-5

    //5@6
    //5@5d
    //5@5-5
    //5@6-5D

    //[0]5 [1]^@|^D [2]D [3]!+-5 [4]+-5
    let key = [];
    let tempmessage = message;
    let regex = /^(\d+)/ig
    key[0] = tempmessage.match(regex) || 1
    tempmessage = tempmessage.replace(regex, '')
    let regex1 = /^([@]|[d])/ig
    key[1] = tempmessage.match(regex1) || 'd'
    tempmessage = tempmessage.replace(regex1, '')
    let regex2 = /d/ig
    key[2] = tempmessage.match(regex2) || ''
    tempmessage = tempmessage.replace(regex2, '')
    let regex3 = /^\d+/
    key[3] = tempmessage.match(regex3) || '4'
    tempmessage = tempmessage.replace(regex3, '')
    key[4] = tempmessage || ''
    // console.log(key)
    return key
}
async function WN2(key, message) {
    //[0]5 [1]^@|^D [2]D [3]!+-5 [4]+-5
    let result = [];
    let success = 0
    let False = 0;
    let time = key[0];
    let method = key[1] || "d";
    let special = key[2] || "";
    let betterthan = 4;
    let theSins = key[3] || 4
    if (method == "@") {
        betterthan = key[3] || 3
    }

    if (method.toString().toLowerCase() == "d") {
        if (key[3] > 4)
            betterthan = 5
    }
    let Adjustment = key[4] || "";
    if (betterthan > 5)
        betterthan = 5
    if (time > 200) time = 200 //限制次數
    for (let i = 0; i < time; i++) {
        result[i] = await rollbase.Dice(6);
        if (result[i] > betterthan)
            success++
        else
            False++
    }
    // time method special > betterthan ; 
    let temp = time + method + special + theSins + '>' + betterthan
    if (message)
        temp += '； ' + message
    temp += " \n[" + result + "]"
    let tempAdj = ''
    try {
        tempAdj = mathjs.eval(Adjustment)
    } catch (error) {
        tempAdj = Adjustment
    }
    if (tempAdj)
        temp += ' ' + tempAdj + '修正'
    if (special) {
        //xD(D)n(+-y)
        temp += " -> " + mathjs.eval(success - False + Adjustment) + "成功"
        return temp
    }

    temp += " - > " + mathjs.eval(success + Adjustment) + "成功"
    return temp
    //export ->
    //6@6-5D
    //6D6D>3-5 -> X 成功
}




module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};