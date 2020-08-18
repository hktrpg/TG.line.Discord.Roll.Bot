"use strict";

//heroku labs:enable runtime-dyno-metadata -a <app name>
var chineseConv = require('chinese-conv'); //繁簡轉換
const GoogleImages = require('google-images');
const client = (process.env.CSE_ID && process.env.CSE_API_KEY) ? new GoogleImages(process.env.CSE_ID, process.env.CSE_API_KEY) : '';
const wiki = require('wikijs').default;
const rollbase = require('./rollbase.js');
//const translate = require('translation-google');
var variables = {};
var gameName = function () {
	return 'Wiki查詢/圖片搜索 .wiki .image '
}

var gameType = function () {
	return 'Wiki:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^[.]wiki$|^[.]tran$|^[.]tran[.]\S+$|^[.]image$|^[.]imagee$/i,
		second: null
	}]

}

var getHelpMessage = function () {
	return "【Wiki查詢/即時翻譯】.wiki .image .tran .tran.(目標語言)\n\
1) Wiki功能: .wiki (條目)  \n\
EG: .wiki BATMAN  \n\
2) 圖片搜尋功能: .Image (內容)  \n\
從Google 得到相關隨機圖片Link\n\
隨機YES NO: 如.image yesno 會得到yes 或NO 結果\n\
3) 即時翻譯功能: .Tran (內容)  \n\
預設翻譯成正體中文\n\
EG: .tran BATMAN  \n\
4) 可翻譯成其他語言: .tran.(語系) (內容)\n\
EG: .tran.ja BATMAN  .tran.日 BATMAN\n\
常用語言代碼: 英=en, 簡=zh-cn, 德=de, 日=ja\n\
語系代碼 https://github.com/vitalets/google-translate-api/blob/master/languages.js\n\
"
}
var initialize = function () {
	return variables;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
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
			rply.text = this.getHelpMessage();
			return rply;
		case /\S+/.test(mainMsg[1]) && /[.]wiki/.test(mainMsg[0]):
			rply.text = await wiki({
					apiUrl: 'https://zh.wikipedia.org/w/api.php'
				}).page(mainMsg[1].toLowerCase())
				.then(async page => {
					return chineseConv.tify(await page.summary())
				}) //console.log('case: ', rply)
				.catch(error => {
					if (error == 'Error: No article found')
						return '沒有此條目'
					else {
						return error
					}
				})
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran$/.test(mainMsg[0]):
			rply.text = "插件有漏洞, 現在下架功能"
			return rply;
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), {
				to: 'zh-TW'
			}).then(res => {
				return res.text
			}).catch(err => {
				return err.message;
			});
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran[.]\S+$/.test(mainMsg[0]):
			rply.text = "插件有漏洞, 現在下架功能"
			return rply;
			lang = /.tran.(\S+)/;
			test = mainMsg[0].match(lang)
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), {
				to: test[1].replace("簡中", "zh-CN").replace("簡體", "zh-CN").replace(/zh-cn/ig, "zh-CN").replace("英", "en").replace("簡", "zh-CN").replace("德", "de").replace("日", "ja")
			}).then(res => {
				//console.log(res.from.language.iso);
				return res.text
			}).catch(err => {
				console.log(err.message)
				return err.message + "\n常用語言代碼: 英=en, 簡=zh-cn, 德=de, 日=ja\n例子: .tran.英\n.tran.日\n.tran.de";
			});
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]image$/.test(mainMsg[0]):
			rply.text = await googleimage(inputStr, mainMsg, "high")
			rply.type = 'image'
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]imagee$/.test(mainMsg[0]):
			//成人版
			rply.text = await googleimage(inputStr, mainMsg, "off")
			rply.type = 'image'
			return rply;


		default:
			break;
	}
}

async function googleimage(inputStr, mainMsg, safe) {
	if (!process.env.CSE_ID && !process.env.CSE_API_KEY) return;
	let keyword = inputStr.replace(mainMsg[0] + " ", "")
	//let page = Math.floor((Math.random() * (10)) * 10) + 1;
	let page = await rollbase.DiceINT(0, 91)
	if (mainMsg[1].match(/^yesno$/i)) {
		//隨機YES NO
		let A = ['yes', 'no']
		keyword = A[await rollbase.Dice(A.length) - 1] + " GIF";
	}
	return await client.search(keyword, {
			"safe": safe,
			"page": page
		})
		.then(async images => {
			if (images[0]) {
				//let resultnum = Math.floor((Math.random() * (images.length)) + 0)
				let resultnum = await rollbase.Dice(images.length - 1)
				return images[resultnum].url;
			}

		}).catch(err => {
			console.log(err)
		})
}


module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};