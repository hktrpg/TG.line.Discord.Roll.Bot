"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.WHATSAPP_SWITCH) {
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
	return;
}
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (process.env.BROADCAST) {
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
	const WebSocket = require('ws');
	const ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('connected To core-www from Whatsapp!')
		ws.send('connected To core-www from Whatsapp!');
	});
// @ts-expect-error TS(7006): Parameter 'data' implicitly has an 'any' type.
	ws.on('message', async function incoming(data) {
		let object = JSON.parse(data);
		if (object.botname == 'Whatsapp') {
			if (!object.message.text) return;
			console.log('connect To core-www from Whatsapp!')
			await SendToId(object.message.target.id, object.message.text);
			return;
		}
	});
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'candle'.
const candle = require('../modules/candleDays.js'); 
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const qrcode = require('qrcode-terminal');
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const isHeroku = (process.env._ && process.env._.indexOf("heroku")) > 0 ? true : false;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'TargetGM'.
let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('../modules/schema');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'opt'.
const opt = {
	upsert: true,
	runValidators: true
}
const herokuPuppeteer = { headless: true, 'executablePath': '/app/.apt/usr/bin/google-chrome-stable' };
const normalPuppeteer = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'newMessage... Remove this comment to see the full error message
const newMessage = require('./message');

// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.analytics = require('./analytics');
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.z_stop = require('../roll/z_stop');
const {
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Client'.
	Client, LocalAuth, MessageMedia
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
} = require('whatsapp-web.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'isImageURL... Remove this comment to see the full error message
const isImageURL = require('image-url-validator').default;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'imageUrl'.
const imageUrl = (((/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)$/i)));
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MESSAGE_SP... Remove this comment to see the full error message
const MESSAGE_SPLITOR = (((/\S+/ig)));
// Path where the session data will be stored
const SESSION_FILE_PATH = './modules/whatsapp-session.json';

// Load the session data if it has been previously saved
// @ts-expect-error TS(7034): Variable 'sessionData' implicitly has type 'any' i... Remove this comment to see the full error message
let sessionData;
const maxRetry = 6;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'retry'.
let retry = 0;

async function startUp() {
	/**
	if (process.env.mongoURL) {
		let data = await schema.whatsapp.findOne({}).catch(error => console.error('whatsapp #52 mongoDB error: ', error.name, error.reson));
		sessionData = (data && data.sessionData) ? JSON.parse(data.sessionData.toString()) : null;
	}
	if (!isHeroku && require('fs').existsSync(SESSION_FILE_PATH) && !sessionData) {
		try {
			(require('fs').readFileSync(SESSION_FILE_PATH)) ? sessionData = JSON.parse(require('fs').readFileSync(SESSION_FILE_PATH).toString()) : null;
		} catch (error) {
			require('fs').unlink(SESSION_FILE_PATH, function (err) {
				if (err) {
					console.error('whatsapp error: ', err);
				}
			});
		}


	}
	 */
	const client = new Client({
// @ts-expect-error TS(7005): Variable 'sessionData' implicitly has an 'any' typ... Remove this comment to see the full error message
		session: sessionData || null,
		authStrategy: new LocalAuth(),
		puppeteer: (isHeroku) ? herokuPuppeteer : normalPuppeteer
	});
	client.initialize();
	// Save session values to the file upon successful auth
	/**
client.on('authenticated', async (session) => {
sessionData = session;
retry = 0;
if (process.env.mongoURL) {
	await schema.whatsapp.findOneAndUpdate({}, { sessionData: JSON.stringify(session) }, opt).catch(error => console.error('whatsapp #78 mongoDB error: ', error.name, error.reson))
} else if (!isHeroku)
	require('fs').writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
		if (err) {
			console.error('whatsapp error: ', err);
		}
	});
});

client.on('auth_failure', async (msg) => {

// Fired if session restore was unsuccessfull
console.error(`AUTHENTICATION FAILURE: ${msg}\nRetry #${retry}`);
retry++;
if (retry > maxRetry) {
	sessionData = '';
	if (process.env.mongoURL) {
		await schema.whatsapp.findOneAndUpdate({}, { sessionData: '' }, opt).catch(error => console.error('whatsapp #94 mongoDB error: ', error.name, error.reson))
	}
	if (!isHeroku) {
		require('fs').unlink(SESSION_FILE_PATH, function (err) {
			if (err) {
				console.error('whatsapp error: ', err);
			}
		});
	}
}
//startUp();
});
*/


// @ts-expect-error TS(7006): Parameter 'qr' implicitly has an 'any' type.
	client.on('qr', (qr) => {
		// Generate and scan this code with your phone
		console.log('QR RECEIVED\n', qr);
		qrcode.generate(qr, {
			small: true
		});
	});

	client.on('ready', () => {
		console.log('Client is ready!');
	});

	/*
		__proto__:Object {constructor: , __defineGetter__: , __defineSetter__: , …}
		isForwarded:false
		author:undefined
	body:"1e"
	broadcast:false
	from:"85********@c.us"
	fromMe:false
	hasMedia:false
	hasQuotedMsg:false
		location:undefined
		mediaKey:undefined
		mentionedIds:Array(0) []
		timestamp:33333
		to:"852******@c.us"
		type:"chat"
		*/
// @ts-expect-error TS(7006): Parameter 'msg' implicitly has an 'any' type.
	client.on('message', async msg => {
		if (!msg.body || msg.fromMe || msg.isForwarded) return;
		let displaynamecheck = true;
		let inputStr = msg.body;
		let membercount, groupid, trigger = "";
		let getChatDetail = await client.getChatById(msg.from)
		if (getChatDetail.isGroup) {
			groupid = getChatDetail.id._serialized;
			membercount = getChatDetail.participants.length - 1;
		}
		let mainMsg = inputStr.match(MESSAGE_SPLITOR); //定義輸入字串
		if (mainMsg && mainMsg[0]) {
			trigger = mainMsg[0].toString().toLowerCase();

		}
		//指定啟動詞在第一個詞&把大階強制轉成細階
		if ((trigger == ".me" || trigger == ".mee") && !z_stop(mainMsg, groupid)) {
			displaynamecheck = false;
		}
		let privatemsg = 0;

		function privateMsg() {
			if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 1;
				inputStr = inputStr.replace(/^dr\s+/i, '');
			}
			if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 2;
				inputStr = inputStr.replace(/^ddr\s+/i, '');
			}
			if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 3;
				inputStr = inputStr.replace(/^dddr\s+/i, '');
			}
		}
		privateMsg();






// @ts-expect-error TS(2304): Cannot find name 'exports'.
		let target = exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
		if (!target && privatemsg == 0) return null;
		let userid, displayname, channelid, channelKeyword = '';
		//得到暗骰的數據, GM的位置
		//是不是自己.ME 訊息
		//TRUE 即正常

		let userrole = 3;
// @ts-expect-error TS(7034): Variable 'TargetGMTempID' implicitly has type 'any... Remove this comment to see the full error message
		let TargetGMTempID = [];
// @ts-expect-error TS(7034): Variable 'TargetGMTempdiyName' implicitly has type... Remove this comment to see the full error message
		let TargetGMTempdiyName = [];
// @ts-expect-error TS(7034): Variable 'TargetGMTempdisplayname' implicitly has ... Remove this comment to see the full error message
		let TargetGMTempdisplayname = [];

		userid = msg.author;
		let getContact = await msg.getContact();
		displayname = (getContact && getContact.pushname) || '';
		let rplyVal = {};
		if (mainMsg && mainMsg[0])
			trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階
		if (trigger == ".me" || trigger == ".mee") {
			displaynamecheck = false;
		}
		// 訊息來到後, 會自動跳到analytics.js進行骰組分析
		// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

		//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM

		if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
			mainMsg.shift();
// @ts-expect-error TS(2304): Cannot find name 'exports'.
			rplyVal = await exports.analytics.parseInput({
				inputStr: inputStr,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: "Whatsapp",
				displayname: displayname,
				channelid: channelid,
				membercount: membercount
			})
		} else {
			if (channelKeyword == '') {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
				rplyVal = await exports.analytics.parseInput({
					inputStr: inputStr,
					groupid: groupid,
					userid: userid,
					userrole: userrole,
					botname: "Whatsapp",
					displayname: displayname,
					channelid: channelid,
					membercount: membercount
				})
			}
		}
		//LevelUp功能
// @ts-expect-error TS(2339): Property 'LevelUp' does not exist on type '{}'.
		if (groupid && rplyVal && rplyVal.LevelUp) {
// @ts-expect-error TS(2339): Property 'statue' does not exist on type '{}'.
			let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}${(candle.checker()) ? ' ' + candle.checker() : ''}
// @ts-expect-error TS(2339): Property 'LevelUp' does not exist on type '{}'.
			${rplyVal.LevelUp}`
			client.sendMessage(msg.from, text);
		}
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
		if (!rplyVal.text) {
			return;
		}
		//TGcountroll++;
		if (privatemsg > 1 && TargetGM) {
			let groupInfo = privateMsgFinder(groupid) || [];
// @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
			groupInfo.forEach((item) => {
				TargetGMTempID.push(item.userid);
				TargetGMTempdiyName.push(item.diyName);
				TargetGMTempdisplayname.push(item.displayname);
			})

		}
		switch (true) {
			case privatemsg == 1:
				// 輸入dr  (指令) 私訊自己
				if (groupid) {
					SendDR(msg, "@" + displayname + '暗骰給自己');
				}
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
				rplyVal.text = "@" + displayname + "的暗骰\n" + rplyVal.text
				await SendToId(userid, rplyVal, client);
				break;
			case privatemsg == 2:
				//輸入ddr(指令) 私訊GM及自己
				if (groupid) {
					let targetGMNameTemp = "";
					for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
						targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
					}
					SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
				}
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
				await SendToId(msg.from, rplyVal, client);
				for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
					if (userid != TargetGMTempID[i])
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
						await SendToId(TargetGMTempID[i], rplyVal, client);
				}
				break;
			case privatemsg == 3:
				//輸入dddr(指令) 私訊GM
				if (groupid) {
					let targetGMNameTemp = "";
					for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
						targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
					}
					SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: ' + targetGMNameTemp);
				}
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
				for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
					await SendToId(TargetGMTempID[i], rplyVal, client);
				}
				break;
			default:
				if (displaynamecheck == false) {
					await SendToId(msg.from, rplyVal, client);
				} else
					await SendToReply(msg, rplyVal);
				break;
		}
		// msg.delete();
	})

// @ts-expect-error TS(7006): Parameter 'msg' implicitly has an 'any' type.
	client.on('message_ack', async (msg, ack) => {
		if (ack > 0) {
			const chat = await msg.getChat();
			await chat.clearMessages();
		}
	});

// @ts-expect-error TS(7006): Parameter 'msg' implicitly has an 'any' type.
	client.on('group_join', async (msg) => {
		console.log("Whatsapp joined");
		if (msg.client.info.me._serialized == msg.id.participant)
			msg.reply(newMessage.joinMessage());
	});






// @ts-expect-error TS(7006): Parameter 'msg' implicitly has an 'any' type.
	async function SendDR(msg, text) {
		return msg.reply(text);
	}

// @ts-expect-error TS(7006): Parameter 'msg' implicitly has an 'any' type.
	async function SendToReply(msg, rplyVal) {
		for (let i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
				const imageMatch = rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i].match(imageUrl) || null;
				if (imageMatch && imageMatch.length) {
					try {
						let imageVaild = await isImageURL(imageMatch[0]);
						if (imageVaild) {
							const media = await MessageMedia.fromUrl(imageMatch[0]);
							msg.reply(media);
						}
					} catch (error) {
						console.log(error);
					}


				}
				msg.reply(`${(candle.checker()) ? candle.checker() +' ': ''}${rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]}`);
			}
		}
	}
// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
	function privateMsgFinder(channelid) {
		if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
// @ts-expect-error TS(7006): Parameter 'data' implicitly has an 'any' type.
		let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
			data.groupid == channelid
		)
		if (groupInfo && groupInfo.trpgDarkRollingfunction)
			return groupInfo.trpgDarkRollingfunction
		else return [];
	}
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
	process.on('unhandledRejection', () => {

	});







}
startUp()

// @ts-expect-error TS(7006): Parameter 'targetid' implicitly has an 'any' type.
async function SendToId(targetid, rplyVal, client) {
	for (let i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
			const imageMatch = rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i].match(imageUrl) || null;
			if (imageMatch && imageMatch.length) {
				try {
					let imageVaild = await isImageURL(imageMatch[0]);
					if (imageVaild) {
						const media = await MessageMedia.fromUrl(imageMatch[0]);
						client.sendMessage(targetid, media);
					}
				} catch (error) {
					console.error(error)
				}
			}
			client.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);


		}
	}
}

// @ts-expect-error TS(7006): Parameter 'mainMsg' implicitly has an 'any' type.
function z_stop(mainMsg, groupid) {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save || !mainMsg || !groupid) {
		return false;
	}
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	let groupInfo = exports.z_stop.initialize().save.find(e => e.groupid == groupid)
	if (!groupInfo || !groupInfo.blockfunction) return;
// @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
	let match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()))
	if (match) {
		return true;
	} else
		return false;
}