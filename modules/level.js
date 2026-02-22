if (!process.env.mongoURL) return;

const oneMinute = (process.env.DEBUG) ? 1 : 60_000;
const THIRTY_MINUTES = (process.env.DEBUG) ? 1 : 60_000 * 30;
const checkMongodb = require('./dbWatchdog.js');
const schema = require('./schema.js');
exports.rollbase = require('../roll/rollbase');

const retry = { number: 0, times: 0 };
let tempSwitchV2 = [{ groupid: '', SwitchV2: false }];

async function EXPUP(groupid, userid, displayname, displaynameDiscord, membercount, tgDisplayname, discordMessage) {
    if (!groupid) return;

    if (retry.number >= 10 && (Date.now() - retry.times) < THIRTY_MINUTES) return;
    if (retry.number >= 10) retry.number = 0;

    let reply = { text: '', status: '' };

    const filterSwitchV2 = tempSwitchV2.find(group => group.groupid == groupid);
    if (filterSwitchV2 && !filterSwitchV2.SwitchV2) return;
    if (!checkMongodb.isDbOnline()) return;

    const gpInfo = await schema.trpgLevelSystem.findOne({ groupid, SwitchV2: true }).cache(60).catch(error => {
        console.error('level #26 mongoDB error:', error.name, error.reason);
        checkMongodb.dbErrOccurs();
        retry.number++;
        retry.times = new Date();
        if (retry.number > 20 && !checkMongodb.isDbOnline()) {
            reply.respawn = true;
            return reply;
        }
    });

    if (!filterSwitchV2) {
        tempSwitchV2.push({ groupid, SwitchV2: gpInfo ? gpInfo.SwitchV2 : false });
    }

    if (!gpInfo || !gpInfo.SwitchV2) return;
    if (!checkMongodb.isDbOnline()) return;

    let userInfo = await schema.trpgLevelSystemMember.findOne({ groupid, userid }).cache(60).catch(error => {
        console.error('level #46 mongoDB error:', error.name, error.reason);
        checkMongodb.dbErrOccurs();
    });

    if (!userInfo) {
        await newUser(gpInfo, groupid, userid, displayname, displaynameDiscord, tgDisplayname);
        return;
    }

    userInfo.name = tgDisplayname || displaynameDiscord || displayname || '無名';
    if (userInfo.decreaseEXPTimes > 0) reply.status += "🧟‍♂️🧟‍♀️";
    if (userInfo.multiEXPTimes > 0) reply.status += "🧙‍♂️🧙‍♀️";
    if (userInfo.stopExp > 0) reply.status += "☢️☣️";

    if ((Date.now() - userInfo.LastSpeakTime) < oneMinute) return reply;

    if (userInfo.stopExp > 0) {
        userInfo.stopExp--;
        await userInfo.save();
        return reply;
    }

    let exp = await exports.rollbase.Dice(9) + 15;
    if (Number.isNaN(userInfo.decreaseEXPTimes)) userInfo.decreaseEXPTimes = 0;

    switch (true) {
        case (userInfo.decreaseEXPTimes > 0): {
            userInfo.EXP -= userInfo.decreaseEXP;
            userInfo.decreaseEXPTimes--;
            if (userInfo.decreaseEXPTimes === 0) userInfo.decreaseEXP = 1;
            break;
        }
        case (userInfo.multiEXPTimes > 0): {
            userInfo.EXP += userInfo.multiEXP ? exp * userInfo.multiEXP : exp;
            userInfo.multiEXPTimes--;
            if (userInfo.multiEXPTimes === 0) userInfo.multiEXP = 1;
            break;
        }
        default: {
            userInfo.EXP += exp;
            break;
        }
    }

    userInfo.LastSpeakTime = Date.now();
    let LVsumOne = Number(userInfo.Level) + 1;
    let levelUP = false;

    let newLevelExp = 5 / 6 * LVsumOne * (2 * LVsumOne * LVsumOne + 30 * LVsumOne) + 100;
    if (userInfo.EXP > newLevelExp) {
        userInfo.Level++;
        levelUP = true;
    }

    try {
        if (!checkMongodb.isDbOnline()) return;
        await userInfo.save();
    } catch (error) {
        console.error('mongodb #109 error', error);
        checkMongodb.dbErrOccurs();
    }

    if (gpInfo.HiddenV2 === false || !levelUP) return reply;

    reply.text = await returnTheLevelWord(gpInfo, userInfo, membercount, groupid, discordMessage);
    return reply;
}

async function returnTheLevelWord(gpInfo, userInfo, membercount, groupid, discordMessage) {
    let username = userInfo.name;
    let userlevel = userInfo.Level;
    let userexp = userInfo.EXP;
    let usermember_count = Math.max(membercount);

    let docMember = await schema.trpgLevelSystemMember.find({ groupid }).sort({ EXP: -1 }).catch(error => {
        console.error('level #120 mongoDB error:', error.name, error.reason);
        checkMongodb.dbErrOccurs();
    });

    let myselfIndex = docMember.map(members => members.userid).indexOf(userInfo.userid);
    let userRanking = myselfIndex + 1;
    let userRankingPer = Math.ceil(userRanking / usermember_count * 10_000) / 100 + '%';
    let userTitle = await checkTitle(userlevel, gpInfo.Title);

    let tempUPWord = gpInfo.LevelUpWord || "恭喜 {user.displayName}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！";
    if (/{user.displayName}/ig.test(tempUPWord)) {
        let userDisplayName = await getDisplayName(discordMessage) || username || "無名";
        tempUPWord = tempUPWord.replaceAll(/{user.displayName}/ig, userDisplayName);
    }

    return tempUPWord.replaceAll(/{user.name}/ig, username)
        .replaceAll(/{user.level}/ig, userlevel)
        .replaceAll(/{user.exp}/ig, userexp)
        .replaceAll(/{user.Ranking}/ig, userRanking)
        .replaceAll(/{user.RankingPer}/ig, userRankingPer)
        .replaceAll(/{server.member_count}/ig, usermember_count)
        .replaceAll(/{user.title}/ig, userTitle);
}

async function newUser(gpInfo, groupid, userid, displayname, displaynameDiscord, tgDisplayname) {
    if (!checkMongodb.isDbOnline()) return;

    let temp = {
        userid,
        groupid,
        name: tgDisplayname || displaynameDiscord || displayname || '無名',
        EXP: await exports.rollbase.Dice(9) + 15,
        Level: 0,
        LastSpeakTime: Date.now()
    };

    await new schema.trpgLevelSystemMember(temp).save().catch(error => {
        console.error('level #144 mongoDB error:', error.name, error.reason);
        checkMongodb.dbErrOccurs();
    });
}

async function getDisplayName(message) {
    if (!message) return;
    const member = await message.guild.members.fetch(message.author);
    return member ? member.displayName : message.author.username;
}

const Title = function () {
    let Title = []
    Title[0] = "無名調查員";
    Title[3] = "雀";
    Title[4] = "調查員";
    Title[8] = "記者";
    Title[11] = "偵探";
    Title[13] = "小熊";
    Title[14] = "考古家";
    Title[18] = "神秘學家";
    Title[21] = "狂信徒";
    Title[24] = "教主";
    Title[28] = "眷族";
    Title[31] = "眷族首領";
    Title[33] = "南";
    Title[34] = "化身";
    Title[38] = "舊神";
    Title[41] = "舊日支配者";
    Title[43] = "門";
    Title[44] = "外神";
    Title[48] = "KP";
    Title[53] = "東";
    Title[54] = "作者";
    return Title;
}

const checkTitle = async function (userlvl, DBTitle) {
    let templvl = 0;
    let temptitle = "";

    if (DBTitle && DBTitle.length > 0) {
        for (const [g, element] of DBTitle.entries()) {
            if (userlvl >= g && templvl <= g && element) {
                templvl = g;
                temptitle = element;
            }
        }
    }

    if (!temptitle) {
        for (let g = 0; g < Title().length; g++) {
            if (userlvl >= g && templvl <= g && Title()[g]) {
                templvl = g;
                temptitle = Title()[g];
            }
        }
    }

    return temptitle;
}

module.exports = {
    EXPUP,
    tempSwitchV2
};