const BCDice = require('bcdice-js').BCDice; // CommonJS

const bcdice = new BCDice();

function calldice(gameType, message) {
    bcdice.setGameByTitle(gameType)
    bcdice.setMessage(message)
    return bcdice.dice_command()

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
