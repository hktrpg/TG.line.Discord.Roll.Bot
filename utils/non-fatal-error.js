"use strict";

/**
 * Application bugs (e.g. "x is not a function") should be logged, not take down the process.
 * @param {unknown} reason
 * @returns {boolean}
 */
function isNonFatalApplicationError(reason) {
    if (!reason) return false;
    const name = reason.name || (reason.constructor && reason.constructor.name) || '';
    if (name === 'TypeError' || name === 'ReferenceError' || name === 'RangeError' || name === 'SyntaxError') {
        return true;
    }
    const errorMessage = reason.message || String(reason);
    return /is not a function|Cannot read propert|is not defined|Cannot set propert/i.test(errorMessage);
}

module.exports = {
    isNonFatalApplicationError
};
