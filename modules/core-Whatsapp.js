"use strict";
if (!process.env.WHATSAPP_SWITCH) return;

if (process.env.BROADCAST) {
	const WebSocket = require('ws');
	const ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('[Whatsapp] connected To core-www from Whatsapp!')
		ws.send('connected To core-www from Whatsapp!');
	});
	ws.on('message', async function incoming(data) {
		let object = JSON.parse(data);
		if (object.botname == 'Whatsapp') {
			if (!object.message.text) return;
			console.log('[Whatsapp] connect To core-www from Whatsapp!')
			await SendToId(object.message.target.id, object.message.text);
			return;
		}
	});
}

const qrcode = require('qrcode-terminal');
const {
	Client, LocalAuth, MessageMedia
} = require('whatsapp-web.js');
const isImageURL = require('image-url-validator').default;
const candle = require('../modules/candleDays.js');
const agenda = require('../modules/schedule')
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const isHeroku = (process.env._ && process.env._.indexOf("heroku")) > 0 ? true : false;
let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
// const schema = require('../modules/schema');
// const opt = {
// 	upsert: true,
// 	runValidators: true
// }
const herokuPuppeteer = {
	headless: true,
	'executablePath': '/app/.apt/usr/bin/google-chrome-stable'
};

const normalPuppeteer = {
	headless: true,
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
		'--disable-accelerated-2d-canvas',
		'--disable-gpu'
	],
	'executablePath': process.platform === 'win32'
		? String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
		: (process.platform === 'linux'
			? '/usr/bin/google-chrome'
			: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
};

const newMessage = require('./message');

exports.analytics = require('./analytics');
const rollText = require('./getRoll').rollText;
const imageUrl = (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)$/i);
const MESSAGE_SPLITOR = (/\S+/ig);

async function startUp() {
	try {
		const client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: (isHeroku) ? herokuPuppeteer : normalPuppeteer
		});

		client.initialize().catch(error => {
			console.error('[WhatsApp Init Error]', error);
			if (error.message.includes('Failed to launch')) {
				console.log('[Whatsapp] 請確認已安裝 Google Chrome，或手動設定 Chrome 路徑');
			}
		});

		client.on('qr', (qr) => {
			console.log('[Whatsapp] QR RECEIVED');
			qrcode.generate(qr, { small: true });
		});

		client.on('ready', () => console.log('[Whatsapp] Client is ready!'));

		client.on('message', async msg => {
			try {
				// Validate message object
				if (!msg || !msg.body || msg.fromMe || msg.isForwarded) return;
				
				// Validate required properties
				if (!msg.from) {
					console.error('[WhatsApp] Invalid message object - missing msg.from');
					return;
				}

				// 基本訊息處理
				const chatDetail = await client.getChatById(msg.from);
				const groupInfo = chatDetail.isGroup ? {
					id: chatDetail.id._serialized,
					memberCount: chatDetail.participants.length - 1
				} : null;

				// 分析訊息內容
				const result = await processMessage(msg, groupInfo, client);
				if (!result) return;

				// 發送回覆
				await handleReply(result, msg, client);

			} catch (error) {
				console.error('[WhatsApp Message Error]', error);
			}
		});

		client.on('message_ack', async (msg, ack) => {
			if (ack > 0) {
				try {
					if (msg && typeof msg.getChat === 'function') {
						const chat = await msg.getChat();
						await chat.clearMessages();
					} else {
						console.error('[WhatsApp] msg.getChat is not available in message_ack');
					}
				} catch (error) {
					console.error('[WhatsApp] message_ack error:', error.message);
				}
			}
		});

		client.on('group_join', async (msg) => {
			console.log("[Whatsapp] Whatsapp joined");
			if (msg.client.info.me._serialized == msg.id.participant)
				msg.reply(newMessage.joinMessage());
		});

		setupAgenda(client);
	} catch (error) {
		console.error('[WhatsApp StartUp Error]', error);
	}
}

function setupAgenda(client) {
	if (!agenda || !agenda.agenda) return;

	agenda.agenda.define("scheduleAtMessageWhatsapp", async (job) => {
		try {
			const { groupid, replyText } = job.attrs.data;
			const text = await rollText(replyText);
			await SendToId(groupid, { text: text }, client);
			await job.remove();
		} catch (error) {
			console.error("Schedule Error:", error);
		}
	});

	agenda.agenda.define("scheduleCronMessageWhatsapp", async (job) => {
		try {
			const { groupid, replyText, createAt } = job.attrs.data;
			const text = await rollText(replyText);
			await SendToId(groupid, { text: text }, client);
			if ((new Date(Date.now()) - createAt) >= SIX_MONTH) {
				await job.remove();
				await SendToId(groupid, { text: "已運行六個月, 移除此定時訊息" }, client);
			}
		} catch (error) {
			console.error("Schedule Error:", error);
		}
	});
}

async function processMessage(msg, groupInfo, client) {
	let inputStr = msg.body;
	const mainMsg = inputStr.match(MESSAGE_SPLITOR);
	if (!mainMsg || !mainMsg[0]) return null;

	let displaynamecheck = true;
	let membercount, groupid, trigger = "";
	if (groupInfo) {
		groupid = groupInfo.id;
		membercount = groupInfo.memberCount;
	}

	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	let privatemsg = 0;

	function privateMsg() {
		if (/^dr$/i.test(trigger) && mainMsg && mainMsg[1]) {
			privatemsg = 1;
			inputStr = inputStr.replace(/^dr\s+/i, '');
		}
		if (/^ddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
			privatemsg = 2;
			inputStr = inputStr.replace(/^ddr\s+/i, '');
		}
		if (/^dddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
			privatemsg = 3;
			inputStr = inputStr.replace(/^dddr\s+/i, '');
		}
	}
	privateMsg();

	let target = exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
	if (!target && privatemsg == 0) return null;
	let userid, displayname, channelid, channelKeyword = '';
	let userrole = 3;
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];

	userid = msg.author;
	let getContact;
	let displayname = '';
	try {
		getContact = await msg.getContact();
		displayname = (getContact && getContact.pushname) || (getContact && getContact.name) || '';
	} catch (error) {
		console.error('[WhatsApp] Failed to get contact:', error.message);
		getContact = null;

		// Fallback: try to get display name from message author info
		if (msg.author && typeof msg.author === 'string') {
			// Extract a basic display name from the author ID if possible
			const authorParts = msg.author.split('@');
			if (authorParts[0]) {
				displayname = authorParts[0];
			}
		}

		// If still no display name, use a generic one
		if (!displayname) {
			displayname = 'Unknown User';
		}
	}
	let rplyVal = {};
	if (mainMsg && mainMsg[0])
		trigger = mainMsg[0].toString().toLowerCase();
	if (trigger == ".me" || trigger == ".mee") {
		displaynamecheck = false;
	}
	if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
		mainMsg.shift();
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

	if (groupid && rplyVal && rplyVal.LevelUp) {
		let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}${(candle.checker(userid)) ? ' ' + candle.checker(userid) : ''}
		${rplyVal.LevelUp}`
		client.sendMessage(msg.from, text);
	}


	// Handle .me messages
	if (rplyVal.myspeck) {
		return await __sendMeMessage({ msg, rplyVal, groupid, client });
	}

	if (!rplyVal.text) {
		return;
	}


	if (privatemsg > 1 && TargetGM) {
		let groupInfo = privateMsgFinder(groupid) || [];
		for (const item of groupInfo) {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		}
	}
	return { rplyVal, privatemsg, displayname, groupid, TargetGMTempID, TargetGMTempdiyName, TargetGMTempdisplayname, userid, displaynamecheck };
}

async function handleReply(result, msg, client) {
	const { rplyVal, privatemsg, displayname, groupid, TargetGMTempID, TargetGMTempdiyName, TargetGMTempdisplayname, userid, displaynamecheck } = result;
	switch (true) {
		case privatemsg == 1: {
			if (groupid) {
				SendDR(msg, "@" + displayname + '暗骰給自己');
			}
			rplyVal.text = "@" + displayname + "的暗骰\n" + rplyVal.text
			await SendToId(userid, rplyVal, client);
			break;
		}
		case privatemsg == 2: {
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			await SendToId(msg.from, rplyVal, client);
			for (const element of TargetGMTempID) {
				if (userid != element)
					await SendToId(element, rplyVal, client);
			}
			break;
		}
		case privatemsg == 3: {
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			for (const element of TargetGMTempID) {
				await SendToId(element, rplyVal, client);
			}
			break;
		}
		default: {
			await (displaynamecheck == false ? SendToId(msg.from, rplyVal, client) : SendToReply(msg, rplyVal, userid));
			break;
		}
	}
}

async function __sendMeMessage({ msg, rplyVal, groupid, client }) {
	if (groupid) {
		try {
			await msg.reply(rplyVal.myspeck.content);
		} catch (error) {
			console.log('[WhatsApp] Failed to reply with .me message, sending direct message instead:', error.message);
			try {
				if (msg && typeof msg.getChat === 'function') {
					const chat = await msg.getChat();
					await chat.sendMessage(rplyVal.myspeck.content);
				} else {
					console.error('[WhatsApp] msg.getChat is not available, falling back to client.sendMessage');
					await client.sendMessage(msg.from, rplyVal.myspeck.content);
				}
			} catch (fallbackError) {
				console.error('[WhatsApp] Fallback message sending failed:', fallbackError.message);
			}
		}
	} else {
		await client.sendMessage(msg.from, rplyVal.myspeck.content);
	}
	return;
}

async function SendDR(msg, text) {
	try {
		return await msg.reply(text);
	} catch (error) {
		console.log('[WhatsApp] Failed to reply, sending direct message instead:', error.message);
		try {
			if (msg && typeof msg.getChat === 'function') {
				return await msg.getChat().then(chat => chat.sendMessage(text));
			} else {
				console.error('[WhatsApp] msg.getChat is not available for SendDR');
				return null;
			}
		} catch (fallbackError) {
			console.error('[WhatsApp] SendDR fallback failed:', fallbackError.message);
			return null;
		}
	}
}

async function SendToReply(msg, rplyVal, userid) {
	for (let i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
			const messageText = `${(candle.checker(userid)) ? candle.checker(userid) + ' ' : ''}${rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]}`;
			const imageMatch = rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i].match(imageUrl) || null;
			
			try {
				if (imageMatch && imageMatch.length > 0) {
					try {
						let imageVaild = await isImageURL(imageMatch[0]);
						if (imageVaild) {
							const media = await MessageMedia.fromUrl(imageMatch[0]);
							await msg.reply(media);
						}
					} catch (error) {
						console.error('[WhatsApp] Image processing error:', error.message);
					}
				}
				await msg.reply(messageText);
			} catch (error) {
				console.log('[WhatsApp] Failed to reply, sending direct message instead:', error.message);
				try {
					if (msg && typeof msg.getChat === 'function') {
						const chat = await msg.getChat();
						if (imageMatch && imageMatch.length > 0) {
							try {
								let imageVaild = await isImageURL(imageMatch[0]);
								if (imageVaild) {
									const media = await MessageMedia.fromUrl(imageMatch[0]);
									await chat.sendMessage(media);
								}
							} catch (error) {
								console.error('[WhatsApp] Image processing error:', error.message);
							}
						}
						await chat.sendMessage(messageText);
					} else {
						console.error('[WhatsApp] msg.getChat is not available, cannot send fallback message');
					}
				} catch (fallbackError) {
					console.error('[WhatsApp] SendToReply fallback failed:', fallbackError.message);
				}
			}
		}
	}
}

function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	return groupInfo && groupInfo.trpgDarkRollingfunction ? groupInfo.trpgDarkRollingfunction : [];
}

async function SendToId(targetid, rplyVal, client) {
	try {
		if (!rplyVal || !rplyVal.text) {
			console.error('[WhatsApp] SendToId: rplyVal or rplyVal.text is undefined');
			return;
		}

		const textChunks = rplyVal.text.toString().match(/[\s\S]{1,2000}/g) || [];
		
		for (let i = 0; i < textChunks.length; i++) {
			if (i == 0 || i == 1 || i == textChunks.length - 2 || i == textChunks.length - 1) {
				const chunk = textChunks[i];
				const imageMatch = chunk.match(imageUrl) || null;
				
				if (imageMatch && imageMatch.length > 0) {
					try {
						let imageVaild = await isImageURL(imageMatch[0]);
						if (imageVaild) {
							const media = await MessageMedia.fromUrl(imageMatch[0]);
							await client.sendMessage(targetid, media);
						}
					} catch (error) {
						console.error('[WhatsApp] SendToId image error:', error.message);
					}
				}
				
				try {
					await client.sendMessage(targetid, chunk);
				} catch (error) {
					console.error('[WhatsApp] SendToId message error:', error.message);
				}
			}
		}
	} catch (error) {
		console.error('[WhatsApp] SendToId general error:', error.message);
	}
}

// Unhandled rejections are handled by the main application error handler in index.js

startUp();
