return;
const schema = require('./schema.js');
const channelList = [];
const translate = require('@vitalets/google-translate-api');
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



async function getRecords() {
	let result = await schema.translateChannel.find({
	}).catch(error => console.error('translate #20 mongoDB error: ', error.name, error.reson))
	console.log('translateChannel channelList Got!')
	if (result) channelList.push(...result);
}

function translateChecker(channelid) {
	if (!Array.isArray(channelList)) return false;
	let channel = channelList.find(v => {
		return v.channelid == channelid && v.switch === true;
	})
	if (channel) return true
	else return false;
}
async function translateText(inputStr) {
	let text = await translate(inputStr, {
		to: 'zh-TW'
	}).then(res => {
		return res.text
	}).catch(err => {
		return err.message;
	});
	return text;
}

function translateSwitchOn(channelid) {
	let channel = channelList.find(v => {
		return v.channelid == channelid
	})
	if (channel) channel.switch = true;
	else channelList.push({
		channelid: channelid,
		switch: true
	})
	console.log('translateSwitchOn', channelList)
}


function translateSwitchOff(channelid) {
	let channel = channelList.find(v => {
		return v.channelid == channelid
	})
	if (channel) channel.switch = false;
	console.log('translateSwitchOn', channelList)
}

module.exports = {
	translateChecker,
	translateText,
	translateSwitchOn,
	translateSwitchOff
};