"use strict";
const schema = require('./core-schema.js');
var viplevel;
var viplevelCheckGroup = async function (groupID) {
    let rply = '';
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findGP = viplevel.find(function (item) {
        return item.gpid == groupID; // 取得大於五歲的
    });
    console.log('findUser', findGP);
    rply = (findGP) ? findGP.level : 0;
    return rply;
}
var viplevelCheckUser = async function (userid) {
    let rply = '';
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findUser = viplevel.find(function (item) {
        return item.id == userid; // 取得大於五歲的
    });
    console.log('findUser', findUser);
    rply = (findUser) ? findUser.level : 0;
    return rply;
}

module.exports = {
    viplevelCheckGroup: viplevelCheckGroup,
    viplevelCheckUser: viplevelCheckUser
}