if (!process.env.mongoURL) return;
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
//60000 一分鐘多久可以升級及增加經驗
exports.rollbase = require('../roll/rollbase');
exports.z_Level_system = require('../roll/z_Level_system');
const schema = require('../modules/core-schema.js');
//trpgEventSystem
const opt = {
    upsert: true,
    runValidators: true
}




async function get(who, data) {

}







module.exports = {
    event
};