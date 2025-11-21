"use strict";
if (!process.env.mongoURL) {
    return;
}
const checkMongodb = require('../modules/dbWatchdog.js');
const schema = require('./schema.js');
const TEN_SECOND = 1000 * 10;
let channelList = [];
(async () => {
	try {
		await getRecords();
	} catch {
		console.error('error: multiserver message#10')
		setTimeout(async () => {
			await getRecords();
		}, TEN_SECOND)
		//10secs 
	}
})();



async function getRecords() {
	if (!checkMongodb.isDbOnline()) return;
	try {
		let result = await checkMongodb.executeDatabaseOperation(
			async () => await schema.multiServer.find({}),
			'multiServer.find'
		);
		if (result && result.length > 0) channelList = result;
	} catch (error) {
		console.error('multi-server #20 mongoDB error:', error?.name || 'Unknown', error?.reason || error?.message || error)
		checkMongodb.dbErrOccurs();
		return []; // Return empty array on error
	}
}

function multiServerChecker(channelid) {
	if (channelList.length === 0) return false;
	let channel = channelList.find(v => {
		return v.channelid == channelid;
	})
	if (channel) {
		let result = channelList.find(v => {
			return v.multiId == channel.multiId && v.channelid !== channelid;
		})
		return result;
	}
	return false;

}

module.exports = {
	multiServerChecker,
	getRecords

};