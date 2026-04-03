"use strict";
const fs = require('node:fs');
const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');
const Dice = [],
	Tool = [],
	admin = [],
	funny = [],
	help = [],
	link = [];
const start = async () => {
	try {
		const commandFiles = fs.readdirSync('./roll/').filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const tryFile = require(`../roll/${file}`);
			if (tryFile.gameType && tryFile.gameType()) {
				let type = require('./' + file).gameType().replace(/:.*/i, '')
				let name = file.replace('.js', '');
				exports[type + '_' + name] = await require('./' + file);
			}

		}
	} catch (error) {
		console.error('help.js error:', error)
	}
	for (let name of Object.keys(exports)) {
		if (/^DICE/i.test(name)) {
			Dice.push(exports[name])
		}
		if (/^Tool/i.test(name)) {
			Tool.push(exports[name]);
		}
		if (/^admin/i.test(name)) {
			admin.push(exports[name]);
		}
		if (/^funny/i.test(name)) {
			funny.push(exports[name]);
		}
		if (/^help/i.test(name)) {
			help.push(exports[name]);
		}
		if (/^link/i.test(name)) {
			link.push(exports[name]);
		}
	}
}
start();
let variables = {};
//heroku labs:enable runtime-dyno-metadata -a <app name>




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
    return `【🎲擲骰系統】
╭────── 🎯暗骰功能 ──────
│ • dr [指令] - 結果私訊給你
│ • ddr/dddr - 私訊給已設定的GM
│ • .drgm - 查詢GM設定詳情
│
├────── 📊基本擲骰 ──────
│ 標準格式: [次數]d[面數][運算符][修正值]
│ 
│ 基本用法:
│ 　• 2d6+1 - 擲兩顆六面骰+1
│ 　• (2d6+1)*2 攻撃！
│ 　  範例輸出: (10[5+5]+1)2 = 22
│
│ 進階功能:
│ 　• .5 3D6 - 投擲5次3d6
│ 　• 支援四則運算與括號
│ 　• 支援比較符號 >, <, >=, <=
│
│ 保留/放棄骰值:
│ 　• kh - keep highest 保留最高
│ 　• kl - keep lowest 保留最低
│ 　• dh - drop highest 放棄最高
│ 　• dl - drop lowest 放棄最低
│ 　
│ 範例:
│ 　• 3d6kh1 - 保留最高一顆
│ 　• 3d6dl2 - 放棄最低兩顆
│
├────── 🎲RPG Dice Roller ──────
│ 使用指令: .rr [骰子表示式]
│
│ 特色:
│ 　• 支援Foundry VTT格式
│ 　• 提供更詳細的擲骰選項
│
│ 範例:
│ 　• 1d10r1 - 遇1重骰
│ 　• 5d10!k2 - 爆擊後保留2顆
│
│ 📚完整指令說明:
│ dice-roller.github.io/documentation
╰──────────────`
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
			rply.text = `【HKTRPG擲骰機器人 🎲】v${await version.version()}
╭───── 👋 歡迎使用 ─────
│ HKTRPG是跨平台骰子機器人
│ 支援Discord、Line、Telegram
│ Whatsapp與網頁版
│
├───── 🎯 核心功能 ─────
│ • 基礎擲骰與暗骰
│ • 各類TRPG系統骰子
│ • 自定義骰子
│ • 角色卡系統
│ • 先攻表
│ • 經驗值系統
│
├───── 🛠️ 實用工具 ─────
│ • 資料庫快速查詢
│ • Discord聊天紀錄匯出
│ • 定時發送訊息
│ • 圖片搜尋
│ • 即時翻譯
│ • Wiki查詢
│ • 數學計算
│
├───── 📖 查詢指令 ─────
│ • bothelp ver   - 版本與公告
│ • bothelp Base  - 基本擲骰指令🎲
│ • bothelp Dice  - 系統擲骰指令💻
│ • bothelp Tool  - 輔助工具指令🧰
│ • bothelp admin - 管理工具指令⚙️
│ • bothelp funny - 娛樂功能指令😂
│ • bothelp link  - 相關平台連結🔗
│ • bothelp privacy- 隱私權條款🔒
│ • bothelp about - 歷史沿革📜
│
├───── 🔗 重要連結 ─────
│ 📚 使用教學:
│ https://bothelp.hktrpg.com
│
│ 🗂️ 作品集:
│ https://hktrpg.github.io/TG.line.Discord.Roll.Bot/PORTFOLIOP
│
│ ℹ️ 支援社群:
│ https://support.hktrpg.com
│
│ ☕ 贊助伺服器運行及開放VIP資源:
│ https://www.patreon.com/HKTRPG
╰──────────────────`
			rply.buttonCreate = ['bothelp ver', 'bothelp Base', 'bothelp Dice', 'bothelp Tool', 'bothelp admin', 'bothelp funny', 'bothelp link', 'bothelp privacy', 'bothelp about']

			return rply;
		case /^ver$/i.test(mainMsg[1]):
			rply.text = `${await version.version()}
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
			rply.buttonCreate = ['dr 1d100', '2d6+10 攻擊', '.5 3d6', '.5 4d6dl1', '.rr 5d10!k2']
			return rply;
		case /^about$/i.test(mainMsg[1]):
			rply.text = `【HKTRPG歷史淵源 📜】
╭──── 💫 起源 ────
│ HKTRPG的誕生來自開源項目
│ 「機器鴨霸獸」
│ 最早由LarryLo Retsnimle開發
│ 
├──── 🌱 傳承 ────
│ • 開放源碼的骰子機器人計畫
│ • 供社群自由使用與開發
│ • 詳細的程式碼注釋
│ • 幫助新人學習JS開發
│
├──── 📋 授權條款 ────
│ • GNU通用公共授權條款(GPL)
│ • 賦予使用者四大自由:
│   - 自由執行
│   - 自由學習
│   - 自由分享
│   - 自由修改
│
├──── 💝 特別感謝 ────
│ 感謝原始開發者LarryLo的貢獻
│ 讓更多人能夠參與開發
│ 共同建立更好的TRPG社群
│
╰──────────────────
原始資料來源:
https://docs.google.com/document/d/1dYnJqF2_QTp90ld4YXj6X8kgxvjUoHrB4E2seqlDlAk/edit
`
			return rply;
		case /^Dice/i.test(mainMsg[1]):
			if (/^DICE$/i.test(mainMsg[1])) {
				rply.text = `【🎲 查看骰子說明】
╭─────────────
│ 指令格式: bothelp Dice序號
│ 例如: bothelp Dice1
│
│ 請輸入序號查看詳細內容
╰─────────────
`
				rply.buttonCreate = [];
				for (let num in Dice) {
					rply.text += num + ": " + Dice[num].gameName() + '\n';
					rply.buttonCreate.push('bothelp Dice' + num);
				}
			}
			if (/^Dice\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^dice/i, '');
				if (!Dice[temp]) return;
				rply.text = await Dice[temp].getHelpMessage();
			}
			return rply;
		case /^Tool/i.test(mainMsg[1]):
			if (/^Tool$/i.test(mainMsg[1])) {
				rply.text = `【🛠️ 查看工具說明】
╭─────────────
│ 指令格式: bothelp Tool序號
│ 例如: bothelp Tool1
│
│ 請輸入序號查看詳細內容
╰─────────────
`
				rply.buttonCreate = [];
				for (let num in Tool) {
					rply.text += num + ": " + Tool[num].gameName() + '\n';
					rply.buttonCreate.push('bothelp Tool' + num);
				}
			}
			if (/^Tool\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^Tool/i, '');
				if (!Tool[temp]) return;
				rply.text = await Tool[temp].getHelpMessage();
			}
			return rply;
		case /^privacy/i.test(mainMsg[1]): {
			rply.text = `【🔒 隱私權聲明】
╭─────────────
│ 詳細內容請參閱:
│ https://bothelp.hktrpg.com/hktrpg-guan-fang-shi-yong-jiao-xue/qi-ta-qing-bao/yin-si-quan-sheng-ming
╰─────────────`
			return rply;
		}
		case /^admin/i.test(mainMsg[1]):
			if (/^admin$/i.test(mainMsg[1])) {
				rply.text = `【⚙️ 管理指令說明】
╭─────────────
│ 指令格式: bothelp admin序號
│ 例如: bothelp admin1
│
│ 請輸入序號查看詳細內容
╰─────────────
`
				rply.buttonCreate = [];
				for (let num in admin) {
					rply.text += num + ": " + admin[num].gameName() + '\n';
					rply.buttonCreate.push('bothelp admin' + num);
				}
			}
			if (/^admin\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^admin/i, '');
				if (!admin[temp]) return;
				rply.text = await admin[temp].getHelpMessage();
			}
			return rply;

		case /^funny/i.test(mainMsg[1]):
			if (/^funny$/i.test(mainMsg[1])) {
				rply.text = `【😄 娛樂功能說明】
╭─────────────
│ 指令格式: bothelp funny序號
│ 例如: bothelp funny1
│
│ 請輸入序號查看詳細內容
╰─────────────
`
				rply.buttonCreate = [];
				for (let num in funny) {
					rply.text += num + ": " + funny[num].gameName() + '\n';
					rply.buttonCreate.push('bothelp Funny' + num);
				}
			}
			if (/^funny\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^funny/i, '');
				if (!funny[temp]) return;
				rply.text = await funny[temp].getHelpMessage();
			}
			return rply;

		case /^help/i.test(mainMsg[1]):
			if (/^help$/i.test(mainMsg[1])) {
				rply.text = `【❓ 說明文件查詢】
╭─────────────
│ 指令格式: bothelp help序號
│ 例如: bothelp help1
│
│ 請輸入序號查看詳細內容
╰─────────────
`
				rply.buttonCreate = [];
				for (let num in help) {
					rply.text += num + ": " + help[num].gameName() + '\n';
					rply.buttonCreate.push('bothelp help' + num);
				}
			}
			if (/^help\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^help/i, '');
				if (!help[temp]) return;
				rply.text = await help[temp].getHelpMessage();
			}
			return rply;

		case /^link/i.test(mainMsg[1]):
			rply.text = `【🎲 HKTRPG擲骰機器人】
╭──────────────────
│ 🌐 官方網站
│ https://bothelp.hktrpg.com/
│ 
│ 📚 TRPG百科
│ https://wiki.hktrpg.com/
│
│ 💬 官方支援群
│ https://support.hktrpg.com
│
│ 🤖 邀請機器人
│ LINE:    http://line.hktrpg.com/
│ Discord: https://discord.hktrpg.com/
│ Telegram: http://telegram.hktrpg.com/
│ Web版:    https://rollbot.hktrpg.com/
│ Plurk版: https://plurk.hktrpg.com/
│ 快速擲骰: https://roll.hktrpg.com/
| WhatsApp: https://api.whatsapp.com/send?phone=85294427421&text=運勢
│
│ 📱 社群連結
│ FB社團:   https://www.facebook.com/groups/HKTRPG
│ 贊助支持: https://www.patreon.com/HKTRPG
│ GitHub:   http://github.hktrpg.com/
╰──────────────────
`
			return rply;
		case /^req/i.test(mainMsg[1]):
			rply.text = `請到以下問卷填寫意見，所有意見內容將改善RollBot
			https://forms.gle/uXq6taCPGJ2M99Gp9`
			return rply;
		default:
			break;
	}
}

class Version {
	constructor() {
		this.repo = 'hktrpg/TG.line.Discord.Roll.Bot';
		this.filesCourt = 0;
		this.pullsNumber = 0;
		this.lastUpdate = '00000000';
	}
	async version() {
		await this.update();
		return `v1.${this.filesCourt}.${this.pullsNumber}.${this.lastUpdate}`
	}
	async update() {
		try {
			const {
				data
			} = await axios.get(`https://api.github.com/repos/${this.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=1`);
			this.pullsNumber = data[0].number;
			this.lastUpdate = this.YYYYMMDD(data[0].merged_at);
		} catch (error) {
			console.error('help #302 version error:', error)
		}
		this.filesCourt = Object.keys(exports).length;
	}
	YYYYMMDD(lastUpdateDate) {
		//2023-08-21T16:19:00Z
		const date = new Date(lastUpdateDate);
		const year = date.getFullYear().toString().slice(-2);
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}${month}${day}`;

	}
}

const version = new Version();
/**
 * if (botname == "Line")
				rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik\nP.S. Line 修改政策，免費帳號的Line Bot現在有每月500次的私訊限制，超過時DR等私訊功能會失效。(可以認為這功能在Line已失效，半天已400個DR私訊要求)"
 */
const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('bothelp')
            .setDescription('HKTRPG擲骰機器人說明')
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('選擇說明類別：版本、擲骰、工具、娛樂、管理等')
                    .setRequired(false)
                    .addChoices(
                        { name: '版本與公告', value: 'ver' },
                        { name: '基本擲骰指令', value: 'Base' },
                        { name: '系統擲骰指令', value: 'Dice' },
                        { name: '輔助工具指令', value: 'Tool' },
                        { name: '管理工具指令', value: 'admin' },
                        { name: '娛樂功能指令', value: 'funny' },
                        { name: '相關平台連結', value: 'link' },
                        { name: '隱私權條款', value: 'privacy' },
                        { name: '歷史沿革', value: 'about' }
                    )),
        async execute(interaction) {
            const category = interaction.options.getString('category') || '';
            return `bothelp ${category}`;
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
	Version: Version,
	discordCommand
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
