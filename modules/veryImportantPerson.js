"use strict";
const schema = require('./schema.js');
const checkMongodb = require('./dbWatchdog.js');
var viplevel;
const DIYmode = (process.env.DIY) ? true : false;
var viplevelCheckGroup = async function (groupID) {
    let rply = 0;
    if (!viplevel) {
        viplevel = await schema.veryImportantPerson.find({}).catch(error => console.error('vip #8 mongoDB error: ', error.name, error.reson));
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
        viplevel = await schema.veryImportantPerson.find({}).catch(error => console.error('vip #20 mongoDB error: ', error.name, error.reson));
    }
    var findUser = viplevel.find(function (item) {
        return item.id == userid && item.switch !== false; // 
    });
    rply = (findUser) ? findUser.level : 0;
    rply = (DIYmode) ? 5 : rply;
    return rply;
}
async function renew() {
    if (!checkMongodb.isDbOnline()) return;
    viplevel = await schema.veryImportantPerson.find({}).catch(error => {
        console.error('vip #30 mongoDB error: ', error.name, error.reson)
        checkMongodb.dbErrOccurs();
    });
}

//每10分鐘更新;
setInterval(renew, 10 * 60 * 1000);

module.exports = {
    viplevelCheckGroup: viplevelCheckGroup,
    viplevelCheckUser: viplevelCheckUser,
    renew: renew
}