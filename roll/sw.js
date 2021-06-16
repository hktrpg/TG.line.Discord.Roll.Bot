"use strict";
const {
    DynamicLoader
} = require('bcdice');

async function calldice(gameType, message) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.eval(message);
    if (result.text) return result.text
    else return null;
}
async function callHelp(gameType) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.HELP_MESSAGE;
    return result;
}
var variables = {};

var gameName = function () {
    return '【劍世界2.5】.sw (Kx Gr FT TT)'
}

var gameType = function () {
    return 'Dice:sw2.5:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^[.]sw$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【劍世界2.5】" + "\n\
・啓動語 .sw (指令) 如 .sw K20\n\
自動的成功、成功、失敗、自動的失敗の自動判定を行います。\n\
\n\
・レーティング表 (Kx)\n\
Kキーナンバー+ボーナスの形で記入します。\n\
ボーナスの部分に「K20+K30」のようにレーティングを取ることは出来ません。\n\
また、ボーナスは複数取ることが出来ます。\n\
レーティング表もダイスロールと同様に、他のプレイヤーに隠れてロールすることも可能です。\n\
例）K20   K10+5   k30   k10+10   Sk10-1   k10+5+2\n\
\n\
・クリティカル値の設定\n\
クリティカル値は [クリティカル値]で指定します。\n\
指定しない場合はクリティカル値10とします。\n\
クリティカル処理が必要ないときは13などとしてください。(防御時などの対応)\n\
またタイプの軽減化のために末尾に「@クリティカル値」でも処理するようにしました。\n\
例）K20[10]   K10+5[9]   k30[10]   k10[9]+10   k10-5@9\n\
\n\
・ダイス目の修正（運命変転やクリティカルレイ用）\n\
末尾に「$修正値」でダイス目に修正がかかります。\n\
$＋１と修正表記ならダイス目に＋修正、＄９のように固定値ならダイス目をその出目に差し替え。\n\
クリティカルした場合でも固定値や修正値の適用は最初の一回だけです。\n\
例）K20$+1   K10+5$9   k10-5@9$+2   k10[9]+10$9\n\
\n\
・ダイス目の修正（必殺攻撃用）\n\
「＃修正値」でダイス目に修正がかかります。\n\
クリティカルした場合でも修正値の適用は継続されます。\n\
例）K20#1   k10-5@9#2\n\
\n\
・首切り刀用レーティング上昇 r10\n\
例）K20r10 K30+24@8R10 K40+24@8$12r10\n\
\n\
・グレイテストフォーチュンは末尾に gf\n\
例）K20gf K30+24@8GF K40+24@8$12r10gf\n\
\n\
・超越判定用に2d6ロールに 2D6@10 書式でクリティカル値付与が可能に。\n\
例）2D6@10 2D6@10+11>=30\n\
\n\
・成長 (Gr)\n\
末尾に数字を付加することで、複数回の成長をまとめて行えます。\n\
例）Gr3\n\
\n\
・防御ファンブル表 (FT)\n\
防御ファンブル表を出すことができます。\n\
\n\
・絡み効果表 (TT)\n\
絡み効果表を出すことができます。\n\
		 "
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
    let result = ''
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        default:
            result = await calldice("SwordWorld2.5", mainMsg[1])
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