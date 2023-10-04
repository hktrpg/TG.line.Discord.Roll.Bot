"use strict";
let rollbase = require('./rollbase.js');
let variables = {};
const gameName = function () {
    return '【貓貓鬼差】.kc xDy z'
}

const gameType = function () {
    return 'Dice:yumingkueichai:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^[.]KC$/i,
        second: /^(|4|5)d+((\d+)|)$/i
    }, {
        first: /^[.]KC$/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【貓貓鬼差】
.kc xDy z 
x 投擲多少粒六面骰 留空為4, 只可輸入4,5或留空 
y 修正值 1-20
z 目標值 1-20
十八啦玩法, 只要出現一個對子就成功, 達成值視為另外兩顆骰子加總
若出現兩對子, 則選較高者
另外, 若達成值為3, 視為戲劇性失敗.`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            return rply;
        case /^(|4|5)d+((\d+)|)$/i.test(mainMsg[1]):
            rply.text = await compareAllValues(mainMsg[1], "" || mainMsg[2])
            return rply;
        default:
            break;
    }
}

async function compareAllValues(triggermsg, msg) {
    let result = ""
    let rollresult = []
    let match = /^(|4|5)(d)(\d+|)$/i.exec(triggermsg);
    //判斷式  [0]4d3,[1]4,[2]d,[3]3  
    let x = match[1] || 4;
    let y = match[3] || 0
    let z = msg || 0
    if (y > 20) y = 20
    if (z > 20) z = 20
    if (z >= 1) {
        result = "目標值 ≧ " + z + " ：\n"
    }
    for (let i = 0; i < x; i++) {
        rollresult[i] = rollbase.Dice(6)
    }
    result += "[ " + rollresult + " ] → "
    //找到一樣->report  剩下最大兩粒
    //目標值 ≧ 12：
    //[1, 3, 5, 3, 3] → 達成值 6 [5,1] → 成功
    //[1, 3, 5, 3, 3] → 達成值 6 [5,1] → 失敗
    //============================
    //[1, 3, 5, 3, 3] → 失敗
    //[1, 3, 5, 3, 3] → 達成值 3 [1,2] → 戲劇性失敗
    //[1, 3, 5, 3, 3] → 達成值 6 [5,1]  
    //
    let temp = rollresult
    temp.sort(function (a, b) {
        return a - b
    });

    let first = true;
    for (let i = 0; i < temp.length; i++) {
        for (let j = 0; j < i; j++) {
            //如果有對子, 輸出達成值
            if (temp[j] == temp[i] && first == true) {
                first = false
                result += "達成值 "
                let tempresult = 0;
                let tempa = 0;
                let tempb = 0;
                let sum = 0;
                for (let a = temp.length; a >= 0; a--) {
                    if ((a != i && a != j && sum < 2) && temp[a] > 0) {
                        sum++
                        tempresult += temp[a]
                        if (sum == 1) {
                            tempa = temp[a]
                        }
                        if (sum == 2) {
                            tempb = temp[a]
                        }
                    }
                }
                //如果5D 11112 會變成大失敗, 修正變成 達成值11
                if (x == 5 && tempa == 2 && tempb == 1 && temp[0] == 1 && temp[1] == 1 && temp[2] == 1 && temp[3] == 1 && temp[4] == 2) {
                    tempa = 1;
                    tempb = 1
                    tempresult = 2
                }
                if (y > 0) {
                    tempresult = Number(tempresult) + Number(y)
                }
                result += tempresult + " [" + tempa + "," + tempb + "]"
                if (y > 0) result += " +" + y
                if (tempa == 2 && tempb == 1) {
                    result += " → 戲劇性失敗"
                } else if (z >= 1) {
                    result += " → "
                    if (z > tempresult)
                        result += "失敗"
                    if (z <= tempresult)
                        result += "成功"
                }
            }
        }
    }
    if (first == true) {
        result += "失敗"
    }
    if (isNaN(z)) {
        result += "；" + z
    }
    return result;
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};