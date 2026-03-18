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
const crypto = require('crypto');
const _DEFAULT_CANDLE = '🕯️';
const _ANIMALS = [
    '🐶汪汪', '🐱喵', '🐭吱吱', '🐰', '🦊', '🐻', '🐯', '🦁', '🐮', '🐷呠呠',
    '🐸呱呱', '🐒嘰嘰', '🐔', '🦆', '🐺', '🐝嗡嗡', '🐋🦈', '🦉', '🦄', '🦌呦呦',
    '🐘', '🦒', '🦓', '🐪', '🦏', '🦛', '🐅', '🐆', '🦘', '🐨',
    '🐼', '🦥', '🦦', '🦨', '🦔', '🐿️', '🐇', '🐁', '🐀', '🦇',
    '🐓咯咯', '🦃', '🦚', '🦜', '🐧', '🕊️', '🦅', '🦆嘎嘎', '🐦啾啾', '🐤嘰嘰',
    '🐣', '🐥', '🦢', '🦩', '🐍嘶嘶', '🦎', '🐢', '🐊', '🦴', '🐙',
    '🦑', '🦞', '🦀', '🐠', '🐟', '🐡', '🦈', '🐳噴水', '🐬', '🦭',
    '🐌慢慢', '🦋', '🐛', '🐜', '🐝嗡嗡', '🪲', '🕷️', '🦂', '🦟嗡嗡', '🪰嗡嗡'
];

class CandleChecker {
    static #instance = null;

    static getInstance(customDate = null) {
        if (!CandleChecker.#instance) {
            CandleChecker.#instance = new CandleChecker(customDate);
        }
        return CandleChecker.#instance;
    }

    static clearInstance() {
        CandleChecker.#instance = null;
    }

    constructor(customDate = null) {
        if (CandleChecker.#instance) {
            return CandleChecker.#instance;
        }
        CandleChecker.#instance = this;

        this.monthDays = [];
        this.today = {};
        this.customDate = customDate;
        this.timer = null;
        // Cache for today's candle to avoid repeated calculations
        this.todayCandleCache = null;
        this.currentYear = null;
        // Cache for April Fools animals to avoid repeated hash calculations
        this.aprilFoolsCache = new Map();
        this.aprilFoolsCacheMax = 10_000; // cap size to limit memory (one entry per user per year)

        this.#importDates();
        this.#updateToday();
        if (!customDate) {
            this.#scheduleFunction();
        }
        this.isCandleDay = false;
        this.todayCandle = '';
        this.#checkForCandle();
    }

    #validateDate(month, day) {
        if (month < 1 || month > 12) return false;
        const daysInMonth = new Date(2024, month, 0).getDate();
        return day >= 1 && day <= daysInMonth;
    }

    #checkForCandle() {
        // Single pass through monthDays to find matching date
        const matchingCandle = this.monthDays.find(({ month, day }) =>
            month === this.today.Month && day === this.today.Date
        );

        this.isCandleDay = !!matchingCandle;
        this.todayCandle = matchingCandle ? (matchingCandle.candle || _DEFAULT_CANDLE) : '';
        this.todayCandleCache = this.todayCandle;

        // console.log(`[CandleChecker] Today is ${this.today.Month}/${this.today.Date}, isCandleDay: ${this.isCandleDay}, candle: ${this.checker()}`);
    }

    #importDates() {
        this.monthDays = [];
        try {
            const dates = process.env.CANDLE_DATES?.split(/\s+/) || [];
            for (const date of dates) {
                const [month, day, candle] = date.split(',');
                const monthNum = Number(month);
                const dayNum = Number(day);

                if (!Number.isNaN(monthNum) && !Number.isNaN(dayNum) && this.#validateDate(monthNum, dayNum)) {
                    this.monthDays.push({
                        month: monthNum,
                        day: dayNum,
                        candle: candle || _DEFAULT_CANDLE
                    });
                } else {
                    console.warn(`[CandleChecker] Invalid date format: ${date}`);
                }
            }
        } catch (error) {
            console.error('[CandleChecker] Error importing dates:', error);
        }
    }

    #getAprilFoolsAnimal(userid) {
        if (!userid || typeof userid !== 'string') return '';
        try {
            // Get current year for consistent randomization within the same year
            const year = this.customDate ? this.customDate.getFullYear() : new Date().getFullYear();

            // Check cache first - key format: userid_year
            const cacheKey = `${userid}_${year}`;
            if (this.aprilFoolsCache.has(cacheKey)) {
                return this.aprilFoolsCache.get(cacheKey);
            }

            // Clear cache if year changed (keep memory usage reasonable)
            if (this.currentYear !== year) {
                this.aprilFoolsCache.clear();
                this.currentYear = year;
            }

            // Combine userid with year as you requested
            const seed = `${userid}${year}`;

            // Create hash and convert to integer
            const hash = crypto.createHash('md5').update(seed.slice(0, 30)).digest('hex');

            // Convert hex string to integer for modulo operation
            const hashInt = Number.parseInt(hash.slice(0, 8), 16);

            const animal = _ANIMALS[hashInt % _ANIMALS.length];

            // Cache the result
            this.aprilFoolsCache.set(cacheKey, animal);
            // Evict oldest entries if over cap (Map keeps insertion order)
            if (this.aprilFoolsCache.size > this.aprilFoolsCacheMax) {
                const toDelete = this.aprilFoolsCache.size - this.aprilFoolsCacheMax;
                const keys = [...this.aprilFoolsCache.keys()].slice(0, toDelete);
                for (const k of keys) this.aprilFoolsCache.delete(k);
            }

            return animal;
        } catch (error) {
            console.error('[CandleChecker] Error getting April Fools animal:', error);
            return '';
        }
    }

    checker(userid = null) {
        try {
            // Check if it's April 1st and userid is provided
            if (this.today.Month === 4 && this.today.Date === 1 && userid) {
                return this.#getAprilFoolsAnimal(userid);
            }
            // Use cached value if available
            return this.todayCandleCache !== null ? this.todayCandleCache : this.todayCandle;
        } catch (error) {
            console.error('[CandleChecker] Error in checker:', error);
            return '';
        }
    }

    #scheduleFunction() {
        try {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const msUntilMidnight = tomorrow.getTime() - now.getTime() + 5000;

            this.timer = setTimeout(() => {
                this.#scheduleFunction();
                this.#updateToday();
                this.#checkForCandle();
            }, msUntilMidnight);
        } catch (error) {
            console.error('[CandleChecker] Error scheduling function:', error);
        }
    }

    #updateToday() {
        try {
            const today = this.customDate || new Date();
            this.today = {
                Month: today.getMonth() + 1,
                Date: today.getDate()
            };
            // Reset cache when date changes
            this.todayCandleCache = null;
        } catch (error) {
            console.error('[CandleChecker] Error updating today:', error);
        }
    }

    // For testing purposes
    reset(customDate = null) {
        try {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.customDate = customDate;
            this.monthDays = [];
            this.todayCandleCache = null;
            this.aprilFoolsCache.clear();
            this.#importDates();
            this.#updateToday();
            this.#checkForCandle();
            if (!customDate) {
                this.#scheduleFunction();
            }
        } catch (error) {
            console.error('[CandleChecker] Error in reset:', error);
        }
    }

    // For testing purposes
    setDate(customDate) {
        try {
            this.customDate = customDate;
            this.#updateToday();
            this.#checkForCandle();
        } catch (error) {
            console.error('[CandleChecker] Error in setDate:', error);
        }
    }

    // For cleanup
    cleanup() {
        try {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.aprilFoolsCache.clear();
        } catch (error) {
            console.error('[CandleChecker] Error in cleanup:', error);
        }
    }
}

// Initialize singleton instance
let candleChecker = CandleChecker.getInstance();

// Export methods
exports.checker = (userid = null) => candleChecker.checker(userid);
exports.reset = (customDate = null) => {
    candleChecker.cleanup();
    // Clear the static instance for testing
    CandleChecker.clearInstance();
    candleChecker = CandleChecker.getInstance(customDate);
};
exports.setDate = (customDate) => candleChecker.setDate(customDate);
exports.cleanup = () => candleChecker.cleanup();

