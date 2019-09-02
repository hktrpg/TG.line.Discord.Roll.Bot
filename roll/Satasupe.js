var rollbase = require('./rollbase.js');
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
    return '亞俠必死的冒險 .ss (nR>=x[y,z,c] SRx+y FumbleT) (help 說明)'
}

gameType = function () {
    return 'Satasupe:hktrpg'
}
prefixs = function () {
    return [/^[.]ss$/i, ]
}
getHelpMessage = function () {
    return "【亞俠必死的冒險】" + "\
    \n・啓動語 .ss (指令) 如 .ss nR>=x\
	\n  ・判定コマンド　(nR>=x[y,z,c] or nR>=x or nR>=[,,c] etc)\
    \n　nが最大ロール回数、xが難易度、yが目標成功度、zがファンブル値、cが必殺値。\
    \n　y と z と c は省略可能です。(省略時、y＝無制限、z＝1、c=13(なし))\
    \n　c の後ろにSを記述すると必殺が出た時点で判定を終了します。\
    \n　例）5R>=5[10,2,7S]\
    \n ・性業値コマンド(SRx or SRx+y or SRx-y x=性業値 y=修正値)\
    \n ・各種表 ： コマンド末尾に数字を入れると複数回の一括実行が可能　例）TAGT3\
    \n　・タグ決定表(TAGT)\
    \n　・命中判定ファンブル表(FumbleT)、致命傷表(FatalT)\
    \n　・ロマンスファンブル表(RomanceFT)\
    \n　・アクシデント表(AccidentT)、汎用アクシデント表(GeneralAT)\
    \n　・その後表　(AfterT)、臭い飯表(KusaiMT)、登場表(EnterT)、\
    \n　バッドトリップ表(BudTT)\
    \n　・報酬表(Get〜) ： ガラクタ(GetgT)、実用品(GetzT)、値打ち物(GetnT)、\
    \n　　奇天烈(GetkT)\
    \n　・NPCの年齢と好みを一括出力(NPCT)\
    \n　・「サタスペ」のベースとアクセサリを出力(GETSSTx　xはアクセサリ数、省略時１)\
    \n  ・以下のコマンドは +,- でダイス目修正、=でダイス目指定が可能\
    \n　例）CrimeIET+1　CrimeIET-1　CrimeIET=7\
    \n　・情報イベント表(〜IET) ： 犯罪表(CrimeIET)、生活表(LifeIET)、\
    \n　恋愛表(LoveIET)、教養表(CultureIET)、戦闘表(CombatIET)\
    \n　・情報ハプニング表(〜IHT) ： 犯罪表(CrimeIHT)、生活表(LifeIHT)、\
    \n　恋愛表(LoveIHT)、教養表(CultureIHT)、戦闘表(CombatIHT)\
		\n "
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
    rply.text = '';
    let result = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        default:
            result = calldice("Satasupe", mainMsg[1])
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


