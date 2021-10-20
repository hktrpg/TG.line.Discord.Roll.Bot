const fs = require('fs');
const schema = require('../modules/core-schema.js');


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
	let newJoinMessage = ""
	for (let index = 0; index < message.joinMessage.length; index++) {
		newJoinMessage += message.joinMessage[index] + "\n";
	}
	return newJoinMessage;
}


async function newUserChecker(userid, botname) {
	console.log("AA")
	let user = await schema.firstTimeMessage.findOne({
		userID: userid,
		botname: botname
	})
	if (!user) {
		user = new schema.firstTimeMessage({ userID: userid, botname: botname })
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