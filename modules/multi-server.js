"use strict";
if (!process.env.mongoURL) {
    return;
}
// const checkMongodb = require('../modules/dbWatchdog.js');
// const schema = require('./schema.js');
const TEN_SECOND = 1000 * 10;
// let channelList = [];
(async () => {
	try {
		await getRecords();
	} catch {
		console.error('[Multi-Server] Error in message handling')
		setTimeout(async () => {
			await getRecords();
		}, TEN_SECOND)
		//10secs 
	}
})();



async function getRecords() {
	// Function disabled - early return
	return;
}

function multiServerChecker() {
	// Function disabled - early return
	return false;
}

module.exports = {
	multiServerChecker,
	getRecords
};