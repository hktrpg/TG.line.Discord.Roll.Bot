const fs = require('fs');
const schema = require('../modules/core-schema.js');
const crypto = require('crypto');

function joinMessage() {
	const rawdata = fs.readFileSync("./assets/message.json");
	const message = JSON.parse(rawdata);
	let newJoinMessage = ""
	for (let index = 0; index < message.joinMessage.length; index++) {
		newJoinMessage += message.joinMessage[index] + "\n";
	}
	return newJoinMessage;
}

function firstTimeMessage() {
	const rawdata = fs.readFileSync("./assets/message.json");
	const message = JSON.parse(rawdata);
	let newfirstTimeUseMessage = ""
	for (let index = 0; index < message.firstTimeUseMessage.length; index++) {
		newfirstTimeUseMessage += message.firstTimeUseMessage[index] + "\n";
	}
	return newfirstTimeUseMessage;
}


async function newUserChecker(userid, botname) {
	const hash = crypto.createHash('sha256').update(userid.toString()).digest('base64');
	let user = await schema.firstTimeMessage.findOne({
		userID: hash,
		botname: botname
	})
	if (!user) {
		user = new schema.firstTimeMessage({ userID: hash, botname: botname })
		await user.save();
		return true;
	} else
		return false;

}

module.exports = {
	joinMessage,
	newUserChecker,
	firstTimeMessage
};