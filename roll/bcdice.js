const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();

function calldice(gameType, message) {
  bcdice.setGameByTitle(gameType)
  bcdice.setMessage(message)
  return bcdice.dice_command()
}

var rollbase = require('./rollbase.js')
var rply = {
  type: 'text'
}; // type是必需的,但可以更改

// //////////////////////////////////////
// ////////////// Sample
// //////////////////////////////////////

gameName = function () {
  return 'bcdice'
}

gameType = function () {
  return 'bcdice:hktrpg'
}
prefixs = function () {
  return /^bcd$/i
}
getHelpMessage = function () {
  return '・bcDice 擲骰\
  \n使用凍豆骰組\
  \n'
}
initialize = function () {
  return {
    default: 'on',
    type: 'text'
  }
}
//迷宮キングダム, 神我狩, 永遠的後日談,忍神,SW , DX3 ,PF,守護神,朱之孤塔,ShadowRun,DND

rollDiceCommand = function (mainMsg) {
  let result = null;
  switch (true) {
    case /(\d+)MK6|(\d+)MK|^NAMEA|^NAMEB|^NAMEEX|^NAMEFA|^NAME(\d*)|^PNT(\d*)|^MLT(\d*)|^DFT(\d*)|^LRT|^ORT|^CRT|^ART|^FRT|^TBT|^CBT|^SBT|^VBT|^FBT|^THT|^CHT|^SHT|^VHT|^MPT|^T1T|^T2T|^T3T|^T4T|^T5T|^RWIT|^RUIT|^WIT|^LIT|^RIT|^SIT|^IFT|^IDT|^1RET|^2RET|^3RET|^4RET|^5RET|^6RET|^KDT|^KCT|^KMT|^CAT|^FWT|^CFT|^TT|^NT|^ET|^KNT(\d+)|^WORD(\d+)|^ABT|^WBT|^LBT/i.test(mainMsg[1]):
      //迷宮キングダム MeikyuKingdom
      /*
      ・判定　(nMK+m)
　n個のD6を振って大きい物二つだけみて達成値を算出します。修正mも可能です。
　絶対成功と絶対失敗も自動判定します。
・各種表
　・散策表(〜RT)：生活散策表 LRT／治安散策表 ORT／文化散策表 CRT／軍事散策表 ART／お祭り表 FRT
　・休憩表(〜BT)：才覚休憩表 TBT／魅力休憩表 CBT／探索休憩表 SBT／武勇休憩表 VBT／お祭り休憩表 FBT／捜索後休憩表 ABT／全体休憩表 WBT／カップル休憩表 LBT
　・ハプニング表(〜HT)：才覚ハプニング表 THT／魅力ハプニング表 CHT／探索ハプニング表 SHT
　　／武勇ハプニング表 VHT
　・王国災厄表 KDT／王国変動表 KCT／王国変動失敗表 KMT
　・王国名決定表１／２／３／４／５ KNT1／KNT2／KNT3／KNT4
　・痛打表 CAT／致命傷表 FWT／戦闘ファンブル表 CFT
　・道中表 TT／交渉表 NT／感情表 ET／相場表 MPT
　・お宝表１／２／３／４／５ T1T／T2T／T3T／T4T／T5T
　・名前表 NAMEx (xは個数)
　・名前表A NAMEA／名前表B NAMEB／エキゾチック名前表 NAMEEX／ファンタジック名前表 NAMEFA
　・アイテム関連（猟奇戦役不使用の場合をカッコ書きで出力）
　　・デバイスファクトリー　　DFT
　　・アイテムカテゴリ決定表　IDT
　　・アイテム表（〜IT)：武具 WIT／生活 LIT／回復 RIT／探索 SIT／レア武具 RWIT／レア一般 RUIT
　　・アイテム特性決定表　　　IFT
　・ランダムエンカウント表　nRET (nはレベル,1〜6)
　・地名決定表　　　　PNTx (xは個数)
　・迷宮風景表　　　　MLTx (xは個数)
　・単語表１／２／３／４　WORD1／WORD2／WORD3／WORD4
*/
      result = calldice("MeikyuKingdom", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /^MT(\d*)$|^RT$/i.test(mainMsg[1]):
      //神我狩 Kamigakari 
      /*
       ・感情表(ET)
 ・霊紋消費の代償表(RT)
 ・伝奇名字・名前決定表(NT)
 ・魔境臨界表(KT)
 ・獲得素材チャート(MTx xは［法則障害］の［強度］。省略時は１)
　　例） MT　MT3　MT9*/
      result = calldice("Kamigakari", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /(\d+)NC(10)?([\+\-][\+\-\d]+)/i.test(mainMsg[1]):
      //永遠的後日談 Nechronica
      /*
      ・判定　(nNC+m)
　ダイス数n、修正値mで判定ロールを行います。
　ダイス数が2以上の時のパーツ破損数も表示します。
・攻撃判定　(nNA+m)
　ダイス数n、修正値mで攻撃判定ロールを行います。
　命中部位とダイス数が2以上の時のパーツ破損数も表示します。*/
      result = calldice("Nechronica", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /((\w)*ST)|([K]*FT)|(ET)|([GK]?WT)|(BT)|((\w)*RTT)|(MT)|CST|MST|DST|TST|NST|TKST|KST|GST|GAST|KYST|JBST|KFT|GWT|KWT/i.test(mainMsg[1]):
      //忍神 ShinobiGami
      /*
　・(無印)シーン表　ST／ファンブル表　FT／感情表　ET
　　　／変調表　WT／戦場表　BT／異形表　MT／ランダム特技決定表　RTT
　・(弐)都市シーン表　CST／館シーン表　　MST／出島シーン表　DST
　・(参)トラブルシーン表　TST／日常シーン表　NST／回想シーン表　KST
　・(死)東京シーン表　TKST／戦国シーン表　GST
　・(乱)戦国変調表　GWT
　・(リプレイ戦1〜2巻)学校シーン表　GAST／京都シーン表　KYST
　　　／神社仏閣シーン表　JBST
　・(怪)怪ファンブル表　KFT／怪変調表　KWT
　・（その他）秋空に雪舞えばシーン表　AKST／災厄シーン表　CLST
　　／出島EXシーン表　DXST／斜歯ラボシーン表　HLST
　　／夏の終わりシーン表　NTST／培養プラントシーン表　　PLST
　　・忍秘伝　　中忍試験シーン表　HC/滅びの塔シーン表　HT/影の街でシーン表　HK
　　/夜行列車シーン表　HY/病院シーン表　HO/龍動シーン表　HR/密室シーン表　HM/催眠シーン表　HS*/
      result = calldice("ShinobiGami", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /^(S)?MG/i.test(mainMsg[1]):
      //鋼之守護神 メタリックガーディアン MetallicGuadian
      //例) MG+2>=10        2d6+2>=10と同じ（MGが2D6のショートカットコマンド）
      result = calldice("MetallicGuadian", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /(\d+)AL(\d+)(x|\*)(\d+)$/i.test(mainMsg[1]):
      //朱の孤塔のエアゲトラム  Airgetlamh
      /*
      ・命中判定
[n]AL[X]*[p]：「n」で連射数を指定、「X」で目標値を指定、「p」で威力を指定。
「*」は「x」でも代用化。
例：3AL7*5 → 3連射で目標値7、威力5、5AL5x3 → 5連射で目標値5、威力3
*/
      result = calldice("Airgetlamh", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];
    case /^Gr(\d+)?|^FT$|^TT$/i.test(mainMsg[1]):
      //SwordWorld2_0
      result = calldice("SwordWorld2_0", mainMsg[1])
      if (result && result[0] != 1)
        return mainMsg[1] + result[0];

    default:
      break;
  }
}

/*
try {
  var resultroll =calldice('DoubleCross', '100d1000+100d1000+100d1000+100d1000+100d1000+100d1000+100d1000')[0 ];

  //console.log(resultroll);
  switch(1) {
    case x:
      // code block
      break;
    case y:
      // code block
      break;
    default:
      // code block
  }


} catch (e) {
  console.log(e)
}

*/
module.exports = {
  rollDiceCommand: rollDiceCommand,
  initialize: initialize,
  getHelpMessage: getHelpMessage,
  prefixs: prefixs,
  gameType: gameType,
  gameName: gameName
};