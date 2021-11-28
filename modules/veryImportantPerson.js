"use strict";
const schema = require('./schema.js');
var viplevel;
const DIYmode = (process.env.DIY) ? true : false;
var viplevelCheckGroup = async function (groupID) {
    let rply = 0;
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findGP = viplevel.find(function (item) {
        return item.gpid == groupID && item.switch !== false;
    });
    rply = (findGP) ? findGP.level : 0;
    rply = (DIYmode) ? 5 : rply;
    return rply;
}
var viplevelCheckUser = async function (userid) {
    let rply = 0;
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({});
    }
    var findUser = viplevel.find(function (item) {
        return item.id == userid && item.switch !== false; // 
    });
    rply = (findUser) ? findUser.level : 0;
    rply = (DIYmode) ? 5 : rply;
    return rply;
}
async function renew() {
    viplevel = await schema.veryImportantPerson.find({});
}


setInterval(renew, 10 * 60 * 1000);

module.exports = {
    viplevelCheckGroup: viplevelCheckGroup,
    viplevelCheckUser: viplevelCheckUser,
    renew: renew
}