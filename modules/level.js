if (!process.env.mongoURL) return;
const oneMinuts = 60000;
//60000 一分鐘多久可以升級及增加經驗
const records = require('./records.js');
exports.rollbase = require('../roll/rollbase');
exports.z_Level_system = require('../roll/z_Level_system');
async function EXPUP(groupid, userid, displayname, displaynameDiscord, membercount) {
    if (!process.env.mongoURL || !Object.keys(exports.z_Level_system).length) {
        return;
    }
    var levelUpNow = false;
    let tempEXPconfig = 0;
    let tempGPID = 0;
    let tempGPuserID = 0;
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    if (exports.z_Level_system && exports.z_Level_system.initialize() && exports.z_Level_system.initialize().trpgLevelSystemfunction && exports.z_Level_system.initialize().trpgLevelSystemfunction[0]) {
        for (let a = 0; a < exports.z_Level_system.initialize().trpgLevelSystemfunction.length; a++) {
            if (exports.z_Level_system.initialize().trpgLevelSystemfunction[a].groupid == groupid && exports.z_Level_system.initialize().trpgLevelSystemfunction[a].Switch == "1") {
                tempEXPconfig = 1;
                tempGPID = a;
            }
            //檢查CONFIG開啓
        }
    }

    if (tempEXPconfig == 1) {
        let tempIsUser = 0;
        //2. 有 -> 檢查有沒USER 資料
        for (let b = 0; b < exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.length; b++) {
            if (exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[b].userid == userid) {
                tempIsUser = userid;
                tempGPuserID = b;
            }
        }

        //3. 沒有 -> 新增
        if (tempIsUser == 0) {
            let temp = {
                groupid: groupid,
                trpgLevelSystemfunction: {
                    userid: userid,
                    name: displayname || '無名',
                    EXP: await exports.rollbase.Dice(9) + 15,
                    //EXP: math.floor(math.random() * 10) + 15,
                    Level: "0",
                    LastSpeakTime: Date.now()
                }
            }

            exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.push(temp.trpgLevelSystemfunction);

            records.settrpgLevelSystemfunctionNewUser('trpgLevelSystem', temp, () => {});

        } else if (tempIsUser != 0) {
            //4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加1-10 經驗值
            if (new Date(Date.now()) - new Date(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].LastSpeakTime) > oneMinuts) {
                exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP + await exports.rollbase.Dice(9) + 15;
                exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].LastSpeakTime = Date.now();
                exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].name = displaynameDiscord || displayname || '無名'
                //5. 檢查現LEVEL 需不需要上升. =5 / 6 * LVL * (2 * LVL * LVL + 27 * LVL + 91)
                if ((5 / 6 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) * (2 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) + 27 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) + 91)) <= exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP) {
                    //現EXP >於需求LV
                    //LVUP
                    await exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level++;
                    if (exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].Hidden == 1) {
                        //6. 需要 -> 檢查有沒有開啓通知
                        levelUpNow = true;

                    }
                }
                //8. 更新MLAB資料
                let a = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP;
                let b = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level;
                await records.maxtrpgLevelSystemfunctionEXPup('trpgLevelSystem', userid, a, b, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID], exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction, () => {});
                if (levelUpNow) return await LevelUP(userid, displayname, displaynameDiscord, membercount, tempGPID, tempGPuserID);

            }
        }
    }
    return;

}

async function LevelUP(userid, displayname, displaynameDiscord, membercount, tempGPID, tempGPuserID) {
    //1. 讀取LEVELUP語
    let username = displaynameDiscord || displayname || "無名"
    let userlevel = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level;
    let userexp = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP;
    //console.log('rply.trpgLevelSystemfunction[i]',
    let usermember_count = membercount || exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.length;
    let userRanking = await ranking(userid, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction);

    let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
    let userTitle = await exports.z_Level_system.checkTitle(userlevel, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].Title);
    let tempUPWord = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].LevelUpWord || "恭喜 {user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！";
    return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle);

    //2. 回應BOT

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
    //console.log('array.length', array.length)
    //console.log('array', array)
    for (let i = 0; i < array.length; i++) {
        if (i > 0 && array[i].EXP < array[i - 1].EXP) {
            rank++;
        }
        array[i].rank = rank;
    }
    for (let b = 0; b < array.length; b++) {
        if (array[b].userid == who)
            answer = b + 1;
        //  document.write(b + 1);

    }
    //console.log('answer', answer)
    return answer;
}

module.exports = {
    EXPUP
};