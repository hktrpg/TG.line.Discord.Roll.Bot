var rollbase = require('./rollbase.js');
var funny = require('./funny.js');
if (!process.env.HEROKU_RELEASE_VERSION)
	require('dotenv').config()
//heroku labs:enable runtime-dyno-metadata -a <app name>
var rply = {
	default: 'on',
	type: 'text',
	text: ''
}; //type是必需的,但可以更改
require('fs').readdirSync(__dirname).forEach(function (file) {
	if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'help.js') {
		var name = file.replace('.js', '');
		exports[name] = require('./' + file);
	}
});
var version = "v1." + Object.keys(exports).length + "." + (process.env.HEROKU_RELEASE_VERSION || 0).replace(/v/, '');

gameName = function () {
	return '骰子機器人HKTRPG說明'
}

gameType = function () {
	return 'bothelp:hktrpg'
}
prefixs = function () {
	return /^bothelp$/i
}
getHelpMessage = function () {
	return "【HKTRPG擲骰BOT】" + version + "\
	\n  \
	\n 暗骰功能 在指令前打dr 結果會私訊你\
	\n 基本擲骰1d100\
\n 例如輸入2d6+1　攻撃！\
\n 會輸出）2d6+1：攻撃  9[6+3]+1 = 10\
\n 如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\
\n 以下還有其他例子\
\n  \
\n 5 3D6 ：	分別骰出5次3d6\
\n D66 D66s：	骰出D66 s小者固定在前\
\n 5B10：	不加總的擲骰 會進行小至大排序 \
\n 5B10 9：	如上,另外計算其中有多少粒大於9 \
\n 5U10 8：	進行5D10 每骰出一粒8會有一粒獎勵骰 \
\n 5U10 8 9：	如上,另外計算其中有多少粒大於9 \
	\n"
}
initialize = function () {
	return rply;
}

rollDiceCommand = function (mainMsg) {
	//let result = {};
	switch (true) {
		case /^\d+$/i.test(mainMsg[1]):
			//console.log(exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage)
			if (exports[Object.keys(exports)[mainMsg[1]]] && exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage())
				rply.text = exports[Object.keys(exports)[mainMsg[1]]].getHelpMessage() +
					'\n'
			return rply;
		case /^all$/i.test(mainMsg[1]):
			rply.text = getHelpMessage();
			for (i = 0; i < Object.keys(exports).length; i++) {
				if (exports[Object.keys(exports)[i]] && exports[Object.keys(exports)[i]].gameName)
					rply.text += "\n" +
						i + ": " +
						exports[Object.keys(exports)[i]].gameName() +
						exports[Object.keys(exports)[i]].getHelpMessage()
			}
			console.log(rply)
			return rply;

		case /^(?![\s\S])/.test(mainMsg[1] || ''):
			rply.text = getHelpMessage() + '現支援系統: 【了解骰組詳情,請輸入 bothelp (編號) 或 all 顯示全部】';
			for (i = 0; i < Object.keys(exports).length; i++) {
				if (exports[Object.keys(exports)[i]] && exports[Object.keys(exports)[i]].gameName)
					rply.text += "\n" +
						i + ": " +
						exports[Object.keys(exports)[i]].gameName()
			}
			console.log(rply)
			return rply;

		default:
			return rply;
	}
}

/*
try {
  var resultroll =calldice('DoubleCross', '100d1000+100d1000+100d1000+100d1000+100d1000+100d1000+100d1000')[0 ];
 
  //console.log(resultroll);
  switch(1) {
	case x:
	  // code block
	  break;
	case y:
	  // code block
	  break;
	default:
	  // code block
  }
 
 
} catch (e) {
  console.log(e)
}
 
*/
module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};


function Help() {
	rply = {
		"text": "【HKTRPG擲骰BOT】" + version + "\
		\n  \
		\n 支援基本擲骰, COC, 永遠的後日談, 黑暗世界, DX3, SW2.0 \
		\n 暗骰功能 在指令前打dr 結果會私訊你\
		\n 基本擲骰1d100\
\n 例如輸入2d6+1　攻撃！\
\n 會輸出）2d6+1：攻撃  9[6+3]+1 = 10\
\n 如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\
\n 以下還有其他例子\
\n  \
\n 5 3D6 ：	分別骰出5次3d6\
\n D66 D66s：	骰出D66 s小者固定在前\
\n 5B10：	不加總的擲骰 會進行小至大排序 \
\n 5B10 9：	如上,另外計算其中有多少粒大於9 \
\n 5U10 8：	進行5D10 每骰出一粒8會有一粒獎勵骰 \
\n 5U10 8 9：	如上,另外計算其中有多少粒大於9 \
\n  \
\n 隨機選擇：	啓動語choice/隨機/選項/選1\
\n (問題)(啓動語)(問題)  (選項1) (選項2) \
\n 例子 隨機收到聖誕禮物數 1 2 3 >4  \
\n  \
\n 隨機排序：啓動語　排序\
\n (問題)(啓動語)(問題) (選項1) (選項2)(選項3)\
\n 例子 交換禮物排序 A君 C君 F君 G君\
\n  \
\n 占卜運氣功能： 字句中包括「運勢」兩字即可  \
\n 塔羅牌占卜 塔羅/大十字塔羅/每日塔羅牌  \
\n 時間tarot 等關键字可啓動  \
\n    \
\n COC7th：	cc 80 技能小於等於80 \
\n coc7版 即時型瘋狂：	啓動語 ccrt  \
\n coc7版 總結型瘋狂：	啓動語 ccsu  \
\n coc6版創角：	啓動語 cc6版創角 \
\n coc7版創角：	啓動語 cc7版創角 (歲數) \
\n coc7 成長或增長檢定：	dp 或 成長檢定 或 幕間成長 (技能) (名稱) \
\n 例）DP 50 騎馬 | 成長檢定 45 頭槌 | 幕間成長 40 單車\
\n \
\n Line版 https://line.me/R/ti/p/svMLqy9Mik\
\n Discord版 https://discordapp.com/oauth2/authorize?&client_id=544462904037081138&scope=bot&permissions=8\
\n Telegram版 http://t.me/hktrpg_bot\
\n \
\n 其他指令請到 https://github.com/hktrpg/TG.line.Discord.Roll.Bot  最底下查詢",
		"type": "template",
		"altText": "【HKTRPG擲骰BOT】v1.0.3 \
\n 例如輸入2d6+1　攻撃！\
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
	return rply;
}