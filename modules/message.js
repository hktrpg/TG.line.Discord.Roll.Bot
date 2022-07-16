"use strict";
const fs = require('fs');
const schema = require('./schema.js');
const crypto = require('crypto');
var userList = null;
const checkMongodb = require('./dbWatchdog.js');

(async () => {
	try {
		await getRecords();
	} catch (e) {
		console.error('error: message#10')
		setTimeout(async () => {
			await getRecords();
		}, 1000)

	}
})();


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


async function getRecords() {
	if (!checkMongodb.isDbOnline()) return;
	userList = await schema.firstTimeMessage.find({
	}).catch(error => {
		console.error('message #42 mongoDB error: ', error.name, error.reson)
		checkMongodb.dbErrOccurs();
	})
	console.log('message userList Got!')
}

async function newUserChecker(userid, botname) {
	if (!Array.isArray(userList)) return false;
	const hash = crypto.createHash('sha256').update(userid.toString()).digest('base64');
	let user = userList.find(v => {
		return v.userID == hash && v.botname == botname
	})
	if (!user) {
		userList.push({ userID: hash, botname: botname })
		user = new schema.firstTimeMessage({ userID: hash, botname: botname })
		user.save().catch(error => console.error('massage #55 mongoDB error: ', error.name, error.reson));
		return true;
	} else
		return false;

}

module.exports = {
	joinMessage,
	newUserChecker,
	firstTimeMessage
};