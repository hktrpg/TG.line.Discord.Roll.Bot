"use strict";
//heroku labs:enable runtime-dyno-metadata -a <app name>
let chineseConv = require('chinese-conv'); //繁簡轉換
const duckImage = require("@zetetic/duckduckgo-images-api")
const wiki = require('wikijs').default;
const translate = require('@vitalets/google-translate-api').translate;
const { SlashCommandBuilder } = require('discord.js');
let variables = {};
const schema = require('../modules/schema.js'); // eslint-disable-line no-unused-vars
const VIP = require('../modules/veryImportantPerson'); // eslint-disable-line no-unused-vars
const translateChannel = require('../modules/translate'); // eslint-disable-line no-unused-vars
const rollbase = require('./rollbase.js');
const FUNCTION_LIMIT = [0, 2, 4, 6, 8, 9, 9, 9]; // eslint-disable-line no-unused-vars
const opt = { // eslint-disable-line no-unused-vars
	upsert: true,
	runValidators: true
}
const gameName = function () {
	return '【Wiki查詢/圖片搜索】 .wiki .image .tran'
}

const gameType = function () {
	return 'funny:Wiki:hktrpg'
}
const prefixs = function () {
	return [{
		first: /^[.]wiki$|^[.]tran$|^[.]tran[.]\S+$|^[.]image$|^[.]imagee$|^[.]translate$/i,
		second: null
	}]

}

const getHelpMessage = async function () {
    return `【🔍Wiki查詢與翻譯系統】
╭────── 📚維基查詢 ──────
│ 指令: .wiki [條目]
│ 功能: 搜尋維基百科條目
│ 範例: .wiki BATMAN
│
├────── 🖼️圖片搜尋 ──────
│ 指令: .image [關鍵字]
│ 功能:
│ 　• 從Google取得隨機圖片
│ 　• 支援YES/NO隨機選擇
│
│ 特殊用法:
│ 　• .image yesno
│ 　  隨機回答yes或no
│
├────── 🌐即時翻譯 ──────
│ 基本翻譯:
│ 　• .tran [文字]
│ 　• 預設翻譯成繁體中文
│
│ 指定語言:
│ 　• .tran.[語言代碼] [文字]
│ 　• .tran.[語言名稱] [文字]
│
├────── 🗣️語言代碼 ──────
│ 常用代碼:
│ 　• 英文 - en
│ 　• 繁中 - zh-tw
│ 　• 簡中 - zh-cn
│ 　• 日文 - ja
│ 　• 德文 - de
│
│ 完整語言表:
│ github.com/vitalets/google-translate-api/blob/master/languages.js
│
├────── 📝使用範例 ──────
│ • .wiki BATMAN
│ 　查詢蝙蝠俠的維基條目
│
│ • .image cat
│ 　搜尋貓咪相關圖片
│
│ • .tran Hello World
│ 　翻譯成繁體中文
│
│ • .tran.ja 早安
│ 　翻譯成日文
│
├────── ⚠️注意事項 ──────
│ • 翻譯服務由Google提供
│ • 圖片來自Google搜尋
│ • 維基內容可能有延遲
╰──────────────`
}
const initialize = function () {
	return variables;
}

const rollDiceCommand = async function ({
	inputStr,
	mainMsg,
	groupid, // eslint-disable-line no-unused-vars
	channelid, // eslint-disable-line no-unused-vars
	botname, // eslint-disable-line no-unused-vars
	userrole // eslint-disable-line no-unused-vars
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	}; //type是必需的,但可以更改
	let lang = '',
		test = '';
	//let result = {};

	switch (true) {
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = await this.getHelpMessage();
			return rply;
		case /\S+/.test(mainMsg[1]) && /[.]wiki/i.test(mainMsg[0]):
			rply.text = await wiki({
				apiUrl: 'https://zh.wikipedia.org/w/api.php'
			}).page(mainMsg[1].toLowerCase())
				.then(async page => {
					return chineseConv.tify(await page.summary())
				})
				.catch(error => {
					if (error == 'Error: No article found')
						return '沒有此條目'
					else {
						return error
					}
				})
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran$/i.test(mainMsg[0]):
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), {
				to: 'zh-TW'
			}).then(res => {
				return res.text
			}).catch(error => {
				return error.message;
			});
			return rply;
		/**
	case /^[.]translate$/i.test(mainMsg[0]): {
		if (botname !== "Discord") {
			rply.text = '這是Discord 限定功能';
			return rply;
		}
		if (userrole < 3) {
			rply.text = '本功能只能由admin 啓動開關';
			return rply;
		}
		if (/^on$/i.test(mainMsg[1])) {
			let check = await schema.translateChannel.find({
				groupid: groupid,
				switch: true
			}).countDocuments().catch(error => console.error('translate #111 mongoDB error: ', error.name, error.reason));
			let gpLv = await VIP.viplevelCheckGroup(groupid);
			let limit = FUNCTION_LIMIT[gpLv];
			if (check.length >= limit) {
				rply.text = '此群組翻譯上限為' + limit + '條頻道' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
				return rply
			}
			await schema.translateChannel.findOneAndUpdate({
				groupid: groupid,
				channelid: channelid
			}, {
				switch: true
			}, opt);
			translateChannel.translateSwitchOn(channelid)
			rply.text = '此頻道已開啓翻譯功能。'
			return rply
		}
		if (/^off$/i.test(mainMsg[1])) {
			await schema.translateChannel.findOneAndUpdate({
				groupid: groupid,
				channelid: channelid
			}, {
				switch: false
			}, opt);
			translateChannel.translateSwitchOff(channelid)
			rply.text = '此頻道已關閉翻譯功能。'
			return rply
		}

		rply.text = '沒有正確指令，需要輸入.translate on 或.translate off 去啓動/關閉翻譯功能'

		return rply
	}
	 */
		case /\S+/.test(mainMsg[1]) && /^[.]tran[.]\S+$/.test(mainMsg[0]):
			lang = /.tran.(\S+)/;
			test = mainMsg[0].match(lang)
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), {
				to: test[1].replace(/簡體|簡中|簡|zh-cn/, "zh-CN").replace(/英文|英語|英/, "en").replace(/德文|德語|德/, "de").replace(/日文|日語|日/, "ja")
			}).then(res => {
				return res.text
			}).catch(error => {
				console.error('tran error:', error.message)
				return error.message + "\n常用語言代碼: 英=en, 簡=zh-cn, 德=de, 日=ja\n例子: .tran.英\n.tran.日\n.tran.de";
			});
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]image$/i.test(mainMsg[0]):
			try {
				rply.text = await searchImage(inputStr, mainMsg, true)
				rply.type = 'image'
			} catch {
				console.error('.image error #108')
				return rply;
			}
			return rply;

		case /\S+/.test(mainMsg[1]) && /^[.]imagee$/i.test(mainMsg[0]):
			//成人版
			try {
				rply.text = await searchImage(inputStr, mainMsg, false)
				rply.type = 'image'
			} catch {
				console.error('.image error #119')
				return rply;
			}
			return rply;
		default:
			break;
	}
}

async function searchImage(inputStr, mainMsg, safe) {
	let keyword = inputStr.replace(mainMsg[0] + " ", "")
	//let page = Math.floor((Math.random() * (10)) * 10) + 1;
	if (/^yesno$/i.test(mainMsg[1])) {
		//隨機YES NO
		let A = ['yes', 'no']
		keyword = A[rollbase.Dice(A.length) - 1] + " GIF";
	}
	return await duckImage.image_search({
		query: keyword,
		moderate: safe
	})
		.then(async images => {
			if (images[0] && images[0].image) {
				//let resultnum = Math.floor((Math.random() * (images.length)) + 0)
				let resultnum = rollbase.Dice(images.length) - 1;
				return images[resultnum].image;
			} else {
				return '沒有結果'
			}

		}).catch(error => {
			console.error('duckImage error:', error & error.respone && error.respone.statusText)
		})
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('wiki')
            .setDescription('搜尋維基百科條目')
            .addStringOption(option => 
                option.setName('entry')
                    .setDescription('要搜尋的維基條目')
                    .setRequired(true)),
        async execute(interaction) {
            const entry = interaction.options.getString('entry');
            return `.wiki ${entry}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('imagesearch')
            .setDescription('搜尋圖片')
            .addStringOption(option => 
                option.setName('keyword')
                    .setDescription('搜尋關鍵字')
                    .setRequired(true)),
        async execute(interaction) {
            const keyword = interaction.options.getString('keyword');
            return `.image ${keyword}`;
        }
    }
];

module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName,
	discordCommand: discordCommand
};