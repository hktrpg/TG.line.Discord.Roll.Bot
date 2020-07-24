"use strict";
const schema = require('./core-schema.js');
var viplevelCheck = async function (userid, limitArr) {
    const viplevelArr = [0, 3, 5, 10, 20, 99]

    let limit;
    let rply = ''
    let viplevel = await schema.veryImportantPerson.find({
        id: userid
    });
    if (!viplevel) {
        viplevel = 0
    }
    for (let i = 0; viplevel >= viplevelArr[i]; i++) {
        limit = limitArr[i];
    }

    let check = await schema.characterCard.find({
        id: userid
    });
    if (check.length >= limit) {
        rply = '你的角色卡上限為' + limit + '張' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
        return rply
    } else return rply
}

module.exports = {
    viplevelCheck
}