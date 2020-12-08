"use strict";

//heroku labs:enable runtime-dyno-metadata -a <app name>
var chineseConv = require('chinese-conv'); //繁簡轉換
const duckImage = require('@zetetic/duckduckgo-images-api')
const wiki = require('wikijs').default;
var fs = require('fs');
const svg2png = require("svg2png");
const rollbase = require('./rollbase.js');
const translate = require('@vitalets/google-translate-api');
var variables = {};
var gameName = function () {
	return 'Wiki查詢/圖片搜索 .wiki .image .tran'
}

var gameType = function () {
	return 'funny:Wiki:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^[.]wiki$|^[.]tran$|^[.]tran[.]\S+$|^[.]image$|^[.]imagee$|^[.]token$/i,
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

var rollDiceCommand = async function ({
	inputStr,
	mainMsg
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	}; //type是必需的,但可以更改
	let lang = '',
		test = '';
	//let result = {};
	var svgString = "<?xml version='1.0' encoding='utf-8'?><!-- Generator: Adobe Illustrator 22.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --><svg version='1.1' id='圖層_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'	 viewBox='0 0 721 721' style='enable-background:new 0 0 721 721;' xml:space='preserve'><style type='text/css'>	.st0{opacity:0.53;fill:#71BEC8;enable-background:new    ;}	.st1{fill:#71BEC8;}	.st2{opacity:0.53;fill:#1B2E6F;enable-background:new    ;}	.st3{fill:#C6A3C7;}	    .st4{font-family:'MicrosoftJhengHeiBold';font-size:120px;fill:gray;}	.st5{font-family:'MicrosoftJhengHeiBold';font-size:70px;   fill:gray;}	#title {   text-shadow: 1px 1px 3px white;   text-align: center;   font-family: MicrosoftJhengHeiBold;   font-weight: bold;     stroke-width: 0.5px;  stroke: black;    }</style> <defs>    <clipPath id='svg-draw'><path class='st1' d='M352.9,54.2c-146.2,0-264.3,118-264.3,264.3s118,264.3,264.3,264.3s264.3-118,264.3-264.3	S499.1,54.2,352.9,54.2z M352.9,571.6c-139.8,0-253.1-113.3-253.1-253.1S213.1,65.4,352.9,65.4S606,178.7,606,318.5	S492.7,571.6,352.9,571.6z'/><circle class='st3' cx='352.9' cy='318.5' r='243.7'/>    </clipPath>  </defs><path class='st0' d='M352.9,35.4c-156.2,0-283.1,126.9-283.1,283.1s126.9,283.1,283.1,283.1S636,474.7,636,318.5	S509.1,35.4,352.9,35.4z M352.9,582.8c-146.2,0-264.3-118-264.3-264.3s118-264.3,264.3-264.3s264.3,118,264.3,264.3	S499.1,582.8,352.9,582.8z' fill-opacity='00000.0000001'/><path class='st2' d='M352.9,65.4c-139.8,0-253.1,113.3-253.1,253.1s113.3,253.1,253.1,253.1S606,458.3,606,318.5	S492.7,65.4,352.9,65.4z M352.9,562.2c-134.5,0-243.7-109.2-243.7-243.7S218.4,74.8,352.9,74.8S596.6,184,596.6,318.5	S487.4,562.2,352.9,562.2z' fill-opacity='00000.000000001' />  <image clip-path='url(#svg-draw)' y='5%'  height='831' width='831'          xlink:href='https://upload.wikimedia.org/wikipedia/commons/4/45/Eopsaltria_australis_-_Mogo_Campground.jpg' preserveAspectRatio='xMidYMin'/>	 <text x='50%' y='560' dominant-baseline='middle' text-anchor='middle' id='title'  class='st4'>我的名字</text>  <text x='50%' y='640' dominant-baseline='middle' text-anchor='middle' id='title' class='st5'>Sad</text></svg>";

	//1. convert from svg string

	switch (true) {
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = this.getHelpMessage();
			return rply;
		case /^[.]token$/.test(mainMsg[0]):
			svg2png(svgString, {
					width: 300,
					height: 400
				})
				.then(buffer => fs.writeFile("dest.png", buffer))
				.catch(e => console.error(e));

			console.log('AA?')
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
			rply.text = await translate(inputStr.replace(mainMsg[0], ""), {
				to: 'zh-TW'
			}).then(res => {
				return res.text
			}).catch(err => {
				return err.message;
			});
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]tran[.]\S+$/.test(mainMsg[0]):
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
			rply.text = await searchImage(inputStr, mainMsg, true)
			rply.type = 'image'
			return rply;
		case /\S+/.test(mainMsg[1]) && /^[.]imagee$/.test(mainMsg[0]):
			//成人版
			rply.text = await searchImage(inputStr, mainMsg, false)
			rply.type = 'image'
			return rply;
		default:
			break;
	}
}

async function searchImage(inputStr, mainMsg, safe) {
	let keyword = inputStr.replace(mainMsg[0] + " ", "")
	//let page = Math.floor((Math.random() * (10)) * 10) + 1;
	if (mainMsg[1].match(/^yesno$/i)) {
		//隨機YES NO
		let A = ['yes', 'no']
		keyword = A[await rollbase.Dice(A.length) - 1] + " GIF";
	}
	return await duckImage.image_search({
			query: keyword,
			moderate: safe
		})
		.then(async images => {
			if (images[0] && images[0].image) {
				//let resultnum = Math.floor((Math.random() * (images.length)) + 0)
				let resultnum = await rollbase.Dice(images.length) - 1;
				return images[resultnum].image;
			} else {
				return '沒有結果'
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