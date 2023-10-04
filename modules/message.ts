"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) {
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
	return;
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('fs');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'crypto'.
const crypto = require('crypto');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkMongo... Remove this comment to see the full error message
const checkMongodb = require('./dbWatchdog.js');
// @ts-expect-error TS(7034): Variable 'userList' implicitly has type 'any[]' in... Remove this comment to see the full error message
const userList = [];



// @ts-expect-error TS(7006): Parameter 'filename' implicitly has an 'any' type.
function readMessagesFromFile(filename) {
	const rawData = fs.readFileSync(filename);
	return JSON.parse(rawData);
}

// @ts-expect-error TS(7006): Parameter 'messages' implicitly has an 'any' type.
function joinMessages(messages) {
	return messages.join("\n");
}

function joinMessage() {
	const message = readMessagesFromFile("./assets/message.json");
	return joinMessages(message.joinMessage);
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'firstTimeM... Remove this comment to see the full error message
function firstTimeMessage() {
	const message = readMessagesFromFile("./assets/message.json");
	return joinMessages(message.firstTimeUseMessage);
}

// @ts-expect-error TS(7006): Parameter 'userid' implicitly has an 'any' type.
async function newUserChecker(userid, botname) {
	if (!checkMongodb.isDbOnline()) return;
// @ts-expect-error TS(2339): Property 'createHash' does not exist on type 'Cryp... Remove this comment to see the full error message
	const hash = crypto.createHash('sha256').update(userid.toString()).digest('base64');
// @ts-expect-error TS(7005): Variable 'userList' implicitly has an 'any[]' type... Remove this comment to see the full error message
	let user = userList.find(v => v.userID === hash && v.botname === botname) || (await schema.firstTimeMessage.findOne({ userID: hash, botname }));;

	if (!user) {
		userList.push({ userID: hash, botname: botname });
		user = new schema.firstTimeMessage({ userID: hash, botname: botname });
		try {
			await user.save();
			return true;
		} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
			console.error('message #55 mongoDB error: ', error.name, error.reason);
			return false;
		}
	}

	return false;
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
	joinMessage,
	newUserChecker,
	firstTimeMessage
};