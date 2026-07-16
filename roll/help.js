"use strict";
const fs = require('node:fs');
const axios = require('axios');
const { resolveHelp, withPartialTranslationNotice, resolveGameName } = require('../modules/roll-i18n.js');
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




const gameName = function (params) {
	return resolveGameName(params, 'help.game_name', '骰子機器人HKTRPG說明');
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
const getHelpMessage = async function (params = {}) {
	return resolveHelp(params, 'help.base', () => require('../modules/i18n.js').createTranslator('zh-tw')('help.base'));
}
const initialize = function () {
	return variables;
}


const rollDiceCommand = async function ({
	mainMsg,
	t,
	locale
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: '',
		quotes: true
	};
	const translate = t || require('../modules/i18n.js').createTranslator(locale || 'zh-tw');
	const i18nParams = { locale, t };
	const isEnglish = (locale || 'zh-tw') === 'en';
	//let result = {};
	switch (true) {
		case !mainMsg[1]: {
			const ver = await version.version();
			const menuText = translate('help.main_menu_full', { version: ver });
			if (isEnglish) {
				const banner = translate('common.errors.partial_translation_banner');
				rply.text = `${banner}\n${menuText}`;
			} else {
				rply.text = menuText;
			}
			rply.buttonCreate = ['bothelp ver', 'bothelp Base', 'bothelp Dice', 'bothelp Tool', 'bothelp admin', 'bothelp funny', 'bothelp link', 'bothelp privacy', 'bothelp about']

			return rply;
		}
		case /^ver$/i.test(mainMsg[1]):
			rply.text = translate('help.ver_body', { version: await version.version() });
			return rply;
		case /^BASE/i.test(mainMsg[1]):
			rply.text = await getHelpMessage({ locale, t });
			rply.buttonCreate = ['dr 1d100', translate('help.button_attack_example'), '.5 3d6', '.5 4d6dl1', '.rr 5d10!k2']
			return rply;
		case /^about$/i.test(mainMsg[1]):
			rply.text = translate('help.about');
			return rply;
		case /^Dice/i.test(mainMsg[1]):
			if (/^DICE$/i.test(mainMsg[1])) {
				rply.text = translate('help.submenu_dice');
				rply.buttonCreate = [];
				for (let num in Dice) {
					rply.text += num + ": " + Dice[num].gameName(i18nParams) + '\n';
					rply.buttonCreate.push('bothelp Dice' + num);
				}
			}
			if (/^Dice\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^dice/i, '');
				if (!Dice[temp]) return;
				rply.text = withPartialTranslationNotice(await Dice[temp].getHelpMessage({ locale, t }), { locale, t });
			}
			return rply;
		case /^Tool/i.test(mainMsg[1]):
			if (/^Tool$/i.test(mainMsg[1])) {
				rply.text = translate('help.submenu_tool');
				rply.buttonCreate = [];
				for (let num in Tool) {
					rply.text += num + ": " + Tool[num].gameName(i18nParams) + '\n';
					rply.buttonCreate.push('bothelp Tool' + num);
				}
			}
			if (/^Tool\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^Tool/i, '');
				if (!Tool[temp]) return;
				rply.text = withPartialTranslationNotice(await Tool[temp].getHelpMessage({ locale, t }), { locale, t });
			}
			return rply;
		case /^privacy/i.test(mainMsg[1]): {
			rply.text = translate('help.privacy');
			return rply;
		}
		case /^admin/i.test(mainMsg[1]):
			if (/^admin$/i.test(mainMsg[1])) {
				rply.text = translate('help.submenu_admin');
				rply.buttonCreate = [];
				for (let num in admin) {
					rply.text += num + ": " + admin[num].gameName(i18nParams) + '\n';
					rply.buttonCreate.push('bothelp admin' + num);
				}
			}
			if (/^admin\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^admin/i, '');
				if (!admin[temp]) return;
				rply.text = withPartialTranslationNotice(await admin[temp].getHelpMessage({ locale, t }), { locale, t });
			}
			return rply;

		case /^funny/i.test(mainMsg[1]):
			if (/^funny$/i.test(mainMsg[1])) {
				rply.text = translate('help.submenu_funny');
				rply.buttonCreate = [];
				for (let num in funny) {
					rply.text += num + ": " + funny[num].gameName(i18nParams) + '\n';
					rply.buttonCreate.push('bothelp Funny' + num);
				}
			}
			if (/^funny\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^funny/i, '');
				if (!funny[temp]) return;
				rply.text = withPartialTranslationNotice(await funny[temp].getHelpMessage({ locale, t }), { locale, t });
			}
			return rply;

		case /^help/i.test(mainMsg[1]):
			if (/^help$/i.test(mainMsg[1])) {
				rply.text = translate('help.submenu_help_doc');
				rply.buttonCreate = [];
				for (let num in help) {
					rply.text += num + ": " + help[num].gameName(i18nParams) + '\n';
					rply.buttonCreate.push('bothelp help' + num);
				}
			}
			if (/^help\d+$/i.test(mainMsg[1])) {
				let temp = mainMsg[1].replace(/^help/i, '');
				if (!help[temp]) return;
				rply.text = withPartialTranslationNotice(await help[temp].getHelpMessage({ locale, t }), { locale, t });
			}
			return rply;

		case /^link/i.test(mainMsg[1]):
			rply.text = translate('help.link');
			return rply;
		case /^req/i.test(mainMsg[1]):
			rply.text = translate('help.report');
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
