var rply = {
	default: 'on',
	type: 'text',
	text: ''
}; //type是必需的,但可以更改
//heroku labs:enable runtime-dyno-metadata -a <app name>

const wiki = require('wikijs').default;
const timer = require('timer');
const translate = require('@vitalets/google-translate-api');
gameName = function () {
	return 'Wiki查詢/即時翻譯'
}

gameType = function () {
	return 'Wiki:hktrpg'
}
prefixs = function () {
	return [/^[.]wiki$|^[.]tran$|^[.]tran[.]\S+$/i,]

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
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = this.getHelpMessage();
			return rply;
		case /\S+/.test(mainMsg[1]) && /[.]wiki/.test(mainMsg[0]):
			rply.text = await wiki({
				apiUrl: 'https://zh.wikipedia.org/w/api.php'
			}).page(mainMsg[1].toLowerCase())
				.then(page => page.summary()) //console.log('case: ', rply)
				.catch(error => {
					if (error == 'Error: No article found')
						return '沒有此條目'
					else {
						return error
					}
				})
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran$/.test(mainMsg[0]):
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), { to: 'zh-TW' }).then(res => {
				return res.text
			}).catch(err => {
				return err.message;
			});
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran[.]\S+$/.test(mainMsg[0]):
			let lang = /.tran.(\S+)/;
			let test = mainMsg[0].match(lang)
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), { to: test[1] }).then(res => {
				//console.log(res.from.language.iso);
				return res.text
			}).catch(err => {
				console.log(err.message)
				return err.message;
			});
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