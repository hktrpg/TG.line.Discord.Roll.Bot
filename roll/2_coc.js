"use strict";
const rollbase = require('./rollbase.js');
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
const checkMongodb = require('../modules/dbWatchdog.js');
const mathjs = require('mathjs');
const gameName = function () {
	return '【克蘇魯神話】 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg'
}
const { SlashCommandBuilder } = require('discord.js');
const gameType = function () {
	return 'Dice:CoC'
}
const prefixs = function () {
	return [{
		first: /(^\.cccc$)|(^\.ccdr$)|(^\.ccpc$)|(^ccrt$)|(^\.chase$)|(^ccsu$)|(^cc7版創角$)|(^[.]dp$)|(^[.]cc7build$)|(^[.]ccpulpbuild$)|(^[.]cc6build$)|(^[.]cc7bg$)|(^cc6版創角$)|(^cc7版角色背景$)/i,
		second: null
	},
	{
		first: /(^\.sc$)|(^ccb$)|(^cc$)|(^ccn[1-2]$)|(^cc[1-2]$)|(^成長檢定$)|(^幕間成長$)/i,
		second: /(^\d+)|(^help$)/i
	}
	]
}
const getHelpMessage = function () {
	return `【克蘇魯神話】
coc6版擲骰		： ccb 80 技能小於等於80
coc7版擲骰		： cc 80 技能小於等於80
coc7版獎勵骰	： cc(1~2) cc1 80 一粒獎勵骰
coc7版懲罰骰	： ccn(1~2) ccn2 80 兩粒懲罰骰
coc7版聯合檢定	： 
cc 80,40 偵查,鬥毆 cc1 80,40 偵查,鬥毆 ccN1 80,40 偵查,鬥毆

coc7版SanCheck	： .sc (SAN值) (成功)/(失敗)
eg: .sc 50		.sc 50 1/1d3+1		.sc 50 1d10/1d100

coc7版追逐戰產生器(娛樂用): .chase
P.S.追逐戰功能使用了可選規則及我對規則書之獨斷理解，
並不一定完全符合規則書內容，請自行衡量使用
建議使用前詳細閱讀規則書第七章追逐

coc7版 即時型瘋狂： 啓動語 ccrt
coc7版 總結型瘋狂： 啓動語 ccsu

coc7版 神話組織 隨機產生： 啓動語 .cccc
coc7版 神話資料 隨機產生： 啓動語 .ccdr
coc7版 施法推骰後果： 啓動語 .ccpc

coc pulp版創角			： 啓動語 .ccpulpbuild
coc6版創角				： 啓動語 .cc6build
coc7版創角				： 啓動語 .cc7build (歲數7-89)
coc7版隨機創角			： 啓動語 .cc7build random
coc7版自由分配點數創角	： 啓動語 .cc7build .xyz (歲數7-89)
如.cc7build .752 
就會擲出
7次 3d6 * 5
5次 (2d6+6) * 5 
2次 3d6 * 5
可只輸入.  不輸入xyz
預設值為 .53 即5次 3d6 * 5 和3次 (2d6+6) * 5 

coc7 成長或增強檢定： .dp 或 成長檢定 或 幕間成長 (技能%) (名稱) (可以一次輸入多個)
例）.DP 50 騎乘 80 鬥毆  70 60

coc7版角色背景隨機生成： 啓動語 .cc7bg

----2021/08/07新增----
成長檢定紀錄功能
開啓後將會紀錄你使用CC功能投擲成功和大成功大失敗的技能，
然後可以呼叫出來進行自動成長。
.dp start 	： 開啓紀錄功能
.dp stop  	： 停止紀錄功能
.dp show  	： 顯示擲骰紀錄
.dp showall	： 顯示全頻道所有大成功大失敗擲骰紀錄
.dp auto  	： 進行自動成長並清除擲骰紀錄
.dp clear 	： 清除擲骰紀錄
.dp clearall： 清除擲骰紀錄包括大成功大失敗

`
}
const initialize = function () {
	return {};
}

const rollDiceCommand = async function ({
	mainMsg,
	groupid,
	userid,
	userrole,
	channelid,
	displayname,
	displaynameDiscord,
	tgDisplayname,
	botname
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let trigger = mainMsg[0].toLowerCase();
	switch (true) {
		case (/^help$/i.test(mainMsg[1])): {
			rply.text = this.getHelpMessage();
			rply.quotes = true;
			break;
		}
		case /^ccrt$/i.test(mainMsg[0]): {
			rply.text = ccrt();
			rply.quotes = true;
			break;
		}
		case /^ccsu$/i.test(mainMsg[0]): {
			rply.text = ccsu();
			rply.quotes = true;
			break;
		}
		case /^\.sc$/i.test(mainMsg[0]): {
			let sc = new SanCheck(mainMsg, botname);
			rply.text = sc.run();
			rply.buttonCreate = sc.getButton();
			rply.quotes = true;
			break;
		}
		case /^\.chase$/i.test(mainMsg[0]): {
			rply.text = chase();
			rply.quotes = true;
			break;
		}
		case (trigger == 'ccb' && mainMsg[1] <= 1000): {
			rply.text = coc6(mainMsg[1], mainMsg[2]);
			break;
		}
		//DevelopmentPhase幕間成長指令開始於此
		case /^\.dp$/i.test(mainMsg[0]) && /^start$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannelAdmin,
				gid: groupid,
				role: userrole
			})) {
				return rply;
			}
			rply.text = await dpRecordSwitch({ onOff: true, groupid, channelid });
			rply.quotes = true;
			return rply;
		}
		case /^\.dp$/i.test(mainMsg[0]) && /^stop$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannelAdmin,
				gid: groupid,
				role: userrole
			})) {
				return rply;
			}
			rply.text = await dpRecordSwitch({ onOff: false, groupid, channelid });
			rply.quotes = true;
			break;
		}
		case /^\.dp$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannel,
				gid: groupid
			})) {
				return rply;
			}

			let switchOn = await schema.developmentConductor.findOne({
				groupID: channelid || groupid,
				switch: true
			}).catch(error => console.error('coc #149 mongoDB error: ', error.name, error.reson));
			if (!switchOn) {
				rply.text = '本頻道未開啓CC紀錄功能, 請使用 .dp start 開啓'
				return rply;
			}
			let result = await schema.developmentRollingRecord.find({
				groupID: channelid || groupid,
				userID: userid,
			}).sort({ date: -1 }).catch(error => console.error('coc #157 mongoDB error: ', error.name, error.reson));
			rply.quotes = true;
			if (!result || result.length == 0) {
				rply.text = '未有CC擲骰紀錄';
				return rply;
			}
			let successResult = {
				data: false,
				text: `成功的擲骰結果`
			};
			let successResultWithoutName = {
				data: false,
				text: `=======
				無記名成功結果`}
				;
			let criticalSuccessNfumbleResult = {
				data: false,
				text: `=======
				大成功與大失敗`}
				;
			for (let index = 0; index < result.length; index++) {
				if (result[index].skillPerStyle == 'normal' && result[index].skillName) {
					successResult.data = true;
					successResult.text += `
					「${result[index].skillName}」	${result[index].skillPer} - ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()}`
				}
				if (result[index].skillPerStyle == 'normal' && !result[index].skillName) {
					successResultWithoutName.data = true;
					successResultWithoutName.text += `
					「無名技能」	${result[index].skillPer} - ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()}`
				}
				if (result[index].skillPerStyle == 'criticalSuccess' || result[index].skillPerStyle == 'fumble') {
					criticalSuccessNfumbleResult.data = true;
					criticalSuccessNfumbleResult.text += `
					${(result[index].skillName) ? '「' + result[index].skillName + '」' : '「無名技能」'} ${result[index].skillPer} - ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()} - ${(result[index].skillPerStyle == 'criticalSuccess') ? '大成功' : '大失敗'}`
				}

			}
			/**
			 * 成功的擲骰結果
			 * =======
			 * 空手 50	拳擊 60	拳	80
			 * 空手 50	拳擊 60	拳	80 	
			 * =======
			 * 無記名成功結果
			 * 21-08-04 12:33 技能	80
			 * 21-08-04 13:33 技能	80
			 * =======
			 * 大成功與大失敗
			 * 技能	80	大失敗
			 * 拳	80	大成功
			 */

			(successResult.data) ? rply.text += `${successResult.text}\n` : null;
			(successResultWithoutName.data) ? rply.text += `${successResultWithoutName.text}\n` : null;
			(criticalSuccessNfumbleResult.data) ? rply.text += `${criticalSuccessNfumbleResult.text}\n` : null;
			return rply;
		}

		case /^\.dp$/i.test(mainMsg[0]) && /^showall$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannel,
				gid: groupid,
			})) {
				return rply;
			}
			let switchOn = await schema.developmentConductor.findOne({
				groupID: channelid || groupid,
				switch: true
			}).catch(error => console.error('coc #224 mongoDB error: ', error.name, error.reson));
			if (!switchOn) {
				rply.text = '本頻道未開啓CC紀錄功能, 請使用 .dp start 開啓'
				return rply;
			}
			let result = await schema.developmentRollingRecord.find({
				groupID: channelid || groupid,
				userID: userid,
				$or: [{
					skillPerStyle: 'criticalSuccess'
				}, {
					skillPerStyle: 'fumble'
				}]
			}).sort({ userName: -1 }).catch(error => console.error('coc #237 mongoDB error: ', error.name, error.reson));
			rply.quotes = true;
			let criticalSuccessNfumbleResult = {
				data: false,
				text: `大成功與大失敗
				=======`}
				;
			for (let index = 0; index < result.length; index++) {
				if (result[index].skillPerStyle == 'criticalSuccess' || result[index].skillPerStyle == 'fumble') {
					criticalSuccessNfumbleResult.data = true;
					criticalSuccessNfumbleResult.text += `
					${(result[index].userName) ? result[index].userName : '「無名使用者」'} ${(result[index].skillName) ? result[index].skillName : '「無名技能」'} ${result[index].skillPer} - ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()} - ${(result[index].skillPerStyle == 'criticalSuccess') ? '大成功' : '大失敗'}`
				}

			}
			(criticalSuccessNfumbleResult.data) ? rply.text += criticalSuccessNfumbleResult.text : rply.text += "本頻道未有相關紀錄, 請多些擲骰吧!";
			return rply;
		}
		case /^\.dp$/i.test(mainMsg[0]) && /^auto$/i.test(mainMsg[1]): {
			rply.quotes = true;
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannel,
				gid: groupid,
			})) {
				return rply;
			}

			let switchOn = await schema.developmentConductor.findOne({
				groupID: channelid || groupid,
				switch: true
			}).catch(error => console.error('coc #264 mongoDB error: ', error.name, error.reson));
			if (!switchOn) {
				rply.text = '本頻道未開啓CC紀錄功能, 請使用 .dp start 開啓'
				return rply;
			}

			let result = await schema.developmentRollingRecord.find({
				groupID: channelid || groupid,
				userID: userid,
				skillPerStyle: 'normal'
			}).sort({ date: -1 }).catch(error => console.error('coc #274 mongoDB error: ', error.name, error.reson));
			if (!result || result.length == 0) {
				rply.text = '未有CC擲骰紀錄';
				return rply;
			}
			rply.text = `自動成長檢定\n========`;
			for (let index = 0; index < result.length; index++) {
				let target = Number(result[index].skillPer);
				let name = result[index].skillName || '無名技能';
				let skill = rollbase.Dice(100);
				let confident = (target <= 89) ? true : false;
				if (target > 95) target = 95;
				if (skill >= 96 || skill > target) {
					let improved = rollbase.Dice(10);
					rply.text += `\n1D100 > ${target} 擲出: ${skill}  →  「${name}」成長成功! 技能增加 ${improved} 點，現在是 ${target + improved} 點。- ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()}`

					if (confident && ((target + improved) >= 90)) {
						rply.text += `\n調查員的技能提升到90%以上，他的當前理智值增加${rollbase.Dice(6) + rollbase.Dice(6)}點。`
					}
				} else {
					rply.text += `\n1D100 > ${target} 擲出: ${skill}  →  「${name}」 成長失敗!  - ${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()}`
				}

			}
			await schema.developmentRollingRecord.deleteMany({
				groupID: channelid || groupid,
				userID: userid,
				skillPerStyle: 'normal'
			}).catch(error => console.error('coc #302 mongoDB error: ', error.name, error.reson));
			rply.text += `\n--------
			成長結束，已清除擲骰紀錄`
			return rply;
		}
		case /^\.dp$/i.test(mainMsg[0]) && /^clear$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannel,
				gid: groupid,
			})) {
				return rply;
			}

			let result = await schema.developmentRollingRecord.deleteMany({
				groupID: channelid || groupid,
				userID: userid,
				skillPerStyle: 'normal'
			}).catch(error => console.error('coc #316 mongoDB error: ', error.name, error.reson));

			rply.quotes = true;
			rply.text = `已清除 ${result.n}項紀錄, 如想大成功大失敗紀錄也清除, 請使用 .dp clearall`
			return rply;
		}
		case /^\.dp$/i.test(mainMsg[0]) && /^clearall$/i.test(mainMsg[1]): {
			if (rply.text = checkTools.permissionErrMsg({
				flag: checkTools.flag.ChkChannel,
				gid: groupid,
			})) {
				return rply;
			}

			let result = await schema.developmentRollingRecord.deleteMany({
				groupID: channelid || groupid,
				userID: userid,
				$or: [{
					skillPerStyle: 'criticalSuccess'
				}, {
					skillPerStyle: 'fumble'
				}, {
					skillPerStyle: 'normal'
				}]

			}).catch(error => console.error('coc #338 mongoDB error: ', error.name, error.reson));
			rply.quotes = true;
			rply.text = `已清除你在本頻道的所有CC擲骰紀錄, 共計${result.n}項`
			return rply;

		}
		case (trigger == '.dp' || trigger == '成長檢定' || trigger == '幕間成長'): {
			rply.text = DevelopmentPhase(mainMsg);
			rply.quotes = true;
			break;
		}
		case (trigger == 'cc' && mainMsg[1] !== null): {
			rply.text = await coc7({ chack: mainMsg[1], text: mainMsg[2], userid, groupid, channelid, userName: tgDisplayname || displaynameDiscord || displayname });
			break;
		}
		case (trigger == 'cc1' && mainMsg[1] !== null): {
			rply.text = await coc7bp({ chack: mainMsg[1], text: mainMsg[2], userid, groupid, channelid, bpdiceNum: 1, userName: tgDisplayname || displaynameDiscord || displayname });
			break;
		}
		case (trigger == 'cc2' && mainMsg[1] !== null): {
			rply.text = await coc7bp({ chack: mainMsg[1], text: mainMsg[2], userid, groupid, channelid, bpdiceNum: 2, userName: tgDisplayname || displaynameDiscord || displayname });
			break;
		}
		case (trigger == 'ccn1' && mainMsg[1] !== null): {
			rply.text = await coc7bp({ chack: mainMsg[1], text: mainMsg[2], userid, groupid, channelid, bpdiceNum: -1, userName: tgDisplayname || displaynameDiscord || displayname });
			break;
		}
		case (trigger == 'ccn2' && mainMsg[1] !== null): {
			rply.text = await coc7bp({ chack: mainMsg[1], text: mainMsg[2], userid, groupid, channelid, bpdiceNum: -2, userName: tgDisplayname || displaynameDiscord || displayname });
			break;
		}

		case /(^cc7版創角$)|(^[.]cc7build$)/i.test(mainMsg[0]): {
			rply.text = builder.build(mainMsg[1] || 'random', mainMsg[2]).replace(/\*5/ig, ' * 5').trim();
			rply.quotes = true;
			break;
		}
		case /(^ccpulp版創角$)|(^[.]ccpulpbuild$)/i.test(mainMsg[0]): {
			rply.text = (buildpulpchar(mainMsg[1])).replace(/\*5/ig, ' * 5');
			rply.quotes = true;
			break;
		}
		case /(^cc6版創角$)|(^[.]cc6build$)/i.test(mainMsg[0]): {
			rply.text = build6char(mainMsg[1]);
			rply.quotes = true;
			break;
		}
		case /(^cc7版角色背景$)|(^[.]cc7bg$)/i.test(mainMsg[0]): {
			rply.text = PcBG();
			rply.quotes = true;
			break;
		}
		case /(^\.cccc)/i.test(mainMsg[0]): {
			rply.text = CreateCult.createCult();
			rply.quotes = true;
			return rply;
		};
		case /(^\.ccpc)/i.test(mainMsg[0]): {
			rply.text = MythoyCollection.getMythonData('pushedCasting');
			rply.quotes = true;
			return rply;
		};
		case /(^\.ccdr)/i.test(mainMsg[0]): {
			rply.text = MythoyCollection.getMythos();
			rply.quotes = true;
			return rply;
		};

		default:
			break;
	}
	return rply;
}
const discordCommand = [
	{
		data: new SlashCommandBuilder()
			.setName('ccrt')
			.setDescription('coc7版 即時型瘋狂')
		,
		async execute() {
			return `ccrt`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('ccsu')
			.setDescription('coc7版 總結型瘋狂')
		,
		async execute() {
			return `ccsu`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('ccb')
			.setDescription('coc6版擲骰')
			.addStringOption(option => option.setName('text').setDescription('目標技能大小及名字').setRequired(true)),
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `ccb ${text}`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('cc')
			.setDescription('coc7版擲骰')
			.addStringOption(option => option.setName('text').setDescription('目標技能大小及名字').setRequired(true))
			.addStringOption(option =>
				option.setName('paney')
					.setDescription('獎勵或懲罰骰')
					.addChoices({ name: '1粒獎勵骰', value: '1' },
						{ name: '2粒獎勵骰', value: '2' },
						{ name: '1粒懲罰骰', value: 'n1' },
						{ name: '2粒懲罰骰', value: 'n2' }))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			const paney = interaction.options.getString('paney') || '';

			return `cc${paney} ${text}`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('sc')
			.setDescription('coc7版SanCheck')
			.addStringOption(option => option.setName('text').setDescription('你的San值').setRequired(true))
			.addStringOption(option => option.setName('success').setDescription('成功扣多少San'))
			.addStringOption(option => option.setName('failure').setDescription('失敗扣多少San')),
		async execute(interaction) {
			const text = interaction.options.getString('text')
			const success = interaction.options.getString('success')
			const failure = interaction.options.getString('failure')
			let ans = `.sc ${text}`
			if ((success !== null) && (failure !== null)) ans = `${ans} ${success}/${failure}`
			return ans;
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('build')
			.setDescription('創角功能')
			.addSubcommand(subcommand =>
				subcommand
					.setName('ccpulpbuild')
					.setDescription('pulp版創角'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('cc6build')
					.setDescription('coc6版創角'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('cc7build')
					.setDescription('coc7版創角').addStringOption(option => option.setName('age').setDescription('可選: (歲數7-89) 如果沒有會使用隨機開角')))

		,
		async execute(interaction) {
			const age = interaction.options.getString('age') || '';
			const subcommand = interaction.options.getSubcommand()
			if (subcommand !== null)
				return `.${subcommand} ${age}`
			return '.cc7build help';
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('dp')
			.setDescription('coc7 成長或增強檢定')
			.addStringOption(option => option.setName('text').setDescription('目標技能大小及名字').setRequired(true)),
		async execute(interaction) {
			const text = interaction.options.getString('text')
			return `.dp ${text}`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('dpg')
			.setDescription('coc7 成長檢定紀錄功能')
			.addStringOption(option =>
				option.setName('mode')
					.setDescription('功能')
					.addChoices({ name: '顯示擲骰紀錄', value: 'show' },
						{ name: '顯示全頻道所有大成功大失敗擲骰紀錄', value: 'showall' },
						{ name: '開啓紀錄功能', value: 'start' },
						{ name: '停止紀錄功能', value: 'stop' },
						{ name: '進行自動成長並清除擲骰紀錄', value: 'auto' },
						{ name: '清除擲骰紀錄', value: 'clear' },
						{ name: '清除擲骰紀錄包括大成功大失敗', value: 'clearall' })
			),
		async execute(interaction) {
			const mode = interaction.options.getString('mode')
			return `.dp ${mode}`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('cc7bg')
			.setDescription('coc7版角色背景隨機生成'),
		async execute() {
			return `.cc7bg`
		}
	}
	, {
		data: new SlashCommandBuilder()
			.setName('cccc')
			.setDescription('隨機產生 神話組織')
		,
		async execute() {
			return `.cccc`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('ccdr')
			.setDescription('隨機產生 神話資料')
		,
		async execute() {
			return `.ccdr`
		}
	}, {
		data: new SlashCommandBuilder()
			.setName('ccpc')
			.setDescription('施法推骰後果')
		,
		async execute() {
			return `.ccpc`
		}
	}
];

module.exports = {
	rollDiceCommand,
	initialize,
	getHelpMessage,
	prefixs,
	gameType,
	gameName,
	discordCommand
};

class CreateCult {
	constructor() {
	}
	/*
	回應格式
	==============
	Cult 產生器
	首領名字: XXXXXX

	首領身份:
	-> 1-10;
	
	屬性: A-D STR, CON, SIZ, DEX, INT, APP, POW, and EDU
	
	技能: QUICK-REFERENCE SKILLS  A-E

	特質:  個性: 
	-1-100

	能力來源: 
	SOURCES OF POWER 1-3, 4-6, 7-8, 9-10
	==============
	邪教名稱?

	CULT GOALS—WANTS 1-10

	CULT GOALS—MEANS 1-10
	 */
	static createCult() {
		let cult = {
			leaderPosition: this.leaderPosition(),
			characteristics: this.characteristics(),
			skill: this.skill(),
			description: this.description(),
			personality: this.personality(),
			spells: this.spells(),
			sourcesOfPower: this.sourcesOfPower(),
			cultGoals: this.cultGoals(),
			cultGoalsMeans: this.cultGoalsMeans(),
		}
		let cultText = `Cult 產生器
	首領身份:
	${cult.leaderPosition}
	
	屬性: 
	${cult.characteristics}
	
	技能: 
	${cult.skill}

	法術:
	${cult.spells}

	特質: 
	${cult.description}
	
	個性: 
	${cult.personality}

	能力來源: 
	${cult.sourcesOfPower}
	==============
	教派目標:
	${cult.cultGoals}

	實現目標的手段:
	${cult.cultGoalsMeans}`
		return cultText;
	}
	static leaderPosition() {
		return this.LeaderPosition[rollbase.Dice(10) - 1];
	}
	static characteristics() {
		//四選一
		let selectedCharacteristics = this.characteristicsSet[rollbase.Dice(4) - 1];
		// 使用 Fisher–Yates 洗牌算法隨機排列屬性
		selectedCharacteristics = this.FisherYates(selectedCharacteristics);
		let text = '';
		for (let i = 0; i < this.sixState.length; i++) {
			text += `${this.sixState[i]}: ${selectedCharacteristics[i]} `;
			if (i % 3 === 0 && i !== 0) {
				text += '\n';
			}
		}
		return text;
	}

	static skill() {
		let text = '';
		let skillStates = this.SkillStatesSet[rollbase.Dice(this.SkillStatesSet.length) - 1];
		//使用 Fisher–Yates 洗牌算法隨機排列技能
		skillStates = this.FisherYates(skillStates);
		let skillNames = this.WightRandom(this.SkillNameSet(), Object.keys(this.SkillNameSet()).length);
		for (let i = 0; i < skillStates.length; i++) {
			text += `${skillNames[i]}: ${skillStates[i]} `;
			if (i % 3 === 0 && i !== 0) {
				text += '\n';
			}
		}
		return text;
	}
	static description() {
		return this.descriptionSet[rollbase.Dice(this.descriptionSet.length) - 1];
	}
	static personality() {
		return this.traitsSet[rollbase.Dice(this.traitsSet.length) - 1];
	}
	static spells() {
		let text = '';
		let num = 0;
		let spells = this.spellsSet[rollbase.Dice(this.spellsSet.length) - 1];
		text = rollbase.BuildDiceCal(spells);
		num = text.match(/\d+$/i)[0];
		text += '\n';
		text += ` ${this.getLeaderMythonList(num).join(', ')},`;
		text = text.replace(/,$/i, '');
		return text;
	}
	static getLeaderMythonList(count) {
		const shuffledArr = MythoyCollection.Magic.slice();
		for (let i = shuffledArr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
		}
		return shuffledArr.slice(0, count);
	}
	static sourcesOfPower() {
		let text = '';
		let num = rollbase.Dice(10);
		switch (num) {
			case 1: case 2: case 3:
				text = this.SourcesOfPowerSet[0];
				break;
			case 4: case 5: case 6:
				text = this.SourcesOfPowerSet[1];
				break;
			case 7: case 8:
				text = this.SourcesOfPowerSet[2];
				break;
			case 9: case 10:
				text = this.SourcesOfPowerSet[3];
				break;
		}
		return text;
	}
	static cultGoals() {
		return this.CultWants[rollbase.Dice(this.CultWants.length) - 1];
	}
	static cultGoalsMeans() {
		return this.CultMeans[rollbase.Dice(this.CultMeans.length) - 1];
	}
	static WightRandom(options, num_choices) {

		let choices = new Set();
		while (choices.size < num_choices) {
			let total_weight = 0;
			for (let j in options) {
				total_weight += options[j];
			}
			let rnd = Math.random() * total_weight;
			for (let j in options) {
				if (rnd < options[j]) {
					choices.add(j);
					options[j] = options[j] / 2;
					break;
				}
				rnd -= options[j];
			}
		}
		return Array.from(choices);
	}
	static FisherYates(arr) {
		for (let j = arr.length - 1; j > 0; j--) {
			const k = Math.floor(Math.random() * (j + 1));
			[arr[j], arr[k]] = [arr[k], arr[j]];
		}
		return arr;
	}

	static sixState = ["STR", "CON", "SIZ", "DEX", "INT", "APP", "POW", "EDU"]
	static characteristicsSet = [[75, 70, 65, 60, 55, 50, 40, 35],
	[80, 75, 70, 60, 55, 50, 40, 35],
	[90, 85, 80, 80, 70, 60, 60, 50],
	[100, 80, 60, 60, 45, 40, 35, 35]
	];

	static LeaderPosition = [
		`富有商人
	金錢就是力量。擁有成功的小企業者；跨國公司董事會上的一員；有權勢的電影製片人；投資銀行家等等。`,
		`家族女/男家長
	血緣是一種具有特殊且具有束縛力的連結。阿巴拉契亞山脈中一個廣大家族的古老祖母；一個大型且有貴族氣質的家庭的尊貴曾祖父；一位強大巫師的後裔；一對雙胞胎的單親父或母。`,
		`幫派領導者
	罪犯有一種在雷達之下運作的方式——這種經驗可能在隱藏Cthulhu教派的活動時有所幫助。城市街頭幫派的領導者；犯罪組織的老大；大規模的毒品卡特爾的領導者；其他孩子們景仰的正在冒出頭角的街頭小混混。`,
		`宗教領導者
	已經位於影響力的位置，可以接觸到大量的人群，其中一些人急需幫助，更容易受到欺詐和誘惑。
	這些宗教領袖可能免於課稅。主流宗教的神父，拉比，伊瑪目，或牧師。`,
		`大學教授/老師
	擁有接觸許多易受影響，年輕心靈的人的機會。一位高中老師或校長；擁有圖書館鑰匙的大學教授，圖書館內充滿著陳舊的書冊；
	具有影響力的青年領袖，可帶領具有可被重新導向的活動組織的青年。`,
		`政治家
	政治影響力可以指導政策，甚至改變法律。市長或城市議會成員；州議會人員；州長甚至國家總統。 `,
		`農民/工廠工人
	"藍領" 宗教教派領袖可能對確保社會運作平穩的人有影響力，例如工廠員工，農村工人，建築行業和維修工人。`,
		`軍官
	在軍隊之中有個邪教是一個可怕的想法。可能是部隊中位階較高的官員，或者是在情報機構中的執行者，例如FBI或CIA，或是說，其他國家的相似機構。`,
		`船長 
	在海上，船長處於一個非常有威力的位置。可能是大型運輸船的船長，一艘帆船，一艘商船，甚至是一艘郵輪的船長。`,
		`異類 
	這些人士在社會邊緣活動，往往被忽視，例如巡迴銷售員，在家工作的網頁開發員，或者是一位藍調吉他手/歌手。`
	]

	static SkillStatesSet = [[80, 60, 60, 60, 50, 40],
	[100, 80, 60, 60, 50, 40],
	[90, 80, 70, 70, 60, 55],
	[80, 75, 70, 65, 65, 60, 60, 55, 55, 50, 40, 25],
	[90, 85, 75, 70, 60, 60, 60, 55, 50, 40, 30, 25]];

	static SkillNameSet() {
		return Object.assign({}, this.CombatSkills, this.CharacterSkills, this.UsefulSkills, this.ActionSkills);
	};
	static CombatSkills = { '閃避': 4, '鬥毆': 2, '鬥毆(刀/劍/棒)': 2, '射擊（手槍）': 3, '投擲': 1 };//1
	static CharacterSkills = {
		'信用評級': 4, '人類學': 1, '估價': 1, '考古學': 2, '語言': 1, '法律': 1, '博物學': 1, '物理學': 1
	};//1
	static UsefulSkills = { '克蘇魯神話': 10, '心理學': 4, '巧手': 3, '鎖匠': 2, '機械修理': 1, '駕駛汽車': 2, '喬裝': 2, '藝術/工藝（演技）': 3 }
	static ActionSkills = { '偵查': 4, '話術': 1, '取悅': 3, '恐嚇': 2, '說服': 1, '攀爬': 1, '跳躍': 1, '聆聽': 1 }//1-5

	static descriptionSet = ['肌肉發達', '毛髮蓬鬆', '眼神狂野', '全身冒汗', '牙齒狀況差', '非常高大', '非常「平凡」外表', '瘦骨嶙峋', '衣著整潔無瑕', '眯著眼睛', '深邃的眼睛', '下垂的', '多疤痕', '瘢痕累累', '眼睛眼距近', '有皺紋', '刺青', '高額頭', '雕刻般的', '眼睛深陷', '有鬍子', '下巴雙層', '鼻子歪曲', '突出的眉骨', '禿頭', '修剪整齊的指甲', '嬌小', '消瘦', '超重', '長滿老繭的手', '細薄的頭髮', '長指甲', '細長的', '苗條', '運動型', '沾滿墨水的手指', '豐滿的頭髮', '小手', '怪誕', '濕疹', '口臭', '全身同色的衣服', '缺指', '狹長的臉', '乾燥的皮膚', '高挑的', '穿耳環的', '臉頰凹陷', '豐滿', '單眼', '屍體般的', '面具', '腐爛的', '缺少一肢', '無毛的', '疾病纏身的', '縮小的', '虛弱的', '高聳的', '骨瘦如柴的', '貧血的', '彎曲的', '佝僂的', '靈巧的', '笨重的', '蒼白的', '野獸般的', '蠟色的', '狐狸般的', '臉龐像小天使的', '憔悴的', '令人厭惡的', '不老的', '肉感的', '枯萎的', '青筋浮現的皮膚', '纖維狀', '拋光過的', '繃緊的', '時髦的', '醜陋的', '骯髒的', '強壯的', '纖細的', '結實的', '眼鏡', '有吸引力的', '不修邊幅的', '獨眼鏡', '華麗的', '普通的外表', '一頭白髮', '陰森的笑容', '老式的', '堂堂皇皇的', '彎腰駝背的', '華美的', '迷人的', '貓眼狀的', '閃亮的眼睛']

	static traitsSet = ['浪漫', '不友善的', '好色', '冷漠', '傲慢', '無情', '挑剔', '固執', '自負', '心不在焉', '反覆無常', '好鬥', '粗鄙', '虐待狂', '神經質', '過分講究', '揮霍', '強迫', '矯揉造作', '自戀', '猶豫', '吝嗇', '不穩定', '掠奪成性', '魯莽', '悲慘的', '嫉妒的', '無禮的', '武斷的', '快活的', '極端的', '精密計算的', '吹噓的', '殘忍的', '討厭的', '糟糕的', '著迷', '敏感的', '和藹可親的', '有耐心的', '敏銳的', '幽默的', '親切的', '活潑的', '機智的', '有秩序的', '整潔的', '好奇的', '清醒的', '受過教育的', '精確', '即興', '穩定', '有野心', '專制', '嚴厲', '要求多', '真誠', '欺騙', '忠誠', '粗魯', '好爭吵', '尖酸刻薄', '難以寬恕', '粗糙', '不耐煩', '強烈', '殺人的', '瘋狂的', '無憂無慮', '嚴格', '狡猾', '心不在焉', '神祕', '不道德的', '尷尬', '冷靜', '挫折', '親切', '操控他人', '癮君子', '完美主義者', '放鬆', '驕傲', '諷刺', '保守', '緊張', '虛榮', '嗜血', '急躁', '謹慎', '精力充沛', '衝動', '物質主義', '輕浮', '做作', '冷酷', '偏執', '過度情緒', '無情緒'];


	static spellsSet = ['1d4+1', '1d6+1d4+2', '3d6+4', '4d6+10'];
	static SourcesOfPowerSet = [`神話生物
	與神話生物如深潛者，人面鼠，修格斯，星之吸血鬼等有某種形式的關聯。
	為了某種形式的服務或犧牲，怪獸保護並幫助教派領袖。`,
		`文物
	賦予法術般的能力，防護，攻擊方式或類似的物品(如充當魔法點數或甚至POW點數的存儲裝置)。該文物可能來自地球之外或遠古時代。`,
		`科技
	也許來自Xoth (Cthulhu在來到地球前的家)，可能來自另一個維度或另一個世界，這種裝置可能提供法術般效能，存儲魔法點數，可能是魔法武器，或者如盔甲一般提供防護。`,
		`授予的力量
	某種形式的「祝福」，由Cthulhu或其僕從植入教派領袖的心靈中。這種力量可能複製相同或降低的法術效果(通常為一半)所消耗的魔法點數或POW。這種力量也可能是另外的形式。
	某種形式的物理或感官變化：觸手從臉部或身體上生長，某種形式的物理或感官變化：觸手從臉部或身體上生長，鱗狀皮膚護甲，高度的感官等等。`]


	static CultWants = [`財富
	無論是海洋中的金子、金融預測，還是寶貴的古代文物，邪教都相信Cthulhu會賦予某種形式的財富。這可能是對個人或團體具有特定且有幫助的東西。不要低估金錢的力量——它可以驅使人們做出最卑劣的行為。`,
		`魔法力量
	了解強大的咒語和儀式。這樣的魔法可能提供寶貴的洞察宇宙（高等學問）的知識，或者可能是控制和/或殺死他人——通過魔法掌控生命的力量。揭示現實祕密是一種令人陶醉且引人入勝的酒，許多人都會希望饗飽其間。或許，獲得魔法力量是達成更大目標的手段。`,
		`慾望
	可能意指伴侶關係或身體慾望和欲望。世界上有很多孤獨的人，他們幾乎可以為了與他人建立聯繫而做任何事。有些人沉迷於極致的快感，在邪教中成為會員，可以使他們的行為和慾望合法化。`,
		`救贖
	Cthulhu的崛起將帶來前所未有的恐懼和破壞。有些人相信，通過安撫Cthulhu，他們將能夠從這場大災難中幸免於難，他們是那些將在Cthulhu的統治下開創新時代的被選擇者。現在邪教所做的是讓人們購買他們所謂的拯救。`,
		`權力控制他人
	控制其他人：個人，一個組織，一個社區，一個城市，一個國家等。使人們順從邪教的意志是其使命的關鍵。也許是通過魔法，洗腦，或是微妙的條件製造。邪教希望人們為他們效力，這可能是為了推動某種計劃，或者只是邪教所認為Cthulhu要求的。
	`,
		`宇宙理解
	真理的追尋者，無論這真理有多驚悚或詛咒。"真理"有時候是主觀的 - 主觀越強，創造一個吸引人的故事就越好。知識就是力量。誰知道深入探索神話之謎會帶來什麼結果。`,
		`暴力
	有些人希望看到世界燃燒。這些邪教徒以Cthulhu的名義殺人和傷害人。他們將自己的行為視為最終的自由，放棄道德以在Cthulhu的桌旁獲得一席之地 - 他們相信他們是人類發展的下一階段的先驅。有些人可能使用暴力作為實施更大計劃的手段，而其他人則將其用作掩蓋更可怕真相的幌子。`,
		`尋找解決方案
	看似善意的目標，如治療疾病，清除腐敗的權威，理解人類行為 - 這些目標卻被Cthulhu的影響扭曲和腐敗。善意的願望走向了黑暗。`,
		`惡習上癮
	為了滿足某種成癮，無論是平凡的(藥物，賭博，權力等)或是源自神話（魔法，知識，變革等）。對某物成癮的人可能更容易被控制——這個邪教想要控制它的成員。`,
		`愛
	不要與肉體的親密混淆，愛是大多數人的強大驅動力。一個邪教可能利用對家人，伴侶，或者友情的愛來控制人們。也許愛的目標已經以某種方式扭曲了。也許這個邪教是出於對人類的愛而行動，以非常錯誤的方式試圖「拯救」世界。`]
	//手指
	static CultMeans = [
		`犧牲
		為了某種目的，教派信徒犧牲活的人類和/或動物。這可能是為了證明他們的忠誠，作為某種力量的來源，或是大計劃的一部分。`,
		`儀式
		為了進行一種或多種形式的儀式，需要一小群或大量的參與者。儀式可能完全為教派服務，或者是滿足Cthulhu的意志以完成某事（無論大小）。`,
		`集結
		可能是收集知識（神祕學典籍）, 特定的資源，甚至是特定的人。教派必須為了Cthulhu只知的理由收集「某物」。`,
		`服務
		通過服務神祕神靈—與Cthulhu有連結的一個， 教派正在滿足Cthulhu的意志。作為回報，教派將以某種方式得到實體的幫助。或者，教派已深陷於此實體之中，必須服從其命令。也許這個實體與Cthulhu沒有實際的連結，但它宣稱有連結只是為了對教派獲得更多的權力。`,
		`創造
	這個邪教被命令要建造些什麼。這可能是一個魔法之門，一個神秘的工藝品，一個可以集中巨大力量的地方，或者是一個寺廟。也許它只是創建一個秘密網絡，以便有一天接管一個城鎮，一個城市，一個國家，或者是世界。`,
		`摧毀
	邪教被命令去摧毀某物——也許是那些阻礙，激怒，或者傷害Cthulhu的東西。這可能是摧毀一座古老的寺廟，一個神秘的屏障，或者是推翻一個與Cthulhu的目標相牴觸的政府或組織。`,
		`轉變
	邪教徒必須進行轉變——無論身體還是心靈。人類的能力有限，無法完成Cthulhu的目標，或者對於即將到來的世界太過脆弱，所以邪教徒尋求將自己轉變成更強大的存在。這可能是人類進化的新階段，或者是與神話同化，就像深海族那樣。`,
		`追獵並殺死
	摧毀Cthulhu的敵人，如某些人類的派系或另一個像那些上古之物這樣的神話種族，他們的行為是對抗的。這樣的存在可能成為Cthulhu恐怖計劃的問題。也許在追捕和殺死他們的目標時，邪教會得到些回報：吃掉他們的殺戮能給他們提供神話力量或洞見等等。`]
}



const oldArr = [15, 20, 40, 50, 60, 70, 80]
const DebuffArr = [5, 0, 5, 10, 20, 40, 80]
const AppDebuffArr = [0, 0, 5, 10, 15, 20, 25]
const EDUincArr = [0, 1, 2, 3, 4, 4, 4]


const OldArr2020 = [7, 8, 9, 10, 11, 12, 13, 14]
const EDUincArr2020 = [5, 10, 15, 20, 25, 30, 35, 40]

const PersonalDescriptionArr = ['結實的', '英俊的', '粗鄙的', '機靈的', '迷人的', '娃娃臉的', '聰明的', '蓬頭垢面的', '愚鈍的', '骯髒的', '耀眼的', '有書卷氣的', '青春洋溢的', '感覺疲憊的', '豐滿的', '粗壯的', '毛髮茂盛的', '苗條的', '優雅的', '邋遢的', '敦實的', '蒼白的', '陰沉的', '平庸的', '臉色紅潤的', '皮膚黝黑色', '滿臉皺紋的', '古板的', '有狐臭的', '狡猾的', '健壯的', '嬌俏的', '筋肉發達的', '魁梧的', '遲鈍的', '虛弱的'];
const IdeologyBeliefsArr = ['虔誠信仰著某個神祈', '覺得人類不需要依靠宗教也可以好好生活', '覺得科學可以解釋所有事，並對某種科學領域有獨特的興趣', '相信因果循環與命運', '是一個政黨、社群或秘密結社的成員', '覺得這個社會已經病了，而其中某些病灶需要被剷除', '是神秘學的信徒', '是積極參與政治的人，有特定的政治立場', '覺得金錢至上，且為了金錢不擇手段', '是一個激進主義分子，活躍於社會運動'];
const SignificantPeopleArr = ['他的父母', '他的祖父母', '他的兄弟姐妹', '他的孩子', '他的另一半', '那位曾經教導調查員最擅長的技能（點數最高的職業技能）的人', '他的兒時好友', '他心目中的偶像或是英雄', '在遊戲中的另一位調查員', '一個由KP指定的NPC'];
const SignificantPeopleWhyArr = ['調查員在某種程度上受了他的幫助，欠了人情', '調查員從他那裡學到了些什麼重要的東西', '他給了調查員生活的意義', '調查員曾經傷害過他，尋求他的原諒', '和他曾有過無可磨滅的經驗與回憶', '調查員想要對他證明自己', '調查員崇拜著他', '調查員對他有著某些使調查員後悔的過往', '調查員試圖證明自己和他不同，比他更出色', '他讓調查員的人生變得亂七八糟，因此調查員試圖復仇'];
const MeaningfulLocationsArr = ['過去就讀的學校', '他的故鄉', '與他的初戀之人相遇之處', '某個可以安靜沉思的地方', '某個類似酒吧或是熟人的家那樣的社交場所', '與他的信念息息相關的地方', '埋葬著某個對調查員別具意義的人的墓地', '他從小長大的那個家', '他生命中最快樂時的所在', '他的工作場所'];
const TreasuredPossessionsArr = ['一個與他最擅長的技能（點數最高的職業技能）相關的物品', '一件他的在工作上需要用到的必需品', '一個從他童年時就保存至今的寶物', '一樣由調查員最重要的人給予他的物品', '一件調查員珍視的蒐藏品', '一件調查員無意間發現，但不知道到底是什麼的東西，調查員正努力尋找答案', '某種體育用品', '一把特別的武器', '他的寵物'];
const TraitsArr = ['慷慨大方的人', '對動物很友善的人', '善於夢想的人', '享樂主義者', '甘冒風險的賭徒或冒險者', '善於料理的人', '萬人迷', '忠心耿耿的人', '有好名聲的人', '充滿野心的人'];

/**
 * COC恐懼表
 */
const cocmadnessrt = [
	['1)失憶：調查員會發現自己只記得最後身處的安全地點，卻沒有任何來到這裡的記憶。例如，調查員前一刻還在家中吃著早飯，下一刻就已經直面著不知名的怪物。'],
	['2)假性殘疾：調查員陷入了心理性的失明，失聰以及軀體缺失感中。'],
	['3)暴力傾向：調查員陷入了六親不認的暴力行為中，對周圍的敵人與友方進行著無差別的攻擊。'],
	['4)偏執：調查員陷入了嚴重的偏執妄想之中。有人在暗中窺視著他們，同伴中有人背叛了他們，沒有人可以信任，萬事皆虛。'],
	['5)人際依賴：守秘人適當參考調查員的背景中重要之人的條目，調查員因為一些原因而將他人誤認為了他重要的人並且努力的會與那個人保持那種關係。'],
	['6)昏厥：調查員當場昏倒。'],
	['7)逃避行為：調查員會用任何的手段試圖逃離現在所處的位置，即使這意味著開走唯一一輛交通工具並將其它人拋諸腦後。'],
	['8)竭嘶底裡：調查員表現出大笑，哭泣，嘶吼，害怕等的極端情緒表現。'],
	['9)恐懼：調查員投一個D100或者由守秘人選擇，來從恐懼症狀表中選擇一個恐懼源，就算這一恐懼的事物是並不存在的，調查員的症狀會持續1D10 輪。'],
	['10)狂躁：調查員投一個D100 或者由守秘人選擇，來從狂躁症狀表中選擇一個狂躁的誘因。']
];

const cocmadnesssu = [
	['1)失憶（Amnesia）：回過神來，調查員們發現自己身處一個陌生的地方，並忘記了自己是誰。記憶會隨時間恢復。'],
	['2)被竊（Robbed）：調查員恢復清醒，發覺自己被盜，身體毫髮無損。如果調查員攜帶著寶貴之物（見調查員背景），做幸運檢定來決定其是否被盜。所有有價值的東西無需檢定自動消失。'],
	['3)遍體鱗傷（Battered）：調查員恢復清醒，發現自己身上滿是拳痕和瘀傷。生命值減少到瘋狂前的一半，但這不會造成重傷。調查員沒有被竊。這種傷害如何持續到現在由守秘人決定。'],
	['4)暴力傾向（Violence）：調查員陷入強烈的暴力與破壞欲之中。調查員回過神來可能會理解自己做了什麼也可能毫無印象。調查員對誰或何物施以暴力，他們是殺人還是僅僅造成了傷害，由守秘人決定。'],
	['5)極端信念（Ideology/Beliefs）：查看調查員背景中的思想信念，調查員會採取極端和瘋狂的表現手段展示他們的思想信念之一。比如一個信教者會在地鐵上高聲佈道。'],
	['6)重要之人（Significant People）：考慮調查員背景中的重要之人，及其重要的原因。在1D10 小時或更久的時間中，調查員將不顧一切地接近那個人，並為他們之間的關係做出行動。'],
	['7)被收容（Institutionalized）：調查員在精神病院病房或警察局牢房中回過神來，他們可能會慢慢回想起導致自己被關在這裡的事情。'],
	['8)逃避行為（Flee in panic）：調查員恢復清醒時發現自己在很遠的地方，也許迷失在荒郊野嶺，或是在駛向遠方的列車或長途汽車上。'],
	['9)恐懼（Phobia）：調查員患上一個新的恐懼症。在表Ⅸ：恐懼症狀表上骰1 個D100 來決定症狀，或由守秘人選擇一個。調查員在回過神來，並開始為避開恐懼源而採取任何措施。'],
	['10)狂躁（Mania）：調查員患上一個新的狂躁症。在表Ⅹ：狂躁症狀表上骰1 個d100 來決定症狀，或由守秘人選擇一個。在這次瘋狂發作中，調查員將完全沉浸於其新的狂躁症狀。這症狀是否會表現給旁人則取決於守秘人和此調查員。']
];

const cocPhobias = [
	['1) 沐浴癖（Ablutomania）：執著于清洗自己。'],
	['2) 猶豫癖（Aboulomania）：病態地猶豫不定。'],
	['3) 喜暗狂（Achluomania）：對黑暗的過度熱愛。'],
	['4) 喜高狂（Acromaniaheights）：狂熱迷戀高處。'],
	['5) 親切癖（Agathomania）：病態地對他人友好。'],
	['6) 喜曠症（Agromania）：强烈地傾向于待在開闊空間中。'],
	['7) 喜尖狂（Aichmomania）：痴迷于尖銳或鋒利的物體。'],
	['8) 戀猫狂（Ailuromania）：近乎病態地對猫友善。'],
	['9) 疼痛癖（Algomania）：痴迷于疼痛。'],
	['10) 喜蒜狂（Alliomania）：痴迷于大蒜。'],
	['11) 乘車癖（Amaxomania）：痴迷于乘坐車輛。'],
	['12) 欣快癖（Amenomania）：不正常地感到喜悅。'],
	['13) 喜花狂（Anthomania）：痴迷于花朵。'],
	['14) 計算癖（Arithmomania）：狂熱地痴迷于數字。'],
	['15) 消費癖（Asoticamania）：魯莽衝動地消費。'],
	['16) 隱居癖*（Automania）：過度地熱愛獨自隱居。（原文如此，存疑，Automania實際上是戀車癖）'],
	['17) 芭蕾癖（Balletmania）：痴迷于芭蕾舞。'],
	['18) 竊書癖（Biliokleptomania）：無法克制偷竊書籍的衝動。'],
	['19) 戀書狂（Bibliomania）：痴迷于書籍和/或閱讀'],
	['20) 磨牙癖（Bruxomania）：無法克制磨牙的衝動。'],
	['21) 靈臆症（Cacodemomania）：病態地堅信自己已被一個邪惡的靈體占據。'],
	['22) 美貌狂（Callomania）：痴迷于自身的美貌。'],
	['23) 地圖狂（Cartacoethes）：在何時何處都無法控制查閱地圖的衝動。'],
	['24) 跳躍狂（Catapedamania）：痴迷于從高處跳下。'],
	['25) 喜冷症（Cheimatomania）：對寒冷或寒冷的物體的反常喜愛。'],
	['26) 舞蹈狂（Choreomania）：無法控制地起舞或發顫。'],
	['27) 戀床癖（Clinomania）：過度地熱愛待在床上。'],
	['28) 戀墓狂（Coimetormania）：痴迷于墓地。'],
	['29) 色彩狂（Coloromania）：痴迷于某種顔色。'],
	['30) 小丑狂（Coulromania）：痴迷于小丑。'],
	['31) 恐懼狂（Countermania）：執著于經歷恐怖的場面。'],
	['32) 殺戮癖（Dacnomania）：痴迷于殺戮。'],
	['33) 魔臆症（Demonomania）：病態地堅信自己已被惡魔附身。'],
	['34) 抓撓癖（Dermatillomania）：執著于抓撓自己的皮膚。'],
	['35) 正義狂（Dikemania）：痴迷于目睹正義被伸張。'],
	['36) 嗜酒狂（Dipsomania）：反常地渴求酒精。'],
	['37) 毛皮狂（Doramania）：痴迷于擁有毛皮。（存疑）'],
	['38) 贈物癖（Doromania）：痴迷于贈送禮物。'],
	['39) 漂泊症（Drapetomania）：執著于逃離。'],
	['40) 漫游癖（Ecdemiomania）：執著于四處漫游。'],
	['41) 自戀狂（Egomania）：近乎病態地以自我爲中心或自我崇拜。'],
	['42) 職業狂（Empleomania）：對于工作的無盡病態渴求。'],
	['43) 臆罪症（Enosimania）：病態地堅信自己帶有罪孽。'],
	['44) 學識狂（Epistemomania）：痴迷于獲取學識。'],
	['45) 靜止癖（Eremiomania）：執著于保持安靜。'],
	['46) 乙醚上癮（Etheromania）：渴求乙醚。'],
	['47) 求婚狂（Gamomania）：痴迷于進行奇特的求婚。'],
	['48) 狂笑癖（Geliomania）：無法自製地，强迫性的大笑。'],
	['49) 巫術狂（Goetomania）：痴迷于女巫與巫術。'],
	['50) 寫作癖（Graphomania）：痴迷于將每一件事寫下來。'],
	['51) 裸體狂（Gymnomania）：執著于裸露身體。'],
	['52) 妄想狂（Habromania）：近乎病態地充滿愉快的妄想（而不顧現實狀况如何）。'],
	['53) 蠕蟲狂（Helminthomania）：過度地喜愛蠕蟲。'],
	['54) 槍械狂（Hoplomania）：痴迷于火器。'],
	['55) 飲水狂（Hydromania）：反常地渴求水分。'],
	['56) 喜魚癖（Ichthyomania）：痴迷于魚類。'],
	['57) 圖標狂（Iconomania）：痴迷于圖標與肖像'],
	['58) 偶像狂（Idolomania）：痴迷于甚至願獻身于某個偶像。'],
	['59) 信息狂（Infomania）：痴迷于積累各種信息與資訊。'],
	['60) 射擊狂（Klazomania）：反常地執著于射擊。'],
	['61) 偷竊癖（Kleptomania）：反常地執著于偷竊。'],
	['62) 噪音癖（Ligyromania）：無法自製地執著于製造響亮或刺耳的噪音。'],
	['63) 喜綫癖（Linonomania）：痴迷于綫繩。'],
	['64) 彩票狂（Lotterymania）：極端地執著于購買彩票。'],
	['65) 抑鬱症（Lypemania）：近乎病態的重度抑鬱傾向。'],
	['66) 巨石狂（Megalithomania）：當站在石環中或立起的巨石旁時，就會近乎病態地寫出各種奇怪的創意。'],
	['67) 旋律狂（Melomania）：痴迷于音樂或一段特定的旋律。'],
	['68) 作詩癖（Metromania）：無法抑制地想要不停作詩。'],
	['69) 憎恨癖（Misomania）：憎恨一切事物，痴迷于憎恨某個事物或團體。'],
	['70) 偏執狂（Monomania）：近乎病態地痴迷與專注某個特定的想法或創意。'],
	['71) 誇大癖（Mythomania）：以一種近乎病態的程度說謊或誇大事物。'],
	['72) 臆想症（Nosomania）：妄想自己正在被某種臆想出的疾病折磨。'],
	['73) 記錄癖（Notomania）：執著于記錄一切事物（例如攝影）'],
	['74) 戀名狂（Onomamania）：痴迷于名字（人物的、地點的、事物的）'],
	['75) 稱名癖（Onomatomania）：無法抑制地不斷重複某個詞語的衝動。'],
	['76) 剔指癖（Onychotillomania）：執著于剔指甲。'],
	['77) 戀食癖（Opsomania）：對某種食物的病態熱愛。'],
	['78) 抱怨癖（Paramania）：一種在抱怨時産生的近乎病態的愉悅感。'],
	['79) 面具狂（Personamania）：執著于佩戴面具。'],
	['80) 幽靈狂（Phasmomania）：痴迷于幽靈。'],
	['81) 謀殺癖（Phonomania）：病態的謀殺傾向。'],
	['82) 渴光癖（Photomania）：對光的病態渴求。'],
	['83) 背德癖（Planomania）：病態地渴求違背社會道德（原文如此，存疑，Planomania實際上是漂泊症）'],
	['84) 求財癖（Plutomania）：對財富的强迫性的渴望。'],
	['85) 欺騙狂（Pseudomania）：無法抑制的執著于撒謊。'],
	['86) 縱火狂（Pyromania）：執著于縱火。'],
	['87) 提問狂（Questiong-Asking Mania）：執著于提問。'],
	['88) 挖鼻癖（Rhinotillexomania）：執著于挖鼻子。'],
	['89) 塗鴉癖（Scribbleomania）：沉迷于塗鴉。'],
	['90) 列車狂（Siderodromomania）：認爲火車或類似的依靠軌道交通的旅行方式充滿魅力。'],
	['91) 臆智症（Sophomania）：臆想自己擁有難以置信的智慧。'],
	['92) 科技狂（Technomania）：痴迷于新的科技。'],
	['93) 臆咒狂（Thanatomania）：堅信自己已被某種死亡魔法所詛咒。'],
	['94) 臆神狂（Theomania）：堅信自己是一位神靈。'],
	['95) 抓撓癖（Titillomaniac）：抓撓自己的强迫傾向。'],
	['96) 手術狂（Tomomania）：對進行手術的不正常愛好。'],
	['97) 拔毛癖（Trichotillomania）：執著于拔下自己的頭髮。'],
	['98) 臆盲症（Typhlomania）：病理性的失明。'],
	['99) 嗜外狂（Xenomania）：痴迷于异國的事物。'],
	['100) 喜獸癖（Zoomania）：對待動物的態度近乎瘋狂地友好。']
];

const cocManias = [
	['1) 洗澡恐懼症（Ablutophobia）：對于洗滌或洗澡的恐懼。'],
	['2) 恐高症（Acrophobia）：對于身處高處的恐懼。'],
	['3) 飛行恐懼症（Aerophobia）：對飛行的恐懼。'],
	['4) 廣場恐懼症（Agoraphobia）：對于開放的（擁擠）公共場所的恐懼。'],
	['5) 恐鶏症（Alektorophobia）：對鶏的恐懼。'],
	['6) 大蒜恐懼症（Alliumphobia）：對大蒜的恐懼。'],
	['7) 乘車恐懼症（Amaxophobia）：對于乘坐地面載具的恐懼。'],
	['8) 恐風症（Ancraophobia）：對風的恐懼。'],
	['9) 男性恐懼症（Androphobia）：對于成年男性的恐懼。'],
	['10) 恐英症（Anglophobia）：對英格蘭或英格蘭文化的恐懼。'],
	['11) 恐花症（Anthophobia）：對花的恐懼。'],
	['12) 截肢者恐懼症（Apotemnophobia）：對截肢者的恐懼。'],
	['13) 蜘蛛恐懼症（Arachnophobia）：對蜘蛛的恐懼。'],
	['14) 閃電恐懼症（Astraphobia）：對閃電的恐懼。'],
	['15) 廢墟恐懼症（Atephobia）：對遺迹或殘址的恐懼。'],
	['16) 長笛恐懼症（Aulophobia）：對長笛的恐懼。'],
	['17) 細菌恐懼症（Bacteriophobia）：對細菌的恐懼。'],
	['18) 導彈/子彈恐懼症（Ballistophobia）：對導彈或子彈的恐懼。'],
	['19) 跌落恐懼症（Basophobia）：對于跌倒或摔落的恐懼。'],
	['20) 書籍恐懼症（Bibliophobia）：對書籍的恐懼。'],
	['21) 植物恐懼症（Botanophobia）：對植物的恐懼。'],
	['22) 美女恐懼症（Caligynephobia）：對美貌女性的恐懼。'],
	['23) 寒冷恐懼症（Cheimaphobia）：對寒冷的恐懼。'],
	['24) 恐鐘錶症（Chronomentrophobia）：對于鐘錶的恐懼。'],
	['25) 幽閉恐懼症（Claustrophobia）：對于處在封閉的空間中的恐懼。'],
	['26) 小丑恐懼症（Coulrophobia）：對小丑的恐懼。'],
	['27) 恐犬症（Cynophobia）：對狗的恐懼。'],
	['28) 惡魔恐懼症（Demonophobia）：對邪靈或惡魔的恐懼。'],
	['29) 人群恐懼症（Demophobia）：對人群的恐懼。'],
	['30) 牙科恐懼症①（Dentophobia）：對牙醫的恐懼。'],
	['31) 丟弃恐懼症（Disposophobia）：對于丟弃物件的恐懼（貯藏癖）。'],
	['32) 皮毛恐懼症（Doraphobia）：對動物皮毛的恐懼。'],
	['33) 過馬路恐懼症（Dromophobia）：對于過馬路的恐懼。'],
	['34) 教堂恐懼症（Ecclesiophobia）：對教堂的恐懼。'],
	['35) 鏡子恐懼症（Eisoptrophobia）：對鏡子的恐懼。'],
	['36) 針尖恐懼症（Enetophobia）：對針或大頭針的恐懼。'],
	['37) 昆蟲恐懼症（Entomophobia）：對昆蟲的恐懼。'],
	['38) 恐猫症（Felinophobia）：對猫的恐懼。'],
	['39) 過橋恐懼症（Gephyrophobia）：對于過橋的恐懼。'],
	['40) 恐老症（Gerontophobia）：對于老年人或變老的恐懼。'],
	['41)恐女症（Gynophobia）：對女性的恐懼。'],
	['42) 恐血症（Haemaphobia）：對血的恐懼。'],
	['43) 宗教罪行恐懼症（Hamartophobia）：對宗教罪行的恐懼。'],
	['44) 觸摸恐懼症（Haphophobia）：對于被觸摸的恐懼。'],
	['45) 爬蟲恐懼症（Herpetophobia）：對爬行動物的恐懼。'],
	['46) 迷霧恐懼症（Homichlophobia）：對霧的恐懼。'],
	['47) 火器恐懼症（Hoplophobia）：對火器的恐懼。'],
	['48) 恐水症（Hydrophobia）：對水的恐懼。'],
	['49) 催眠恐懼症①（Hypnophobia）：對于睡眠或被催眠的恐懼。'],
	['50) 白袍恐懼症（Iatrophobia）：對醫生的恐懼。'],
	['51) 魚類恐懼症（Ichthyophobia）：對魚的恐懼。'],
	['52) 蟑螂恐懼症（Katsaridaphobia）：對蟑螂的恐懼。'],
	['53) 雷鳴恐懼症（Keraunophobia）：對雷聲的恐懼。'],
	['54) 蔬菜恐懼症（Lachanophobia）：對蔬菜的恐懼。'],
	['55) 噪音恐懼症（Ligyrophobia）：對刺耳噪音的恐懼。'],
	['56) 恐湖症（Limnophobia）：對湖泊的恐懼。'],
	['57) 機械恐懼症（Mechanophobia）：對機器或機械的恐懼。'],
	['58) 巨物恐懼症（Megalophobia）：對于龐大物件的恐懼。'],
	['59) 捆綁恐懼症（Merinthophobia）：對于被捆綁或緊縛的恐懼。'],
	['60) 流星恐懼症（Meteorophobia）：對流星或隕石的恐懼。'],
	['61) 孤獨恐懼症（Monophobia）：對于一人獨處的恐懼。'],
	['62) 不潔恐懼症（Mysophobia）：對污垢或污染的恐懼。'],
	['63) 粘液恐懼症（Myxophobia）：對粘液（史萊姆）的恐懼。'],
	['64) 屍體恐懼症（Necrophobia）：對屍體的恐懼。'],
	['65) 數字8恐懼症（Octophobia）：對數字8的恐懼。'],
	['66) 恐牙症（Odontophobia）：對牙齒的恐懼。'],
	['67) 恐夢症（Oneirophobia）：對夢境的恐懼。'],
	['68) 稱呼恐懼症（Onomatophobia）：對于特定詞語的恐懼。'],
	['69) 恐蛇症（Ophidiophobia）：對蛇的恐懼。'],
	['70) 恐鳥症（Ornithophobia）：對鳥的恐懼。'],
	['71) 寄生蟲恐懼症（Parasitophobia）：對寄生蟲的恐懼。'],
	['72) 人偶恐懼症（Pediophobia）：對人偶的恐懼。'],
	['73) 吞咽恐懼症（Phagophobia）：對于吞咽或被吞咽的恐懼。'],
	['74) 藥物恐懼症（Pharmacophobia）：對藥物的恐懼。'],
	['75) 幽靈恐懼症（Phasmophobia）：對鬼魂的恐懼。'],
	['76) 日光恐懼症（Phenogophobia）：對日光的恐懼。'],
	['77) 鬍鬚恐懼症（Pogonophobia）：對鬍鬚的恐懼。'],
	['78) 河流恐懼症（Potamophobia）：對河流的恐懼。'],
	['79) 酒精恐懼症（Potophobia）：對酒或酒精的恐懼。'],
	['80) 恐火症（Pyrophobia）：對火的恐懼。'],
	['81) 魔法恐懼症（Rhabdophobia）：對魔法的恐懼。'],
	['82) 黑暗恐懼症（Scotophobia）：對黑暗或夜晚的恐懼。'],
	['83) 恐月症（Selenophobia）：對月亮的恐懼。'],
	['84) 火車恐懼症（Siderodromophobia）：對于乘坐火車出行的恐懼。'],
	['85) 恐星症（Siderophobia）：對星星的恐懼。'],
	['86) 狹室恐懼症（Stenophobia）：對狹小物件或地點的恐懼。'],
	['87) 對稱恐懼症（Symmetrophobia）：對對稱的恐懼。'],
	['88) 活埋恐懼症（Taphephobia）：對于被活埋或墓地的恐懼。'],
	['89) 公牛恐懼症（Taurophobia）：對公牛的恐懼。'],
	['90) 電話恐懼症（Telephonophobia）：對電話的恐懼。'],
	['91) 怪物恐懼症①（Teratophobia）：對怪物的恐懼。'],
	['92) 深海恐懼症（Thalassophobia）：對海洋的恐懼。'],
	['93) 手術恐懼症（Tomophobia）：對外科手術的恐懼。'],
	['94) 十三恐懼症（Triskadekaphobia）：對數字13的恐懼症。'],
	['95) 衣物恐懼症（Vestiphobia）：對衣物的恐懼。'],
	['96) 女巫恐懼症（Wiccaphobia）：對女巫與巫術的恐懼。'],
	['97) 黃色恐懼症（Xanthophobia）：對黃色或「黃」字的恐懼。'],
	['98) 外語恐懼症（Xenoglossophobia）：對外語的恐懼。'],
	['99) 异域恐懼症（Xenophobia）：對陌生人或外國人的恐懼。'],
	['100) 動物恐懼症（Zoophobia）：對動物的恐懼。']

];


async function dpRecordSwitch({ onOff = false, groupid = "", channelid = "" }) {
	try {
		let result = await schema.developmentConductor.findOneAndUpdate({
			groupID: channelid || groupid
		}, {
			$set: {
				switch: onOff
			}
		}, {
			new: true,
			upsert: true,
			returnDocument: true
		}).catch(error => console.error('coc #673 mongoDB error: ', error.name, error.reson));
		return `現在這頻道的COC 成長紀錄功能為 ${(result.switch) ? '開啓' : '關閉'}
以後CC擲骰將 ${(result.switch) ? '會' : '不會'}進行紀錄`
	} catch (error) {
		console.error(`dpRecordSwitch ERROR ${error.message}`)
		return '發生錯誤';
	}
}

async function dpRecorder({ userID = "", groupid = "", channelid = "", skillName = "", skillPer = 0, skillPerStyle = "", skillResult = 0, userName = "" }) {
	if (!checkMongodb.isDbOnline()) return;
	try {
		let result = await schema.developmentConductor.findOne({
			groupID: channelid || groupid,
			switch: true
		}).catch(error => {
			console.error('coc #687 mongoDB error: ', error.name, error.reson)
			checkMongodb.dbErrOccurs();
		});
		if (!result) return;
		/**
		 * 	
	 * 檢定成功 -> 檢查有沒有技能名字
	 * 有	檢查有沒有重複的名字 有則覆蓋時間 和記錄結果
	 * 沒有則儲存十個
		 */
		if (skillName) {
			await schema.developmentRollingRecord.findOneAndUpdate({
				groupID: channelid || groupid,
				userID: userID,
				skillName: skillName,
				skillPerStyle: 'normal'
			}, {
				date: Date.now(),
				skillPer: skillPer,
				skillResult: skillResult
			},
				{
					new: true,
					upsert: true,
					returnDocument: true
				}).catch(error => console.error('coc #710 mongoDB error: ', error.name, error.reson));
		} else {
			await schema.developmentRollingRecord.create({
				groupID: channelid || groupid,
				userID: userID,
				skillName: "",
				skillPerStyle: 'normal',
				date: Date.now(),
				skillPer: skillPer,
				skillResult: skillResult
			}).catch(error => console.error('coc #720 mongoDB error: ', error.name, error.reson));
			let countNumber = await schema.developmentRollingRecord.find({
				groupID: channelid || groupid,
				userID: userID,
				skillName: "",
				skillPerStyle: 'normal',
			}).countDocuments().catch(error => console.error('coc #726 mongoDB error: ', error.name, error.reson));
			if (countNumber > 10) {
				let moreThanTen = await schema.developmentRollingRecord.find({
					groupID: channelid || groupid,
					userID: userID,
					skillName: "",
					skillPerStyle: 'normal',
				}).sort({ date: 1 }).limit(countNumber - 10).catch(error => console.error('coc #733 mongoDB error: ', error.name, error.reson));

				moreThanTen.forEach(async function (doc) {
					await schema.developmentRollingRecord.deleteOne({ _id: doc._id }).catch(error => console.error('coc #736 mongoDB error: ', error.name, error.reson));
				})
			}

		}

		/**
		  * 大成功大失敗儲存
	 * 額外儲存十次大成功大失敗的紀錄
		 */

		if (skillPerStyle == "criticalSuccess" || skillPerStyle == "fumble") {
			await schema.developmentRollingRecord.create({
				groupID: channelid || groupid,
				userID: userID,
				skillName: skillName,
				skillPerStyle: skillPerStyle,
				date: Date.now(),
				skillPer: skillPer,
				skillResult: skillResult,
				userName: userName
			}).catch(error => console.error('coc #757 mongoDB error: ', error.name, error.reson));
			let countNumber = await schema.developmentRollingRecord.find({
				groupID: channelid || groupid,
				userID: userID,
				skillPerStyle: skillPerStyle,
			}).countDocuments().catch(error => console.error('coc #762 mongoDB error: ', error.name, error.reson));
			if (countNumber > 10) {
				let moreThanTen = await schema.developmentRollingRecord.find({
					groupID: channelid || groupid,
					userID: userID,
					skillPerStyle: skillPerStyle,
				}).sort({ date: 1 }).limit(countNumber - 10).catch(error => console.error('coc #768 mongoDB error: ', error.name, error.reson));

				moreThanTen.forEach(async function (doc) {
					await schema.developmentRollingRecord.deleteOne({ _id: doc._id }).catch(error => console.error('coc #771 mongoDB error: ', error.name, error.reson));
				})
			}
		}


	} catch (error) {
		console.error(`dpRecordSwitch ERROR ${error.message}`)
		return '發生錯誤';
	}

	/**
	 * 行為
	 * 打開後就開始紀錄CC CC1~2 CCN1~2 的結果
	 * 
	 * 檢定成功 -> 檢查有沒有技能名字
	 * 有	檢查有沒有重複的名字 有則覆蓋時間 和記錄結果
	 * 沒有則儲存十個
	 * 
	 * 
	 * 大成功大失敗儲存
	 * 額外儲存十次大成功大失敗的紀錄
	 * 
	 */

}

function DevelopmentPhase(input) {
	let result = ''
	for (let index = 1; index < input.length; index++) {
		let target = '',
			text = '';
		if (!isNaN(input[index])) {
			target = input[index];
		}
		else continue;
		if (input[index + 1] && isNaN(input[index + 1])) {
			text = input[index + 1];
			index++;
		}
		result += everyTimeDevelopmentPhase(target, text) + '\n' + '\n'
	}
	return result;

}

function everyTimeDevelopmentPhase(target, text = '') {
	let result = '';
	target = Number(target);
	if (target > 1000) target = 1000;
	if (text == undefined) text = "";
	let skill = rollbase.Dice(100);
	let confident = (target <= 89);
	if (target > 95) target = 95;
	if (skill >= 96 || skill > target) {
		let improved = rollbase.Dice(10);
		result = "成長或增強檢定: " + text + "\n1D100 > " + target + "\n擲出: " + skill + " → 成功!\n你的技能增加" + improved + "點，現在是" + (target + improved) + "點。";
		if (confident && ((target + improved) >= 90)) {
			result += `\n調查員的技能提升到90%以上，他的當前理智值增加2D6 > ${rollbase.Dice(6) + rollbase.Dice(6)}點。
這一項獎勵顯示他經由精通一項技能而獲得自信。`
		}
	} else {
		result = "成長或增強檢定: " + text + "\n1D100 > " + target + "\n擲出: " + skill + " → 失敗!\n你的技能沒有變化!";
	}
	return result;
}
function ccrt() {
	let result = '';
	//let rollcc = Math.floor(Math.random() * 10);
	//let time = Math.floor(Math.random() * 10) + 1;
	//let PP = Math.floor(Math.random() * 100);
	let rollcc = rollbase.Dice(10) - 1
	let time = rollbase.Dice(10)
	let PP = rollbase.Dice(100) - 1
	if (rollcc <= 7) {
		result = cocmadnessrt[rollcc] + '\n症狀持續' + time + '輪數';
	} else
		if (rollcc == 8) {
			result = cocmadnessrt[rollcc] + '\n症狀持續' + time + '輪數' + ' \n' + cocManias[PP];
		} else
			if (rollcc == 9) {
				result = cocmadnessrt[rollcc] + '\n症狀持續' + time + '輪數' + ' \n' + cocPhobias[PP];
			}
	return result;
}

function ccsu() {
	let result = '';
	let rollcc = rollbase.Dice(10) - 1
	let time = rollbase.Dice(10)
	let PP = rollbase.Dice(100) - 1
	if (rollcc <= 7) {
		result = cocmadnesssu[rollcc] + '\n症狀持續' + time + '小時';
	} else
		if (rollcc == 8) {
			result = cocmadnesssu[rollcc] + '\n症狀持續' + time + '小時' + ' \n' + cocManias[PP];
		} else
			if (rollcc == 9) {
				result = cocmadnesssu[rollcc] + '\n症狀持續' + time + '小時' + ' \n' + cocPhobias[PP];
			}
	return result;
}


/**
 * COC6
 * @param {數字 如CB 80 的80} chack 
 * @param {後面的文字,如偵查} text 
 */
function coc6(chack, text) {
	let result = '';
	let temp = rollbase.Dice(100);
	if (temp == 100) result = 'ccb<=' + chack + '\n' + temp + ' → 啊！大失敗！';
	else
		if (temp <= chack) result = 'ccb<=' + chack + '\n' + temp + ' → 成功';
		else result = 'ccb<=' + chack + '\n' + temp + ' → 失敗';
	if (text)
		result += '；' + text;
	return result;
}

/**
 * COC7
 * @param {CC 80 的80} chack 
 * @param {攻擊等描述字眼} text 
 */


async function coc7({ chack, text = "", userid, groupid, channelid, userName }) {
	let result = '';
	let temp = rollbase.Dice(100);
	let skillPerStyle = "";
	let check = chack.split(',');
	let name = text.split(',');
	let checkNum = !check.some(i => !Number.isInteger(Number(i)));
	if (!checkNum) return;
	if (check.length >= 2) result += '聯合檢定\n'
	for (let index = 0; index < check.length; index++) {
		switch (true) {
			case (temp == 1): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 恭喜！大成功！';
				skillPerStyle = "criticalSuccess";
				break;
			}
			case (temp == 100): {
				result = '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 啊！大失敗！';
				skillPerStyle = "fumble";
				break;
			}
			case (temp >= 96 && check[index] <= 49): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 啊！大失敗！';
				skillPerStyle = "fumble";
				break;
			}
			case (temp > check[index]): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 失敗';
				skillPerStyle = "failure";
				break;
			}
			case (temp <= check[index] / 5): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 極限成功';
				skillPerStyle = "normal";
				break;
			}
			case (temp <= check[index] / 2): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 困難成功';
				skillPerStyle = "normal";
				break;
			}
			case (temp <= check[index]): {
				result += '1D100 ≦ ' + check[index] + "　\n" + temp + ' → 通常成功';
				skillPerStyle = "normal";
				break;
			}
			default:
				break;
		}

		if (text[index]) result += '：' + (name[index] || '');
		result += '\n\n'
		if (userid && groupid && skillPerStyle !== "failure") {
			await dpRecorder({ userID: userid, groupid, channelid, skillName: name[index], skillPer: check[index], skillPerStyle, skillResult: temp, userName });
		}

	}


	return result;
}

async function coc7chack({ chack, temp, text = "", userid, groupid, channelid, userName, bpdiceNum }) {
	let result = '';
	let skillPerStyle = "";
	switch (true) {
		case (temp == 1): {
			result = temp + ' → 恭喜！大成功！';
			skillPerStyle = "criticalSuccess";
			break;
		}
		case (temp == 100): {
			result = temp + ' → 啊！大失敗！';
			skillPerStyle = "fumble";
			break;
		}
		case (temp >= 96 && chack <= 49): {
			result = temp + ' → 啊！大失敗！';
			skillPerStyle = "fumble";
			break;
		}
		case (temp > chack): {
			result = temp + ' → 失敗';
			skillPerStyle = "failure";
			break;
		}
		case (temp <= chack / 5): {
			result = temp + ' → 極限成功';
			skillPerStyle = "success";
			break;
		}
		case (temp <= chack / 2): {
			result = temp + ' → 困難成功';
			skillPerStyle = "success";
			break;
		}
		case (temp <= chack): {
			result = temp + ' → 通常成功';
			skillPerStyle = "success";
			break;
		}
		default:
			break;
	}
	if (text) result += '：' + text;
	if (userid && groupid && skillPerStyle !== "failure" && bpdiceNum <= 0) {
		await dpRecorder({ userID: userid, groupid, channelid, skillName: text, skillPer: chack, skillPerStyle, skillResult: temp, userName });
	}
	return result;
}



async function coc7bp({ chack, text, userid, groupid, channelid, bpdiceNum, userName }) {
	try {
		let result = '';
		let temp0 = rollbase.Dice(10) - 1;
		let countStr = '';
		let check = chack.split(',');
		let name = (text && text.split(',')) || [];
		let checkNum = !check.some(i => !Number.isInteger(Number(i)));
		if (!checkNum) return;
		if (check.length >= 2) result += '聯合檢定\n'
		if (bpdiceNum > 0) {
			for (let i = 0; i <= bpdiceNum; i++) {
				let temp = rollbase.Dice(10);
				let temp2 = temp.toString() + temp0.toString();
				if (temp2 > 100) temp2 = parseInt(temp2) - 100;
				countStr = countStr + temp2 + '、';
			}
			countStr = countStr.substring(0, countStr.length - 1)
			let countArr = countStr.split('、');


			for (let index = 0; index < check.length; index++) {
				let finallyStr = countStr + ' → ' + await coc7chack(
					{ chack: check[index], temp: Math.min(...countArr), text: name[index], userid, groupid, channelid, userName, bpdiceNum }
				);
				result += '1D100 ≦ ' + check[index] + "　\n" + finallyStr + '\n\n';
			}


			return result;
		}
		if (bpdiceNum < 0) {
			for (let i = 0; i <= Math.abs(bpdiceNum); i++) {
				let temp = rollbase.Dice(10);
				let temp2 = temp.toString() + temp0.toString();
				if (temp2 > 100) temp2 = parseInt(temp2) - 100;
				countStr = countStr + temp2 + '、';
			}
			countStr = countStr.substring(0, countStr.length - 1)
			let countArr = countStr.split('、');

			for (let index = 0; index < check.length; index++) {
				let finallyStr = countStr + ' → ' + await coc7chack(
					{ chack: check[index], temp: Math.max(...countArr), text: name[index], userid, groupid, channelid, bpdiceNum }
				);
				result += '1D100 ≦ ' + check[index] + "  \n" + finallyStr + '\n\n';
			}
			return result;
		}
	} catch (error) {
		console.error('error coc #1536', error)
	}
}
function buildpulpchar() {
	let ReStr = 'Pulp CoC 不使用年齡調整\n';
	//讀取年齡
	ReStr += '\nＳＴＲ：' + rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＤＥＸ：' + rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＰＯＷ：' + rollbase.BuildDiceCal('3d6*5');

	ReStr += '\nＣＯＮ：' + rollbase.BuildDiceCal('3d4*5');
	ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('3d6*5');
	ReStr += '\nＳＩＺ：' + rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\nＩＮＴ：' + rollbase.BuildDiceCal('(2d6+6)*5');


	ReStr += '\nＥＤＵ：' + rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\nＬＵＫ：' + rollbase.BuildDiceCal('(2d6+6)*5');
	ReStr += '\n核心屬性：' + rollbase.BuildDiceCal('(1d6+13)*5');
	return ReStr;
}

/**
 * COC7傳統創角
 * @param {年齡} text
 */


/**
 * COC6傳統創角
 */



function build6char() {
	let ReStr = '六版核心創角：';
	ReStr += '\nＳＴＲ：' + rollbase.BuildDiceCal('3d6');
	ReStr += '\nＤＥＸ：' + rollbase.BuildDiceCal('3d6');
	ReStr += '\nＣＯＮ：' + rollbase.BuildDiceCal('3d6');
	ReStr += '\nＰＯＷ：' + rollbase.BuildDiceCal('3d6');
	ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('3d6');
	ReStr += '\nＩＮＴ：' + rollbase.BuildDiceCal('(2d6+6)');
	ReStr += '\nＳＩＺ：' + rollbase.BuildDiceCal('(2d6+6)');
	ReStr += '\nＥＤＵ：' + rollbase.BuildDiceCal('(3d6+3)');
	ReStr += '\n年收入：' + rollbase.BuildDiceCal('(1d10)');
	ReStr += '\n調查員的最小起始年齡等於EDU+6，每比起始年齡年老十年，\n調查員增加一點EDU並且加20點職業技能點數。\n當超過40歲後，每老十年，\n從STR,CON,DEX,APP中選擇一個減少一點。';
	return ReStr;
}
//隨機產生角色背景
function PcBG() {
	return '背景描述生成器（僅供娛樂用，不具實際參考價值）\n=======\n調查員是一個' + PersonalDescriptionArr[rollbase.Dice(PersonalDescriptionArr.length) - 1] + '人。\n【信念】：說到這個人，他' + IdeologyBeliefsArr[rollbase.Dice(IdeologyBeliefsArr.length) - 1] + '。\n【重要之人】：對他來說，最重要的人是' + SignificantPeopleArr[rollbase.Dice(SignificantPeopleArr.length) - 1] + '，這個人對他來說之所以重要，是因為' + SignificantPeopleWhyArr[rollbase.Dice(SignificantPeopleWhyArr.length) - 1] + '。\n【意義非凡之地】：對他而言，最重要的地點是' + MeaningfulLocationsArr[rollbase.Dice(MeaningfulLocationsArr.length) - 1] + '。\n【寶貴之物】：他最寶貴的東西就是' + TreasuredPossessionsArr[rollbase.Dice(TreasuredPossessionsArr.length) - 1] + '。\n【特徵】：總括來說，調查員是一個' + TraitsArr[rollbase.Dice(TraitsArr.length) - 1] + '。';
}

class SanCheck {
	constructor(mainMsg, botname) {
		this.mainMsg = mainMsg;
		this.rollDice = rollbase.Dice(100);
		this.currentSan = this.getSanity(mainMsg[1]);
		this.scMode = this.getScMode(mainMsg[2]);
		this.sc = this.getSc(mainMsg[2]);
		this.rollSuccess = this.getRollSuccess(this.sc);
		this.rollFail = this.getRollFail(this.sc);
		this.lossSan = this.calculateLossSanity(this.rollSuccess, this.rollFail);
		this.buttonCreate = ["ccrt", "ccsu"];
		this.botname = botname;
	}

	getSanity(mainMsg) {
		const sanityMatch = mainMsg.match(/^\d+$/);
		return sanityMatch ? sanityMatch[0] : null;
	}

	getScMode(mainMsg) {
		return (/\//).test(mainMsg || null);
	}

	getSc(mainMsg) {
		return this.scMode ? mainMsg && mainMsg.match(/^(.+)\/(.+)$/i) : null;
	}

	getRollSuccess(sc) {
		return sc && sc[1] ? sc[1].replace(/[^+\-*\dD]/ig, "") : null;
	}

	getRollFail(sc) {
		return sc && sc[2] ? sc[2].replace(/[^+\-*\dD]/ig, "") : null;
	}

	calculateLossSanity(rollSuccess = '', rollFail = '') {
		const parseRoll = (roll) => {
			try {
				return Math.max(rollbase.BuildDiceCal(roll).match(/\S+$/)?.[0], 0)
			} catch { }
			try {
				return Math.max(mathjs.evaluate(roll), 0);
			} catch { }
			return roll;
		};

		const rollSuccessLoss = parseRoll(rollSuccess) || 0;
		const rollFailLoss = parseRoll(rollFail) || 0;

		let rollFumbleLoss = rollFail;
		const regExp = /d/ig;
		try {
			rollFumbleLoss = mathjs.evaluate(rollFail.replace(regExp, '*'));
		} catch { }

		return {
			rollSuccessLoss,
			rollFailLoss,
			rollFumbleLoss
		};

	}
	runDiscord() {
		let arr = [];
		let str = `手動San Check模式 \n 請選擇要擲骰的方式\n  1d100 - 基本San Check\n`;
		this.scMode = this.getScMode(this.mainMsg[1]);
		this.sc = this.getSc(this.mainMsg[1]);
		this.rollSuccess = this.getRollSuccess(this.sc);
		this.rollFail = this.getRollFail(this.sc);
		if (this.rollSuccess) {
			str += ` ${this.rollSuccess} - 成功時San Check\n`;
			arr.push(this.rollSuccess);
		}
		if (this.rollFail) {
			str += ` ${this.rollFail} - 失敗時San Check\n`;
			arr.push(this.rollFail);
		}
		this.buttonCreate.unshift("1d100",...arr);
		return str;
	}
	run() {
		if (!this.currentSan && this.botname == "Discord") return this.runDiscord();
		if (!this.currentSan) return '請輸入正確的San值，\n格式是 .sc 50 或 .sc 50 1/3 或 .sc 50 1d3+3/1d100';
		const diceFumble = (this.rollDice === 100) || (this.rollDice >= 96 && this.rollDice <= 100 && this.currentSan <= 49);
		const diceSuccess = this.rollDice <= this.currentSan;
		const diceFail = this.rollDice > this.currentSan;

		if (diceFumble) {
			return this.handleDiceFumble();
		} else if (diceSuccess) {
			return this.handleDiceSuccess();
		} else if (diceFail) {
			return this.handleDiceLoss();
		}

		//可接受輸入: .sc 50	.sc 50 哈哈		.sc 50 1/3		.sc 50 1d3+3/1d100 
		//scMode 代表會扣SC 或有正常輸入扣SAN的數字 

	}

	handleDiceFumble() {
		if (!this.scMode) {
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 大失敗!`;
		}
		if (this.rollFail) {
			let updatedSan = ((this.currentSan - this.lossSan.rollFumbleLoss) < 0) ? 0 : this.currentSan - this.lossSan.rollFumbleLoss;
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 大失敗!\n失去${this.rollFail}最大值 ${this.lossSan.rollFumbleLoss}點San\n現在San值是${updatedSan}點`.replace('是NaN點', ' 算式錯誤，未能計算');
		}
		return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 大失敗!`
	}
	handleDiceSuccess() {
		//成功
		if (!this.scMode) {
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 成功!`
		}
		if (this.lossSan) {
			let updatedSan = ((this.currentSan - this.lossSan.rollSuccessLoss) < 0) ? 0 : this.currentSan - this.lossSan.rollSuccessLoss;
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 成功!\n失去${this.rollSuccess} → ${this.lossSan.rollSuccessLoss}點San\n現在San值是${updatedSan}點`.replace('是NaN點', ' 算式錯誤，未能計算');
		} else
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 成功!\n不需要減少San`

	}
	handleDiceLoss() {
		if (!this.scMode) {
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 失敗!`
		}
		if (this.lossSan) {
			let updatedSan = ((this.currentSan - this.lossSan.rollFailLoss) < 0) ? 0 : this.currentSan - this.lossSan.rollFailLoss;
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 失敗!\n失去${this.rollFail} → ${this.lossSan.rollFailLoss}點San\n現在San值是${updatedSan}點`.replace('是NaN點', ' 算式錯誤，未能計算');
		} else
			return `San Check\n1d100 ≦ ${this.currentSan}\n擲出:${this.rollDice} → 失敗!\n但不需要減少San`

	}
	getButton() {
		return this.buttonCreate;
	}
}

function chase() {
	let rply = `CoC 7ed追逐戰產生器\n`;
	let round = rollbase.Dice(5) + 5;
	for (let index = 0; index < round; index++) {
		rply += `${chaseGenerator(index)}\n========\n`;
	}
	return rply;
}
function chaseGenerator(num) {
	let rply = "";
	let chase = rollbase.Dice(100);
	let dangerMode = (rollbase.Dice(2) == 1) ? true : false;
	switch (true) {
		case (chase >= 96): {
			rply = `地點${num + 1} 極限難度 ${dangerMode ? "險境" : "障礙"}
			`
			let itemsNumber = rollbase.DiceINT(2, 5);
			let result = shuffle(request);
			rply += `可能進行的檢定: `;
			for (let index = 0; index < itemsNumber; index++) {
				rply += `${result[index]} `;
			}
			if (dangerMode) {
				rply += `
				失敗失去1D10嚴重事故HP傷害
				及 失去（1D3）點行動點`;
			} else {
				let blockhp = shuffle(blockHard);
				rply += `
				障礙物 HP${blockhp[0]}`
			}
			//1D10嚴重事故
			//額外失去1（1D3）點行動點
			break;
		}
		case (chase >= 85): {
			rply = `地點${num + 1} 困難難度 ${dangerMode ? "險境" : "障礙"}
			`;
			let itemsNumber = rollbase.DiceINT(2, 5);
			let result = shuffle(request);
			rply += `可能進行檢定: `;
			for (let index = 0; index < itemsNumber; index++) {
				rply += `${result[index]} `;
			}
			if (dangerMode) {
				rply += `
				失敗失去1D6中度事故HP傷害
				及 失去（1D3）點行動點`;
			} else {
				let blockhp = shuffle(blockIntermediate);
				rply += `
				障礙物 HP${blockhp[0]}`
			}
			//1D6中度事故
			//額外失去1（1D3）點行動點
			break;
		}
		case (chase >= 60): {
			rply = `地點${num + 1} 一般難度 ${dangerMode ? "險境" : "障礙"}
			`
			let itemsNumber = rollbase.DiceINT(2, 5);
			let result = shuffle(request);
			rply += `可能進行檢定: `;
			for (let index = 0; index < itemsNumber; index++) {
				rply += `${result[index]} `;
			}
			if (dangerMode) {
				rply += `
				失敗失去1D3-1輕微事故HP傷害
				及 失去（1D3）點行動點`;
			} else {
				let blockhp = shuffle(blockEasy);
				rply += `
				障礙物 HP${blockhp[0]}`
			}
			//1D3-1輕微事故
			//額外失去1（1D3）點行動點
			break;
		}
		default: {
			rply = `地點${num + 1} 沒有險境/障礙`
			break;
		}
	}
	return rply;
}

const request = ["攀爬", "游泳", "閃避", "力量", "敏捷", "跳躍", "鎖匠",
	"攻擊", "戰技", "偵查", "幸運", "話術", "恐嚇", "潛行", "心理學", "聆聽"
]

const blockHard = [5, 5, 10, 10, 15, 15, 25, 50, 100];
const blockEasy = [5, 5, 5, 10, 10, 15]
const blockIntermediate = [5, 5, 10, 10, 15, 15, 25]

function shuffle(array) {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

function getOccupationSkill(state) {
	//state = [STR,DEX,....]
	let skillsPool = [];
	let skillResult = [];
	let CR = rollbase.Dice(8) - 1;
	for (let index = 0; index < 8; index++) {
		let temp = eval(state[index]);
		for (let index2 = 0; index2 < temp.length; index2++) {
			skillsPool.push(temp[index2]);
		}
		//skillsPool = ["戰鬥類", "醫療"] - 決定POOL有什麼d
		//skillsPool (15) ['戰鬥類', '醫療', '戰鬥類', '醫療', '移動類', '隱密類', '戰鬥類
		if (index == CR) {
			skillResult.push("信譽");
		}
		skillResult.push(skillsPool[rollbase.Dice(skillsPool.length) - 1]);
		//


	}

	//skillResult (9) ['醫療', '醫療', '醫療', '信譽', '戰鬥類', '隱密類', '移動類', '隱密類', '戰鬥類']
	let finalOSkillList = [];
	let sortSkillList = [
		{ name: "移動類", sort: shuffle([...移動類]) },
		{ name: "隱密類", sort: shuffle([...隱密類]) },
		{ name: "職業興趣", sort: shuffle([...職業興趣]) },
		{ name: "調查類", sort: shuffle([...調查類]) },
		{ name: "戰鬥類", sort: shuffle([...戰鬥類]) },
		{ name: "醫療類", sort: shuffle([...醫療類]) },
		{ name: "語言類", sort: shuffle([...語言類]) },
		{ name: "學問類", sort: shuffle([...學問類]) },
		{ name: "交際類", sort: shuffle([...交際類]) },
	];
	for (let i = 0; i < skillResult.length; i++) {
		if (skillResult[i] == "信譽") {
			finalOSkillList.push("信譽");
			continue;
		}
		sortSkillList.forEach(v => {
			if (v.name == skillResult[i]) {
				finalOSkillList.push(v.sort[0].name);
				v.sort.shift();
			}
		})

	}


	let tempOtherSkillList = [];
	sortSkillList.forEach(element => {
		tempOtherSkillList.push(element.sort)
	});
	let tempFinalOtherSkillList = shuffle([...tempOtherSkillList.flat()])
	let finalOtherSkillList = []
	for (let index = 0; index < 4; index++) {
		finalOtherSkillList.push(tempFinalOtherSkillList[index]);
	}

	return { finalOSkillList, finalOtherSkillList };

	//

}
function checkState(state) {
	let result = [];
	result[0] = eightStateNumber[state.indexOf("STR")]
	result[1] = eightStateNumber[state.indexOf("DEX")]
	result[2] = eightStateNumber[state.indexOf("POW")]
	result[3] = eightStateNumber[state.indexOf("CON")]
	result[4] = eightStateNumber[state.indexOf("APP")]
	result[5] = eightStateNumber[state.indexOf("SIZ")]
	result[6] = eightStateNumber[state.indexOf("INT")]
	result[7] = eightStateNumber[state.indexOf("EDU")]
	return result;
}

const eightState = ["STR",
	"DEX",
	"POW",
	"CON",
	"APP",
	"SIZ",
	"INT",
	"EDU"];
const eightStateNumber = [
	80, 70, 70, 60, 50, 50, 50, 40];
const eightskillsNumber = [70, 60, 60, 50, 50, 50, 40, 40, 40];

const 交際類 = [
	{ name: "心理學", skill: 10 },
	{ name: "說服", skill: 10 },
	{ name: "話術", skill: 5 },
	{ name: "恐嚇", skill: 15 },
	{ name: "取悅", skill: 15 }
]
const 移動類 =
	[{ name: "導航", skill: 10 },
	{ name: "生存", skill: 10 },
	{ name: "跳躍", skill: 20 },
	{ name: "攀爬", skill: 20 },
	{ name: "游泳", skill: 20 },
	{ name: "駕駛（汽車）", skill: 20 },
	{ name: "駕駛（其他）", skill: 1 },
	{ name: "潛水", skill: 1 },
	{ name: "騎術", skill: 5 }]

const 隱密類 = [
	{ name: "潛行", skill: 20 },
	{ name: "追蹤", skill: 10 },
	{ name: "喬裝", skill: 5 },
	{ name: "鎖匠", skill: 1 },
	{ name: "巧手", skill: 10 }
]

const 學問類 = [
	{ name: "會計", skill: 5 },
	{ name: "法律", skill: 5 },
	{ name: "神秘學", skill: 5 },
	{ name: "歷史", skill: 5 },
	{ name: "自然學", skill: 10 },
	{ name: "人類學", skill: 1 },
	{ name: "考古學", skill: 1 },
	{ name: "司法科學", skill: 1 },
	{ name: "數學", skill: 1 },
	{ name: "動物學", skill: 1 },
	{ name: "電子學", skill: 1 },
	{ name: "天文學", skill: 1 },
	{ name: "地質學", skill: 1 },
	{ name: "生物學", skill: 1 },
	{ name: "物理", skill: 1 },
	{ name: "化學", skill: 1 },
	{ name: "密碼學", skill: 1 },
	{ name: "氣象學", skill: 1 },
	{ name: "植物學", skill: 1 },
	{ name: "學問:", skill: 1 }
]

const 語言類 = [
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 },
	{ name: "語言", skill: 1 }

]

const 職業興趣 = [
	{ name: "美術", skill: 5 },
	{ name: "偽造", skill: 5 },
	{ name: "表演", skill: 5 },
	{ name: "攝影", skill: 5 },
	{ name: "藝術／手藝(自選一項)", skill: 5 },
	{ name: "操作重機", skill: 1 },
	{ name: "機械維修", skill: 10 },
	{ name: "電器維修", skill: 10 },
	{ name: "電腦使用", skill: 5 },
	{ name: "動物馴養", skill: 5 },
]

const 調查類 = [
	{ name: "偵查", skill: 25 },
	{ name: "聆聽", skill: 20 },
	{ name: "圖書館使用", skill: 20 },
	{ name: "估價", skill: 5 },
	{ name: "讀唇", skill: 1 },
]

const 戰鬥類 = [
	{ name: "閃避", skill: 0 },
	{ name: "鬥毆", skill: 25 },
	{ name: "劍", skill: 20 },
	{ name: "投擲", skill: 20 },
	{ name: "弓", skill: 15 },
	{ name: "手槍", skill: 20 },
	{ name: "步槍／霰彈槍", skill: 25 },

]

const 醫療類 = [
	{ name: "精神分析", skill: 1 },
	{ name: "急救", skill: 30 },
	{ name: "醫學", skill: 1 },
	{ name: "藥學", skill: 1 },
	{ name: "催眠", skill: 1 }
]
const STR = ["戰鬥類", "醫療類"]
const DEX = ["移動類", "隱密類"]
const POW = ["職業興趣", "學問類"]
const CON = ["移動類", "戰鬥類"]
const APP = ["語言類", "交際類"]
const EDU = ["調查類", "醫療類", "學問類"]
const SIZ = ["戰鬥類", "交際類"]
const INT = ["隱密類", "職業興趣", "調查類"]
class MythoyCollection {
	constructor() { }

	static getMythos() {
		return `克蘇魯神話邪神:
		${this.getMythonData("god")}

		克蘇魯神話生物:
		${this.getMythonData("monster")}

		克蘇魯神話書籍:
		${this.getMythonData("MagicBook")}

		克蘇魯神話法術:
		${this.getMythonData("magic")}
		`
	}
	static getMythonData(dataType) {
		return this.cases[dataType] ? this.cases[dataType]() : this.cases._default();
	}
	static cases = {
		god: () => { return this.getRandomData(this.MythoyGodList) },
		monster: () => { return this.getRandomData(this.mosterList) },
		magic: () => { return this.getRandomData(this.Magic) },
		MagicBook: () => { return this.getRandomData(this.MagicBookList) },
		pushedCasting: () => {
			return `${this.getRandomData(this.pushedCastingRoll)}
			對於更強大的法術（例如召喚神靈或消耗POW的法術），副作用可能更嚴重：
			${this.getRandomData(this.pushedPowerfulCastingRoll)}
			`
		},
		_default: () => { return "沒有找到符合的資料" }
	}
	static getRandomData(array) {
		return array[Math.floor(Math.random() * array.length)];
	}
	static mosterList = [
		"拜亞基", "鑽地魔蟲", "星之彩", "蠕行者", "達貢&海德拉（特殊深潜者）", "黑山羊幼崽", "深潜者", "混種深潜者", "巨噬蠕蟲", "空鬼", "古老者", "炎之精", "飛水螅", "無形眷族", "妖鬼", "食屍鬼", "格拉基之僕", "諾弗·刻", "伊斯之偉大種族", "庭達羅斯的獵犬", "恐怖獵手", "羅伊格爾", "米-戈", "夜魘", "人面鼠", "潜沙怪", "蛇人", "外神僕役", "夏蓋妖蟲", "夏塔克鳥", "修格斯", "修格斯主宰(人型)", "修格斯主宰(修格斯形態)", "克蘇魯的星之眷族", "星之精", "喬喬人", "耶庫伯人", "冷蛛", "昆揚人", "月獸", "空鬼", "潛沙怪", "冷原人", "圖姆哈人"
	];
	static MythoyGodList = ["阿布霍斯", "阿特拉克·納克亞", "阿薩托斯", "芭絲特", "昌格納·方庚", "克圖格亞", "偉大的克蘇魯", "賽伊格亞", "道羅斯", "埃霍特", "加塔諾托亞", "格拉基", "哈斯塔，不可名狀者", "伊塔庫亞", "黃衣之王，哈斯塔的化身", "諾登斯", "奈亞拉托提普(人類形態)", "奈亞拉托提普(怪物形態)", "尼約格薩", "蘭-提格斯", "莎布-尼古拉斯", "修德梅爾", "撒托古亞", "圖爾茲查", "烏波·薩斯拉", "烏波·薩斯拉的子嗣", "伊戈羅納克", "伊波·茲特爾", "伊格", "猶格·索托斯", "佐斯·奧摩格"];
	static Magic = ["維瑞之印", "守衛術", "忘卻之波", "肢體凋萎術", "真言術", "折磨術", "靈魂分配術", "耶德·艾塔德放逐術", "束縛術", "祝福刀鋒術", "葛哥洛斯形體扭曲術", "深淵之息", "黃金蜂蜜酒釀造法", "透特之詠", "記憶模糊術", "紐格塔緊握術", "外貌濫用術", "致盲術/複明術", "創造納克-提特之障壁", "拉萊耶造霧術", "僵屍製造術", "腐爛外皮之詛咒", "致死術", "支配術", "阿撒托斯的恐怖詛咒", "蘇萊曼之塵", "舊印開光術", "綠腐術", "恐懼注入術", "血肉熔解術", "心理暗示術", "精神震爆術", "精神交換術", "精神轉移術", "塔昆·阿提普之鏡", "伊本-加茲之粉", "蒲林的埃及十字架", "修德·梅’爾之赤印", "復活術", "枯萎術", "哈斯塔之歌", "請神術", "聯絡術", "通神術", "附魔術", "迷身術（迷惑犧牲者）", "邪眼術", "猶格-索托斯之拳", "血肉防護術", "時空門法術", "召喚術", "束縛術"];
	static MagicBookList = ["阿齊夫(死靈之書原版)", "死靈之書", "不可名狀的教團", "拉萊耶文本", "格拉基啟示錄", "死靈之書", "戈爾·尼格拉爾", "伊波恩之書", "水中之喀特", "綠之書", "不可名狀的教團", "伊波恩之書", "來自被詛咒者，或（關於古老而恐怖的教團的論文）", "死亡崇拜", "艾歐德之書", "蠕蟲之秘密", "食屍鬼教團", "伊波恩之書", "埃爾特當陶片", "暗黑儀式", "諾姆羊皮卷", "達爾西第四之書", "斯克洛斯之書", "斷罪處刑之書", "智者瑪格洛魯姆", "暗黑大典", "格哈恩殘篇", "納克特抄本", "不可名狀的教團", "伊希之儀式", "刻萊諾殘篇", "狂僧克利薩努斯的懺悔", "迪詹之書", "達貢禱文", "反思錄", "怪物及其族類", "惡魔崇拜", "深淵棲息者", "鉉子七奧書", "亞洲的神秘奧跡，含有從《戈爾·尼格拉爾》中摘抄的注釋", "巨噬蠕蟲頌", "蓋夫抄本", "薩塞克斯手稿", "鑽地啟示錄", "《死靈之書》中的克蘇魯", "伊拉內克紙草", "卡納瑪戈斯聖約書", "水中之喀特", "海底的教團", "真實的魔法", "納斯編年史", "遠古的恐怖", "骷髏黑書", "伊斯提之歌", "來自被詛咒者", "波納佩聖典", "神秘學基礎", "置身高壓水域", "魔法與黑巫術", "黃衣之王", "黑之契經", "《波納佩聖典》所述的史前太平洋", "伊戈爾倫理學", "來自亞狄斯的幻象", "利誇利亞的傳說", "哈利湖啟示錄", "姆-拉斯紙草", "撒都該人的勝利", "新英格蘭樂土上的奇術異事", "混沌之魂", "猶基亞頌歌", "秘密窺視者", "約翰森的敘述", "致夏蓋的安魂彌撒", "艾歐德之書", "越過幻象", "關於新英格蘭的既往巫術", "阿撒托斯及其他", "黑色的瘋狂之神", "伊波恩生平", "全能的奧蘇姆", "地底掘進者", "巨石的子民", "撒拉遜人的宗教儀式", "水鰭書", "波利尼西亞神話學，附有對克蘇魯傳說圈的記錄", "異界的監視者", "科學的奇跡", "薩波斯的卡巴拉", "贊蘇石板", "魚之書", "失落帝國的遺跡", "托斯卡納的宗教儀式", "夜之魍魎", "太平洋史前史：初步調查", "納卡爾之鑰", "宣福者美多迪烏斯", "翡翠石板", "金枝", "易經", "揭開面紗的伊西斯", "所羅門之鑰", "女巫之錘", "諾查丹瑪斯的預言", "西歐的异教巫術崇拜", "光明篇",]

	static pushedCastingRoll = [
		'1 .視力模糊或暫時失明。',
		'2: 殘缺不全的尖叫聲、聲音或其他噪音。',
		'3: 強烈的風或其他大氣效應。',
		'4: 流血——可能是由於施法者、在場其他人或環境（如牆壁）的出血。',
		'5: 奇異的幻象和幻覺。',
		'6: 周圍的小動物爆炸。',
		'7: 異臭的硫磺味。',
		'8: 不小心召喚了神話生物。'
	]
	static pushedPowerfulCastingRoll = ['1: 大地震動，牆壁破裂。',
		'2: 巨大的雷電聲。',
		'3: 血從天而降。',
		'4: 施法者的手被乾枯和燒焦。',
		'5: 施法者不正常地老化（年齡增加2D10歲，並應用特徵修正，請參見老化規則）。',
		'6: 強大或眾多的神話生物出現，從施法者開始攻擊附近所有人！',
		'7: 施法者或附近的所有人被吸到遙遠的時間或地方。',
		'8: 不小心召喚了神話神明。',
	]

}



class BuilderRegistry {
	constructor() {
		this.builders = new Map();
	}

	registerBuilder(pattern, builderClass) {
		this.builders.set(pattern, new builderClass());
	}

	getBuilder(name) {
		return this.builders.get(name);
	}
}

class Build7Char {
	constructor() {
		this.builderRegistry = new BuilderRegistry();
		this.defaultRegistry;
	}
	defaultBuiler(builderClass) {
		this.defaultRegistry = new builderClass();
	}

	registerBuilder(name, builderClass) {
		this.builderRegistry.registerBuilder(name, builderClass);
	}

	build(text, age) {
		for (const [pattern, builderClass] of this.builderRegistry.builders) {
			if (text.match(pattern)) {
				return builderClass.build(text, age);
			}
		}

		return `你輸入的指令不正確，指令為 
coc7版創角				： 啓動語 .cc7build (歲數7-89)
coc7版隨機創角			： 啓動語 .cc7build random 或留空
coc7版自由分配點數創角	： 啓動語 .cc7build .xyz (歲數15-89)

先以coc7版隨機模式來創角
${this.defaultRegistry.build()}
`;
	}
}

class RandomBuilder {
	/**
	 * 該方案適合大家想要立刻掏槍上馬開桌的時候。
	 * 將４０、５０、５０、５０、６０、６０、７０、８０分配在屬性上。
	 * 選擇職業和８個職業技能
	 * 將８個職業技能和信譽分別分配以下數額：１項７０％，２項６０％，３項５０％和３項４０％（直接假定這些技能就是這個數值，忽略掉技能初始值）。
	 * ４個非本職技能，將它們在基礎值上各增加２０％。								
	 * 
	 */
	constructor() {
	}
	static pattern() {
		return /^random$/i;
	}

	build() {
		//設定 因年齡減少的點數 和 EDU加骰次數
		let old = rollbase.DiceINT(15, 89);
		let ReStr = `
=======coc7版隨機創角=======
調查員年齡設為：${old}\n`;
		let Debuff = 0;
		let AppDebuff = 0;
		let EDUinc = 0;
		for (let i = 0; old >= oldArr[i]; i++) {
			Debuff = DebuffArr[i];
			AppDebuff = AppDebuffArr[i];
			EDUinc = EDUincArr[i];
		}
		ReStr += '=======\n';
		switch (true) {
			case (old >= 15 && old <= 19):
				ReStr += '年齡調整：從STR或SIZ中減去' + Debuff + '點\n（請自行手動選擇計算）。\nEDU減去5點。LUK骰兩次取高。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號兩項，減值' + Debuff + '點。）';
				break;
			case (old >= 20 && old <= 39):
				ReStr += '年齡調整：可做' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				break;
			case (old >= 40 && old <= 49):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
				break;
			case (old >= 50):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（從一，二或全部三項中選擇）\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
				break;

			default:
				break;
		}
		/**
		 * 
		 * ＳＴＲ：(4+6+4) * 5 = 70 ←（可選）
		ＤＥＸ：(1+6+1) * 5 = 40
		ＰＯＷ：(2+2+2) * 5 = 30
		ＣＯＮ：(4+3+6) * 5 = 65
		ＡＰＰ：(2+1+1) * 5 = 20
		ＳＩＺ：((3+4)+6) * 5 = 65 ←（可選）
		ＩＮＴ：((6+2)+6) * 5 = 70
		ＥＤＵ：(((4+6)+6) * 5)-5 = 75
		 */
		let randomState = shuffle(eightState);
		let randomStateNumber = checkState(randomState);
		ReStr += '\nＳＴＲ：' + randomStateNumber[0];
		if (old >= 40) ReStr += ' ←（可選） ';
		if (old < 20) ReStr += ' ←（可選）';

		ReStr += '\nＤＥＸ：' + randomStateNumber[1];
		if (old >= 40) ReStr += ' ← （可選）';

		ReStr += '\nＰＯＷ：' + randomStateNumber[2];

		ReStr += '\nＣＯＮ：' + randomStateNumber[3];
		if (old >= 40) ReStr += ' ← （可選）'

		if (old >= 40) {
			ReStr += '\nＡＰＰ：' + `${randomStateNumber[4]}-${AppDebuff} = ${randomStateNumber[4] - AppDebuff}`;
		} else ReStr += '\nＡＰＰ：' + randomStateNumber[4];


		ReStr += '\nＳＩＺ：' + randomStateNumber[5];
		if (old < 20) {
			ReStr += ' ←（可選）';
		}

		ReStr += '\nＩＮＴ：' + randomStateNumber[6]

		if (old < 20) ReStr += '\nＥＤＵ：' + randomStateNumber[7];
		else {
			ReStr += '\n=======';
			ReStr += '\nＥＤＵ初始值：' + randomStateNumber[7]

			let tempEDU = + randomStateNumber[7]

			for (let i = 1; i <= EDUinc; i++) {
				let EDURoll = rollbase.Dice(100);
				ReStr += '\n第' + i + '次EDU成長 → ' + EDURoll;
				if (EDURoll > tempEDU) {
					let EDUplus = rollbase.Dice(10);
					ReStr += ' → 成長' + EDUplus + '點';
					tempEDU = tempEDU + EDUplus;
				} else {
					ReStr += ' → 沒有成長';
				}
			}
			ReStr += '\n';
			ReStr += '\nＥＤＵ最終值：' + tempEDU;
		}
		ReStr += '\n=======';
		const tempBuildLuck = [rollbase.BuildDiceCal('3d6*5'), rollbase.BuildDiceCal('3d6*5')]
		const tempLuck = [tempBuildLuck[0].match(/\d+$/), tempBuildLuck[1].match(/\d+$/)]

		if (old < 20) {
			ReStr += '\nＬＵＫ第一次：' + `${tempBuildLuck[0]} \nＬＵＫ第二次： ${tempBuildLuck[1]}`;
			ReStr += '\nＬＵＫ最終值：' + Math.max(...tempLuck);
		}
		else {
			ReStr += '\nＬＵＫ：' + `${tempBuildLuck[0]} `;
		}

		//ReStr += '\nＬＵＫ：' + rollbase.BuildDiceCal('3d6*5');
		//if (old < 20) ReStr += '\nＬＵＫ加骰：' + rollbase.BuildDiceCal('3D6*5');
		ReStr += `\n==本職技能==`
		let occAndOtherSkills = getOccupationSkill(randomState);
		for (let index = 0; index < occAndOtherSkills.finalOSkillList.length; index++) {
			ReStr += `\n ${occAndOtherSkills.finalOSkillList[index]} ${eightskillsNumber[index]}`

		}
		ReStr += `\n==其他技能==`
		for (let index = 0; index < occAndOtherSkills.finalOtherSkillList.length; index++) {
			ReStr += `\n ${occAndOtherSkills.finalOtherSkillList[index].name} ${occAndOtherSkills.finalOtherSkillList[index].skill + 20}`

		}
		ReStr += `\n=======\n${PcBG()}`;
		return ReStr;
	}
}

class AgeBuilder {
	static pattern() {
		return /^\d+$/i;
	}

	build(text) {
		let old = "";
		let ReStr = "調查員年齡設為：";
		if (text) old = text.replace(/\D/g, '');
		if (old) {
			ReStr += old + '\n';
		}
		//設定 因年齡減少的點數 和 EDU加骰次數
		let Debuff = 0;
		let AppDebuff = 0;
		let EDUinc = 0;
		if (old < 7) {
			ReStr += '\n等等，核心規則或日本拓展沒有適用小於7歲的人物哦。\n先當成15歲處理\n';
			old = 15;
		}

		if (old >= 7 && old <= 14) {
			ReStr += '\n等等，核心規則沒有適用小於15歲的人物哦。\n先使用日本CoC 7th 2020 拓展 - 7到14歲的幼年調查員規則吧\n';
		}
		if (old >= 90) {
			ReStr += '\n等等，核心規則沒有適用於90歲以上的人物哦。\n先當成89歲處理\n';
			old = 89;
		}
		for (let i = 0; old >= oldArr[i]; i++) {
			Debuff = DebuffArr[i];
			AppDebuff = AppDebuffArr[i];
			EDUinc = EDUincArr[i];
		}
		ReStr += '=======\n';
		switch (true) {
			case (old >= 7 && old <= 14):
				{
					if (old >= 7 && old <= 12) {
						ReStr += '\nＳＴＲ：' + rollbase.BuildDiceCal('3d4*5');
						ReStr += '\nＤＥＸ：' + rollbase.BuildDiceCal('3d6*5');
						ReStr += '\nＰＯＷ：' + rollbase.BuildDiceCal('3d6*5');

						ReStr += '\nＣＯＮ：' + rollbase.BuildDiceCal('3d4*5');
						ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('3d6*5');
						ReStr += '\nＳＩＺ：' + rollbase.BuildDiceCal('(2d3+6)*5');
						ReStr += '\nＩＮＴ：' + rollbase.BuildDiceCal('(2d6+6)*5');

					}
					if (old >= 13 && old <= 14) {
						ReStr += '\nＳＴＲ：' + rollbase.BuildDiceCal('(2d6+1)*5');
						ReStr += '\nＤＥＸ：' + rollbase.BuildDiceCal('3d6*5');
						ReStr += '\nＰＯＷ：' + rollbase.BuildDiceCal('3d6*5');

						ReStr += '\nＣＯＮ：' + rollbase.BuildDiceCal('(2d6+1)*5');
						ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('3d6*5');
						ReStr += '\nＳＩＺ：' + rollbase.BuildDiceCal('(2d4+6)*5');
						ReStr += '\nＩＮＴ：' + rollbase.BuildDiceCal('(2d6+6)*5');

					}
					for (let i = 0; old >= OldArr2020[i]; i++) {
						EDUinc = EDUincArr2020[i];
					}
					ReStr += '\nＥＤＵ：' + EDUinc;
					const tempBuildLuck = [rollbase.BuildDiceCal('3d6*5'), rollbase.BuildDiceCal('3d6*5')]
					const tempLuck = [tempBuildLuck[0].match(/\d+$/), tempBuildLuck[1].match(/\d+$/)]
					ReStr += '\nＬＵＫ第一次：' + `${tempBuildLuck[0]} \nＬＵＫ第二次： ${tempBuildLuck[1]}`;
					ReStr += '\nＬＵＫ最終值：' + Math.max(...tempLuck);
					ReStr += '\n\n幼年調查員的特性：' + rollbase.BuildDiceCal('2d6');
					ReStr += '\n幼年調查員的家境：' + rollbase.BuildDiceCal('1D100');
					ReStr += '\n幼年調查員可受「幫忙」的次數：' + Math.round((17 - old) / 3);
					return ReStr;
				}

			case (old >= 15 && old <= 19):
				ReStr += '年齡調整：從STR或SIZ中減去' + Debuff + '點\n（請自行手動選擇計算）。\nEDU減去5點。LUK骰兩次取高。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號兩項，減值' + Debuff + '點。）';
				break;
			case (old >= 20 && old <= 39):
				ReStr += '年齡調整：可做' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				break;
			case (old >= 40 && old <= 49):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
				break;
			case (old >= 50):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（從一，二或全部三項中選擇）\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				ReStr += '\n（以下箭號三項，自選減去' + Debuff + '點。）';
				break;

			default:
				break;
		}
		ReStr += '\nＳＴＲ：' + rollbase.BuildDiceCal('3d6*5');
		if (old >= 40) ReStr += ' ←（可選） ';
		if (old < 20) ReStr += ' ←（可選）';

		ReStr += '\nＤＥＸ：' + rollbase.BuildDiceCal('3d6*5');
		if (old >= 40) ReStr += ' ← （可選）';

		ReStr += '\nＰＯＷ：' + rollbase.BuildDiceCal('3d6*5');

		ReStr += '\nＣＯＮ：' + rollbase.BuildDiceCal('3d6*5');
		if (old >= 40) ReStr += ' ← （可選）'

		if (old >= 40) {
			ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('(3d6*5)-' + AppDebuff)
		} else ReStr += '\nＡＰＰ：' + rollbase.BuildDiceCal('3d6*5');


		ReStr += '\nＳＩＺ：' + rollbase.BuildDiceCal('(2d6+6)*5');
		if (old < 20) {
			ReStr += ' ←（可選）';
		}

		ReStr += '\nＩＮＴ：' + rollbase.BuildDiceCal('(2d6+6)*5');

		if (old < 20) ReStr += '\nＥＤＵ：' + rollbase.BuildDiceCal('((2d6+6)*5)-5');
		else {
			let firstEDU = '(' + rollbase.BuildRollDice('2d6') + '+6)*5';
			ReStr += '\n=======';
			ReStr += '\nＥＤＵ初始值：' + firstEDU + ' = ' + eval(firstEDU);

			let tempEDU = eval(firstEDU);

			for (let i = 1; i <= EDUinc; i++) {
				let EDURoll = rollbase.Dice(100);
				ReStr += '\n第' + i + '次EDU成長 → ' + EDURoll;
				if (EDURoll > tempEDU) {
					let EDUplus = rollbase.Dice(10);
					ReStr += ' → 成長' + EDUplus + '點';
					tempEDU = tempEDU + EDUplus;
				} else {
					ReStr += ' → 沒有成長';
				}
			}
			ReStr += '\n';
			ReStr += '\nＥＤＵ最終值：' + tempEDU;
		}
		ReStr += '\n=======';

		const tempBuildLuck = [rollbase.BuildDiceCal('3d6*5'), rollbase.BuildDiceCal('3d6*5')]
		const tempLuck = [tempBuildLuck[0].match(/\d+$/), tempBuildLuck[1].match(/\d+$/)]
		if (old < 20) {
			ReStr += '\nＬＵＫ第一次：' + `${tempBuildLuck[0]} \nＬＵＫ第二次： ${tempBuildLuck[1]}`;
			ReStr += '\nＬＵＫ最終值：' + Math.max(...tempLuck);
		}
		else {
			ReStr += '\nＬＵＫ：' + `${tempBuildLuck[0]} `;
		}


		//ReStr += '\nＬＵＫ：' + rollbase.BuildDiceCal('3d6*5');
		//if (old < 20) ReStr += '\nＬＵＫ加骰：' + rollbase.BuildDiceCal('3D6*5');
		ReStr += '\n=======\n煤油燈特徵: 1D6&1D20 → ' + rollbase.Dice(6) + ',' + rollbase.Dice(20);
		return ReStr;
	}
}

class XYZBuilder {
	static pattern() {
		return /^([.])/i;
	}

	build(text, age) {
		this.x = (text.match(/[.]\d+/i) && text[1]) || 5;
		this.y = (text.match(/[.]\d+/i) && text[2]) || 3;
		this.z = (text.match(/[.]\d+/i) && text[3]) || 0;
		this.age = age?.match(/^\d+/i) || 0;
		let ReStr = `自由分配屬性點數創角方案
=======
`;
		for (let i = 0; i < this.x; i++) {
			ReStr += `${rollbase.BuildDiceCal('3d6*5')}\n`
		}
		if (this.x) ReStr += `=======\n`
		for (let i = 0; i < this.y; i++) {
			ReStr += `${rollbase.BuildDiceCal('(2d6+6)*5')}\n`
		}
		if (this.y) ReStr += `=======\n`
		for (let i = 0; i < this.z; i++) {
			ReStr += `${rollbase.BuildDiceCal('3d6*5')}\n`
		}
		if (this.z) ReStr += `=======\n`
		if (this.age && !isNaN(this.age)) {
			ReStr += `${this.ageAdjustment(this.age)}`
			//設定 因年齡減少的點數 和 EDU加骰次數
		} else {
			ReStr += `沒有年齡調整\n如果在後面加上年齡，就會自動計算年齡調整 如 
.cc7build .533 40`;
			const tempBuildLuck = [rollbase.BuildDiceCal('3d6*5'), rollbase.BuildDiceCal('3d6*5')]
			ReStr += '\n=======\nＬＵＫ：' + `${tempBuildLuck[0]} `;
		}


		return ReStr;
	}
	ageAdjustment(age) {
		let Debuff = 0;
		let AppDebuff = 0;
		let EDUinc = 0;
		let ReStr = '';
		let newAge = age;
		if (newAge < 15) newAge = 15;
		if (newAge > 89) age = 89;
		for (let i = 0; newAge >= oldArr[i]; i++) {
			Debuff = DebuffArr[i];
			AppDebuff = AppDebuffArr[i];
			EDUinc = EDUincArr[i];
		}
		ReStr += '年齡：' + newAge + '\n';
		switch (true) {
			case (newAge >= 15 && newAge <= 19):
				ReStr += '年齡調整：從STR或SIZ中減去' + Debuff + '點\n（請自行手動選擇計算）。\nEDU減去5點。';
				ReStr += '\n=======';
				break;
			case (newAge >= 20 && newAge <= 39):
				ReStr += '年齡調整：可做' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				break;
			case (newAge >= 40 && newAge <= 49):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				break;
			case (newAge >= 50):
				ReStr += '年齡調整：從STR、DEX或CON中減去' + Debuff + '點\n（從一，二或全部三項中選擇）\n（請自行手動選擇計算）。\nAPP減去' + AppDebuff + '點。進行' + EDUinc + '次EDU的成長擲骰。';
				ReStr += '\n=======';
				break;

			default:
				break;
		}
		for (let i = 1; i <= EDUinc; i++) {
			let EDURoll = rollbase.Dice(100);
			ReStr += '\n第' + i + '次EDU成長 → ' + EDURoll;

			let EDUplus = rollbase.Dice(10);
			ReStr += ' → 如果高於現有EDU，則成長' + EDUplus + '點';
		}
		const tempBuildLuck = [rollbase.BuildDiceCal('3d6*5'), rollbase.BuildDiceCal('3d6*5')]
		const tempLuck = [tempBuildLuck[0].match(/\d+$/), tempBuildLuck[1].match(/\d+$/)]
		if (newAge < 20) {
			ReStr += '\nＬＵＫ第一次：' + `${tempBuildLuck[0]} \nＬＵＫ第二次： ${tempBuildLuck[1]}`;
			ReStr += '\nＬＵＫ最終值：' + Math.max(...tempLuck);
		}
		else {
			ReStr += '\n=======\nＬＵＫ：' + `${tempBuildLuck[0]} `;
		}
		ReStr += '\n=======\n煤油燈特徵: 1D6&1D20 → ' + rollbase.Dice(6) + ',' + rollbase.Dice(20);
		return ReStr;
	}
}

const builder = new Build7Char();
builder.defaultBuiler(RandomBuilder);
builder.registerBuilder(RandomBuilder.pattern(), RandomBuilder);
builder.registerBuilder(XYZBuilder.pattern(), XYZBuilder);
builder.registerBuilder(AgeBuilder.pattern(), AgeBuilder);




