if (!process.env.mongoURL) return;
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
//60000 一分鐘多久可以升級及增加經驗
exports.rollbase = require('../roll/rollbase');
const schema = require('../modules/core-schema.js');
var tempSwitchV2 = [{
    groupid: '',
    SwitchV2: false
}];
async function EXPUP(groupid, userid, displayname, displaynameDiscord, membercount) {
    if (!groupid) {
        return;
    }
    const filterSwitchV2 = tempSwitchV2.find(function (group) {
        return group.groupid == groupid;
    });
    if (filterSwitchV2 && (filterSwitchV2.SwitchV2 === false)) return;
    //  console.log('filterSwitchV2', filterSwitchV2)
    const gpInfo = await schema.trpgLevelSystem.findOne({
        groupid: groupid,
        SwitchV2: true
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
    // console.log('gpInfo', gpInfo);
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    if (!gpInfo || !gpInfo.SwitchV2) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    });
    if (!userInfo) {
        await newUser(gpInfo, groupid, userid, displayname, displaynameDiscord);
        return;
    }
    //4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加15+(1-9) 經驗值
    if ((new Date(Date.now()) - userInfo.LastSpeakTime) < oneMinuts) {
        return;
    }
    if (userInfo.stopExp > 0) {
        userInfo.stopExp--;
        await userInfo.save();
        return;
    }
    userInfo.name = displaynameDiscord || displayname || '無名';
    let exp = await exports.rollbase.Dice(9) + 15;
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
    await userInfo.save();
    //6. 需要 -> 檢查有沒有開啓通知
    if (gpInfo.HiddenV2 == false || levelUP == false) return;
    //1. 讀取LEVELUP語
    return await returnTheLevelWord(gpInfo, userInfo, membercount, groupid);
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)


}

async function returnTheLevelWord(gpInfo, userInfo, membercount, groupid) {
    let username = userInfo.name;
    let userlevel = userInfo.Level;
    let userexp = userInfo.EXP;
    let usermember_count = Math.max(membercount);
    let docMember = await schema.trpgLevelSystemMember.find({
        groupid: groupid
    }).sort({
        EXP: -1
    });
    let myselfIndex = docMember.map(function (members) {
        return members.userid;
    }).indexOf(userInfo.userid);

    let userRanking = myselfIndex + 1;
    let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
    let userTitle = checkTitle(userlevel, gpInfo.Title);
    let tempUPWord = gpInfo.LevelUpWord || "恭喜 {user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！";
    return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle);
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
    await new schema.trpgLevelSystemMember(temp).save();
    return;
}


const Title = function () {
    var Title = []
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
    let temptitle = ""
    //console.log("DBTitle: ", DBTitle)
    if (DBTitle && DBTitle.length > 0) {
        for (let g = 0; g < DBTitle.length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && DBTitle[g]) {
                    templvl = g
                    temptitle = DBTitle[g][2] || DBTitle[g];
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
module.exports = {
    EXPUP,
    tempSwitchV2

};