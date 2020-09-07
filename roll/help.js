"use strict";
if (!process.env.HEROKU_RELEASE_VERSION)
	require('dotenv').config()
var Dice = [],
	Tool = [],
	admin = [],
	funny = [],
	help = [],
	link = [];
const start = async () => {
	await require('fs').readdirSync(__dirname).forEach(async function (file) {
		try {
			if (require('./' + file).gameType && require('./' + file).gameType()) {
				var type = require('./' + file).gameType().replace(/:.*/i, '')
				var name = file.replace('.js', '');
				exports[type + '_' + name] = await require('./' + file);
			}

		} catch (error) {
			console.log(error)
		}
	})
	version = "v1." + Object.keys(exports).length + "." + heroku_version.replace(/[v]/, '');
	if (process.env.HEROKU_RELEASE_CREATED_AT) {
		version += '\n最後更新時間' + new Date(process.env.HEROKU_RELEASE_CREATED_AT).toLocaleString("en-US", {
			timeZone: "Asia/Shanghai"
		}).replace('GMT+0800 (GMT+08:00)', '');
	}
	ver = 'v1.' + Object.keys(exports).length;
	for (let name of Object.keys(exports)) {
		if (name.match(/^DICE/i)) {
			Dice.push(exports[name]);
		}
		if (name.match(/^Tool/i)) {
			Tool.push(exports[name]);
		}
		if (name.match(/^admin/i)) {
			admin.push(exports[name]);
		}
		if (name.match(/^funny/i)) {
			funny.push(exports[name]);
		}
		if (name.match(/^help/i)) {
			help.push(exports[name]);
		}
		if (name.match(/^link/i)) {
			link.push(exports[name]);
		}
	}
}
start();
var variables = {};
//heroku labs:enable runtime-dyno-metadata -a <app name>

var heroku_version = 'v0'
var ver = '';
if (process.env.HEROKU_RELEASE_VERSION)
	heroku_version = process.env.HEROKU_RELEASE_VERSION;
var version = "";


var gameName = function () {
	return '骰子機器人HKTRPG說明';
}

var gameType = function () {
	return 'bothelp:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^bothelp$/i,
		second: null
	}]

}
var getHelpMessage = function () {
	return "暗骰功能 在指令前輸入dr 結果會私訊你\n\
ddr dddr 可以私訊已設定的群組GM, 詳情可打.drgm查詢\n\
【基本擲骰】1d100(khN|klN|dhN|dlN)\n\
例如輸入(2d6+1)*2 攻撃！\n\
會輸出）(2d6+1)*2：攻撃！  (10[5+5]+1)2 = 22\n\
如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\n\
5 3D6 ：	分別骰出5次3d6 最多30次\n\
((2d6+1)*2)-5/2>=10 支援括號加減乘除及大於小於(>,<,>=,<=)計算\n\
支援kh|kl|dh|dl，k keep保留，d drop 放棄，h highest最高，l lowest最低\n\
如3d6kh 保留最大的1粒骰，3d6dl2 放棄最小的2粒骰"
}
var initialize = function () {
	return variables;
}


var rollDiceCommand = async function ({mainMsg}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	//let result = {};
	switch (true) {
		case !mainMsg[1]:
			rply.text =
				"【HKTRPG擲骰ROLLBOT】\n\
請問有什麼可以幫你?\n\
請輸入你想查詢的項目名字.\n\
-------\n\
bothelp ver		- 查詢詳細版本及公告(" + ver + ")\n\
bothelp Base	- 查詢trpg 基本擲骰指令\n\
bothelp Dice	- 查詢trpg 不同系統擲骰指令\n\
bothelp Tool	- 查詢trpg 輔助工具\n\
bothelp admin	- 查詢系統工具\n\
bothelp funny	- 查詢趣味功能\n\
bothelp link	- 查詢hktrpg 不同平台連結\n\
--------\n\
程式開發，求助及TRPG Discord群 https://discord.gg/vx4kcm7\n\
解鎖功能及開發支援 https://www.patreon.com/HKTRPG"
			return rply;
		case /^ver/i.test(mainMsg[1]):

			rply.text = version + '\n\
最近更新: \n\
2019/07/21 香港克警合作 黑ICON紀念\n\
2020/09/07 Bothelp 顯示方法更新';
			return rply;
		case /^BASE/i.test(mainMsg[1]):
			rply.text = getHelpMessage();
			return rply;
		case /^Dice/i.test(mainMsg[1]):
			if (mainMsg[1].match(/^DICE$/i)) {
				rply.text = '輸入 bothelp Dice序號 如bothelp Dice1 即可看到內容\n'
				for (let num in Dice) {
					rply.text += num + '. ' + Dice[num].gameName() + '\n';
				}
			}
			if (mainMsg[1].match(/^Dice\d+$/i)) {
				let temp = mainMsg[1].replace(/^dice/i, '');
				if (!Dice[temp]) return;
				rply.text = Dice[temp].getHelpMessage();
			}
			return rply;
		case /^Tool/i.test(mainMsg[1]):
			if (mainMsg[1].match(/^Tool$/i)) {
				rply.text = '輸入 bothelp Tool序號 如bothelp Tool1 即可看到內容\n'
				for (let num in Tool) {
					rply.text += num + '. ' + Tool[num].gameName() + '\n';
				}
			}
			if (mainMsg[1].match(/^Tool\d+$/i)) {
				let temp = mainMsg[1].replace(/^Tool/i, '');
				if (!Tool[temp]) return;
				rply.text = Tool[temp].getHelpMessage();
			}
			return rply;

		case /^admin/i.test(mainMsg[1]):
			if (mainMsg[1].match(/^admin$/i)) {
				rply.text = '輸入 bothelp admin序號 如bothelp admin1 即可看到內容\n'
				for (let num in admin) {
					rply.text += num + '. ' + admin[num].gameName() + '\n';
				}
			}
			if (mainMsg[1].match(/^admin\d+$/i)) {
				let temp = mainMsg[1].replace(/^admin/i, '');
				if (!admin[temp]) return;
				rply.text = admin[temp].getHelpMessage();
			}
			return rply;

		case /^funny/i.test(mainMsg[1]):
			if (mainMsg[1].match(/^funny$/i)) {
				rply.text = '輸入 bothelp funny序號 如bothelp funny1 即可看到內容\n'
				for (let num in funny) {
					rply.text += num + '. ' + funny[num].gameName() + '\n';
				}
			}
			if (mainMsg[1].match(/^funny\d+$/i)) {
				let temp = mainMsg[1].replace(/^funny/i, '');
				if (!funny[temp]) return;
				rply.text = funny[temp].getHelpMessage();
			}
			return rply;

		case /^help/i.test(mainMsg[1]):
			if (mainMsg[1].match(/^help$/i)) {
				rply.text = '輸入 bothelp help序號 如bothelp help1 即可看到內容\n'
				for (let num in help) {
					rply.text += num + '. ' + help[num].gameName() + '\n';
				}
			}
			if (mainMsg[1].match(/^help\d+$/i)) {
				let temp = mainMsg[1].replace(/^help/i, '');
				if (!help[temp]) return;
				rply.text = help[temp].getHelpMessage();
			}
			return rply;

		case /^link/i.test(mainMsg[1]):
			rply.text = "TRPG百科 https://www.hktrpg.com/\n\
意見留言群 https://discord.gg/vx4kcm7\n\
			\n\
Line版 http://bit.ly/HKTRPG_LINE\n\
Discord版 http://bit.ly/HKTRPG_DISCORD\n\
Telegram版 http://t.me/hktrpg_bot\n\
網頁版 https://roll.hktrpg.com/\n\
簡易網上擲骰網頁 https://roll.hktrpg.com/\n\
			\n\
解鎖功能及開發支援 https://www.patreon.com/HKTRPG \n\
源代碼 http://bit.ly/HKTRPG_GITHUB\n"
			return rply;
			/**
		case /^report/i.test(mainMsg[1]):
			rply.text = this.getHelpMessage();
			return rply;

			 */
		default:
			break;
	}
}

/**
 * if (botname == "Line")
				rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik\nP.S. Line 修改政策，免費帳號的Line Bot現在有每月500次的私訊限制，超過時DR等私訊功能會失效。(可以認為這功能在Line已失效，半天已400個DR私訊要求)"
 */
module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};
/**
 * 		case /^\d+$/i.test(mainMsg[1]):
			//console.log(exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage)
			if (exports[Object.keys(exports)[mainMsg[1]]] && exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage) {
				rply.text = exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage() +
					'\n'
				return rply;
			}
			break;
			/*
					case /^all$/i.test(mainMsg[1]):
						//rply.text = getHelpMessage();
						let i = 0; i < Object.keys(exports).length; i++) {
							if (exports[Object.keys(exports)[i]] && exports[Object.keys(exports)[i]].gameName)
								rply.text += "\n" +
								i + ": " +
								//exports[Object.keys(exports)[i]].gameName() +
								exports[Object.keys(exports)[i]].getHelpMessage()
						}
						return rply;
			
case /^(?![\s\S])/.test(mainMsg[1] || ''):
	await Object.keys(linehelp()).forEach(v => {
		rply[v] = linehelp()[v]
	})
rply.text = getHelpMessage() + '\n現支援系統: \n【了解骰組詳情,請輸入 bothelp (編號) 或 在指令後輸入help 如 .sg help】';
for (let i = 0; i < Object.keys(exports).length; i++) {
	if (exports[Object.keys(exports)[i]] && exports[Object.keys(exports)[i]].gameName)
		rply.text += "\n" +
		i + ": " +
		exports[Object.keys(exports)[i]].gameName()
}

//console.log('case: ', rply)
return rply;
*/

function linehelp() {
	var help = {
		"type": "text",
		"altText": "【HKTRPG擲骰BOT】v1.0.3 \
\n 例如輸入2d6+1 攻撃！\
\n 會輸出）2d6+1：攻撃  9[6+3]+1 = 10\
\n 如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\
\n 以下還有其他例子\
\n 5 3D6 	：分別骰出5次3d6\
\n D66 D66s ：骰出D66 s小者固定在前\
\n 5B10：不加總的擲骰 會進行小至大排序 \
\n 5B10 9：如上,另外計算其中有多少粒大於9 \
\n 5U10 8：進行5D10 每骰出一粒8會有一粒獎勵骰 \
\n 5U10 8 9：如上,另外計算其中有多少粒大於9 \
\n Choice：啓動語choice/隨機/選項/選1\
\n (問題)(啓動語)(問題)  (選項1) (選項2) \
\n COC7th：cc 80 技能小於等於80  \
\n 其他指令或Telegram Discord版請到\
\n  https://github.com/hktrpg/TG.line.Discord.Roll.Bot 最底下查詢",
		"template": {
			"type": "carousel",
			"columns": [{
					//Array of columns
					//Max: 10
					"title": "《基本擲骰系統》",
					//Title Max: 40 characters
					"text": "【擲骰BOT】v1.0.3 指令包括1D100, 5B10 ,5U10 8 9",
					//Message text
					//Max: 120 characters (no image or title)
					//Max: 60 characters (message with an image or title)
					"actions": [{
							"type": "message",
							"label": "1d100擲骰範例",
							"text": "5 1d100 骰出5次1D100"
						},
						{
							"type": "message",
							"label": "5B10擲骰範例",
							"text": "5B10 9 不加總的擲骰,計算其中有多少粒大於9"
						},
						{
							"type": "message",
							"label": "5U10 8 9擲骰範例",
							"text": "5U10 8 9 每骰出一粒8會有一粒獎勵骰及計算有多少粒大於9"
						}
						//Action when tapped
						//Max: 3
					]
				}, {
					"title": "《COC 6 7版 擲骰系統》",
					"text": "指令包括 6版ccb, 7版cc, cc(n)1~2, cc6版創角, cc7版創角, coc7角色背景",
					"actions": [{
							"type": "message",
							"label": "6版擲骰 技能80",
							"text": "ccb 80 擒抱!"
						},
						{
							"type": "message",
							"label": "7版擲骰 cc((n)1-2) d ",
							"text": "ccn2 80 7版擲骰 n代表懲罰 1-2數量 d 目標值"
						},
						{
							"type": "message",
							"label": "cc7版創角 50歲",
							"text": "cc7版創角 50"
						}

					]
				},
				{
					"title": "《COC7版 擲骰系統》",
					"text": "指令包括 即時型瘋狂 總結型瘋狂",
					"actions": [{
							"type": "message",
							"label": "即時型瘋狂Real Time",
							"text": "ccrt"
						},
						{
							"type": "message",
							"label": "總結型瘋狂Summary",
							"text": "ccsu"
						},
						{
							"type": "message",
							"label": "成長或增強檢定",
							"text": "DP 50 騎馬Development Phase | 成長檢定 45 頭槌 | 幕間成長 40 單車"
						}

					]
				},
				{
					"title": "《其他系統01》",
					"text": "NC死靈年代記之永遠的後日談, WoD黑暗世界",
					"actions": [{
							"type": "message",
							"label": "1NC 擲骰範例",
							"text": "2NC"
						},
						{
							"type": "message",
							"label": "NM 依戀擲骰範例",
							"text": "nm"
						},
						{
							"type": "message",
							"label": "WOD擲骰範例",
							"text": "5wd8 投擲5次D10 每有一粒大於8,得到一粒獎勵骰"
						}

					]
				},
				{
					"title": "《其他系統02》",
					"text": "DX3雙重十字 nDXc+m n=骰數 c=暴擊值 m=其他修正",
					"actions": [{
							"type": "message",
							"label": "DX3 擲骰範例",
							"text": "5DX8-1+8"
						},
						{
							"type": "message",
							"label": "DX3 擲骰範例",
							"text": "8DX+1"
						},
						{
							"type": "message",
							"label": "DX3 擲骰範例",
							"text": "2DX5-1"
						}

					]
				},
				{
					"title": "《其他系統03》",
					"text": "SW2.0 劍世界 KKn+m-m@c$d$+xGF n=骰數 c=暴擊值 m=其他修正 d=固定值 x=增加值",
					"actions": [{
							"type": "message",
							"label": "SW2.0 擲骰範例",
							"text": "KK28-8+1"
						},
						{
							"type": "message",
							"label": "SW2.0 擲骰範例",
							"text": "KK050+8-1@8"
						},
						{
							"type": "message",
							"label": "SW2.0 擲骰範例",
							"text": "KK050+8@8$9gf"
						}

					]
				},
				{
					"title": "《附加功能》",
					"text": "排序及隨機功能,D66, D66s",
					"actions": [{
							"type": "message",
							"label": "排序功能範例",
							"text": "交換禮物排序 A君 C君 F君 G君"
						},
						{
							"type": "message",
							"label": "隨機功能範例",
							"text": "隨機收到聖誕禮物數 1 2 3 >4"
						},
						{
							"type": "message",
							"label": "D66s 骰出D66 小至大",
							"text": "D66s 骰出D66 小至大"
						}

					]
				},
				{
					"title": "《附加功能2》",
					"text": "塔羅牌,運氣占卜,死亡FLAG. ",
					"actions": [{
							"type": "message",
							"label": "塔羅占卜",
							"text": "單張塔羅/大十字塔羅/每日塔羅牌/時間tarot 單張,大十字,每日及時間必須放頭"
						},
						{
							"type": "message",
							"label": "死亡FLAG",
							"text": "立Flag/死亡flag"
						},
						{
							"type": "message",
							"label": "運氣占卜",
							"text": "來吧運勢!"
						}

					]
				},
				{
					"title": "《介紹》",
					"text": "Discord版,Telegram版及源碼 ",
					"actions": [{
							"type": "message",
							"label": "Discord版",
							"text": "https://discordapp.com/oauth2/authorize?&client_id=544462904037081138&scope=bot&permissions=8"
						},
						{
							"type": "message",
							"label": "Telegram版",
							"text": "http://t.me/hktrpg_bot"
						},
						{
							"type": "message",
							"label": "骰子機器人原始碼",
							"text": "https://github.com/hktrpg/TG.line.Discord.Roll.Bot"
						}

					]
				}
			]
		}
	};
	return help;
}

/** 
bothelp

請問有什麼可以幫你? 
請輸入你想查詢的項目名字.
-------
bothelp ver    - 查詢版本及公告(xxxx時間更新)
bothelp Dice   - 查詢trpg 不同系統擲骰指令
bothelp Tool   - 查詢trpg 輔助工具
bothelp admin  - 查詢系統工具
bothelp funny  - 查詢趣味功能
bothelp link   - 查詢hktrpg 不同平台連結
bothelp report - 意見提供
-----
輸入 1 或 bothelp 公告 或 bothelp 版本
【HKTRPG擲骰BOT】" + version 
及公告
------
輸入 2 或 bothelp Dice
0: 【進階擲骰】 .ca (計算)|D66(sn)|5B10 Dx|5U10 x y|.int x y
2: 【克蘇魯神話】 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg
3: 【朱の孤塔】 .al (nALxp)
4: 【神我狩】 .kk (ET RT NT KT MTx)
5: 【迷宮王國】 .mk (nMK+m 及各種表)
6: 【亞俠必死的冒險】 .ss (nR>=x[y,z,c] SRx+y FumbleT)
7: 【忍神】 .sg (ST FT ET等各種表)
8: 【歌風】 .UK (nUK nUK@c or nUKc)
9: 【魔女狩獵之夜】.wn xDn+-y
10: 【DX2nd,3rd】 .dx (xDX+y@c ET)
11: 【命運Fate】 .4df(m|-)(加值)
12: 【永遠的後日談】 .nc (NM xNC+m xNA+m)
13: 【劍世界2.5】.sw (Kx Gr FT TT)
14: 【WOD黑暗世界】.xWDy
15: 【貓貓鬼差】.kc xDy z
------
輸入 3 或 bothelp Tool
 (公測中)暗骰GM功能 .drgm (addgm del show) dr ddr dddr
 (公測中)角色卡功能 .char (add edit show delete use nonuse) .ch (set show showall)
 (公測中)儲存擲骰指令功能 .cmd (add del show 自定關鍵字)
------
輸入 4 或 bothelp admin 
.admin state
.admin 
22: (公測中)擲骰開關功能 .bk (add del show)
------
輸入 5 或 bothelp funny
1: 【趣味擲骰】 排序(至少3個選項) choice/隨機(至少2個選項) 每日塔羅 運勢 立flag .me
17: (公測中)經驗值功能 .level (show config LevelUpWord RankWord)
18: Wiki查詢/圖片搜索 .wiki .image 
20: (公測中)自定義回應功能 .ra(p)(次數) (add del show 自定關鍵字)
23: (公測中)資料庫功能 .db(p) (add del show 自定關鍵字)
------
輸入 6 或 bothelp link
DISCORD
TG
LINE
WWW
GITHUB
------
輸入 7 或 bothelp report
可以立即回應東西
------
**/