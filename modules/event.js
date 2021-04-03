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

/**
 * TODO:
 * 1. .evt (event)系統設計
經由新增的事件 可以增加減少EXP
功能及設計列表
1. 舉報不良項目, 有幾個個舉報, 自動隱藏
3. 
進入事件的方法
輸入 .evt event ->   即 進入 隨機事件, 消耗5EN
輸入 .evt (事件名稱) ->   即 進入 指定事件, 消耗15EN

EN= 20+LV
每5分鐘回複1點EN

得知事件名稱的方法，別人告知 或 經隨機事件知道名字

4. 
事件效果
1. 沒有事發生
2. 直接增加X點經驗(X分鐘內)
3. 直接減少X點經驗(X分鐘內)
4. 停止得到經驗(X分鐘內)
5. 分發X經驗給整個CHANNEL中的X人
6. 停止得到經驗(X分鐘內)並每次減少發言減少X經驗
7. 吸收對方X點經驗
8. 對方得到經驗值 X 倍(X分鐘內)
9. 從整個CHANNEL 的X人吸收X點經驗

5. 
設計事件的好處
能夠吸收對方消耗的en 作為自己的exp

6.
設計方式
輸入 .evt add 天命
你被雷打中 得到{exp}點真氣  2  (直接增加X點經驗)
你掉下山中 頭破血流，損失{exp}點真氣  3  (直接減少X點經驗)
今天風平浪靜 1 (無事發生)

可以有3+(ROUNDDOWN 設計者LV/10)  項結果
由設計者自己設定
一個事件由以下三項組成
事件名稱，事件內容及設定事件結果 

7. 
限制
A. 一個事件中，正面選項要比負面選項多
B. 事件效果隨著設計者LV 而開發
如: 效果1-3 LV0-10 可用
4 需要LV11-20LV
5 需要LV21-30
C. 一個事件中，不可以全部正面效果
D. 一個事件可用的總EN 為(10+LV)，負面事件消耗X點EN

8.
變數X 普通為
設計者LV , 
使用者LV, 
設計者LV 與使用者LV 的相差,
負面效果的程度(即如果一個事件中有負面效果，那正面效果會增加)
 * 
 * 
 */
async function event(groupid, userid, displayname, displaynameDiscord, membercount) {
    if (!process.env.mongoURL || !Object.keys(exports.z_Level_system).length || !exports.z_Level_system.initialize().trpgLevelSystemfunction) {
        return;
    }

    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let userInfo = {};
    let gpInfo = exports.z_Level_system.initialize().trpgLevelSystemfunction.find(e => e.groupid == groupid);
    if (!gpInfo || gpInfo.Switch != 1) return;
    if (gpInfo.trpgLevelSystemfunction) {
        userInfo = gpInfo.trpgLevelSystemfunction.find(e => e.userid == userid)
    }
    if (!userInfo) {
        await newUser(gpInfo, groupid, userid, displayname, displaynameDiscord);
        return;
    }

    //4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加15+(1-9) 經驗值
    if ((new Date(Date.now()) - userInfo.LastSpeakTime) < oneMinuts) {
        return;
    }
    userInfo.name = displaynameDiscord || displayname || '無名'
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
    await uploadMongoose(groupid, userid, userInfo);
    //6. 需要 -> 檢查有沒有開啓通知
    if (gpInfo.Hidden != 1 || levelUP == false) return;
    //1. 讀取LEVELUP語
    return await returnTheLevelWord(gpInfo, userInfo, membercount);
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function returnTheLevelWord(gpInfo, userInfo, membercount) {
    let username = userInfo.name;
    let userlevel = userInfo.Level;
    let userexp = userInfo.EXP;
    let usermember_count = Math.max(membercount, gpInfo.trpgLevelSystemfunction.length);
    let userRanking = await ranking(userInfo.userid, gpInfo.trpgLevelSystemfunction);
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
        name: displaynameDiscord || displayname || '無名',
        EXP: await exports.rollbase.Dice(9) + 15,
        //EXP: math.floor(math.random() * 10) + 15,
        Level: "0",
        LastSpeakTime: Date.now()
    }
    gpInfo.trpgLevelSystemfunction.push(temp)

    let v = await schema.trpgLevelSystem.findOneAndUpdate({
        groupid: groupid
    }, {
        $push: {
            trpgLevelSystemfunction: temp
        }
    }, opt)
    return v;
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
    event
};