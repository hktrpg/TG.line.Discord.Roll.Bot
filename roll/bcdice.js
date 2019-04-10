const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();
function calldice(gameType, message) {
  bcdice.setGameByTitle(gameType)
  bcdice.setMessage(message)
  return bcdice.dice_command()
}

var rollbase = require('./rollbase.js')
var rply = { type: 'text' }; // type是必需的,但可以更改

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
//迷宮キングダム, 神我狩, 永遠的後日談,忍神,COC7, COC,SW , DX3 ,PF,守護神,朱之孤塔,ShadowRun,DND

rollDiceCommand = function (mainMsg) {
  switch (true) {
    case /(\d+)MK6|(\d+)MK|^NAMEA|^NAMEB|^NAMEEX|^NAMEFA|^NAME(\d*)|^PNT(\d*)|^MLT(\d*)|^DFT(\d*)|^LRT|^ORT|^CRT|^ART|^FRT|^THT|^TBT|^CBT|^SBT|^VBT|^FBT|^CHT|^SHT|^VHT|^MPT|^T1T/i.test(mainMsg[1]):
    //迷宮キングダム MeikyuKingdom
      if (calldice("MeikyuKingdom", mainMsg[1])[0] != 1)
        return mainMsg[1] + calldice("MeikyuKingdom", mainMsg[1])[0];
    case /test/.test(mainMsg[1]):
      return calldice();
    case /ing/.test(mainMsg[1]):
      return calldice();
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