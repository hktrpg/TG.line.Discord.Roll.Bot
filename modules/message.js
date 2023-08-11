"use strict";
if (!process.env.mongoURL) {
	return;
}

const fs = require('fs');
const schema = require('./schema.js');
const crypto = require('crypto');
const checkMongodb = require('./dbWatchdog.js');
let userList = null;

(async function getRecords() {
	try {
		if (!checkMongodb.isDbOnline()) return;
		userList = await schema.firstTimeMessage.find({});
		console.log('message userList Got!');
	} catch (error) {
		console.error('message #42 mongoDB error: ', error.name, error.reason);
		checkMongodb.dbErrOccurs();
		setTimeout(getRecords, 1000);
	}
})();

function readMessagesFromFile(filename) {
	const rawData = fs.readFileSync(filename);
	return JSON.parse(rawData);
}

function joinMessages(messages) {
	return messages.join("\n");
}

function joinMessage() {
	const message = readMessagesFromFile("./assets/message.json");
	return joinMessages(message.joinMessage);
}

function firstTimeMessage() {
	const message = readMessagesFromFile("./assets/message.json");
	return joinMessages(message.firstTimeUseMessage);
}

async function newUserChecker(userid, botname) {
	if (!Array.isArray(userList)) return false;

	const hash = crypto.createHash('sha256').update(userid.toString()).digest('base64');
	let user = userList.find(v => v.userID === hash && v.botname === botname);

	if (!user) {
		userList.push({ userID: hash, botname: botname });
		user = new schema.firstTimeMessage({ userID: hash, botname: botname });
		try {
			await user.save();
			return true;
		} catch (error) {
			console.error('message #55 mongoDB error: ', error.name, error.reason);
			return false;
		}
	}

	return false;
}

module.exports = {
	joinMessage,
	newUserChecker,
	firstTimeMessage
};