// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
return;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelLis... Remove this comment to see the full error message
const channelList = [];
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'translate'... Remove this comment to see the full error message
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
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	}).catch(error => console.error('translate #20 mongoDB error: ', error.name, error.reson))
	console.log('translateChannel channelList Got!')
	if (result) channelList.push(...result);
}

// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
function translateChecker(channelid) {
	if (!Array.isArray(channelList)) return false;
	let channel = channelList.find(v => {
		return v.channelid == channelid && v.switch === true;
	})
	if (channel) return true
	else return false;
}
// @ts-expect-error TS(7006): Parameter 'inputStr' implicitly has an 'any' type.
async function translateText(inputStr) {
	let text = await translate(inputStr, {
		to: 'zh-TW'
// @ts-expect-error TS(7006): Parameter 'res' implicitly has an 'any' type.
	}).then(res => {
		return res.text
// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
	}).catch(err => {
		return err.message;
	});
	return text;
}

// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
function translateSwitchOn(channelid) {
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
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


// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
function translateSwitchOff(channelid) {
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
	let channel = channelList.find(v => {
		return v.channelid == channelid
	})
	if (channel) channel.switch = false;
	console.log('translateSwitchOn', channelList)
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
	translateChecker,
	translateText,
	translateSwitchOn,
	translateSwitchOff
};