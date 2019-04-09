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
  return { default: 'on' }
}

rollDiceCommand = function (abc) {
  switch (true) {
    case /xyz/.test(abc):
      display("• Matched 'xyz' test");
      break;
    case /test/.test(str):
      display("• Matched 'test' test");
      break;
    case /ing/.test(str):
      display("• Matched 'ing' test");
      break;
    default:
      display("• Didn't match any test");
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