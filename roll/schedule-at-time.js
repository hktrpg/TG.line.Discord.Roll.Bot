"use strict";

const moment = require('moment');

/**
 * Parse .at time tokens.
 * Supports 5mins / 5hours / 5days, YYYYMMDD HHMM, and YYYYMMDDHHMM.
 */
function checkAtTime(first, second) {
    //const date = new Date(2012, 11, 21, 5, 30, 0);
    //const date = new Date(Date.now() + 5000);
    //   如 20220604 1900 或 202206041900 < 年月日 時間
    //5mins  (五分鐘後)
    //5hours (五小時後)
    switch (true) {
        case /^\d+mins$/i.test(first): {
            let time = first.match(/^(\d+)mins$/i)[1];
            if (time > 44_640) time = 44_640;
            if (time < 1) time = 1;
            time = moment().add(time, 'minute').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+hours$/i.test(first): {
            let time = first.match(/^(\d+)hours$/i)[1];
            if (time > 744) time = 744;
            if (time < 1) time = 1;
            time = moment().add(time, 'hour').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+days$/i.test(first): {
            let time = first.match(/^(\d+)days$/i)[1];
            if (time > 31) time = 31;
            if (time < 1) time = 1;
            time = moment().add(time, 'day').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d{12}$/i.test(first): {
            // .at 202608181129  (YYYYMMDDHHmm, 24h)
            let time = moment(first, "YYYYMMDDHHmm").toDate();
            return { time: time, threeColum: false };
        }
        case /^\d{8}$/i.test(first) && /^\d{4}$/i.test(second): {
            // .at 20260818 1129  (YYYYMMDD HHMM, 24h)
            let time = moment(`${first} ${second}`, "YYYYMMDD HHmm").toDate();
            return { time: time, threeColum: true };
        }
        default:
            break;
    }
}

module.exports = { checkAtTime };
