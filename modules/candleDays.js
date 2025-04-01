/**
 * @file candleDays.js
 * @description 檢查今天是否是指定日期，如果是的話，回傳指定的字串，否則回傳空字串，用於檢查是否需要顯示蠟燭，或是其他用途。
 * @example 在.env 中設定 CANDLE_DATES=2,14,🌷 12,25,🕯️
 * @example 在程式中使用：
 *          const candle = require('../modules/candleDays.js'); 
 *          candle.checker();
 * @example 以上設定會在每年的 6 月 4 日顯示蠟燭，2 月 14 日顯示🌷，12 月 25 日顯示🕯️
 * @example 日期格式為：月,日,顯示的字串，月和日必須為數字，顯示的字串可以不填，預設為🕯️
 * @example 日期之間以空白隔開，可以設定多個日期，例如：CANDLE_DATES=2,14,🌷 12,25,🕯️
 * 
 */
const _DEFAULT_CANDLE = '🕯️';
const _ANIMALS = ['🐶汪汪', '🐱喵', '🐭吱吱', '🐰', '🦊', '🐻', '🐯', '🦁', '🐮', '🐷呠呠', '🐸呱呱', '🐒嘰嘰', '🐔', '🦆', '🐺', '🐝嗡嗡', '🐋🦈', '🦉', '🦄', '🦌呦呦'];

class CandleChecker {
    constructor(customDate = null) {
        this.monthDays = [];
        this.today = {};
        this.customDate = customDate;
        this.timer = null;
        this.#importDates();
        this.#updateToday();
        if (!customDate) {
            this.#scheduleFunction();
        }
        this.isCandleDay = false;
        this.todayCandle = '';
        this.#checkForCandle();
    }

    #checkForCandle() {
        this.isCandleDay = this.monthDays.some(({ month, day }) =>
            month === this.today.Month && day === this.today.Date
        )
        if (this.isCandleDay) {
            this.todayCandle = this.monthDays.find(({ month, day }) =>
                month === this.today.Month && day === this.today.Date
            ).candle || _DEFAULT_CANDLE;
        }
        else this.todayCandle = '';
        console.log(`[CandleChecker] Today is ${this.today.Month}/${this.today.Date}, isCandleDay: ${this.isCandleDay}, candle: ${this.checker()}`);
    }

    #importDates() {
        this.monthDays = [];
        process.env.CANDLE_DATES?.split(/\s+/).forEach((date) => {
            const [month, day, candle] = date.split(',');
            if (!isNaN(month) && !isNaN(day)) {
                this.monthDays.push({ month: Number(month), day: Number(day), candle: candle || _DEFAULT_CANDLE });
            }
        });
    }

    #getAprilFoolsAnimal(userid) {
        if (!userid) return '';
        let sum = 0;
        for (let i = 0; i < userid.length; i++) {
            sum += userid.charCodeAt(i);
        }
        return _ANIMALS[sum % _ANIMALS.length];
    }

    checker(userid = null) {
        // Check if it's April 1st and userid is provided
        if (this.today.Month === 4 && this.today.Date === 1 && userid) {
            return this.#getAprilFoolsAnimal(userid);
        }
        return this.todayCandle;
    }

    #scheduleFunction() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        const now = new Date(); // 當前日期和時間
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // 明天日期
        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 5000; // 距離明天 00:00 +1000 的毫秒數
        this.timer = setTimeout(() => {
            this.#scheduleFunction(); // 設定下一次定時任務
            this.#updateToday(); // 更新今天的日期
            this.#checkForCandle();// 檢查是否是指定日期，如果是的話，設定 this.isCandleDay 為 true
        }, msUntilMidnight); // 設定定時器等待到明天 00:00+5秒 後執行
    }

    #updateToday() {
        const today = this.customDate || new Date();
        this.today = {
            Month: today.getMonth() + 1,
            Date: today.getDate()
        }
    }

    // For testing purposes
    reset(customDate = null) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.customDate = customDate;
        this.monthDays = [];
        this.#importDates();
        this.#updateToday();
        this.#checkForCandle();
        if (!customDate) {
            this.#scheduleFunction();
        }
    }

    // For testing purposes
    setDate(customDate) {
        this.customDate = customDate;
        this.#updateToday();
        this.#checkForCandle();
    }

    // For cleanup
    cleanup() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

// 使用方法：
let candleChecker = new CandleChecker(); // 初始化

// 當日期改變後，使用此方法檢查今天是否是指定日期
exports.checker = (userid = null) => candleChecker.checker(userid);

// For testing purposes
exports.reset = (customDate = null) => {
    candleChecker.cleanup();
    candleChecker = new CandleChecker(customDate);
};

// For testing purposes
exports.setDate = (customDate) => {
    candleChecker.setDate(customDate);
};

// For cleanup
exports.cleanup = () => {
    candleChecker.cleanup();
};

