const schema = require('../schema');
const config = require('./config');
const validator = require('validator');

function isValidDiscordId(id) {
    return validator.isNumeric(id) && id.length === 18;
}

async function getVipCount(patreonId) {
    return await schema.veryImportantPerson.countDocuments({ setter: patreonId });
}

async function addVip(patreonId, targetId, level, type) {
    if (!isValidDiscordId(targetId)) throw new Error('Invalid Discord ID format');
    if (!Number.isInteger(level) || level < 1 || level > 5) throw new Error('Invalid VIP level');

    const count = await getVipCount(patreonId);
    const quota = config.tierQuotas[Math.min(3, tier)] || 0;
    if (count >= quota) throw new Error('VIP quota exceeded');

    const filter = type === 'group' ? { gpid: targetId } : { id: targetId };
    filter.setter = patreonId;

    await schema.veryImportantPerson.updateOne(filter, {
        $set: { level, switch: true, startDate: new Date(), setter: patreonId },
        $setOnInsert: { notes: 'Set by Patreon subscriber' }
    }, { upsert: true });
}

async function removeVip(patreonId, vipId) {
    await schema.veryImportantPerson.deleteOne({ _id: vipId, setter: patreonId });
}

async function getVipList(patreonId) {
    return await schema.veryImportantPerson.find({ setter: patreonId });
}

module.exports = { addVip, removeVip, getVipList, getVipCount };