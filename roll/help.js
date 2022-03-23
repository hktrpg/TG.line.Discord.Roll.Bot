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
var getHelpMessage = async function () {
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
如3d6kh 保留最大的1粒骰，3d6dl2 放棄最小的2粒骰`
}
var initialize = function () {
	return variables;
}


var rollDiceCommand = async function ({
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
ℹ️如果你需要幫助, 加入我們的支援頻道, (https://discord.gg/vx4kcm7)
☕贊助伺服器運行及開放VIP資源, (https://www.patreon.com/HKTRPG)`
			return rply;
		case /^ver$/i.test(mainMsg[1]):
			rply.text = `${version}
最近更新: 
2019/07/21 香港克警合作 黑ICON紀念
...前略...
2021/06/24 🍎
2021/06/28 更新名人堂, 感謝 陳啟昌, strben,匡匡贊助HKTRPG
2021/07/01 🌼
2021/07/03 .admin state 增加顯示數據
2021/07/08 更新Plurk連接
2021/07/16 使用Discord js light, 現在有7400群組在使用, 記憶體不夠用了...
		   更新coc創角, 幼年調查員和PULP版
2021/07/18 更新Discord說明的方式, 使用Embeds
2021/09/01 新增作品集
2021/09/10 新增追逐戰.chase，新增.sc SanCheck功能
2021/09/18 showMeAtTheWorld
2021/09/30 新增匯出團錄時，可以去掉不必要的日期標示，Choice 排序功能顯示改良，.CC7build random
2021/10/09 更新topgg-autoposter，舊版時常CRASH，令HKTRPG出錯
		   更新了PLURK，令速度提升
 		   改良CODE，移除了沒用的AWAIT ASYNC，令程式反應更快
2021/10/20 增加 5B10S：不加總的擲骰，並按大至小排序 - Krymino Lin的意見
2021/11/01 增加 .x 多重擲骰 如.5 cc 80
			增加定時發訊功能 .at / .cron
全部更新可看https://github.com/hktrpg/TG.line.Discord.Roll.Bot/commits/master
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
意見留言群 https://discord.gg/vx4kcm7
			
邀請HKTRPG 加入
Line 邀請連結 http://bit.ly/HKTRPG_LINE
Discord 邀請連結 http://bit.ly/HKTRPG_DISCORD_
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

const privacy = `# 隱私權聲明

最後更新: 2022-03-07
非常歡迎您光臨及使用「HKTRPG」（以下簡稱本組織），為了讓您能夠安心使用本組織的各項服務與資訊，特此向您說明本組織的隱私權保護政策，以保障您的權益，請您詳閱下列內容：

一、隱私權保護政策的適用範圍
隱私權保護政策內容，包括本組織如何處理在您使用服務時收集到的個人識別資料。隱私權保護政策不適用於本組織以外的相關連結網站，也不適用於非本組織所委託或參與管理的人員。

二、個人資料的蒐集、處理及利用方式
當您造訪本組織或使用本組織所提供之功能服務時，我們將視該服務功能性質，請您提供必要的個人資料，並在該特定目的範圍內處理及利用您的個人資料；非經您書面同意，本組織不會將個人資料用於其他用途。
本組織在您使用HKTRPG的BOT或網站中具互動性或資料庫功能時，會保留您或您所使用的平台(包括但不限於Discord LINE Telegram Whatsapp)所提供的用戶名稱、ID、及使用時間等。
於一般使用時，伺服器會以不記名的方式自行記錄相關行徑進行統計，做為我們增進服務的參考依據。
為提供精確的服務，我們會將收集的問卷調查內容進行統計與分析，分析結果之統計數據或說明文字呈現，除供內部研究外，我們會視需要公佈統計數據及說明文字，但不涉及特定個人之資料。
您可以隨時向我們提出請求，以更正或刪除本組織所蒐集您錯誤或不完整的個人資料，請見最下方聯繫管道。
三、資料之保護
本組織主機均設有防火牆等相關的各項資訊安全設備及必要的安全防護措施，加以保護本組織及您的個人資料採用嚴格的保護措施，只由經過授權的人員才能接觸您的個人資料。
如因業務需要有必要委託其他單位提供服務時，本組織亦會嚴格要求其遵守保密義務，並且採取必要檢查程序以確定其將確實遵守。
四、本組織對外的相關連結
本組織提供其他網站的網路連結，您也可經由本組織所提供的連結，點選進入其他網站。但該連結網站不適用本組織的隱私權保護政策，您必須參考該連結網站中的隱私權保護政策。

五、與第三人共用個人資料之政策
本組織絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有法律依據或合約義務者，不在此限。

前項但書之情形包括不限於：

經由您書面同意。
法律明文規定。
為免除您生命、身體、自由或財產上之危險。
與公務機關或學術研究機構合作，基於公共利益為統計或學術研究而有必要，且資料經過提供者處理或蒐集著依其揭露方式無從識別特定之當事人。
當您在網站的行為，違反服務條款或可能損害或妨礙網站與其他使用者權益或導致任何人遭受損害時，經網站管理單位研析揭露您的個人資料是為了辨識、聯絡或採取法律行動所必要者。
有利於您的權益。
本組織委託廠商協助蒐集、處理或利用您的個人資料時，將對委外廠商或個人善盡監督管理之責。
六、Cookie之使用
為了提供您最佳的服務，本組織會在您的電腦中放置並取用我們的Cookie，若您不願接受Cookie的寫入，您可在您使用的瀏覽器功能項中設定隱私權等級為高，即可拒絕Cookie的寫入，但可能會導至網站某些功能無法正常執行 。

七、隱私權保護政策之修正
本組織隱私權保護政策將因應需求隨時進行修正，修正後的條款將刊登於網站上。

八、聯繫管道
對於本站之隱私權政策有任何疑問，或者想提出變更、移除個人資料之請求，請 Email 至： info@hktrpg.com

這隱私權條款以下列網站提供的範本作基礎，並修改後使用。
<https://github.com/lyrasoft/chinese-privacy-policy-template>
`