"use strict";
if (!process.env.mongoURL) {
	return;
}

const fs = require('fs');
const schema = require('./schema.js');
const crypto = require('crypto');
const checkMongodb = require('./dbWatchdog.js');
const userList = [];



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
	if (!checkMongodb.isDbOnline()) return;
	const hash = crypto.createHash('sha256').update(userid.toString()).digest('base64');
	let user = userList.find(v => v.userID === hash && v.botname === botname) || await schema.firstTimeMessage.findOne({ userID: hash, botname });;

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