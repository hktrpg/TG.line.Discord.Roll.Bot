"use strict";
const schema = require('./core-schema.js');
var viplevel;
var viplevelCheckGroup = async function (groupID) {
    let rply = '';
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findGP = viplevel.find(function (item) {
        return item.gpid == groupID && item.switch !== false;
    });
    rply = (findGP) ? findGP.level : 0;
    return rply;
}
var viplevelCheckUser = async function (userid) {
    let rply = '';
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findUser = viplevel.find(function (item) {
        return item.id == userid && item.switch !== false; // 
    });
    rply = (findUser) ? findUser.level : 0;
    return rply;
}
async function renew() {
    viplevel = await schema.veryImportantPerson.find({});
}

module.exports = {
    viplevelCheckGroup: viplevelCheckGroup,
    viplevelCheckUser: viplevelCheckUser,
    renew: renew
}