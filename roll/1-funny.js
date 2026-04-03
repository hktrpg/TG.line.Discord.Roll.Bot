"use strict";
let variables = {};
const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const axiosRetry = require('axios-retry');
const chineseConv = require('chinese-conv'); 
const axios = require('axios');
const cheerio = require('cheerio');
const wiki = require('wikijs').default;
const NodeCache = require('node-cache');
const schedule = require('node-schedule');

const identity = 'HKTRPG (https://www.hktrpg.com; admin@hktrpg.com) wiki.js';
const lunisolar = require('lunisolar');
const { fetalGod } = require('@lunisolar/plugin-fetalgod');
const { takeSound } = require('@lunisolar/plugin-takesound');
const { theGods } = require('@lunisolar/plugin-thegods');
const rollbase = require('./rollbase.js');
const wheelAnimator = require('./wheel-animator.js');
lunisolar.extend(fetalGod);
lunisolar.extend(takeSound);
lunisolar.extend(theGods);

const gameName = function () {
	return '【趣味擲骰】 排序(至少3個選項) choice/隨機(至少2個選項) 運勢 每日塔羅 每日笑話 每日動漫 每日一言 每日廢話 每日黃曆 每日毒湯 每日情話 每日靈簽 每日淺草簽 每日大事 每日(星座) 每日解答	立flag .me'
}

axiosRetry(axios, { retries: 3 });

/**
 * DailyCache class - Manages caching for all daily data
 */
class DailyCache {
	constructor() {
		this.cache = new NodeCache({ stdTTL: 86_400 }); // 24 hours TTL
		this.twelveAstro = new TwelveAstro();
		this.isInitialized = false;
	}

	/**
	 * Initialize cache - called when application starts
	 */
	async initialize() {
		if (this.isInitialized) return;

		try {
			// Load all data in parallel
			await Promise.all([
				this.updateAstroCache(),
				this.updateBigEventCache(),
				this.updateAlmanacCache()
			]);

			this.isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize daily cache:', error);
		}
	}

	/**
	 * Update astrology cache - prewarm today, tomorrow, and day-after-tomorrow data
	 */
	async updateAstroCache() {
		try {
			const today = this.twelveAstro.getDate();
			const tomorrow = this.twelveAstro.getTomorrowDate();
			const dayAfterTomorrow = this.twelveAstro.getDayAfterTomorrowDate();

			// Prewarm today's, tomorrow's, and day-after-tomorrow's astro data
			await Promise.all([
				this.updateAstroCacheForDate(today),
				this.updateAstroCacheForDate(tomorrow),
				this.updateAstroCacheForDate(dayAfterTomorrow)
			]);

			// Prewarm today's big event and almanac data
			await Promise.all([
				this.updateBigEventCache(),
				this.updateAlmanacCache()
			]);

			//console.log('Astro, big event, and almanac cache prewarmed for today, tomorrow, and day-after-tomorrow');
		} catch (error) {
			console.error('Failed to update astro cache:', error);
		}
	}

	/**
	 * Update astrology cache for specific date
	 */
	async updateAstroCacheForDate(date) {
		try {
			const astroData = {};
			for (const astro of twelveAstro) {
				const data = await this.twelveAstro.getAstro(astro, date, true); // force update for specific date
				if (data) {
					astroData[astro] = data;
				}
			}
			this.cache.set(`astro_${date}`, astroData);
		} catch (error) {
			console.error(`Failed to update astro cache for ${date}:`, error);
		}
	}

	/**
	 * Update big events cache
	 */
	async updateBigEventCache() {
		try {
			const bigEventData = await this.twelveAstro.getBigEvent(null, true); // force update
			if (bigEventData) {
				this.cache.set('bigEvent', bigEventData);
			}
		} catch (error) {
			console.error('Failed to update big event cache:', error);
		}
	}

	/**
	 * Update almanac cache
	 */
	async updateAlmanacCache() {
		try {
			const almanacData = await this.twelveAstro.getAlmanac(null, true); // force update
			if (almanacData) {
				this.cache.set('almanac', almanacData);
			}
		} catch (error) {
			console.error('Failed to update almanac cache:', error);
		}
	}

	/**
	 * Update almanac cache
	 */

	/**
	 * Get astrology data for today
	 */
	async getAstro(name) {
		const today = this.twelveAstro.getDate();
		let astroData = this.getAstroForDate(name, today);

		// If not in cache, fetch it asynchronously
		if (!astroData) {
			try {
				console.log(`Cache miss for ${name} on ${today}, fetching data...`);
				astroData = await this.twelveAstro.getAstro(name, today, false);
				console.log(`Successfully fetched astro data for ${name}`);
			} catch (error) {
				console.error(`Failed to fetch astro data for ${name}:`, error);
				return '獲取星座資料時發生錯誤，請稍後再試';
			}
		}

		return astroData;
	}

	/**
	 * Get big event data for today
	 */
	async getBigEvent() {
		const today = this.twelveAstro.getDate();
		let bigEventData = this.cache.get('bigEvent');

		// If not in cache, fetch it asynchronously
		if (!bigEventData) {
			try {
				console.log(`Cache miss for big event on ${today}, fetching data...`);
				bigEventData = await this.twelveAstro.getBigEvent(today, false);
				console.log(`Big event fetch result:`, bigEventData ? 'success' : 'null/empty');
				if (bigEventData) {
					this.cache.set('bigEvent', bigEventData);
					console.log(`Successfully cached big event data`);
				} else {
					console.log(`Big event data is empty, returning error`);
					return '獲取大事資料時發生錯誤，請稍後再試';
				}
			} catch (error) {
				console.error(`Failed to fetch big event data:`, error);
				return '獲取大事資料時發生錯誤，請稍後再試';
			}
		}

		return bigEventData;
	}

	/**
	 * Get astrology data for specific date
	 */
	getAstroForDate(name, date) {
		const astroData = this.cache.get(`astro_${date}`);
		return astroData ? astroData[name] : null;
	}


	/**
	 * Get almanac data for today
	 */
	async getAlmanac() {
		const today = this.twelveAstro.getDate();
		let almanacData = this.cache.get('almanac');

		// If not in cache, fetch it asynchronously
		if (!almanacData) {
			try {
				console.log(`Cache miss for almanac on ${today}, fetching data...`);
				almanacData = await this.twelveAstro.getAlmanac(today, false);
				if (almanacData) {
					this.cache.set('almanac', almanacData);
					console.log(`Successfully cached almanac data`);
				} else {
					console.log(`Almanac data is empty, returning error`);
					return '獲取黃曆資料時發生錯誤，請稍後再試';
				}
			} catch (error) {
				console.error(`Failed to fetch almanac data:`, error);
				return '獲取黃曆資料時發生錯誤，請稍後再試';
			}
		}

		return almanacData;
	}

	/**
	 * Setup daily update task
	 */
	setupDailyUpdate() {
		// Update day-after-tomorrow's data at 23:45-00:00, let TTL handle expiration
		// This ensures we always have data available for the next few days

		const updateDayAfterTomorrow = async () => {
			const dayAfterTomorrow = this.twelveAstro.getDayAfterTomorrowDate();
			console.log(`Starting day-after-tomorrow astro cache update for ${dayAfterTomorrow}...`);
			await this.updateAstroCacheForDate(dayAfterTomorrow);
			// Also update tomorrow's big event and almanac data
			const tomorrow = this.twelveAstro.getTomorrowDate();
			console.log(`Starting tomorrow big event and almanac cache update for ${tomorrow}...`);
			await Promise.all([
				this.twelveAstro.getBigEvent(tomorrow, true),
				this.twelveAstro.getAlmanac(tomorrow, true)
			]);
			console.log(`Tomorrow big event and almanac cache update completed for ${tomorrow}`);
			console.log(`Day-after-tomorrow astro cache update completed for ${dayAfterTomorrow}`);
		};

		// Schedule updates from 23:45 to 00:00 every 20 seconds for day-after-tomorrow's data
		// This gives us 5 updates: 23:45:00, 23:45:20, 23:45:40, 23:46:00, 23:46:20
		let minute = 45;
		let second = 0;
		for (let i = 0; i < 5; i++) { // 5 updates to cover 23:45-00:00
			schedule.scheduleJob(`${second} ${minute} 23 * * *`, updateDayAfterTomorrow);
			second += 20;
			if (second >= 60) {
				second -= 60;
				minute += 1;
			}
		}
	}
}

const gameType = function () {
	return 'funny:funny:hktrpg'
}
const prefixs = function () {
	return [{
		first: /^排序|排序$|^隨機|隨機$|^choice|^\.wl|^每日塔羅|^時間塔羅|^大十字塔羅|立flag|運勢|鴨霸獸|^每日笑話$|^每日動漫$|^每日一言$|^每日廢話$|^每日黃曆$|^每日毒湯$|^每日情話$|^每日靈簽$|^每日淺草簽$|^每日大事$|^每日解答$|^每日白羊$|^每日牡羊$|^每日金牛$|^每日雙子$|^每日巨蟹$|^每日獅子$|^每日處女$|^每日天秤$|^每日天平$|^每日天蠍$|^每日天蝎$|^每日射手$|^每日人馬$|^每日摩羯$|^每日山羊$|^每日水瓶$|^每日寶瓶$|^每日雙魚$/i,
		second: null
	}]
}


const getHelpMessage = async function () {
	return `【🎲趣味擲骰系統】
╭────── 🎯隨機功能 ──────
│ 【選擇】choice/隨機
│ 　格式: (問題)(選項1)(選項2)...
│ 　示例: 隨機收到聖誕禮物 1 2 3
│ 
│ 【輪盤動畫】.wl /輪盤
│ 　格式: .wl 選項1 選項2 選項3...
│ 　示例: .wl 選項A 選項B 選項C
│ 　說明: 動畫轉盤抽選（Discord專用，最多12個選項）
│ 
│ 【排序】排序
│ 　格式: (問題)(選項1)(選項2)...
│ 　示例: 交換禮物排序 A君 B君 C君
│
│ 【複述】.me
│ 　格式: .me (句子)
│ 　示例: .me C君殺死了NPC村民！
├────── 🔮占卜系統 ──────
│ 【運勢】訊息包含「運勢」兩字即可
│ 　格式1: (目標)運勢 
│ 　格式2: 運勢 (目標1) (目標2) (目標3)...
│ 　說明: 若提供多個項目且項目名稱少於30字，將顯示多個結果，每行兩個，最多20個
│ 【塔羅】大十字塔羅/每日塔羅/時間塔羅
│ 【FLAG】訊息包含「立FLAG」即可
├────── 📅每日功能 ──────
│ 🎭 每日笑話 - 顯示趣味笑話
│ 💫 每日動漫 - 顯示動漫金句
│ 💭 每日廢話 (名字) - 產生專屬廢話
│ 💡 每日一言 - 顯示勵志金句
│ 📆 每日黃曆 - 查看今日宜忌
│ 🥣 每日毒湯 - 顯示毒雞湯
│ 💝 每日情話 - 顯示甜蜜情話
│ 🏮 每日靈簽 - 抽取觀音簽
│ 🎋 每日淺草簽 - 抽取淺草簽
│ 📜 每日大事 - 歷史上的今天
│ ❓ 每日解答 - 答案之書-解答你的疑問
│ 
│ 星座運程：
│ 　格式: 每日(星座)
│ 　示例: 每日白羊、每日金牛
╰──────────────`
}
const initialize = async function () {
	// Initialize daily data cache
	await dailyCache.initialize();
	// Setup daily update task
	dailyCache.setupDailyUpdate();
	return variables;
}

const rollDiceCommand = async function ({
	inputStr,
	mainMsg,
	displayname, displaynameDiscord, tgDisplayname
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	}
	//let result = {};
	//		if (trigger.match(/sort|排序/) != null && mainMsg.length >= 3) return exports.funny.SortIt(inputStr, mainMsg);
	// Choice command starts here
	//	if (trigger.match(/choice|隨機|選項|選1/) != null && mainMsg.length >= 3) return exports.funny.choice(inputStr, mainMsg); // Random choice or selection
	// Tarot command
	/*
	if (trigger.match(/tarot|塔羅牌|塔羅/) != null) {
		if (trigger.match(/^單張|^每日|^daily/) != null) return exports.funny.NomalDrawTarot(mainMsg[1], mainMsg[2]); // Default draw 79 cards
		if (trigger.match(/^時間|^time/) != null) return exports.funny.MultiDrawTarot(mainMsg[1], mainMsg[2], 1);
		if (trigger.match(/^大十字|^cross/) != null) return exports.funny.MultiDrawTarot(mainMsg[1], mainMsg[2], 2);
	}
	*/

	// FLAG command starts here
	//		if (trigger.match(/立flag|死亡flag/) != null) return exports.funny.BStyleFlagSCRIPTS(); // Death flags

	// Duck beast command starts here
	//		if (trigger.match(/鴨霸獸/) != null) return exports.funny.randomReply(); // Duck beast (character reference)
	//		if (trigger.match(/運勢/) != null) return exports.funny.randomLuck(mainMsg); // Fortune telling		
	/*猜拳指令
	if (trigger.match(/猜拳/) != null) {
	return RockPaperScissors(inputStr, mainMsg[1]);
	}
*/

	if (/^help$/i.test(mainMsg[1])) {
		rply.text = await this.getHelpMessage();
		rply.buttonCreate = ['隨機 跑團 溫習 打遊戲', '排序 A君 C君 F君 G君', '.re 簽到', '.re 1d100', '今日運勢', '每日塔羅', '立FLAG', '每日大事', '每日笑話', '每日廢話', '每日一言', '每日黃曆', '每日毒湯', '每日情話', '每日靈簽', '每日淺草簽', '每日動漫', '每日解答']
		return rply;
	}
	if (/^排序|排序$/i.test(mainMsg[0]) && (mainMsg.length >= 4)) {
		rply.text = SortIt(inputStr, mainMsg);
		return rply;
	}
	if (/^隨機|^choice|隨機$|choice$/i.test(mainMsg[0]) && (mainMsg.length >= 3)) {
		// Text version only
		rply.text = choice(inputStr, mainMsg);
		return rply;
	}
	if (/^\.wl$/i.test(mainMsg[0]) && (mainMsg.length >= 2)) {
		// Wheel animation version - .wl command (must have dot)
		if (!displaynameDiscord) {
			rply.text = '❌ 此功能僅在 Discord 環境下可用';
			return rply;
		}
		try {
			const array = inputStr.replace(mainMsg[0], '').trim().match(/\S+/ig);
			if (!array || array.length < 2) {
				rply.text = '❌ 至少需要2個選項\n💡 使用方式：.wl 選項1 選項2 選項3...';
				return rply;
			}
			// If too many options, fallback to text version
			const MAX_OPTIONS_FOR_ANIMATION = 12;
			if (array.length > MAX_OPTIONS_FOR_ANIMATION) {
				rply.text = `❌ 選項過多（${array.length}個），最多支援12個選項\n💡 使用文字版：隨機 ${array.join(' ')}`;
				return rply;
			}
			// If any option text is too long, fallback to text version
			const hasTooLongOption = array.some(opt =>
				wheelAnimator.effectiveTextLength(opt) > wheelAnimator.MAX_OPTION_EFFECTIVE_LENGTH
			);
			if (hasTooLongOption) {
				rply.text = `❌ 選項字數過多，已自動切換為文字版本\n💡 使用文字版：隨機 ${array.join(' ')}`;
				return rply;
			}

			// Select random option
			const selectedIndex = rollbase.Dice(array.length) - 1;
			
			// Generate wheel animation GIF - use optimized defaults
			const gifPath = await wheelAnimator.generateWheelGif(
				array,
				{}, // Use optimized defaults (1.5s, 10fps, 500px)
				selectedIndex
			);

			// Set file link for Discord
			if (!rply.fileLink) {
				rply.fileLink = [];
			}
			rply.fileLink.push(gifPath);
			rply.text = `🎲 **輪盤抽選**\n📋 [ ${array.join(' ')} ]\n🎯 結果：`;
			return rply;
		} catch (error) {
			console.error('[Funny] Wheel animation error:', error);
			rply.text = `❌ 動畫生成失敗：${error.message}\n💡 使用文字版：隨機 ${inputStr.replace(mainMsg[0], '').trim()}`;
			return rply;
		}
	}
	if (/^每日解答$/i.test(mainMsg[0])) {
		rply.text = dailyAnswerChoice(inputStr);
		return rply;
	}
	if (/塔羅/i.test(mainMsg[0])) {
		rply.quotes = true;
		if (mainMsg[0].match(/^每日塔羅/) != null)
			rply.text = NomalDrawTarot(mainMsg[1], mainMsg[2]); // Default draw 79 cards
		if (mainMsg[0].match(/^時間塔羅/) != null)
			rply.text = MultiDrawTarot(mainMsg[1], mainMsg[2], 1);
		if (mainMsg[0].match(/^大十字塔羅/) != null)
			rply.text = MultiDrawTarot(mainMsg[1], mainMsg[2], 2);
		rply.buttonCreate = ['每日塔羅', '時間塔羅', '大十字塔羅']
		return rply;
	}
	if ((/立flag$|^立flag/i.test(mainMsg[0]) && mainMsg[0].toString().match(/[\s\S]{1,25}/g).length <= 1)) {
		rply.text = BStyleFlagSCRIPTS();
		return rply;
	}
	if (/^鴨霸獸$/i.test(mainMsg[0])) {
		rply.text = randomReply();
		return rply;
	}
	if ((/運勢$|^運勢/i.test(mainMsg[0]) && mainMsg[0].toString().match(/[\s\S]{1,40}/g).length <= 1)) {
		rply.text = randomLuck(mainMsg);
		return rply;
	}
	if (/^每日笑話$/.test(mainMsg[0])) {
		rply.text = joke.getFunnyRandomResult();
		return rply;
	}
	if (/^每日動漫$/.test(mainMsg[0])) {
		rply.text = acg.getFunnyRandomResult();
		return rply;
	}
	if (/^每日一言$/.test(mainMsg[0])) {
		rply.text = slogan.getFunnyRandomResult();
		return rply;
	}
	if (/^每日黃曆$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAlmanac();
		return rply;
	}
	if (/^每日毒湯$/.test(mainMsg[0])) {
		rply.text = blackjoke.getFunnyRandomResult();
		return rply;
	}
	if (/^每日情話$/.test(mainMsg[0])) {
		rply.text = mlove.getFunnyRandomResult();
		return rply;
	}
	if (/^每日靈簽$/.test(mainMsg[0])) {
		rply.text = watchMusic.getRandomWatchMusic100()
		return rply;
	}
	if (/^每日淺草簽$/.test(mainMsg[0])) {
		rply.text = asakusa100.getRandomAsakusa100();
		return rply;
	}
	if (/^每日廢話$/.test(mainMsg[0])) {
		const name = mainMsg[1] || displaynameDiscord || tgDisplayname || displayname || '你';
		const req = DailyFuckUp.generateArticles(name);
		rply.text = req;
		return rply;
	}
	if (/^每日大事$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getBigEvent();
		return rply;
	}
	// Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
	if ((/^每日白羊$/.test(mainMsg[0]) || /^每日牡羊$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('牡羊');
		return rply;
	}
	if (/^每日金牛$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('金牛');
		return rply;
	}
	if (/^每日雙子$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('雙子');
		return rply;
	}
	if (/^每日巨蟹$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('巨蟹');
		return rply;
	}
	if (/^每日獅子$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('獅子');
		return rply;
	}
	if (/^每日處女$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('處女');
		return rply;
	}
	if ((/^每日天秤$/.test(mainMsg[0]) || /^每日天平$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('天秤');
		return rply;
	}
	if ((/^每日天蠍$/.test(mainMsg[0]) || /^每日天蝎$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('天蠍');
		return rply;
	}
	if ((/^每日射手$/.test(mainMsg[0]) || /^每日人馬$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('射手');
		return rply;
	}
	if ((/^每日摩羯$/.test(mainMsg[0]) || /^每日山羊$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('摩羯');
		return rply;
	}
	if ((/^每日水瓶$/.test(mainMsg[0]) || /^每日寶瓶$/.test(mainMsg[0]))) {
		rply.text = await dailyCache.getAstro('水瓶');
		return rply;
	}
	if (/^每日雙魚$/.test(mainMsg[0])) {
		rply.text = await dailyCache.getAstro('雙魚');
		return rply;
	}
}

class FunnyRandom {
	constructor(txt) {
		this.random = FunnyRandom.convertArray(txt);
	}
	static convertArray(txt) {
		const data = fs.readFileSync(txt, 'utf8').toString();
		return data.split('\n');
	}
	getFunnyRandomResult() {
		try {
			return this.random[rollbase.Dice(this.random.length) - 1];
		} catch (error) {
			console.error('Funny #330', error);
			return '出現問題，請以後再試';
		}
	}
}

/**
 * .ME
 */
// eslint-disable-next-line no-unused-vars
function me(inputStr) {
	return inputStr.replace(/^[.]re/i, '');
}

const twelveAstro = [
	'牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'
]

class TwelveAstro {
	constructor() {
		this.Astro = {}; // Date-based caching: { date: { astroCode: astroData } }
		this.BigEvent = {}; // Date-based caching for big events: { date: bigEventData }
		this.Almanac = {}; // Date-based caching for almanac: { date: almanacData }
	}

	/**
	 * Get astrology fortune
	 * @param {string} name - Astrology name
	 * @param {string} date - Date (optional, defaults to today)
	 * @param {boolean} forceUpdate - Whether to force update
	 */
	async getAstro(name, date = null, forceUpdate = false) {
		try {
			const targetDate = date || this.getDate();
			let astroCode = twelveAstro.indexOf(name);

			if (forceUpdate || !this.Astro[targetDate] || !this.Astro[targetDate][astroCode]) {
				await this.updateAstro(astroCode, targetDate);
			}

			if (this.Astro[targetDate] && this.Astro[targetDate][astroCode]) {
				return this.returnStr(this.Astro[targetDate][astroCode], name);
			} else return;
		} catch (error) {
			console.error('TwelveAstro getAstro error:', error);
			return;
		}
	}

	returnStr(astro, name) {
		return `今日${name}座運程(${astro.date})
你的幸運數字：${astro.TODAY_LUCKY_NUMBER}
你的幸運星座：${astro.TODAY_LUCKY_ASTRO}
短語：${astro.TODAY_WORD}${astro.TODAY_CONTENT}
	`;
	}

	async updateAstro(code, date) {
		let res = await axios.get(`https://astro.click108.com.tw/daily_${code}.php?iAstro=${code}&iType=0&iAcDay=${date}`);
		const $ = cheerio.load(res.data);

		if (!this.Astro[date]) {
			this.Astro[date] = {};
		}
		this.Astro[date][code] = new Astro($, date);
	}

	getDate() {
		let year = new Date().getFullYear();
		let month = ('0' + (new Date().getMonth() + 1)).slice(-2);
		let day = ('0' + new Date().getDate()).slice(-2);
		return `${year}-${month}-${day}`;
	}

	/**
	 * Get date string for tomorrow
	 */
	getTomorrowDate() {
		let tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		let year = tomorrow.getFullYear();
		let month = ('0' + (tomorrow.getMonth() + 1)).slice(-2);
		let day = ('0' + tomorrow.getDate()).slice(-2);
		return `${year}-${month}-${day}`;
	}

	/**
	 * Get date string for day after tomorrow
	 */
	getDayAfterTomorrowDate() {
		let dayAfterTomorrow = new Date();
		dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
		let year = dayAfterTomorrow.getFullYear();
		let month = ('0' + (dayAfterTomorrow.getMonth() + 1)).slice(-2);
		let day = ('0' + dayAfterTomorrow.getDate()).slice(-2);
		return `${year}-${month}-${day}`;
	}

	/**
	 * Get daily events
	 * @param {string} date - Date (optional, defaults to today)
	 * @param {boolean} forceUpdate - Whether to force update
	 */
	async getBigEvent(date = null, forceUpdate = false) {
		try {
			const targetDate = date || this.getDate();

			if (forceUpdate || !this.BigEvent[targetDate]) {
				await this.updateBigEvent(targetDate);
			}

			return this.BigEvent[targetDate] || null;
		} catch (error) {
			console.error('TwelveAstro getBigEvent error:', error);
			return '條目出錯';
		}
	}

	/**
	 * Update daily events data
	 * @param {string} date - Date
	 */
	async updateBigEvent(date) {
		const targetDate = new Date(date);
		const day = targetDate.getDate();
		const month = targetDate.getMonth() + 1;
		let respond = `${month}月${day}日\n\n`;

		// Retry logic for network failures
		let retries = 3;
		let lastError = null;

		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				const page = await wiki({
					headers: { 'User-Agent': identity },
					apiUrl: 'https://zh.wikipedia.org/w/api.php',
					setpagelanguage: "zh-hant",
					timeout: 10_000 // 10 second timeout
				}).page(`${month}月${day}日`);

				let temp = await page.content();
				let answerFestival = temp.find(v => {
					return v && v.title.match(/(节日)|(節日)|(习俗)|(假日)|(节假)/)
				});

				respond += `${(answerFestival && answerFestival.title) ? `${answerFestival.title}\n` : ''}${(answerFestival && answerFestival.content) ? `${answerFestival.content}\n` : ''}\n`

				let answerBig = temp.find(v => {
					return v && v.title.match(/(大事)/)
				});

				if (answerBig && answerBig.items) answerBig = answerBig.items;

				for (let index = 0; index < answerBig?.length; index++) {
					respond += `${answerBig[index].title}\n${answerBig[index].content}\n\n`
				}

				this.BigEvent[date] = chineseConv.tify(respond);
				return; // Success, exit retry loop

			} catch (error) {
				lastError = error;

				// If it's a timeout or network error, retry with exponential backoff
				if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
					if (attempt < retries - 1) {
						// Wait 10 seconds * (attempt + 1) for exponential backoff (10s, 20s, 30s)
						const waitTime = 10_000 * (attempt + 1);
						await new Promise(resolve => setTimeout(resolve, waitTime));
						continue;
					}
				}

				// For other errors or if we've exhausted retries, break
				break;
			}
		}

		// Handle final failure - only log after all retries failed
		if (lastError == 'Error: No article found') {
			this.BigEvent[date] = '沒有此條目';
		} else {
			console.error(`Daily events updateBigEvent failed after ${retries} retries, final error:`, lastError.message);
			this.BigEvent[date] = '條目出錯';
		}
	}

	/**
	 * Get almanac
	 * @param {string} date - Date (optional, defaults to today)
	 * @param {boolean} forceUpdate - Whether to force update
	 */
	async getAlmanac(date = null, forceUpdate = false) {
		try {
			const targetDate = date || this.getDate();

			if (forceUpdate || !this.Almanac[targetDate]) {
				await this.updateAlmanac(targetDate);
			}

			if (this.Almanac[targetDate]) {
				return this.returnAlmanacStr(this.Almanac[targetDate]);
			}
			return null;
		} catch (error) {
			console.error('TwelveAstro getAlmanac error:', error);
			return null;
		}
	}

	/**
	 * Format almanac output
	 * @param {Object} almanac - Almanac object
	 */
	returnAlmanacStr(almanac) {
		return `今日黃曆 - ${almanac.date}
${almanac.content}
	`;
	}

	/**
	 * Update almanac data
	 * @param {string} date - Date
	 */
	async updateAlmanac(date) {
		const targetDate = new Date(date);
		const now = new Date(targetDate); // Use the target date for calculations
		const lsr = lunisolar(now, { lang: 'zh' });
		const almanacDate = this.getAlmanacDate(targetDate);
		const content = this.buildContent(lsr, now);
		this.Almanac[date] = { date: almanacDate, content };
	}

	getAlmanacDate(d) {
		let year = d.getFullYear();
		let month = d.getMonth() + 1;
		let day = d.getDate();
		return `${year}年${month}月${day}日`;
	}

	buildContent(lsr, now) {
		const weekday = this.getWeekday(now);
		const westernZodiac = this.getWesternZodiac(now);
		const lunar = lsr.lunar;
		const lunarMonth = this.pad2(lunar.month);
		const isBig = lunar.isBigMonth ? '大' : '小';
		const lunarDay = this.pad2(lunar.day);
		const yearSB = lsr.char8.year;
		const monthSB = lsr.char8.month;
		const daySB = lsr.char8.day;
		const yearGanzhi = yearSB.toString();
		const monthGanzhi = monthSB.toString();
		const dayGanzhi = daySB.toString();
		const zodiac = this.branchToAnimal(yearSB.branch.name);
		const fetal = String(lsr.fetalGod || '');

		// Get takeSound information for year, month, and day
		const yearTakeSound = yearSB.takeSound;
		const monthTakeSound = monthSB.takeSound;
		const dayTakeSound = daySB.takeSound;
		const yearTakeSoundE5 = yearSB.takeSoundE5.toString();
		const monthTakeSoundE5 = monthSB.takeSoundE5.toString();
		const dayTakeSoundE5 = daySB.takeSoundE5.toString();

		const dutyGod = lsr.theGods.getDuty12God()?.name || '';
		const fiveElementStr = `${dayTakeSound} ${dutyGod}`.trim();
		const conflictBranch = daySB.branch.conflict;
		const conflictAnimal = this.branchToAnimal(conflictBranch.name);
		const conflictSB = lunisolar.SB.create((daySB.value + 6) % 60);
		const conflictGanzhi = conflictSB.toString();
		const shaDirection = this.getShaDirection(conflictBranch.name);
		const conflictStr = `沖${conflictAnimal}(${conflictGanzhi})煞${shaDirection}`;
		const goodGods = (lsr.theGods.getGoodGods('MD') || []).map(g => g.name).join(' ');
		const badGods = (lsr.theGods.getBadGods('MD') || []).map(g => g.name).join(' ');

		// Get acts by different types
		const goodsTongshu = (lsr.theGods.getGoodActs(1, false) || []).join(' ');
		const goodsYuyong = (lsr.theGods.getGoodActs(2, false) || []).join(' ');
		const goodsMin = (lsr.theGods.getGoodActs(3, false) || []).join(' ');

		const badsTongshu = (lsr.theGods.getBadActs(1, false) || []).join(' ');
		const badsYuyong = (lsr.theGods.getBadActs(2, false) || []).join(' ');
		const badsMin = (lsr.theGods.getBadActs(3, false) || []).join(' ');
		const hoursBlock = this.buildHourBlock(lsr);
		const luckDir = this.buildLuckDirection(lsr);
		return [
			`【農曆】：農曆${lunarMonth}月(${isBig})${lunarDay}日  `,
			`【星期】：${weekday}  【星座】：${westernZodiac}`,
			`【歲次】：${yearGanzhi}年 生肖屬${zodiac} ${monthGanzhi}月 ${dayGanzhi}日`,
			`【胎神】：${fetal}  【五行】：${fiveElementStr}執位 【沖煞】：${conflictStr}`,
			`【納音】：年${yearTakeSound}(${yearTakeSoundE5}) 月${monthTakeSound}(${monthTakeSoundE5}) 日${dayTakeSound}(${dayTakeSoundE5})`,
			luckDir ? `【吉神方位】：${luckDir}` : '',
			`---`,
			goodGods ? `【吉神宜趨】：${goodGods}` : '',
			goodsTongshu ? `【宜-通書六十事】：${goodsTongshu}` : '',
			goodsYuyong ? `【宜-御用六十七事】：${goodsYuyong}` : '',
			goodsMin ? `【宜-民用三十七事】：${goodsMin}` : '',
			`---`,
			badGods ? `【凶神宜忌】：${badGods}` : '',
			badsTongshu ? `【忌-通書六十事】：${badsTongshu}` : '',
			badsYuyong ? `【忌-御用六十七事】：${badsYuyong}` : '',
			badsMin ? `【忌-民用三十七事】：${badsMin}` : '',

			'—— 當日時辰時局 ——',
			hoursBlock
		].filter(Boolean).join('\n');
	}

	buildLuckDirection(lsr) {
		try {
			const allDirections = lsr.theGods.getAllLuckDirection();
			if (!Array.isArray(allDirections) || allDirections.length === 0) return '';
			return allDirections
				.map(item => {
					if (!Array.isArray(item) || item.length < 2 || !item[0] || !item[1]) return '';
					const d24 = item[0];
					const god = item[1];
					const dir = d24 && d24.direction ? d24.direction : '';
					const name = god && god.name ? god.name : '';
					return dir && name ? `${dir} ${name}` : '';
				})
				.filter(Boolean)
				.join('； ');
		} catch {
			return '';
		}
	}

	buildHourBlock(lsr) {
		let luckArr = [];
		let allHourGods = [];
		try { luckArr = lsr.theGods.getLuckHours(1) || []; } catch { luckArr = []; }
		try { allHourGods = lsr.theGods.getAllDayHourGods() || []; } catch { allHourGods = []; }
		let lines = [];
		for (let i = 0; i < 12; i++) {
			const start = (i * 2 + 23) % 24;
			const end = (start + 2) % 24;
			const label = `${this.pad2(start)}-${this.pad2(end)}${this.hourStemBranch(lsr, i)}`;
			const list = Array.isArray(allHourGods[i]) ? allHourGods[i] : [];
			const gods = list.filter(Boolean).map(g => g && g.name ? g.name : '').filter(Boolean).join(' ');
			const luck = luckArr[i] && luckArr[i] > 0 ? '吉' : '凶';
			lines.push(`【${label}】：${luck} ${gods ? gods : ''}`.trim());
		}
		return lines.join('\n');
	}

	hourStemBranch(lsr, hourIndex) {
		const branches = lunisolar.Branch.getNames();
		const stems = lunisolar.Stem.getNames();
		const dayStemIndex = lsr.char8.day.stem.value;
		const stemIdx = (dayStemIndex * 2 + hourIndex) % 10;
		return `${stems[stemIdx]}${branches[hourIndex]}`;
	}

	pad2(n) { return ('0' + n).slice(-2); }
	getWeekday(d) {
		const map = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
		return map[d.getDay()];
	}
	getWesternZodiac(d) {
		const m = d.getMonth() + 1, day = d.getDate();
		const z = [
			['摩羯座', 1, 19], ['水瓶座', 2, 18], ['雙魚座', 3, 20], ['牡羊座', 4, 19], ['金牛座', 5, 20], ['雙子座', 6, 21],
			['巨蟹座', 7, 22], ['獅子座', 8, 22], ['處女座', 9, 22], ['天秤座', 10, 23], ['天蠍座', 11, 22], ['射手座', 12, 21]
		];
		const cur = z[m - 1];
		if (day <= cur[2]) return cur[0];
		return z[(m % 12)][0];
	}
	branchToAnimal(branchName) {
		const map = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龍', 巳: '蛇', 午: '馬', 未: '羊', 申: '猴', 酉: '雞', 戌: '狗', 亥: '豬' };
		return map[branchName] || branchName;
	}
	getShaDirection(conflictBranchName) {
		switch (conflictBranchName) {
			case '申': case '子': case '辰': return '南';
			case '寅': case '午': case '戌': return '北';
			case '亥': case '卯': case '未': return '西';
			case '巳': case '酉': case '丑': return '東';
			default: return '';
		}
	}

}


class Astro {
	constructor($, date) {
		//TODAY_CONTENT
		this.TODAY_CONTENT = $('.TODAY_CONTENT').text().replaceAll('                ', '');
		this.TODAY_WORD = $('.TODAY_WORD').text();
		this.TODAY_LUCKY_NUMBER = this.matchImgUrl($, 0)
		this.TODAY_LUCKY_COLOR = this.matchImgUrl($, 1)
		this.TODAY_LUCKY_DIRECTION = this.matchImgUrl($, 2)
		this.TODAY_LUCKY_TIME = this.matchImgUrl($, 3)
		this.TODAY_LUCKY_ASTRO = this.matchImgUrl($, 4)
		this.date = date;
	}
	matchImgUrl($, num) {
		const LUCKY = $('.TODAY_LUCKY .LUCKY').text().match(/\S+/g);
		return LUCKY[num];

	}
}



// Create daily cache manager
const dailyCache = new DailyCache();

// Auto-initialize DailyCache when module is loaded
(async function autoInitialize() {
	try {
		await dailyCache.initialize();
	} catch (error) {
		console.error('Failed to auto-initialize DailyCache:', error);
	}
})();

// For backward compatibility, keep old instance names but actually use cache
const joke = new FunnyRandom('./assets/joke.txt');
const acg = new FunnyRandom('./assets/acg.txt');
const slogan = new FunnyRandom('./assets/slogan.txt');
const blackjoke = new FunnyRandom('./assets/blackjoke.txt');
const mlove = new FunnyRandom('./assets/mlove.txt');

class Asakusa100 {
	constructor() {
		this.Asakusa100 = [];
	}
	getRandomAsakusa100() {
		let random = Math.floor(Math.random() * (this.Asakusa100.length));
		return this.Asakusa100[random];
	}
	createAsakusa100() {
		const rawdata = fs.readFileSync('./assets/Asakusa100.json');
		const asakusa100 = JSON.parse(rawdata);
		this.Asakusa100 = asakusa100.json;
	}
}

const asakusa100 = new Asakusa100();
asakusa100.createAsakusa100();


class WatchMusic100 {
	constructor() {
	}
	getRandomWatchMusic100() {
		const random = ('00' + Math.floor(Math.random() * (100) + 1)).slice(-3);
		const WatchMusic = fs.readFileSync(`./assets/watchmusic100/觀音百籤${random}籤.htm`, 'utf8')
		const $ = cheerio.load(WatchMusic);
		let chance = '';
		$('tr > td').each((i, elem) => {
			chance = $(elem).text().includes('觀音一百籤') ? $(elem).text().replaceAll(/^\s+/g, '').replaceAll(/\s+\n/g, '\n') : chance;

		})
		return chance;
	}
}
const watchMusic = new WatchMusic100();


/**
 * Divination & Others
 */

function BStyleFlagSCRIPTS() {
	const rplyArr = ['\
「打完這仗我就回老家結婚（この戦いが終わったら、故郷に帰って結婚するんだ）」', '\
「打完這一仗後我請你喝酒」', '\
別怕！子彈還很多！', '\
「現在的我，已經戰無不勝了！（今の俺は、負ける気がしねぇ！）', '\
這裡是安全屋吧。', '\
「你、你要錢嗎！要什麼我都能給你！\n我可以給你更多的錢！」', '\
「做完這次任務，我就要結婚了。」', '\
「幹完這一票我就金盆洗手了。」', '\
「好想再試一次啊……」', '\
「已經沒什麼好害怕的了（もう何も恐くない）」', '\
「我一定會回來的（必ず帰る！）」', '\
「差不多該走了」', '\
「我只是希望你永遠不要忘記我。」', '\
「我只是希望能永遠和你在一起。」', '\
「啊啊…為什麼會在這種時候、想起了那些無聊的事呢？」', '\
「能遇見你真是太好了。」', '\
「我終於…為你們報仇了！」', '\
「他們佔盡優勢。」', '\
「等到一切結束後，我有些話想跟妳說！」', '\
「這段時間我過的很開心啊。」', '\
「待一切結束後記得還給我。」', '\
「真希望這份幸福可以永遠持續下去。」', '\
「這工作結束後我們兩人一起生活吧！」（この仕事が終わったら2人で暮らそう）', '\
「我們三個人要永永遠遠在一起！」', '\
「這是我女兒的照片，很可愛吧？」', '\
「請告訴他/她，我永遠愛他/她」', '\
「聽好，在我回來之前絕不要亂走動哦（いいか、俺が帰ってくるまでここを動くんじゃないぞ）」', '\
「要像一個乖孩子一樣等著我回來」', '\
「我去去就來（先に行って、すぐ戻るから）」', '\
「快逃！(逃げろう！/早く逃げろう！)」', '\
「對方只有一個人，大家一起上啊」', '\
「我就不信，這麼多人還殺不了他一個！」', '\
「幹，幹掉了嗎？（やったのか？）」', '\
「身體好輕」', '\
「可惡！你給我看著！（逃跑）」', '\
「躲在這裡就應該不會被發現了吧。」', '\
「我不會讓任何人死的。」', '\
「可惡！原來是這麼回事！」', '\
「嘛 反正以後還有很多機會問的。」', '\
「你的生命已經如風中殘燭。」', '\
「沒有手牌場上也沒卡，你還想要贏嗎？」', '\
「跑這麼遠應該就行了。」', '\
「我已經甚麼都不怕了（もう何も恐くない）」', '\
「這東西是什麼，怎麼之前沒見過（なんだこのXXX、見たことないな）」', '\
「什麼聲音……？就去看一下吧（:「何の音だ？ちょっと見てくる」', '\
「是我的錯覺嗎？可能是我看錯了」', '\
「成功了嗎！？」', '\
「二十年後又是一條好漢！」', '\
「大人武運昌隆」', '\
「這次工作的報酬是以前無法比較的（「今度の仕事でまとまったカネが入るんだ」）', '\
「我才不要和罪犯呆在一起，我回自己的房間去了！（この中に殺人者がいるかもしれないのに、一緒に居られるか!俺は自分の部屋に戻るぞ!）」', '\
「其實我知道事情的真相…犯人就是……」', '\
「我已經天下無敵了~~」', '\
「大人！這邊就交給小的吧，請快離開這邊吧」', '\
「這就是我們流派的最終奧義。這一招我只會演示一次，你看好了！」', '\
「誰敢殺我？」', '\
「從來沒有人能破解我這招。」', '\
「就算殺死也沒問題吧？」', '\
「看我塔下強殺！」', '\
「騙人的吧，我們不是朋友嗎？」', '\
「不需要大人出手，就交給在下吧」', '\
「原來只有這種水平嗎」', '\
「操縱一切的黑手其實就是！」', '\
「沒看過你呢，你是誰？」', '\
「外面怎麼這麼吵」', '\
「我老爸是....你有種就....」', '\
「戰鬥力只有五的渣渣。」', '\
「我真是HIGH到不行了啊！」', '\
「嗯？鞋帶斷了。」', '\
「這一招我只會演示一次，你看好了！」', '\
「過了明天就沒事了。」', '\
「我出門了。」', '\
「你能走到這裡很了不起……」', '\
「給我打，打出事來我負責」', '\
「我已經不是那個一無所知的我了！」', '\
「明天我會把所有事全部告訴你……」', '\
「只要擊敗你們兩個，剩下的就很容易解決。」', '\
「我會變得比任何人都強，一生保護你。」', '\
「你可以繼承這裡嗎，這孩子也說喜歡你。」', '\
「打倒了！他死掉了！」', '\
「來戰個痛快，我和你最後的戰鬥！！」', '\
「我看你是個分身或是什麼類似東西吧。」', '\
「謝謝你，你讓我感到我不是孤單一人。」', '\
「我先去死了，你儘管加油。」', '\
「這次任務輕輕鬆鬆，訓練時辛苦多了！」', '\
「我的這把刀可是塗滿了毒藥的毒刃！」\nhttp://takehana.cocolog-nifty.com/photos/uncategorized/2011/08/06/onesegpc_20110806_01041904.jpg', '\
「哈哈哈，今天又是幸運的一天，死裡逃生了！」', '\
「我花費一生的實驗終於完成了！」', '\
「什麼寺廟什麼神像，看我拆了它！」', '\
「世上怎會有鬼，都是吓小朋友啦。」', '\
「這個經過多重實驗，保證不會發生意外。」', '\
「大哥……哥……。」', '\
「大哥哥，一起玩吧。」', '\
「接下來將會說明規則。」\n「夠了，這種整人節目可以停了吧，我要走了。」', '\
「過不久我也要升級了！」', '\
「這是你的生日禮物，很有歷史價值的」', '\
「哇，好嘔心的液體！」', '\
「我已經死而無憾！」', '\
「好大件事呢，但這和我們也沒什麼關係。草」', '\
「回來後我會十倍奉還！」', '\
「雷達出現巨大的影子！」「雷達故障了吧。」', '\
「今天天氣真好，是適合出海的日子！」', '\
「雖然被怪物咬了一口，但只是皮外傷而已！」', '\
「隊長，這裡看到一個人影……」「喂喂？你說什麼」「……」', '\
「這裡很安全」「這下放心了！」', '\
「前輩會停住他，別怕，去吧！」', '\
「我要將我超過５年的感情告訴她！」', '\
「換人吧，你太無聊了。」', '\
「只要他們幸福就好，我從心底祝福他們。」', '\
「我可以好好利用這件事」', '\
「我打oo???」', '\
「會贏的」', '\
「是我們的勝利！」', '\
「畢竟我也不是吃素的」', '\
「有一個好消息和一個壞消息」', '\
「今天的風兒好喧囂啊 」', '\
「然而我拒絕 」', '\
「沒有人能在我的BGM裡打敗我」', '\
「你不是還有生命嗎 」', '\
「他超我鎧」', '\
「 我是，超級ooo」', '\
「戰鬥力只有5的渣渣」', '\
「這是我最後的波紋 」', '\
「區區oo送給你了 」', '\
「 完美的手牌  」', '\
「都是世界的錯」', '\
「我願分一半世界給你」', '\
「你叫吧，你叫破喉嚨也沒人會來救你」', '\
「你們先走我斷後」', '\
「好耶!」', '\
「祝你生日快樂」'
	];

	//	rply.text = rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
	return rplyArr[rollbase.Dice(rplyArr.length) - 1]
}

function randomReply() {
	const rplyArr = ['\
你們死定了呃呃呃不要糾結這些……所以是在糾結哪些？', '\
在澳洲，每過一分鐘就有一隻鴨嘴獸被拔嘴。 \n我到底在共三小。', '\
嗚噁噁噁噁噁噁，不要隨便叫我。', '\
幹，你這學不會的豬！', '\
嘎嘎嘎。', '\
wwwwwwwwwwwwwwwww', '\
為什麼你們每天都可以一直玩；玩就算了還玩我。', '\
好棒，整點了！咦？不是嗎？', '\
不要打擾我挖坑！', '好棒，誤點了！', '\
在南半球，一隻鴨嘴獸拍打他的鰭，他的嘴就會掉下來。 \n我到底在共三小。', '\
什麼東西你共三小。', '\
哈哈哈哈哈哈哈哈！', '\
一直叫，你4不4想拔嘴人家？', '\
一直叫，你想被淨灘嗎？', '\
幫主你也敢嘴？', '\
拔嘴的話，我的嘴巴會長出觸手，然後開花成四個花瓣哦 (´×`)', '\
看看我！！我體內的怪物已經這麼大了！！', '\
傳說中，凡是拔嘴過鴨嘴獸的人，有高機率在100年內死去。 \n我到底在共三小。', '\
人類每花60秒拔嘴，就減少一分鐘的壽命。 \n我到底在共三小。', '\
嘴被拔，就會掉。', '\
你在大聲什麼啦！！！！', '\
公道價，八萬一（伸手）。', '\
你的嘴裡有異音（指）', '\
幫主說，有人打你的左臉，你就要用肉食性猛擊咬斷他的小腿。'];
	//	rply.text = rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
	return rplyArr[rollbase.Dice(rplyArr.length) - 1];
}

function randomLuck(mainMsg) {
	const rplyArr = ['超吉', '超級上吉', '大吉', '吉', '中吉', '小吉', '吉', '小吉', '吉', '吉', '中吉', '吉', '中吉', '吉', '中吉', '小吉', '末吉', '吉', '中吉', '小吉', '末吉', '中吉', '小吉', '小吉', '吉', '小吉', '末吉', '中吉', '小吉', '凶', '小凶', '沒凶', '大凶', '很凶', '你不要知道比較好呢', '命運在手中,何必問我'];


	const isAllShort = mainMsg.every(msg => msg.length < 30);

	if (isAllShort && mainMsg.length > 1) {
		const limit = Math.min(mainMsg.length, 20);
		let result = '';

		for (let i = 0; i < limit; i += 2) {
			const luck1 = mainMsg[i] + ' ： ' + rplyArr[rollbase.Dice(rplyArr.length) - 1];

			if (i + 1 < limit) {
				const luck2 = mainMsg[i + 1] + ' ： ' + rplyArr[rollbase.Dice(rplyArr.length) - 1];
				result += luck1 + '\t' + luck2 + '\n';
			} else {
				result += luck1;
			}
		}

		return result;
	} else {
		return mainMsg[0] + ' ： ' + rplyArr[rollbase.Dice(rplyArr.length) - 1];
	}
}

/**
 * Tarot塔羅牌
 */
function MultiDrawTarot(text, text2, type) {
	let returnStr = '';
	let cards = rollbase.shuffleTarget(TarotList2);

	const formatText = (prefix, text, text2) => {
		return `${prefix}\n${text ? "；" + text : ""}${text2 ? " " + text2 : ""}`;
	};

	switch (type) {
		case 1:
			returnStr = formatText('【時間塔羅】/每日塔羅/大十字塔羅', text, text2);
			returnStr += `過去: ${cards[0]}\n現在: ${cards[1]}\n未來: ${cards[2]}\n`;
			break;
		case 2:
			returnStr = formatText('【大十字塔羅】/每日塔羅/時間塔羅', text, text2);
			returnStr += `現況: ${cards[0]}\n助力: ${cards[1]}\n目標: ${cards[2]}\n基礎: ${cards[3]}\n過去: ${cards[4]}\n未來: ${cards[5]}\n自我: ${cards[6]}\n環境: ${cards[7]}\n恐懼: ${cards[8]}\n結論: ${cards[9]}\n`;
			break;
		default:
			break;
	}
	return returnStr;
}


function NomalDrawTarot(text, text2) {
	let returnStr = '';
	returnStr = '【每日塔羅】/大十字塔羅/時間塔羅'
	returnStr += `${text ? "\n；" + text : ""}${text2 ? " " + text2 : ""}`
	let ans = rollbase.shuffleTarget(TarotList)
	returnStr += '\n' + ans[0]
	return returnStr;
}


const TarotList = ["愚者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/00.jpg",
	"魔術師 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/01.jpg",
	"女祭司 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/02.jpg",
	"女皇 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/03.jpg",
	"皇帝 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/04.jpg",
	"教皇 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/05.jpg",
	"戀人 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/06.jpg",
	"戰車 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/07.jpg",
	"力量 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/08.jpg",
	"隱者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/09.jpg",
	"命運之輪 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/10.jpg",
	"正義 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/11.jpg",
	"吊人 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/12.jpg",
	"死神 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/13.jpg",
	"節制 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/14.jpg",
	"惡魔 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/15.jpg",
	"高塔 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/16.jpg",
	"星星 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/17.jpg",
	"月亮 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/18.jpg",
	"太陽 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/19.jpg",
	"審判 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/20.jpg",
	"世界 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/21.jpg",
	"愚者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/00-Re.jpg",
	"魔術師 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/01-Re.jpg",
	"女祭司 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/02-Re.jpg",
	"女皇 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/03-Re.jpg",
	"皇帝 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/04-Re.jpg",
	"教皇 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/05-Re.jpg",
	"戀人 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/06-Re.jpg",
	"戰車 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/07-Re.jpg",
	"力量 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/08-Re.jpg",
	"隱者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/09-Re.jpg",
	"命運之輪 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/10-Re.jpg",
	"正義 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/11-Re.jpg",
	"吊人 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/12-Re.jpg",
	"死神 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/13-Re.jpg",
	"節制 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/14-Re.jpg",
	"惡魔 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/15-Re.jpg",
	"高塔 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/16-Re.jpg",
	"星星 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/17-Re.jpg",
	"月亮 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/18-Re.jpg",
	"太陽 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/19-Re.jpg",
	"審判 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/20-Re.jpg",
	"世界 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/21-Re.jpg",
	"聖杯一 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_01.jpg",
	"聖杯二 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_02.jpg",
	"聖杯三 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_03.jpg",
	"聖杯四 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_04.jpg",
	"聖杯五 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_05.jpg",
	"聖杯六 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_06.jpg",
	"聖杯七 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_07.jpg",
	"聖杯八 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_08.jpg",
	"聖杯九 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_09.jpg",
	"聖杯十 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_10.jpg",
	"聖杯國王 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_KING.jpg",
	"聖杯騎士 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_KNIGHT.jpg",
	"聖杯侍者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_PAGE.jpg",
	"聖杯皇后 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_QUEEN.jpg",
	"錢幣一 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_01.jpg",
	"錢幣二 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_02.jpg",
	"錢幣三 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_03.jpg",
	"錢幣四 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_04.jpg",
	"錢幣五 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_05.jpg",
	"錢幣六 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_06.jpg",
	"錢幣七 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_07.jpg",
	"錢幣八 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_08.jpg",
	"錢幣九 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_09.jpg",
	"錢幣十 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_10.jpg",
	"錢幣國王 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_KING.jpg",
	"錢幣騎士 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_KNIGHT.jpg",
	"錢幣侍者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_PAGE.jpg",
	"錢幣皇后 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_QUEEN.jpg",
	"寶劍一 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_01.jpg",
	"寶劍二 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_02.jpg",
	"寶劍三 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_03.jpg",
	"寶劍四 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_04.jpg",
	"寶劍五 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_05.jpg",
	"寶劍六 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_06.jpg",
	"寶劍七 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_07.jpg",
	"寶劍八 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_08.jpg",
	"寶劍九 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_09.jpg",
	"寶劍十 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_10.jpg",
	"寶劍國王 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_KING.jpg",
	"寶劍騎士 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_KNIGHT.jpg",
	"寶劍侍者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_PAGE.jpg",
	"寶劍皇后 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_QUEEN.jpg",
	"權杖一 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_01.jpg",
	"權杖二 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_02.jpg",
	"權杖三 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_03.jpg",
	"權杖四 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_04.jpg",
	"權杖五 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_05.jpg",
	"權杖六 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_06.jpg",
	"權杖七 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_07.jpg",
	"權杖八 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_08.jpg",
	"權杖九 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_09.jpg",
	"權杖十 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_10.jpg",
	"權杖國王 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_KING.jpg",
	"權杖騎士 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_KNIGHT.jpg",
	"權杖侍者 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_PAGE.jpg",
	"權杖皇后 ＋\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_QUEEN.jpg",
	"聖杯一 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_01-Re.jpg",
	"聖杯二 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_02-Re.jpg",
	"聖杯三 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_03-Re.jpg",
	"聖杯四 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_04-Re.jpg",
	"聖杯五 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_05-Re.jpg",
	"聖杯六 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_06-Re.jpg",
	"聖杯七 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_07-Re.jpg",
	"聖杯八 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_08-Re.jpg",
	"聖杯九 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_09-Re.jpg",
	"聖杯十 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_10-Re.jpg",
	"聖杯國王 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_KING-Re.jpg",
	"聖杯騎士 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_KNIGHT-Re.jpg",
	"聖杯侍者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_PAGE-Re.jpg",
	"聖杯皇后 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/CUPS_QUEEN-Re.jpg",
	"錢幣一 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_01-Re.jpg",
	"錢幣二 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_02-Re.jpg",
	"錢幣三 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_03-Re.jpg",
	"錢幣四 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_04-Re.jpg",
	"錢幣五 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_05-Re.jpg",
	"錢幣六 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_06-Re.jpg",
	"錢幣七 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_07-Re.jpg",
	"錢幣八 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_08-Re.jpg",
	"錢幣九 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_09-Re.jpg",
	"錢幣十 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_10-Re.jpg",
	"錢幣國王 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_KING-Re.jpg",
	"錢幣騎士 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_KNIGHT-Re.jpg",
	"錢幣侍者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_PAGE-Re.jpg",
	"錢幣皇后 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/PANTA_QUEEN-Re.jpg",
	"寶劍一 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_01-Re.jpg",
	"寶劍二 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_02-Re.jpg",
	"寶劍三 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_03-Re.jpg",
	"寶劍四 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_04-Re.jpg",
	"寶劍五 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_05-Re.jpg",
	"寶劍六 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_06-Re.jpg",
	"寶劍七 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_07-Re.jpg",
	"寶劍八 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_08-Re.jpg",
	"寶劍九 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_09-Re.jpg",
	"寶劍十 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_10-Re.jpg",
	"寶劍國王 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_KING-Re.jpg",
	"寶劍騎士 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_KNIGHT-Re.jpg",
	"寶劍侍者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_PAGE-Re.jpg",
	"寶劍皇后 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/SWORDS_QUEEN-Re.jpg",
	"權杖一 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_01-Re.jpg",
	"權杖二 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_02-Re.jpg",
	"權杖三 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_03-Re.jpg",
	"權杖四 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_04-Re.jpg",
	"權杖五 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_05-Re.jpg",
	"權杖六 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_06-Re.jpg",
	"權杖七 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_07-Re.jpg",
	"權杖八 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_08-Re.jpg",
	"權杖九 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_09-Re.jpg",
	"權杖十 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_10-Re.jpg",
	"權杖國王 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_KING-Re.jpg",
	"權杖騎士 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_KNIGHT-Re.jpg",
	"權杖侍者 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_PAGE-Re.jpg",
	"權杖皇后 －\nhttps://raw.githubusercontent.com/hktrpg/TG.line.Discord.Roll.Bot/master/assets/tarot/WANDS_QUEEN-Re.jpg",
	"空白"
]

const TarotList2 = ["愚者 ＋",
	"魔術師 ＋",
	"女祭司 ＋",
	"女皇 ＋",
	"皇帝 ＋",
	"教皇 ＋",
	"戀人 ＋",
	"戰車 ＋",
	"力量 ＋",
	"隱者 ＋",
	"命運之輪 ＋",
	"正義 ＋",
	"吊人 ＋",
	"死神 ＋",
	"節制 ＋",
	"惡魔 ＋",
	"高塔 ＋",
	"星星 ＋",
	"月亮 ＋",
	"太陽 ＋",
	"審判 ＋",
	"世界 ＋",
	"聖杯一 ＋",
	"聖杯二 ＋",
	"聖杯三 ＋",
	"聖杯四 ＋",
	"聖杯五 ＋",
	"聖杯六 ＋",
	"聖杯七 ＋",
	"聖杯八 ＋",
	"聖杯九 ＋",
	"聖杯十 ＋",
	"聖杯國王 ＋",
	"聖杯騎士 ＋",
	"聖杯侍者 ＋",
	"聖杯皇后 ＋",
	"錢幣一 ＋",
	"錢幣二 ＋",
	"錢幣三 ＋",
	"錢幣四 ＋",
	"錢幣五 ＋",
	"錢幣六 ＋",
	"錢幣七 ＋",
	"錢幣八 ＋",
	"錢幣九 ＋",
	"錢幣十 ＋",
	"錢幣國王 ＋",
	"錢幣騎士 ＋",
	"錢幣侍者 ＋",
	"錢幣皇后 ＋",
	"寶劍一 ＋",
	"寶劍二 ＋",
	"寶劍三 ＋",
	"寶劍四 ＋",
	"寶劍五 ＋",
	"寶劍六 ＋",
	"寶劍七 ＋",
	"寶劍八 ＋",
	"寶劍九 ＋",
	"寶劍十 ＋",
	"寶劍國王 ＋",
	"寶劍騎士 ＋",
	"寶劍侍者 ＋",
	"寶劍皇后 ＋",
	"權杖一 ＋",
	"權杖二 ＋",
	"權杖三 ＋",
	"權杖四 ＋",
	"權杖五 ＋",
	"權杖六 ＋",
	"權杖七 ＋",
	"權杖八 ＋",
	"權杖九 ＋",
	"權杖十 ＋",
	"權杖國王 ＋",
	"權杖騎士 ＋",
	"權杖侍者 ＋",
	"權杖皇后 ＋",
	"愚者 －",
	"魔術師 －",
	"女祭司 －",
	"女皇 －",
	"皇帝 －",
	"教皇 －",
	"戀人 －",
	"戰車 －",
	"力量 －",
	"隱者 －",
	"命運之輪 －",
	"正義 －",
	"吊人 －",
	"死神 －",
	"節制 －",
	"惡魔 －",
	"高塔 －",
	"星星 －",
	"月亮 －",
	"太陽 －",
	"審判 －",
	"世界 －",
	"聖杯一 －",
	"聖杯二 －",
	"聖杯三 －",
	"聖杯四 －",
	"聖杯五 －",
	"聖杯六 －",
	"聖杯七 －",
	"聖杯八 －",
	"聖杯九 －",
	"聖杯十 －",
	"聖杯國王 －",
	"聖杯騎士 －",
	"聖杯侍者 －",
	"聖杯皇后 －",
	"錢幣一 －",
	"錢幣二 －",
	"錢幣三 －",
	"錢幣四 －",
	"錢幣五 －",
	"錢幣六 －",
	"錢幣七 －",
	"錢幣八 －",
	"錢幣九 －",
	"錢幣十 －",
	"錢幣國王 －",
	"錢幣騎士 －",
	"錢幣侍者 －",
	"錢幣皇后 －",
	"寶劍一 －",
	"寶劍二 －",
	"寶劍三 －",
	"寶劍四 －",
	"寶劍五 －",
	"寶劍六 －",
	"寶劍七 －",
	"寶劍八 －",
	"寶劍九 －",
	"寶劍十 －",
	"寶劍國王 －",
	"寶劍騎士 －",
	"寶劍侍者 －",
	"寶劍皇后 －",
	"權杖一 －",
	"權杖二 －",
	"權杖三 －",
	"權杖四 －",
	"權杖五 －",
	"權杖六 －",
	"權杖七 －",
	"權杖八 －",
	"權杖九 －",
	"權杖十 －",
	"權杖國王 －",
	"權杖騎士 －",
	"權杖侍者 －",
	"權杖皇后 －",
	"空白"
]

/**
 *  choice 及SORT
 */

function dailyAnswerChoice(input) {
	return input + ' \n→ ' + dailyAnswer[rollbase.Dice(dailyAnswer.length) - 1];
}
function choice(input, str) {
	let array = input.replace(str[0], '').match(/\S+/ig);
	return str[0] + ' [ ' + array.join(' ') + ' ] \n→ ' + array[rollbase.Dice(array.length) - 1];
}

function SortIt(input, mainMsg) {
	let a = input.replace(mainMsg[0], '').match(/\S+/ig);
	for (let i = a.length - 1; i >= 0; i--) {
		//let randomIndex = Math.floor(Math.random() * (i + 1));  
		//3 -> 210 , 10, 0
		let randomIndex = rollbase.Dice(i + 1) - 1
		//3 ->
		let itemAtIndex = a[randomIndex];
		a[randomIndex] = a[i];
		a[i] = itemAtIndex;
	}
	return mainMsg[0] + ' \n→ [ ' + a.join(', ') + ' ]';
}
const discordCommand = [

	{
		data: new SlashCommandBuilder()
			.setName('排序')
			.setDescription('進行隨機排序')
			.addStringOption(option => option.setName('text').setDescription('輸入所有內容，以空格分隔 如 排序 選項A 選項B 選項C').setRequired(true))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `排序 ${text}`

		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('隨機')
			.setDescription('進行隨機抽選')
			.addStringOption(option => option.setName('text').setDescription('輸入所有內容，以空格分隔 如 選項A 選項B 選項C').setRequired(true))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `隨機 ${text}`
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('choice')
			.setDescription('進行隨機抽選')
			.addStringOption(option => option.setName('text').setDescription('輸入所有內容，以空格分隔 如 選項A 選項B 選項C').setRequired(true))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `隨機 ${text}`
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('輪盤')
			.setDescription('進行輪盤Wheel動畫抽選（動畫版.wl）')
			.addStringOption(option => option.setName('text').setDescription('輸入所有選項，以空格分隔 如 選項A 選項B 選項C').setRequired(true))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `.wl ${text}`
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('運勢')
			.setDescription('查詢運勢')
			.addStringOption(option => option.setName('text').setDescription('可輸入單一或多個目標，多個目標以空格分隔，例如：TRPG 今日 跑團'))
		,
		async execute(interaction) {
			//to array

			const text = interaction.options.getString('text')?.trim()?.split(/\s+/)

			if (!text || text.length === 0) {
				return `運勢`
			} else if (text.length == 1) {
				return `${text[0]}運勢 `
			}
			else {
				return `${text[0]}運勢 ${text.slice(1).join(' ')}`
			}
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('塔羅')
			.setDescription('每日塔羅(單張)／時間塔羅／大十字塔羅 — 選擇種類後抽牌')
			.addStringOption(option =>
				option.setName('category')
					.setDescription('選擇：每日塔羅(單張)、時間塔羅、大十字塔羅')
					.setRequired(true)
					.addChoices(
						{ name: '每日塔羅(單張)', value: '每日塔羅' },
						{ name: '大十字塔羅', value: '大十字塔羅' },
						{ name: '時間塔羅', value: '時間塔羅' }))
		,
		async execute(interaction) {
			const category = interaction.options.getString('category')
			if (category !== null)
				return `${category}`
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('時間塔羅')
			.setDescription('過去、現在、未來三張牌（時間軸塔羅）'),
		async execute() {
			return '時間塔羅';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('每日塔羅')
			.setDescription('抽一張牌（單張每日塔羅）'),
		async execute() {
			return '每日塔羅';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('大十字塔羅')
			.setDescription('十張牌：現況、助力、目標、基礎、過去、未來、自我、環境、恐懼、結論（大十字）'),
		async execute() {
			return '大十字塔羅';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('立flag')
			.setDescription('立FLAG')
			.addStringOption(option => option.setName('text').setDescription('可選: 立什麼FLAG'))
		,
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `${text}立FLAG`
			else return `立FLAG`
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('每日')
			.setDescription('進行每日功能')
			.addSubcommand(subcommand =>
				subcommand
					.setName('星座')
					.setDescription('顯示每日星座運程')
					.addStringOption(option =>
						option.setName('star')
							.setDescription('哪個星座')
							.setRequired(true)
							.addChoices({ name: '白羊', value: '每日白羊' },
								{ name: '金牛', value: '每日金牛' },
								{ name: '巨蟹', value: '每日巨蟹' },
								{ name: '獅子', value: '每日獅子' },
								{ name: '雙子', value: '每日雙子' },
								{ name: '處女', value: '每日處女' },
								{ name: '天秤', value: '每日天秤' },
								{ name: '天蠍', value: '每日天蠍' },
								{ name: '射手', value: '每日射手' },
								{ name: '摩羯', value: '每日摩羯' },
								{ name: '水瓶', value: '每日水瓶' },
								{ name: '雙魚', value: '每日雙魚' }
							)))
			.addSubcommand(subcommand =>
				subcommand
					.setName('塔羅')
					.setDescription('抽一張牌（單張每日塔羅）'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('一言')
					.setDescription('顯示一條金句'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('毒湯')
					.setDescription('顯示一條有毒的雞湯'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('情話')
					.setDescription('顯示一條情話'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('靈簽')
					.setDescription('抽取一條觀音簽'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('淺草簽')
					.setDescription('抽取一條淺草簽'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('大事')
					.setDescription('顯示今天歷史上的大事'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('解答')
					.setDescription('答案之書-解答你的疑問'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('笑話')
					.setDescription('顯示一條笑話'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('動漫')
					.setDescription('顯示一條動漫金句'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('黃曆')
					.setDescription('顯示今日黃曆'))
			.addSubcommand(subcommand =>
				subcommand
					.setName('廢話')
					.setDescription('生產一條你或對像的廢話').addStringOption(option => option.setName('name').setDescription('可選: 對像的名字，留白則使用你的名字')))

		,
		async execute(interaction) {
			const category = interaction.options.getString('category')
			const name = interaction.options.getString('name') || '';
			const subcommand = interaction.options.getSubcommand()
			const star = interaction.options.getString('star')
			if (star !== null)
				return `${star}`
			if (subcommand !== null)
				return `每日${subcommand}${name ? ' ' + name : ''}`
			if (category !== null)
				return `${category}`
			return;
		}
	}
];



const DailyFuckUp = {
	randomSentence(list) {
		let row = Math.floor(Math.random() * list.length);
		return list[row];
	},

	randomNumber(min = 0, max = 100) {
		let number = Math.random() * (max - min) + min;
		return number;
	},

	genCelebrity() {
		let quotes = DailyFuckUp.randomSentence(DailyFuckUp.celebrityQuotes)
		quotes = quotes.replace("曾經說過", DailyFuckUp.randomSentence(DailyFuckUp.formerFuck))
		quotes = quotes.replace("這不禁令我深思", DailyFuckUp.randomSentence(DailyFuckUp.afterFuck))
		return quotes
	},

	genDiscuss(subject) {
		let sentence = DailyFuckUp.randomSentence(DailyFuckUp.discuss);
		sentence = sentence.replaceAll(RegExp("主題", "g"), subject);
		return sentence;
	},

	addParagraph(chapter) {
		if (chapter.at(-1) === " ") {
			chapter = chapter.slice(0, -2)
		}
		return "　　" + chapter + "。 "
	},

	generateArticles(subject) {
		let text = []
		let chapter = "";
		let chapterLength = 0;
		while (chapterLength < 300) {
			let num = DailyFuckUp.randomNumber();
			if (num < 5 && chapter.length > 200) {
				chapter = DailyFuckUp.addParagraph(chapter) + "\n";;
				text.push(chapter);
				chapter = "";
			} else if (num < 20) {
				let sentence = DailyFuckUp.genCelebrity();
				chapterLength = chapterLength + sentence.length;
				chapter = chapter + sentence;
			} else {
				let sentence = DailyFuckUp.genDiscuss(subject);
				chapterLength = chapterLength + sentence.length;
				chapter = chapter + sentence;
			}
		}
		chapter = DailyFuckUp.addParagraph(chapter);
		text.push(chapter);

		let result = text.join("\n\n").replace('。。', '。');
		return result;
	},

	discuss: [
		"現在，解決主題的問題，是非常非常重要的。 ",
		"主題的發生，到底需要如何做到，不主題的發生，又會如何產生。 ",
		"主題，到底應該如何實現。 ",
		"帶著這些問題，我們來審視一下主題。 ",
		"所謂主題，關鍵是主題需要如何寫。 ",
		"我們一般認為，抓住了問題的關鍵，其他一切則會迎刃而解。 ",
		"問題的關鍵究竟為何? ",
		"主題因何而發生?",
		"每個人都不得不面對這些問題。 在面對這種問題時， ",
		"一般來講，我們都必須務必慎重的考慮考慮。 ",
		"要想清楚，主題，到底是一種怎麼樣的存在。 ",
		"瞭解清楚主題到底是一種怎麼樣的存在，是解決一切問題的關鍵。 ",
		"就我個人來說，主題對我的意義，不能不說非常重大。 ",
		"本人也是經過了深思熟慮，在每個日日夜夜思考這個問題。 ",
		"主題，發生了會如何，不發生又會如何。 ",
		"在這種困難的抉擇下，本人思來想去，寢食難安。 ",
		"生活中，若主題出現了，我們就不得不考慮它出現了的事實。 ",
		"這種事實對本人來說意義重大，相信對這個世界也是有一定意義的。 ",
		"我們都知道，只要有意義，那麼就必須慎重考慮。 ",
		"在現今社會，一些重要的問題始終存在著。因此，我們需要關注這些問題並找到有效的解決方案。",
		"從長遠來看，我們必須重視某些問題的影響，因為它們可能對我們的未來產生深遠的影響。",
		"解決問題需要集中精力和全面的思考。只有這樣，才能找到最佳解決方案。",
		"我們必須從多個角度來看待問題，因為問題的解決通常不是單一的方法。",
		"無論面對什麼樣的問題，我們都必須保持冷靜和理性。只有這樣，我們才能找到最好的解決方案。",
		"看似簡單的問題，有時也可能是非常複雜的。因此，我們需要投入更多的時間和精力去理解問題。",
		"通過學習和經驗，我們可以增強解決問題的能力。這不僅可以幫助我們應對當前的問題，還可以使我們更好地應對未來的挑戰。",
		"尋找最佳解決方案需要勇氣和創造力。我們必須敢於嘗試新的思路和方法。",
		"某些問題可能會給我們帶來挑戰，但同時也可能帶來機會。我們需要善加利用這些機會，以創造更好的未來。",
		"在解決問題的過程中，我們需要充分了解問題的本質和原因，以確保我們找到的解決方案是可行的。",
		"解決問題需要有一個清晰的目標和計劃。只有這樣，我們才能更有效地實現我們的目標。",
		"面對困難和挑戰，我們必須堅持不懈，直到找到最佳解決方案。",
		"在解決問題的過程中，我們必須有耐心和毅力。只有這樣，我們才能成功地克服所有的障礙。",
		"綜觀主題的歷史，我們會發現，這是一個複雜且多變的問題。",
		"許多學者和專家已經對主題進行了深入的研究和分析，但仍有許多問題需要解決。",
		"與主題相關的議題越來越多，因此需要更多的研究和探討。",
		"對於主題的討論，人們常常持不同的觀點和看法，這使得解決問題變得更加困難。",
		"面對主題，我們必須採取有效的措施，才能解決問題。",
		"許多人對主題感到困惑和無助，需要更多的指導和支援。",
		"主題涉及的範圍非常廣泛，需要進一步細化和區分。",
		"對於主題的處理，我們需要更好地運用科技和創新，才能取得更好的效果。",
		"解決主題需要全社會的參與和努力，不能單靠某一個群體或個人的力量。",
		"主題所帶來的影響和後果是深遠的，必須慎重對待。",
	],

	celebrityQuotes: [
		"馬丁路德金曾經說過：黑夜雖然會延遲，但白天一定會到來。這不禁令我深思",
		"貝多芬曾經說過：人生就像一首交響樂，需要高低起伏才會有美妙的旋律。這不禁令我深思",
		"約翰·藍儂曾經說過：生命是發生在你身上的事情，當你忙於為其餘的東西而忘了它時，它就會溜走。這不禁令我深思",
		"艾倫·德珍尼斯曾經說過：生命中最困難的部分是不知道該怎麼做，而最容易的部分是知道該怎麼做卻不去做。這不禁令我深思",
		"奧斯卡·王爾德曾經說過：人生就像一場戲劇，演員們出場、扮演角色，但當燈光熄滅時，他們又得回到現實中來。這不禁令我深思",
		"約翰·華納克爾曾經說過：成功不是最終目的，失敗也不是致命的，勇氣繼續前進才是最重要的。這不禁令我深思",
		"亞伯拉罕·林肯曾經說過：你可以愛上你的工作，也可以恨你的工作，但你必須為它付出努力。這不禁令我深思",
		"比爾·蓋茨曾經說過：成功不是取決於你有多聰明，而是取決於你有多認真。這不禁令我深思",
		"納爾遜·曼德拉曾經說過：教育是改變世界的最強大的武器。這不禁令我深思",
		"史蒂夫·喬布斯曾經說過：你的工作將佔用你生命中大部分時間，為什麼不要做你熱愛的工作呢？這不禁令我深思",
		"伏爾泰曾經說過，不經巨大的困難，不會有偉大的事業。這不禁令我深思",
		"富勒曾經說過，苦難磨鍊一些人，也毀滅另一些人。這不禁令我深思",
		"文森特·皮爾曾經說過，改變你的想法，你就改變了自己的世界。這不禁令我深思",
		"拿破崙·希爾曾經說過，不要等待，時機永遠不會恰到好處。這不禁令我深思",
		"塞涅卡曾經說過，生命如同寓言，其價值不在與長短，而在與內容。這不禁令我深思",
		"奧普拉·溫弗瑞曾經說過，你相信什麼，你就成為什麼樣的人。這不禁令我深思",
		"呂凱特曾經說過，生命不可能有兩次，但許多人連一次也不善於度過。這不禁令我深思",
		"莎士比亞曾經說過，人的一生是短的，但如果卑劣地過這一生，就太長了。這不禁令我深思",
		"笛卡兒曾經說過，我的努力求學沒有得到別的好處，只不過是愈來愈發覺自己的無知。這不禁令我深思",
		"左拉曾經說過，生活的道路一旦選定，就要勇敢地走到底，決不回頭。這不禁令我深思",
		"米歇潘曾經說過，生命是一條艱險的峽谷，只有勇敢的人才能通過。這不禁令我深思",
		"吉姆·羅恩曾經說過，要麼你主宰生活，要麼你被生活主宰。這不禁令我深思",
		"日本諺語曾經說過，不幸可能成為通向幸福的橋樑。這不禁令我深思",
		"海貝爾曾經說過，人生就是學校。在那裡，與其說好的教師是幸福，不如說好的教師是不幸。這不禁令我深思",
		"杰納勒爾·喬治·S·巴頓曾經說過，接受挑戰，就可以享受勝利的喜悅。這不禁令我深思",
		"德謨克利特曾經說過，節制使快樂增加並使享受加強。這不禁令我深思",
		"裴斯泰洛齊曾經說過，今天應做的事沒有做，明天再早也是耽誤了。這不禁令我深思",
		"歌德曾經說過，決定一個人的一生，以及整個命運的，只是一瞬之間。這不禁令我深思",
		"卡耐基曾經說過，一個不注意小事情的人，永遠不會成就大事業。這不禁令我深思",
		"盧梭曾經說過，浪費時間是一樁大罪過。這不禁令我深思",
		"康德曾經說過，既然我已經踏上這條道路，那麼，任何東西都不應妨礙我沿著這條路走下去。這不禁令我深思",
		"克勞斯·莫瑟爵士曾經說過，教育需要花費錢，而無知也是一樣。這不禁令我深思",
		"伏爾泰曾經說過，堅持意志偉大的事業需要始終不渝的精神。這不禁令我深思",
		"亞伯拉罕·林肯曾經說過，你活了多少歲不算什麼，重要的是你是如何度過這些歲月的。這不禁令我深思",
		"韓非曾經說過，內外相應，言行相稱。這不禁令我深思",
		"富蘭克林曾經說過，你熱愛生命嗎？那麼別浪費時間，因為時間是組成生命的材料。這不禁令我深思",
		"馬爾頓曾經說過，堅強的信心，能使平凡的人做出驚人的事業。這不禁令我深思",
		"笛卡兒曾經說過，讀一切好書，就是和許多高尚的人談話。這不禁令我深思",
		"塞涅卡曾經說過，真正的人生，只有在經過艱難卓絕的鬥爭之後才能實現。這不禁令我深思",
		"易卜生曾經說過，偉大的事業，需要決心，能力，組織和責任感。這不禁令我深思",
		"歌德曾經說過，沒有人事先了解自己到底有多大的力量，直到他試過以後才知道。這不禁令我深思",
		"達爾文曾經說過，敢於浪費哪怕一個鐘頭時間的人，說明他還不懂得珍惜生命的全部價值。這不禁令我深思",
		"佚名曾經說過，感激每一個新的挑戰，因為它會鍛造你的意志和品格。這不禁令我深思",
		"奧斯特洛夫斯基曾經說過，共同的事業，共同的鬥爭，可以使人們產生忍受一切的力量。　這不禁令我深思",
		"蘇軾曾經說過，古之立大事者，不惟有超世之才，亦必有堅忍不拔之志。這不禁令我深思",
		"王陽明曾經說過，故立志者，為學之心也；為學者，立志之事也。這不禁令我深思",
		"歌德曾經說過，讀一本好書，就如同和一個高尚的人在交談。這不禁令我深思",
		"烏申斯基曾經說過，學習是勞動，是充滿思想的勞動。這不禁令我深思",
		"別林斯基曾經說過，好的書籍是最貴重的珍寶。這不禁令我深思",
		"富蘭克林曾經說過，讀書是易事，思索是難事，但兩者缺一，便全無用處。這不禁令我深思",
		"魯巴金曾經說過，讀書是在別人思想的幫助下，建立起自己的思想。這不禁令我深思",
		"培根曾經說過，合理安排時間，就等於節約時間。這不禁令我深思",
		"屠格涅夫曾經說過，你想成為幸福的人嗎？但願你首先學會吃得起苦。這不禁令我深思",
		"莎士比亞曾經說過，拋棄時間的人，時間也拋棄他。這不禁令我深思",
		"叔本華曾經說過，普通人只想到如何度過時間，有才能的人設法利用時間。這不禁令我深思",
		"博曾經說過，一次失敗，只是證明我們成功的決心還夠堅強。 維這不禁令我深思",
		"拉羅什夫科曾經說過，取得成就時堅持不懈，要比遭到失敗時頑強不屈更重要。這不禁令我深思",
		"莎士比亞曾經說過，人的一生是短的，但如果卑劣地過這一生，就太長了。這不禁令我深思",
		"俾斯麥曾經說過，失敗是堅忍的最後考驗。這不禁令我深思",
		"池田大作曾經說過，不要回避苦惱和困難，挺起身來向它挑戰，進而克服它。這不禁令我深思",
		"莎士比亞曾經說過，那腦袋裡的智慧，就像打火石裡的火花一樣，不去打它是不肯出來的。這不禁令我深思",
		"希臘曾經說過，最困難的事情就是認識自己。這不禁令我深思",
		"黑塞曾經說過，有勇氣承擔命運這才是英雄好漢。這不禁令我深思",
		"非洲曾經說過，最靈繁的人也看不見自己的背脊。這不禁令我深思",
		"培根曾經說過，閱讀使人充實，會談使人敏捷，寫作使人精確。這不禁令我深思",
		"斯賓諾莎曾經說過，最大的驕傲於最大的自卑都表示心靈的最軟弱無力。這不禁令我深思",
		"西班牙曾經說過，自知之明是最難得的知識。這不禁令我深思",
		"塞內加曾經說過，勇氣通往天堂，怯懦通往地獄。這不禁令我深思",
		"赫爾普斯曾經說過，有時候讀書是一種巧妙地避開思考的方法。這不禁令我深思",
		"笛卡兒曾經說過，閱讀一切好書如同和過去最傑出的人談話。這不禁令我深思",
		"鄧拓曾經說過，越是沒有本領的就越加自命不凡。這不禁令我深思",
		"愛爾蘭曾經說過，越是無能的人，越喜歡挑剔別人的錯兒。這不禁令我深思",
		"老子曾經說過，知人者智，自知者明。勝人者有力，自勝者強。這不禁令我深思",
		"歌德曾經說過，意志堅強的人能把世界放在手中像泥塊一樣任意揉捏。這不禁令我深思",
		"邁克爾·F·斯特利曾經說過，最具挑戰性的挑戰莫過於提升自我。這不禁令我深思",
		"愛迪生曾經說過，失敗也是我需要的，它和成功對我一樣有價值。這不禁令我深思",
		"羅素·貝克曾經說過，一個人即使已登上頂峰，也仍要自強不息。這不禁令我深思",
		"馬雲曾經說過，最大的挑戰和突破在於用人，而用人最大的突破在於信任人。這不禁令我深思",
		"雷鋒曾經說過，自己活著，就是爲了使別人過得更美好。這不禁令我深思",
		"布爾沃曾經說過，要掌握書，莫被書掌握；要為生而讀，莫為讀而生。這不禁令我深思",
		"培根曾經說過，要知道對好事的稱頌過於誇大，也會招來人們的反感輕蔑和嫉妒。這不禁令我深思",
		"莫扎特曾經說過，誰和我一樣用功，誰就會和我一樣成功。這不禁令我深思",
		"馬克思曾經說過，一切節省，歸根到底都歸結為時間的節省。這不禁令我深思",
		"莎士比亞曾經說過，意志命運往往背道而馳，決心到最後會全部推倒。這不禁令我深思",
		"卡萊爾曾經說過，過去一切時代的精華盡在書中。這不禁令我深思",
		"培根曾經說過，深窺自己的心，而後發覺一切的奇蹟在你自己。這不禁令我深思",
		"羅曼·羅蘭曾經說過，只有把抱怨環境的心情，化為上進的力量，才是成功的保證。這不禁令我深思",
		"孔子曾經說過，知之者不如好之者，好之者不如樂之者。這不禁令我深思",
		"達·芬奇曾經說過，大膽和堅定的決心能夠抵得上武器的精良。這不禁令我深思",
		"叔本華曾經說過，意志是一個強壯的盲人，倚靠在明眼的跛子肩上。這不禁令我深思",
		"黑格爾曾經說過，只有永遠躺在泥坑裡的人，才不會再掉進坑裡。這不禁令我深思",
		"普列姆昌德曾經說過，希望的燈一旦熄滅，生活剎那間變成了一片黑暗。這不禁令我深思",
		"維龍曾經說過，要成功不需要什麼特別的才能，只要把你能做的小事做得好就行了。這不禁令我深思",
		"郭沫若曾經說過，形成天才的決定因素應該是勤奮。這不禁令我深思",
		"洛克曾經說過，學到很多東西的訣竅，就是一下子不要學很多。這不禁令我深思",
		"西班牙曾經說過，自己的鞋子，自己知道緊在哪裡。這不禁令我深思",
		"拉羅什福科曾經說過，我們唯一不會改正的缺點是軟弱。這不禁令我深思",
		"亞伯拉罕·林肯曾經說過，我這個人走得很慢，但是我從不後退。這不禁令我深思",
		"美華納曾經說過，勿問成功的秘訣為何，且盡全力做你應該做的事吧。這不禁令我深思",
		"俾斯麥曾經說過，對於不屈不撓的人來說，沒有失敗這回事。這不禁令我深思",
		"阿卜·日·法拉茲曾經說過，學問是異常珍貴的東西，從任何源泉吸收都不可恥。這不禁令我深思",
		"白哲特曾經說過，堅強的信念能贏得強者的心，並使他們變得更堅強。 這不禁令我深思",
		"查爾斯·史考伯曾經說過，一個人幾乎可以在任何他懷有無限熱忱的事情上成功。 這不禁令我深思",
		"貝多芬曾經說過，卓越的人一大優點是：在不利與艱難的遭遇裡百折不饒。這不禁令我深思",
		"莎士比亞曾經說過，本來無望的事，大膽嘗試，往往能成功。這不禁令我深思",
		"卡耐基曾經說過，我們若已接受最壞的，就再沒有什麼損失。這不禁令我深思",
		"德國曾經說過，只有在人群中間，才能認識自己。這不禁令我深思",
		"史美爾斯曾經說過，書籍把我們引入最美好的社會，使我們認識各個時代的偉大智者。這不禁令我深思",
		"馮學峰曾經說過，當一個人用工作去迎接光明，光明很快就會來照耀著他。這不禁令我深思",
		"吉格·金克拉曾經說過，如果你能做夢，你就能實現它。這不禁令我深思",
	],

	afterFuck: ["這不禁令我深思。 ", "帶著這句話，我們還要更加慎重的審視這個問題： ", "這啟發了我， ", "我希望諸位也能好好地體會這句話。 ", "這句話語雖然很短，但令我浮想聯翩。 ", "無可否認，這句話帶給我們極大的啟示。", "我深深體會到這句話所蘊含的深意。", "這句話真正引起了我的共鳴。", "這句話不僅引發了我們的關注，也引起了我們的思考。", "我們需要認真對待這句話所提出的挑戰。", "這句話所傳達的信息絕對不容忽視。", "這句話令我們更加清晰地看到了問題的本質。", "這句話讓我們看到了問題的另一面。", "我深信這句話會成為我們思考的重要起點。", "我們必須從這句話中學到更多的東西。", "這句話能夠激發我們內心深處的共鳴。", "我們需要從這句話中學到一個重要的教訓。", "這句話引起了我們對問題的關注，也啟發了我們的思考。", "這句話不僅是一句警句，更是一個重要的提醒。", "這句話在我們思考的過程中發揮了重要的作用。", "這句話讓我們看到了一個全新的視角。", "這句話可以幫助我們更好地理解問題的本質。", "我們必須從這句話中吸取更多的智慧和啟示。", "這句話深刻地反映了現實的困境和挑戰。", "這句話讓我們更加明白了自己的不足之處。", "這句話揭示了問題的一個重要方面。", "這句話讓我們更加認識到自己的責任和使命。", "這句話提醒我們要時刻保持警醒和警覺。", "這句話讓我們更加堅定了自己的信念和決心。", "這句話可以幫助我們更好地理解自己和他人。", "這句話是一個重要的思想火花，可以引發更多的啟示。", "這句話可以幫助我們更好地理解自己的身份和使命。", "這句話讓我們更加明白了人生的真諦和意義。", "這句話可以激勵我們更加努力地工作和生活。", "這句話是一個非常寶貴的啟示和提醒。", "這句話讓我們看到了問題的一個新的方向和出路。", "這句話可以幫助我們更好地面對人生的挑戰和困境。", "這句話讓我們更加明白了自己的優點和不足。", "這句話是一個非常實用的工作和生活的指導原則。", "這句話可以幫助我們更好地理解人性和社會。", "這句話讓我們更加意識到自己的權利和義務。", "這句話讓我們更加了解了一個文化或一個國家的特點和價值觀。", "這句話可以啟發我們更多的創造力和想像力。", "這句話讓我們更加明白了生命的珍貴和脆弱。"],

	formerFuck: ["曾經說過", "在不經意間這樣說過", "事先聲明", "先說一聲", "需要先強調", "需要先說明", "需要先說明一下", "必須說明的是", "講過一個小故事", "討論過這問題", "曾經稍微講過背景", "曾經簡單提過一下", "談到這個話題", "想要先聲明的是", "在關於這個問題", "根據自己的經驗", "曾探討過這個議題", "在談論過這件事", "過交代過", "談到這個事情時，說過", "在進入正題前，曾說過", "關於這個話題，曾說過", "交代過一下", "說過自己的立場", "闡述過想法", "探討過這個問題", "談論過這個主題", "曾分析過", "提過，一下問題的重要性", "曾深入探討這個問題", "談到這個議題"],

};




const dailyAnswer = ["不一定", "需要別人的幫助", "需要慎重考慮", "相信你自己", "你是對的", "放棄吧", "聽聽別人的建議", "需要堅持", "不要放棄", "不要錯過機會", "會有轉機", "等待機會", "花更多時間來决定", "再多考慮", "你可能要放棄些東西", "考慮下別人的感受", "這事不靠譜", "別讓它影響到你", "做能讓你快樂的那個决定", "掃清障礙", "不要覺得憂慮", "主動一點", "時間會給你答案", "現在就開始", "別猶豫", "决定了就做", "顯而易見的結果", "保存實力", "時機還不成熟", "你需要掌握更多的信息", "去找個人傾訴", "你需要去探索真相", "把握機會", "决定了就堅持", "很麻煩2現在比以往任何時候的情况都要好", "重新思考", "列出原因", "期待一下,令人期待的事情馬上會發生", "培養一項新的愛好", "走容易走的路", "時間不對", "給自己點時間", "坦誠相告", "著眼未來", "信任", "別傻傻等待", "希望渺茫", "需要新的開始", "其實你已經有了答案", "聽聽別人的建議", "試著放棄", "不要猶豫", "趁早放棄", "再努力一些", "忘掉過去", "可以", "值得一試", "抓住機會", "不要嘗試", "聽長輩的建議", "不要堅持", "你可以的", "不靠譜", "打消念頭", "等待機會", "重新計劃", "重新開始", "擺脫現在的環境", "建議多次嘗試", "需要休息一下再决定", "冷靜思考再决定", "珍惜他或者她", "坦白一切", "努力一下", "主動出擊", "不要太主動", "冷靜處理", "謹慎做决定", "獨立面對", "從過去尋找答案", "多和家人溝通", "多和朋友溝通", "暗中觀察", "不太確定", "沒太大可能", "沒什麼把握", "學會放棄", "放弃這個念頭", "不值得一試", "風險很大", "不要再浪費時間", "做多重計劃", "再堅持一下", "不能繼續下去", "不會有結果", "結果不會讓你滿意", "結果出乎你的意料", "堅持就有結果", "付諸行動", "你會成功", "成功率很高", "沒問題", "耐心處理", "不要主動出擊", "好運馬上來了", "會有變化", "無濟於事", "是個好主意", "不太穩妥", "放空自己", "信任", "相信自己的判斷", "堅持就能看見真理", "會有轉折", "會有改變", "相信自己的第一直覺", "定下目標", "學會獨立思考", "學會捨得", "繼續前行", "不懼未來", "需要些時間", "還有更好的選擇", "不合適", "結果不理想", "抓住新的機會", "尋找新的機會", "尋找更好的方法", "聽取家人的建議", "接受它", "當面溝通", "多次嘗試", "你一定會成功", "可以確定是的", "不重要", "錯誤的想法", "爭取機會", "或許很難", "放心去嘗試", "沒有好結果", "花點時間處理", "堅持自己的想法", "多方面思考再决定", "別猶豫", "思考風險再决定", "有希望", "不要失去信心", "擺脫現在的關係", "十分困難", "需要一些準備", "需要條件", "改變自己再决定", "參考朋友的建議", "分享想法會有收穫", "不算是", "考慮全面", "非常肯定", "也許希望很小", "不是最佳選擇", "再找找別的辦法", "趁早放棄", "一定要堅持", "時間會改變一切", "充實自己再做决定", "從回憶中找答案", "不可以嘗試", "不要做讓自己後悔的事", "不做你會後悔", "抓緊行動", "機不可失", "等待好機會", "整理思路", "可以確定", "控制自己", "做充分準備", "需要好的建議", "幷沒有那麽好", "不是最好的選擇", "不要抱太大希望", "完全正確", "很遺憾", "這不是一個好辦法", "不能否認", "千真萬確", "一定是", "完全肯定", "尋找可能", "細心觀察", "勇於面對", "爲未來做打算", "背向而馳", "憑藉自己的直覺", "深思熟慮再决定", "不是唯一的選擇", "最好的選擇", "找個人給你點意見", "請教你媽媽", "誰說的准呢先觀望著", "把心踹懷裏", "答案在鏡子裏", "這事兒不靠譜", "天上要掉餡餅了", "有好運", "要有耐心", "你需要知道真相", "還有另一種情况", "觀望", "別讓他影響到你", "照你想做的那樣去", "但行好事莫問前程", "走容易走的路", "試試賣萌", "借助他人的經驗", "再多考慮", "機會稍縱即逝", "制定一個新計劃", "GO", "情况很快會發生變化", "轉移你的注意力", "告訴自己什麼是最重要的", "爲什麼不", "別傻等了", "不要忘記", "WHY", "NOT", "去解决", "尋找更多的選擇8上帝爲你關一扇門必定會爲你開一扇窗", "隨波逐流未必是好事", "問天問大地不如問問自己", "你就是答案", "去爭取機會", "改變不了世界就改變自己", "主動一點人生會大不相同", "學會妥協", "掌握更多信息", "相信你的最初想法", "勿忘初心方得始終", "掃清障礙", "把重心放在工作學習上", "培養一項新的愛好", "對他人慷慨", "去做其他的事情", "觀察形勢", "休息休息一會兒", "這是你最後的機會", "再考慮一下", "幷不明智", "等待更好的", "很快能解决", "重要", "去做", "不要過火", "事情開始變得有趣了", "保存你的實力", "不確定因素有點多", "結果不錯,你可能不得不放棄其他東西", "不要憂慮", "不需要", "去傾訴,告訴別人這對你意味著什麼", "無論你做何種選擇結果都是對的", "保持頭腦清醒", "克服困難", "實際一點", "你需要一點幫助", "協作", "尋找更多的選擇", "負責", "阻止", "你必須現在就行動", "遵守規則", "堅持", "需要花點時間", "你不會失望", "不要迫於壓力而改變初衷", "不要忽略身邊的人", "抗拒", "不值得鬥爭", "玩得開心就好", "毋庸置疑", "你也許會失望", "去改變", "一個强有力的承諾將會換回更好的結果", "也許有更好的解决方案", "不要害怕", "想法太對選擇太少", "一笑而過", "取决於你的選擇", "隨他去", "你需要考慮其他方面", "一年後就不那麽重要了", "醒醒吧別做夢了", "意義非凡", "默數十秒再問我", "去行動", "發揮你的想像力", "保持冷靜", "你必須彌補這個缺點", "你會後悔的", "毫無疑問", "當然", "現在比以往任何時候的情况都要好", "相信你的直覺", "這是一個機會", "去問你爸爸", "從來沒有", "尋找一個指路人", "去嘗試", "荒謬", "不賭", "不值得冒險", "不妥協", "關注你的家庭生活", "肯定", "不可預測", "絕對不", "我確定", "儘早完成,令人期待的事情馬上就要發生", "你需要適應", "表示懷疑", "它會帶來好運", "看看會發生什麼", "記錄下倆", "不宜在這個時候", "决定了就去做", "別要求太多", "放棄第一個方案", "Hold不住", "謹慎小心", "注意細節", "注意身後", "不要猶豫", "繼續前行", "情况很快會發生改變", "不要被情緒左右", "轉移注意力", "著眼未來", "問自己什麼是最重要的", "不要等了", "保持樂觀", "沒有更好的選擇", "你需要主動", "妥協", "有比這更重要的東西", "你需要掌握更多的信息", "删除記憶", "專注於你的工作", "你需要考慮其他的方面", "相信自己的直覺", "形勢不明", "先讓自己休息", "重新考慮", "不要做的太過分", "保持現狀/有意料之外的事會發生不妨等待", "花更多的時間來决定", "你開心就好", "有風險但也有機會", "算了吧", "當然咯", "千萬別傻,保持你的好奇心去挖掘真相", "把心揣懷裏", "時機不對", "照你想做的那樣去做", "量力而行", "拋棄首選方案", "最佳方案不一定可行", "注意細節", "說出來吧", "誰都不能保證", "不要陷得太深", "至關重要", "這是一定的", "不妨賭一把", "需要多思考一下", "這個問題確實不好回答", "其實都還不錯", "你認爲好的那個", "或許還沒有", "沒有足够的條件", "目前不滿足", "可以接受", "停止", "對比一下再决定", "勿忘初心", "不重要", "多讀書少思考", "放棄第一個選擇", "不該堅持", "學會放棄", "捨得才有機會獲得", "你是對的", "你值得這麽做", "沒有你想的那麽簡單", "不會更糟糕", "別騙自己", "想太多了", "睡一覺再决定", "不是最佳選擇", "不合適", "把注意力轉移一下", "不要强求", "時間會告訴你答案", "這件事不好回答", "要看你自己", "這個問題沒有答案", "你懂得，不用問我", "用心去做", "不能言傳", "改變自己", "無所謂", "全力以赴", "爭取早日擺脫", "顯而易見的道理", "沒有理由拒絕", "想想未來吧", "開心就好", "及時行樂", "看情况再說", "不聽老人言，吃虧在眼前", "無須多言", "熬過去就好", "一切都是好的", "是非難辨", "搞不清楚狀况", "不要太樂觀", "用心感受", "嗯", "明天就有變化", "等一周再說", "都可以", "都值得去做", "太早决定不好", "別懷疑自己", "你要果斷一些", "靜觀其變", "看起來不靠譜", "放輕鬆", "不想要就趁早放棄", "尋找新的開始", "都可以", "放下吧", "忽略別人的看法", "不需要解釋", "愛拼才會贏", "讓他、她知道", "其他選擇", "沒有意義", "你的答案在心裏", "換位思考", "嘗試新的生活", "接受它", "一切都是最好的安排", "完美", "不要放縱自己", "跟隨大衆的審美", "不太滿意的結果", "沒有更好的選擇", "堅持到底", "不要", "隨心所欲", "大膽去做", "聽人勸吃飽飯", "你還是不够努力", "不要欺騙自己", "注意細節", "珍惜現在", "讓別人替你分擔", "分享會有驚喜", "走下去", "淘汰它", "心誠則靈", "行與不行一試便知", "真心對待", "最後的决定", "二選一，選前者", "找人幫你做", "相信大家的眼光", "難得糊塗", "從現在開始努力", "回頭是岸", "求同存異", "或許還不是時候", "先苦後甜", "樹立信心再來一次", "過了這村沒這店", "運氣不佳不建議做", "別一條路走到黑", "別再委屈自己", "多看看外面的世界", "問下你們老師", "這是個問題嘛？", "無法回答", "相信科學", "少吃多動就會有收穫", "幹嘛想不開來笑一個", "誰也幫不了你", "瞭解自己的人會給你答案", "沒效果", "言多必失", "敞開心扉", "梳理一下再决定", "想想得了", "最後的疼愛是手放開", "別想那麽多沒用的", "沒用的", "不起作用", "適得其反", "空說無用", "沒什麼不妥", "長點心吧", "還有別的選擇嘛？", "別往心裏去", "控制自己", "今生無緣", "幸福快來了", "不是現在這個人、事、物", "再給自己一次機會", "未必適合你", "沒問題的", "不計得失方能成功", "愛幹嘛就幹嘛", "分散注意力", "緩解壓力繼續前行", "說多無益", "別膽少", "直接點", "只有你最清楚", "問問你閨蜜或基友", "看樣子是不行", "沒什麼差別", "摸著自己的胸再問一次", "親愛的那是不可能的", "反正也不會實現", "無所謂了", "試一次就知道", "別怕麻煩", "自己拿主意吧", "別人說的話隨便聽一聽", "我也幫不上忙", "和昨天一樣", "別忘了你的承諾", "恐怕來不及", "反復無常", "不要自討苦吃", "不要自討沒趣", "枉然", "取長補短", "不能硬來", "不明智的選擇", "犯不著", "理清頭緒答案就有了", "放輕鬆再問一遍", "你喜歡的就是好的", "如果有選擇我選第一個", "做自己喜歡的事", "很重要的事情要花點功夫", "對自己好一點", "愛惜自己", "沒有對比就沒有傷害", "醒醒吧", "不要輕易放棄", "浪費功夫", "依賴別人也不是辦法", "別人幫不了你", "沒有辦法感同身受", "不要好了傷疤忘了疼", "要矜持點", "簡單易行的方式", "找值得信賴的人諮詢", "少點套路", "什麼都沒有把握", "主意不錯哦", "要有野心", "好景不長", "不要自尋煩惱", "清理自己的過去", "提高自己", "誰也做不了你的主", "這個還真不好說", "給自己一點壓力", "別管對錯去做吧", "你需要點套路", "懶得想不如簡單點", "看開一點", "支持你", "不適合你的", "你這麽好看說什麼都對", "多讀書少提問", "活在當下", "別灰心再試一下", "沒有絕對的答案", "不存在優勢", "抓住重點", "這跟我沒關係", "好主意", "搞不定", "想想就好，別衝動", "鼓勵一下，你行滴", "無疑是一個好選擇", "看情况咯", "費盡心思也無濟於事", "性格不合", "試試賣萌、耍酷", "冷靜冷靜", "主動聯繫", "一包辣條壓壓驚", "痛苦的選擇", "離開", "顧及別人感受", "傻人有傻福", "一切從簡", "重新考慮一下", "千萬小心", "太天真", "別想太多啦", "忍一忍就過去了", "何必認真", "都是緣分", "提醒自己過去的事", "隨你吧", "這不重要吧", "你說對了呢", "仁者見仁智者見智", "無解", "是個謎", "無所謂", "不要反復果斷點", "不要感情用事", "放手一搏", "什麼都不用做", "轉機馬上到了", "要敢於直面現實", "改變不了自己，就放弃", "接受現狀", "可能不會有", "現實很殘酷", "不知道啊", "你一定是對的", "跟以前一樣", "還是老樣子", "不如讓自己開心一點", "糟糕", "猜不透就不猜", "別理睬", "忍", "陽光總在風雨後", "小心爲上", "不提也罷", "不該問我，問問自己", "想不通就明天再想", "問你身邊的异性", "問你身邊的朋友", "問你身邊的同性", "答案即將揭曉", "肯定沒戲", "別抱太大希望", "慢慢來", "不必在乎", "沒有準確答案", "如往常一樣", "沒什麼不妥", "安心去做", "抓緊實現", "你搞不定", "這個問題沒有答案", "需要找個專家問問", "樂觀面對", "不要做鴕鳥", "清醒地認識自己", "擺脫一切幹擾", "試試手氣重新來過", "別讓自己變得不像自己", "別著急，再好好想想", "問天問地不如問問自己", "毫無意義的事", "不要强加於人", "及時行樂", "與人溝通，會有收穫", "樂趣在於探索", "找不到相關的信息", "大膽提出建議", "無話可說", "別忘了自己的夢想", "說好的獨立解决呢", "拒絕回答一切問題", "不太想管你這種閑事", "安心的去做", "難道告訴你結果不妙嘛", "無聊的問題", "別人說的都對", "好人有好報", "祈禱一下，就會有奇迹", "不够虔誠，重新問一次", "不要騙自己", "很尷尬的局面", "沒必要堅持", "放手一搏", "換個角度思考", "神仙都幫不了你", "心靈鶏湯救不了你", "遠水救不了近火", "更多選擇更多歡笑", "軟硬兼施", "全面推進", "妥協吧", "只是時間問題罷了", "天時地利只欠人和", "等風來", "回家問你媽媽", "不一定是你滿意的結果", "强扭的瓜不甜", "真的未必能做到", "沒可能完成", "嘗試三次不行就撤", "誰說你不行，去他打", "你怎樣做都是錯,真理永遠掌握在少數人手中", "別猶豫加油做", "去吧，不然會後悔", "智者是不需要任何答案的", "反向思考", "淡定", "不知道", "找個人請教一下", "話聽三分", "你的地盤你做主", "這個問題太深奧", "决定了就去做"]

module.exports = {
	rollDiceCommand,
	initialize,
	getHelpMessage,
	prefixs,
	gameType,
	gameName,
	discordCommand
};