"use strict";

var Dice = [],
	Tool = [],
	admin = [],
	funny = [],
	help = [],
	link = [];
const start = async () => {
	await require('fs').readdirSync(__dirname).forEach(async function (file) {
		try {
			if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js' && file !== 'help.js') {
				let tryFile = require('./' + file);
				if (tryFile.gameType && tryFile.gameType()) {
					var type = require('./' + file).gameType().replace(/:.*/i, '')
					var name = file.replace('.js', '');
					exports[type + '_' + name] = await require('./' + file);
				}
			}

		} catch (error) {
			console.error('help.js error: ', error)
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
			Dice.push(exports[name])
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


const gameName = function () {
	return '骰子機器人HKTRPG說明';
}

const gameType = function () {
	return 'bothelp:hktrpg'
}
const prefixs = function () {
	return [{
		first: /^bothelp$/i,
		second: null
	}]

}
const getHelpMessage = async function () {
	return `【暗骰功能】
在指令前輸入dr 結果會私訊你
ddr dddr 可以私訊已設定的群組GM, 詳情可打.drgm查詢

【基本擲骰】1d100(khN|klN|dhN|dlN)
例如輸入(2d6+1)*2 攻撃！
會輸出）(2d6+1)*2：攻撃！  (10[5+5]+1)2 = 22
如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。

.5 3D6 ：	分別骰出5次3d6 最多30次
((2d6+1)*2)-5/2>=10 支援括號加減乘除及大於小於(>,<,>=,<=)計算
支援kh|kl|dh|dl，k keep保留，d drop 放棄，h highest最高，l lowest最低
如3d6kh 保留最大的1粒骰，3d6dl2 放棄最小的2粒骰

【RPG Dice Roller擲骰】.rr
RPG Dice Roller 是英語系統常用擲骰功能
Foundry VTT也是使用它
和基本擲骰不同
有更多仔細的擲骰命令，如1d10r1 5d10!k2


擲骰指令請看
https://dice-roller.github.io/documentation/guide/notation/
 
 `
}
const initialize = function () {
	return variables;
}


const rollDiceCommand = async function ({
	mainMsg
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: '',
		quotes: true
	};
	//let result = {};
	switch (true) {
		case !mainMsg[1]:
			rply.text =
				`【HKTRPG擲骰ROLLBOT🤖】
HKTRPG是在Discord, Line, Telegram, Whatsapp和網頁上都可以使用的骰子機械人！
功能：暗骰, 各類TRPG骰子擲骰, 自定義骰子, 頻道經驗值, 占卜, 先攻表, TRPG角色卡, 搜圖,
翻譯, Discord 聊天紀錄匯出, 數學計算, 隨機抽選, wiki查詢, 資料庫快速查詢功能
定時發訊息
及其他
-------
請問有什麼可以幫助你?
請輸入你想查詢的項目名字.
或到 (https://bothelp.hktrpg.com/) 觀看詳細使用說明.
-------
bothelp ver		- 查詢詳細版本及公告(${ver})
bothelp Base	- 查詢trpg 基本擲骰指令🎲
bothelp Dice	- 查詢trpg 不同系統擲骰指令💻
bothelp Tool	- 查詢trpg 輔助工具🧰
bothelp admin	- 查詢系統工具⚙️
bothelp funny	- 查詢趣味功能😂
bothelp link	- 查詢HKTRPG 不同平台連結🔗
bothelp privacy	- 查詢HKTRPG 的隱私權條款🔒
bothelp about	- 查詢HKTRPG 歷史📜
--------
🗂️HKTRPG 作品集, (https://hktrpg.github.io/TG.line.Discord.Roll.Bot/PORTFOLIOP)
ℹ️如果你需要幫助, 加入我們的支援頻道, (https://support.hktrpg.com)
☕贊助伺服器運行及開放VIP資源, (https://www.patreon.com/HKTRPG)`
			rply.buttonCreate = ['bothelp ver', 'bothelp Base', 'bothelp Dice', 'bothelp Tool', 'bothelp admin', 'bothelp funny', 'bothelp link', 'bothelp privacy', 'bothelp about']

			return rply;
		case /^ver$/i.test(mainMsg[1]):
			rply.text = `${version}
最近更新: 
2019/07/21 香港克警合作 黑ICON紀念
...前略...
2022/05 https://www.patreon.com/posts/hktrpg-wu-yue-66190934
2022/04	https://www.patreon.com/posts/hktrpg-4yue-geng-65565589
2022/03	https://www.patreon.com/posts/3yue-geng-xin-64158733
2022/02	https://www.patreon.com/posts/2yue-geng-xin-62329216
2022/01	https://www.patreon.com/posts/hktrpg-1yue-geng-60706957
`;
			return rply;
		case /^BASE/i.test(mainMsg[1]):
			rply.text = await getHelpMessage();
			return rply;
		case /^about$/i.test(mainMsg[1]):
			rply.text = `關於HKTRPG

HKTRPG來源自 機器鴨霸獸 https://docs.google.com/document/d/1dYnJqF2_QTp90ld4YXj6X8kgxvjUoHrB4E2seqlDlAk/edit	
最早由LarryLo Retsnimle開發，
是一個開放源碼骰子機器人計畫，供他人使用開發和使用。

現在的HKTRPG基礎是根據該計畫而開發，
感謝當時源碼大量的注釋，讓當時第一次接觸JS的我，
慢慢學到怎寫CODE。

現在HKTRPG 以GNU GENERAL PUBLIC LICENSE授權，
是被廣泛使用的自由軟體授權條款，給予了終端使用者運行、學習、共享和修改軟體的自由。
`
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
				rply.text = await Dice[temp].getHelpMessage();
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
				rply.text = await Tool[temp].getHelpMessage();
			}
			return rply;
		case /^privacy/i.test(mainMsg[1]): {
			rply.text = "隱私權聲明\nhttps://bothelp.hktrpg.com/hktrpg-guan-fang-shi-yong-jiao-xue/qi-ta-qing-bao/yin-si-quan-sheng-ming";
			return rply;
		}
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
				rply.text = await admin[temp].getHelpMessage();
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
				rply.text = await funny[temp].getHelpMessage();
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
				rply.text = await help[temp].getHelpMessage();
			}
			return rply;

		case /^link/i.test(mainMsg[1]):
			rply.text = `TRPG百科 https://www.hktrpg.com/
意見留言群 https://support.hktrpg.com
			
邀請HKTRPG 加入
Line 邀請連結 http://bit.ly/HKTRPG_LINE
Discord 邀請連結 https://discord.hktrpg.com
Telegram 邀請連結 http://t.me/hktrpg_bot
網頁版 邀請連結 https://rollbot.hktrpg.com/
簡易網上擲骰網頁 https://roll.hktrpg.com/
			
HKTRPG 研究社 Facebook https://www.facebook.com/groups/HKTRPG
解鎖功能及贊助 https://www.patreon.com/HKTRPG 
源代碼 http://bit.ly/HKTRPG_GITHUB
`
			return rply;
		/**
	case /^report/i.test(mainMsg[1]):
		rply.text = await this.getHelpMessage();
		return rply;

		 */
		case /^req/i.test(mainMsg[1]):
			rply.text = `請到以下問卷填寫意見，所有意見內容將改善RollBot
			https://forms.gle/uXq6taCPGJ2M99Gp9`
			return rply;
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
