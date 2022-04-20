"use strict";

const convertRegex = function (str = "", flags = '') {
    return new RegExp(str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"), flags);
};



module.exports = {
    convertRegex
};