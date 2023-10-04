"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkMongo... Remove this comment to see the full error message
const checkMongodb = require('../modules/dbWatchdog.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
const TEN_SECOND = 1000 * 10;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelLis... Remove this comment to see the full error message
let channelList: any = [];
(async () => {
	try {
		await getRecords();
	} catch (e) {
		console.error('error: multiserver message#10')
		setTimeout(async () => {
			await getRecords();
		}, TEN_SECOND)
		//10secs 
	}
})();



async function getRecords() {
	if (!checkMongodb.isDbOnline()) return;
	let result = await schema.multiServer.find({
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	}).catch(error => {
		console.error('multi-server #20 mongoDB error: ', error.name, error.reson)
		checkMongodb.dbErrOccurs();
	})
	if (result.length > 0) channelList = result;
}

// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
function multiServerChecker(channelid) {
	if (channelList.length == 0) return false;
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
	let channel = channelList.find(v => {
		return v.channelid == channelid;
	})
	if (channel) {
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
		let result = channelList.find(v => {
			return v.multiId == channel.multiId && v.channelid !== channelid;
		})
		return result;
	}
	return false;

}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
	multiServerChecker,
	getRecords

};