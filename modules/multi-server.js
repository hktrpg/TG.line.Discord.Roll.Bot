const checkMongodb = require('../modules/mongodbConnectionError.js');
const schema = require('./schema.js');
let channelList = [];
(async () => {
	try {
		await getRecords();
	} catch (e) {
		console.error('error: multiserver message#10')
		setTimeout(async () => {
			await getRecords();
		}, 1000 * 10)
		//10secs 
	}
})();



async function getRecords() {
	if (!checkMongodb.IsDbOnline) return;
	let result = await schema.multiServer.find({
	}).catch(error => {
		console.error('multi-server #20 mongoDB error: ', error.name, error.reson)
		checkMongodb.dbErrorCourtPlus();
	})
	if (result.length > 0) channelList = result;
}

function multiServerChecker(channelid) {
	if (channelList.length == 0) return false;
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