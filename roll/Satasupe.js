"use strict";
const {
    DynamicLoader
} = require('bcdice');

async function calldice(gameType, message) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.eval(message);
    return result.text;
}
var variables = {};
var gameName = function () {
    return '【亞俠必死的冒險】 .ss (nR>=x[y,z,c] SRx+y FumbleT)'
}

var gameType = function () {
    return 'Dice:Satasupe:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^[.]ss$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【亞俠必死的冒險】" + "\n\
・啓動語 .ss (指令) 如 .ss nR>=x\n\
・ 判定指令 nR >= x[y, z, c] / nR >= x / nR >= [, , c]\n\
n = 最大擲骰次數、 x = 難易度、 y = 目標成功度、 z = 大失敗率、 c = 必殺率\n\
y, z, c 可以省略, 省略時, y = 無限制, z = 1, c = 13(無)\n\
c 後面加 S 判定成功就結束\n\
例如） 5 R >= 5[10, 2, 7 S]・ 性業値(SRx or SRx + y or SRx - y x = 性業値 y = 修正値)・ 各種表： 在指令結尾加上數字， 可以進行複數擲骰 例） TAGT3・ Tag 決定表(TAGT)・ 命中判定大失敗表(FumbleT)、 致命傷表(FatalT)・ 浪漫大失敗表(RomanceFT)・ 意外表(AccidentT)、 泛用意外表(GeneralAT)・ 在那之後表(AfterT)、 臭飯表(KusaiMT)、 登場表(EnterT)、\n\
Bad Trip表(BudTT)・ 報酬表(Get〜)： 寶物報酬(GetgT)、 實用品(GetzT)、 武器(GetnT)、\n\
奇天烈(GetkT)・ NPC 年齡與喜好(NPCT)・ 裝飾品(GETSSTx x = 裝飾品數、 省略時１)・ 下列指令可以用 + -來修正骰數, = 可以指定骰數\n\
例如） CrimeIET + 1 CrimeIET - 1 CrimeIET = 7・ 情報事件表(〜IET)： 犯罪表(CrimeIET)、 生活表(LifeIET)、\n\
戀愛表(LoveIET)、 教養表(CultureIET)、 戰鬥表(CombatIET)・ 情報事故表(〜IHT)： 犯罪表(CrimeIHT)、 生活表(LifeIHT)、\n\
戀愛表(LoveIHT)、 教養表(CultureIHT)、 戰鬥表(CombatIHT)・ D66骰表\n"
}
var initialize = function () {
    return variables;
}

var rollDiceCommand = async function ({
    mainMsg
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let result = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        default:
            result = await calldice("Satasupe", mainMsg[1])
            if (result)
                rply.text = mainMsg[1] + ' ' + result;
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