// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) return;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'oneMinuts'... Remove this comment to see the full error message
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
//60000 一分鐘多久可以升級及增加經驗
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkMongo... Remove this comment to see the full error message
const checkMongodb = require('./dbWatchdog.js');
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.rollbase = require('../roll/rollbase');
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const THIRTY_MINUTES = (process.env.DEBUG) ? 1 : 60000 * 30;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'retry'.
const retry = { number: 0, times: 0 };
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'tempSwitch... Remove this comment to see the full error message
let tempSwitchV2 = [{
    groupid: '',
    SwitchV2: false
}];
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'EXPUP'.
async function EXPUP(groupid: any, userid: any, displayname: any, displaynameDiscord: any, membercount: any, tgDisplayname: any, discordMessage: any) {
    if (!groupid) {
        return;
    }
    // @ts-expect-error TS(2339): Property 'number' does not exist on type 'number'.
    if (retry.number >= 10) {
        // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
        if ((new Date() - retry.times) < THIRTY_MINUTES)
            return;
        // @ts-expect-error TS(2339): Property 'number' does not exist on type 'number'.
        else retry.number = 0;
    }
    let reply = {
        text: '',
        statue: ''
    }
    const filterSwitchV2 = tempSwitchV2.find(function (group) {
        return group.groupid == groupid;
    });
    if (filterSwitchV2 && (filterSwitchV2.SwitchV2 === false)) return;
    if (!checkMongodb.isDbOnline()) return;
    const gpInfo = await schema.trpgLevelSystem.findOne({
        groupid: groupid,
        SwitchV2: true
    }).cache(60).catch((error: any) => {
        console.error('level #26 mongoDB error: ', error.name, error.reson)
        checkMongodb.dbErrOccurs();
        // @ts-expect-error TS(2339): Property 'number' does not exist on type 'number'.
        retry.number++;
        // @ts-expect-error TS(2339): Property 'times' does not exist on type 'number'.
        retry.times = new Date();
        if (retry > 20 && !checkMongodb.isDbOnline()) {
            // @ts-expect-error TS(2339): Property 'respawn' does not exist on type '{ text:... Remove this comment to see the full error message
            reply.respawn = true;
            return reply
        }
    });
    if (filterSwitchV2 === undefined) {
        if (!gpInfo || !gpInfo.SwitchV2) {
            tempSwitchV2.push({
                groupid: groupid,
                SwitchV2: false
            })
        }
        else
            tempSwitchV2.push({
                groupid: groupid,
                SwitchV2: gpInfo.SwitchV2
            })
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    if (!gpInfo || !gpInfo.SwitchV2) return;
    if (!checkMongodb.isDbOnline()) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    })
        .catch((error: any) => {
            console.error('level #46 mongoDB error: ', error.name, error.reson)
            checkMongodb.dbErrOccurs();
        });
    if (!userInfo) {
        await newUser(gpInfo, groupid, userid, displayname, displaynameDiscord, tgDisplayname);
        return;
    }
    userInfo.name = tgDisplayname || displaynameDiscord || displayname || '無名';
    (userInfo.decreaseEXPTimes > 0) ? reply.statue += "🧟‍♂️🧟‍♀️" : null;
    (userInfo.multiEXPTimes > 0) ? reply.statue += "🧙‍♂️🧙‍♀️" : null;
    (userInfo.stopExp > 0) ? reply.statue += "☢️☣️" : null;
    //4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加15+(1-9) 經驗值
    // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
    if ((new Date(Date.now()) - userInfo.LastSpeakTime) < oneMinuts) {
        return reply;
    }
    if (userInfo.stopExp > 0) {
        userInfo.stopExp--;
        await userInfo.save();
        return reply;
    }

    // @ts-expect-error TS(2304): Cannot find name 'exports'.
    let exp = (await exports.rollbase.Dice(9)) + 15;
    if (isNaN(userInfo.decreaseEXPTimes)) userInfo.decreaseEXPTimes = 0;
    switch (true) {
        case (userInfo.decreaseEXPTimes > 0):
            userInfo.EXP -= userInfo.decreaseEXP;
            userInfo.decreaseEXPTimes--;
            if (userInfo.decreaseEXPTimes == 0) {
                userInfo.decreaseEXP = 1;
            }
            break;
        case (userInfo.multiEXPTimes > 0):
            userInfo.EXP += (userInfo.multiEXP) ? exp * userInfo.multiEXP : exp;
            userInfo.multiEXPTimes--;
            if (userInfo.multiEXPTimes == 0) {
                userInfo.multiEXP = 1;
            }
            break;
        default:
            userInfo.EXP += exp;
            break;
    }
    userInfo.LastSpeakTime = Date.now();
    let LVsumOne = Number(userInfo.Level) + 1;
    let levelUP = false;
    //5. 檢查現LEVEL 需不需要上升. =5 / 6 * LVL * (2 * LVL * LVL + 27 * LVL )+ 91DD
    let newLevelExp = 5 / 6 * (LVsumOne) * (2 * (LVsumOne) * (LVsumOne) + 30 * (LVsumOne)) + 100;
    if (userInfo.EXP > newLevelExp) {
        userInfo.Level++;
        levelUP = true;
    }
    //8. 更新MLAB資料
    try {
        if (!checkMongodb.isDbOnline()) return;
        await userInfo.save();
    } catch (error) {
        console.error('mongodb #109 error', error);
        checkMongodb.dbErrOccurs();
    }

    //6. 需要 -> 檢查有沒有開啓通知
    if (gpInfo.HiddenV2 == false || levelUP == false) return reply;
    //1. 讀取LEVELUP語
    reply.text = await returnTheLevelWord(gpInfo, userInfo, membercount, groupid, discordMessage);
    return reply;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)


}

async function returnTheLevelWord(gpInfo: any, userInfo: any, membercount: any, groupid: any, discordMessage: any) {
    let username = userInfo.name;
    let userlevel = userInfo.Level;
    let userexp = userInfo.EXP;
    let usermember_count = Math.max(membercount);
    let docMember = await schema.trpgLevelSystemMember.find({
        groupid: groupid
    }).sort({
        EXP: -1
    }).catch((error: any) => {
        console.error('level #120 mongoDB error: ', error.name, error.reson)
        checkMongodb.dbErrOccurs();
    });
    let myselfIndex = docMember.map(function (members: any) {
        return members.userid;
    }).indexOf(userInfo.userid);

    let userRanking = myselfIndex + 1;
    let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
    let userTitle = await checkTitle(userlevel, gpInfo.Title);
    let tempUPWord = gpInfo.LevelUpWord || "恭喜 {user.displayName}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！";
    if (tempUPWord.match(/{user.displayName}/ig)) {
        let userDisplayName = (await getDisplayName(discordMessage)) || username || "無名";
        tempUPWord = tempUPWord.replace(/{user.displayName}/ig, userDisplayName)
    }
    return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle);
}


async function newUser(gpInfo: any, groupid: any, userid: any, displayname: any, displaynameDiscord: any, tgDisplayname: any) {
    if (!checkMongodb.isDbOnline()) return;
    //3. 沒有 -> 新增
    let temp = {
        userid: userid,
        groupid: groupid,
        name: tgDisplayname || displaynameDiscord || displayname || '無名',
        // @ts-expect-error TS(2304): Cannot find name 'exports'.
        EXP: (await exports.rollbase.Dice(9)) + 15,
        //EXP: math.floor(math.random() * 10) + 15,
        Level: 0,
        LastSpeakTime: Date.now()
    }
    await new schema.trpgLevelSystemMember(temp).save().catch((error: any) => {
        console.error('level #144 mongoDB error: ', error.name, error.reson);
        checkMongodb.dbErrOccurs();
    });
    return;
}

// @ts-expect-error TS(2393): Duplicate function implementation.
async function getDisplayName(message: any) {
    if (!message) return;
    const member = await message.guild.members.fetch(message.author)
    let nickname = member ? member.displayName : message.author.username;
    return nickname;
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Title'.
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

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkTitle... Remove this comment to see the full error message
const checkTitle = async function (userlvl: any, DBTitle: any) {
    let templvl = 0;
    let temptitle = ""
    if (DBTitle && DBTitle.length > 0) {
        for (let g = 0; g < DBTitle.length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && DBTitle[g]) {
                    templvl = g
                    temptitle = DBTitle[g];
                }
            }
        }
    }
    if (!temptitle)
        for (let g = 0; g < Title().length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && Title()[g]) {
                    templvl = g
                    temptitle = Title()[g];
                }
            }
        }
    return temptitle;
}
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    EXPUP,
    tempSwitchV2

};