var rply = {
	default: 'on',
	type: 'text',
	text: ''
}; //type是必需的,但可以更改
//heroku labs:enable runtime-dyno-metadata -a <app name>
const GoogleImages = require('google-images');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const client = new GoogleImages(process.env.CSE_ID, process.env.CSE_API_KEY);
const wiki = require('wikijs').default;
const timer = require('timer');
const translate = require('@vitalets/google-translate-api');
const {
	image_search
} = require('duckduckgo-images-api')

gameName = function () {
	return '(公測中)Wiki查詢/圖片搜索/翻譯 .wiki .image .tran'
}

gameType = function () {
	return 'Wiki:hktrpg'
}
prefixs = function () {
	return [/^[.]wiki$|^[.]tran$|^[.]tran[.]\S+$|^[.]image$|^[.]imagee$/i, ]

}

getHelpMessage = function () {
	return "【Wiki查詢/即時翻譯】.wiki .image .tran .tran.(目標語言)\
		\n 1) Wiki功能: .wiki (條目)  \
		\n EG: .wiki BATMAN  \
		\n 2) 圖片搜尋功能: .Image (內容)  \
		\n 從Google 得到相關隨機圖片Link\
		\n 隨機YES NO: 如.image yesno 會得到yes 或NO 結果\
		\n 3) 即時翻譯功能: .Tran (內容)  \
		\n 預設翻譯成正體中文\
		\n EG: .tran BATMAN  \
		\n 4) 可翻譯成其他語言: .tran.(語系) (內容)\
		\n EG: .tran.ja BATMAN  .tran.日 BATMAN\
		\n 常用語言代碼: 英=en, 簡=zh-cn, 德=de, 日=ja\
		\n 語系代碼 https://github.com/vitalets/google-translate-api/blob/master/languages.js\
		"
}
initialize = function () {
	return rply;
}

rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
	rply.text = '';
	//let result = {};
	switch (true) {
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = this.getHelpMessage();
			return rply;
		case /\S+/.test(mainMsg[1]) && /[.]wiki/.test(mainMsg[0]):
			rply.text = await wiki({
					apiUrl: 'https://zh.wikipedia.org/w/api.php'
				}).page(mainMsg[1].toLowerCase())
				.then(page => page.summary()) //console.log('case: ', rply)
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
			let lang = /.tran.(\S+)/;
			let test = mainMsg[0].match(lang)
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

async function now(a, b, c) {
	let now = a + b
	if (now >= c)
		now = now - c
	return now
}

async function googleimage(inputStr, mainMsg, safe) {
	let keyword = inputStr.replace(mainMsg[0] + " ", "")
	let page = Math.floor((Math.random() * (10)) + 1)*10;
	if (mainMsg[1].match(/^yesno$/i)) {
		//隨機YES NO
		let A = ['yes', 'no']
		keyword = A[Math.floor((Math.random() * (A.length)))] + " GIF";
	}
	return await client.search(keyword, {
			"safe": safe,
			"page": page
		})
		.then(async images => {
			if (images[0]) {
				let resultnum = Math.floor((Math.random() * (images.length)) + 0)
				for (let i = 0; i < images.length; i++) {
					let nows = await now(resultnum, i, images.length)
					if (await imageExists(images[nows].url) && images[nows].url != 'https://c8.alamy.com/comp/HKTRPG/los-angeles-usa-29th-jan-2017-danielle-brooks-seen-arriving-at-the-HKTRPG.jpg') {
						i = images.length
						return images[nows].url;
					}
				}
			} else
				return client.search(keyword, {
						"safe": "high"
					})
					.then(async images => {
						{
							let resultnum = Math.floor((Math.random() * (images.length)) + 0)
							for (let i = 0; i < images.length; i++) {
								if (images[resultnum].url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
									i = images.length
									return images[resultnum].url;
								} else {
									resultnum++
									if (resultnum = images.length)
										resultnum = 0
								}
							}

						}
					})
		}).catch(err => {
			console.log(err)
		})
}

async function imageExists(image_url) {

	var http = new XMLHttpRequest();

	http.open('HEAD', image_url, false);
	http.send();
	return http.status != 404;

}
module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};