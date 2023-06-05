/**
 * @file candleDays.js
 * @description 檢查今天是否是指定日期，如果是的話，回傳指定的字串，否則回傳空字串，用於檢查是否需要顯示蠟燭，或是其他用途。
 * @example 在.env 中設定 CANDLE_DATES=2,14,🌷 12,25,🕯️
 * @example 在程式中使用：
 *          const candle = require('./modules/candleDays.js'); 
 *          candle.checker();
 * @example 以上設定會在每年的 6 月 4 日顯示蠟燭，2 月 14 日顯示🌷，12 月 25 日顯示🕯️
 * @example 日期格式為：月,日,顯示的字串，月和日必須為數字，顯示的字串可以不填，預設為🕯️
 * @example 日期之間以空白隔開，可以設定多個日期，例如：CANDLE_DATES=2,14,🌷 12,25,🕯️
 * 
 */

class CandleChecker {
    constructor() {
        this.monthDays = [
        ];
        this.importDates();
        const today = new Date();
        this.todayMonth = today.getMonth() + 1;
        this.todayDate = today.getDate();
        this.scheduleFunction()
        this.isCandleDay = false;
        this.checkForCandle();
    }

    checkForCandle() {
        for (const day of this.monthDays) {
            if (day.month === this.todayMonth && day.day === this.todayDate) {
                this.isCandleDay = true;
                break;
            }
        }
    }
    importDates() {
        process.env.CANDLE_DATES?.split(/\s+/).forEach((date) => {
            const [month, day, candle] = date.split(',');
            this.monthDays.push({ month: Number(month), day: Number(day), candle: candle || '🕯️' });
        })
    }

    checker() {
        if (this.isCandleDay) {
            return this.monthDays.find((day) => day.month === this.todayMonth && day.day === this.todayDate).candle || '🕯️';
        } else {
            return '';
        }
    }
    scheduleFunction() {
        const now = new Date(); // 當前日期和時間
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // 明天日期
        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000; // 距離明天 00:00 +1000 的毫秒數
        setTimeout(function () {
            this.scheduleFunction(); // 設定下一次定時任務
            this.updateToday(); // 更新今天的日期
            this.checkForCandle();// 檢查是否是指定日期，如果是的話，設定 this.isCandleDay 為 true
        }, msUntilMidnight); // 設定定時器等待到明天 00:00
    }
    updateToday() {
        const today = new Date();
        this.todayMonth = today.getMonth() + 1;
        this.todayDate = today.getDate();
    }
}

// 使用方法：
const candleChecker = new CandleChecker(); // 初始化
// 當日期改變後，使用此方法檢查今天是否是指定日期
exports.checker = () => candleChecker.checker();

