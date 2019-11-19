

var rply = {
	default: 'on',
	type: 'text',
	text: ''
}; //type是必需的,但可以更改
//heroku labs:enable runtime-dyno-metadata -a <app name>

const wiki = require('wikijs').default;
gameName = function () {
	return 'TEST ONLINE'
}

gameType = function () {
	return 'ONLINE:hktrpg'
}
prefixs = function () {
	return [/^online$/i,]

}

getHelpMessage = function () {
	return "ONLINE\
		\n "
}
initialize = function () {
	return rply;
}

rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
	rply.text = '';
	//let result = {};
	switch (true) {
		case /\S/.test(mainMsg[1]):
			rply.text = await wiki({ apiUrl: 'https://zh.wikipedia.org/w/api.php' }).page(mainMsg[1].toLowerCase())
				.then(page => page.summary())//console.log('case: ', rply)
				.catch(error => {
					if (error == 'Error: No article found')
						return '沒有此條目'
					else { return error }
				})
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

