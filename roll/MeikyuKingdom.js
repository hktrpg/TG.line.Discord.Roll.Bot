const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();

var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

gameName = function () {
    return '迷宮王國 .mk'
}

gameType = function () {
    return 'MeikyuKingdom:hktrpg'
}
prefixs = function () {
    return /^[.]mk$/i
}
getHelpMessage = function () {
    return "【迷宮王國MeikyuKingdom】" + "\
	\n・啓動語 .mk (指令) 如 .mk 5mk\
    \n・判定　(nMK+m)\
    \nn個のD6を振って大きい物二つだけみて達成値を算出します。修正mも可能です。\
    \n絶対成功と絶対失敗も自動判定します。\
    \n・各種表\
    \n・散策表(〜RT)：生活散策表 LRT／治安散策表 ORT／文化散策表 CRT／軍事散策表 ART／お祭り表 FRT\
    \n・休憩表(〜BT)：才覚休憩表 TBT／魅力休憩表 CBT／探索休憩表 SBT／武勇休憩表 VBT／お祭り休憩表 FBT／捜索後休憩表 ABT／全体休憩表 WBT／カップル休憩表 LBT\
    \n・ハプニング表(〜HT)：才覚ハプニング表 THT／魅力ハプニング表 CHT／探索ハプニング表 SHT\
    \n／武勇ハプニング表 VHT\
    \n・王国災厄表 KDT／王国変動表 KCT／王国変動失敗表 KMT\
    \n・王国名決定表１／２／３／４／５ KNT1／KNT2／KNT3／KNT4\
    \n・痛打表 CAT／致命傷表 FWT／戦闘ファンブル表 CFT\
    \n・道中表 TT／交渉表 NT／感情表 ET／相場表 MPT\
    \n・お宝表１／２／３／４／５ T1T／T2T／T3T／T4T／T5T\
    　\n・名前表 NAMEx (xは個数)\
    　\n・名前表A NAMEA／名前表B NAMEB／エキゾチック名前表 NAMEEX／ファンタジック名前表 NAMEFA\
    　\n・アイテム関連（猟奇戦役不使用の場合をカッコ書きで出力）\
    　　\n・デバイスファクトリー　　DFT\
    　　\n・アイテムカテゴリ決定表　IDT\
    　　\n・アイテム表（〜IT)：武具 WIT／生活 LIT／回復 RIT／探索 SIT／レア武具 RWIT／レア一般 RUIT\
    　　\n・アイテム特性決定表　　　IFT\
    　\n・ランダムエンカウント表　nRET (nはレベル,1〜6)\
    　\n・地名決定表　　　　PNTx (xは個数)\
    　\n・迷宮風景表　　　　MLTx (xは個数)\
    　\n・単語表１／２／３／４　WORD1／WORD2／WORD3／WORD4\
		\n"
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
    rply.text = '';
    //let result = {};
    switch (true) {
        case /(\d+)MK6|(\d+)MK|^NAMEA|^NAMEB|^NAMEEX|^NAMEFA|^NAME(\d*)|^PNT(\d*)|^MLT(\d*)|^DFT(\d*)|^LRT|^ORT|^CRT|^ART|^FRT|^TBT|^CBT|^SBT|^VBT|^FBT|^THT|^CHT|^SHT|^VHT|^MPT|^T1T|^T2T|^T3T|^T4T|^T5T|^RWIT|^RUIT|^WIT|^LIT|^RIT|^SIT|^IFT|^IDT|^1RET|^2RET|^3RET|^4RET|^5RET|^6RET|^KDT|^KCT|^KMT|^CAT|^FWT|^CFT|^TT|^NT|^ET|^KNT(\d+)|^WORD(\d+)|^ABT|^WBT|^LBT/i.test(mainMsg[1]):
            bcdice.setGameByTitle("MeikyuKingdom")
            bcdice.setMessage(mainMsg[1])
            rply.text = mainMsg[1] + ' ' + bcdice.dice_command()[0]
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