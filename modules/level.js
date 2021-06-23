if (!process.env.mongoURL) return;
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
//60000 一分鐘多久可以升級及增加經驗
exports.rollbase = require('../roll/rollbase');
exports.z_Level_system = require('../roll/z_Level_system');
const schema = require('../modules/core-schema.js');
//trpgLevelSystem
const opt = {
    upsert: true,
    runValidators: true
}
async function EXPUP(groupid, userid, displayname, displaynameDiscord, membercount) {
    if (!groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = await schema.trpgLevelSystem.findOne({ groupid: groupid });
    if (!gpInfo || !gpInfo.Switch) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });

    if (!userInfo) {
        await newUser(gpInfo, groupid, userid, displayname, displaynameDiscord);
        return;
    }

    //4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加15+(1-9) 經驗值
    if ((new Date(Date.now()) - userInfo.LastSpeakTime) < oneMinuts) {
        return;
    }
    userInfo.name = displaynameDiscord || displayname || '無名';
    userInfo.EXP += await exports.rollbase.Dice(9) + 15;
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
    await userInfo.save();
    //6. 需要 -> 檢查有沒有開啓通知
    if (gpInfo.Hidden != 1 || levelUP == false) return;
    //1. 讀取LEVELUP語
    return await returnTheLevelWord(gpInfo, userInfo, membercount, groupid);
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)


}

async function returnTheLevelWord(gpInfo, userInfo, membercount, groupid) {
    let username = userInfo.name;
    let userlevel = userInfo.Level;
    let userexp = userInfo.EXP;
    let usermember_count = Math.max(membercount);
    let docMember = await schema.trpgLevelSystemMember.find({ groupid: groupid }).sort({ EXP: -1 });
    let myselfIndex = docMember.map(function (members, index) {
        return members.userid;
    }).indexOf(userInfo.userid);

    let userRanking = myselfIndex + 1;
    let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
    let userTitle = await exports.z_Level_system.checkTitle(userlevel, gpInfo.Title);
    let tempUPWord = gpInfo.LevelUpWord || "恭喜 {user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！";
    return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle);
}

async function uploadMongoose(groupid, userid, userInfo) {
    let v = await schema.trpgLevelSystem.findOneAndUpdate({
        groupid: groupid,
        'trpgLevelSystemfunction.userid': userid
    }, {
        $set: {
            'trpgLevelSystemfunction.$.name': userInfo.name,
            'trpgLevelSystemfunction.$.Level': userInfo.Level
        },
        $max: {
            'trpgLevelSystemfunction.$.EXP': userInfo.EXP,
            'trpgLevelSystemfunction.$.LastSpeakTime': userInfo.LastSpeakTime
        }
    }, opt)
    return v;
}

async function newUser(gpInfo, groupid, userid, displayname, displaynameDiscord) {
    //3. 沒有 -> 新增
    let temp = {
        userid: userid,
        groupid: groupid,
        name: displaynameDiscord || displayname || '無名',
        EXP: await exports.rollbase.Dice(9) + 15,
        //EXP: math.floor(math.random() * 10) + 15,
        Level: 0,
        LastSpeakTime: Date.now()
    }
    let v = await new schema.trpgLevelSystemMember(temp).save();
    console.log('v', v);
    return;
}

async function ranking(who, data) {
    let array = [];
    let answer = "0";
    for (let key in data) {
        await array.push(data[key]);
    }
    array.sort(function (a, b) {
        return b.EXP - a.EXP;
    });
    let rank = 1;
    for (let i = 0; i < array.length; i++) {
        if (i > 0 && array[i].EXP < array[i - 1].EXP) {
            rank++;
        }
        array[i].rank = rank;
    }
    for (let b = 0; b < array.length; b++) {
        if (array[b].userid == who)
            answer = b + 1;

    }
    return answer;
}

module.exports = {
    EXPUP
};