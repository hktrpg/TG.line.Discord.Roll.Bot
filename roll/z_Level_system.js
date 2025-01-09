//參考
//https://github.com/cookkkie/mee6
"use strict";
if (!process.env.mongoURL) {
    return;
}
const checkMongodb = require('../modules/dbWatchdog.js');
const checkTools = require('../modules/check.js');
const tempSwitchV2 = require('../modules/level');
const schema = require('../modules/schema.js');
const DEFAULT_RANK_WORD = "{user.displayName}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點！\n現在排名是{server.member_count}人中的第{user.Ranking}名！{user.RankingPer}！\n調查經驗是{user.exp}點。 "

const gameName = function () {
    return '【經驗值功能】 .level (show config LevelUpWord RankWord)'
}
const gameType = function () {
    return 'funny:trpgLevelSystem:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]level$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【⭐經驗值系統】
╭──── 📝系統簡介 ────
│ • 基於Mee6設計的經驗系統
│ • 發言可獲得經驗值提升等級
│ • 支援排名、稱號、自訂通知
│
├──── ⚙️基本設定 ────
│ • .level config 11
│   開啟並顯示升級通知
│ • .level config 10
│   開啟但不顯示通知
│ • .level config 00
│   關閉經驗值功能
│
├──── 📊等級查詢 ────
│ • .level show
│   查詢自己現在等級
│ • .level showMe [數字]
│   查詢群組排名(預設前5名)
│ • .level showMeTheworld [數字]
│   查詢世界排名(預設前6名)
│ • .level showMeAtTheworld
│   查詢自己的世界排名
│
├──── ✨自訂系統 ────
│ ■ 升級通知及回應:
│ • .level LevelUpWord [內容]
│   設定升級通知文字
│ • .level RankWord [內容]
│   設定查詢回應文字
│ • 加上del使用預設文字
│ • 加上show顯示目前設定
│
│ ■ 稱號設定:
│ • .level TitleWord -[LV] [稱號]
│   設定達到等級後的稱號
│   例: -0 無名調查員 -5 調查員 -10 記者
│
├──── 💬升級語及RankWord支援代碼 ────
│ • {user.name} 使用者名稱
│ • {user.displayName} 群暱稱
│ • {user.level} 當前等級
│ • {user.title} 當前稱號
│ • {user.exp} 累積經驗值 
│ • {user.Ranking} 目前排名
│ • {user.RankingPer} 排名比例
│ • {server.member_count} 總人數
├──── 📋預設回應範例 ────
│ {user.displayName}《{user.title}》，
│ 你的克蘇魯神話知識現在是 {user.level}點！
│ 現在排名是{server.member_count}人中的
│ 第{user.Ranking}名！{user.RankingPer}！
│ 調查經驗是{user.exp}點。
╰──────────────`
}
const initialize = function () {
    return;
}
const checkTitle = async function (userlvl, DBTitle) {
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

/*
    稱號
    0-3     無名調查員
    4-7     調查員
    8-10    記者    
    11-13   偵探
    14-17   考古家
    18-20   神秘學家
    21-23   狂信徒
    24-27   教主
    28-30   眷族
    31-33   眷族首領
    34-37   化身
    38-40   舊神
    41-43   舊日支配者
    44-47   外神
    48-50   門
    */
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    displaynameDiscord,
    tgDisplayname,
    discordMessage,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            if (botname == "Line")
                rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
            return rply;
        // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)

        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #164 mongoDB error: ', error.name, error.reason));

            //問題: 如果沒有GP 的話, 可以刪除嗎?
            if (!doc || doc.Title.length < 1) {
                rply.text = "刪除稱號成功。現改回使用預設稱號。"
                return rply
            }
            doc.Title = [];
            await doc.save();
            rply.text = "刪除稱號成功。現改回使用預設稱號。"
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '查詢失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #184 mongoDB error: ', error.name, error.reason));
            if (!doc || doc.Title.length < 1) {
                rply.text = "正在使用預設稱號。"
                return rply
            }
            rply.text = '稱號:\n'
            for (let te = 0; te < doc.Title.length; te++) {
                if (doc.Title[te]) {
                    rply.text += `${[te]}等級: ` + doc.Title[te] + "\n"
                }
            }
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]): {
            //
            //稱號Title
            //
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #212 mongoDB error: ', error.name, error.reason));

            let temprply = setNew(inputStr, doc.Title)

            if (temprply.length < 1) {
                rply.text = '新增失敗。 未有稱號輸入，格式為 \n.level TitleWord -(等級) (稱號).'
                return rply
            }
            await schema.trpgLevelSystem.updateOne({
                groupid: groupid
            }, {
                $set: {
                    "Title": temprply
                }
            }).catch(error => console.error('level_system #227 mongoDB error: ', error.name, error.reason));
            rply.text = '新增稱號成功: \n'
            for (let te = 0; te < temprply.length; te++) {
                if (temprply[te])
                    rply.text += [te] + '等級: ' + temprply[te] + '\n'
            }
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #242 mongoDB error: ', error.name, error.reason));
            if (!doc || !doc.LevelUpWord) {
                rply.text = '正在使用預設升級語. ';
                return rply;
            }
            rply.text = '現在升級語:';
            rply.text += ("\n") + doc.LevelUpWord;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #262 mongoDB error: ', error.name, error.reason));
            doc.LevelUpWord = "";
            await doc.save().catch(error => console.error('level_system #264 mongoDB error: ', error.name, error.reason));
            rply.text = "刪除升級語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #280 mongoDB error: ', error.name, error.reason));
            doc.LevelUpWord = inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            await doc.save().catch(error => console.error('level_system #282 mongoDB error: ', error.name, error.reason));
            rply.text = "新增升級語成功.\n" + inputStr.replace(/\s?.*\s+\w+\s+/i, '');

            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #294 mongoDB error: ', error.name, error.reason));
            if (!doc || !doc.RankWord) {
                rply.text = '正在使用預設查詢語. ';
                return rply;
            }
            rply.text = '現在查詢語:';
            rply.text += ("\n") + doc.RankWord;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #314 mongoDB error: ', error.name, error.reason));
            doc.RankWord = "";
            await doc.save();
            rply.text = "刪除查詢語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #332 mongoDB error: ', error.name, error.reason));
            doc.RankWord = inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            await doc.save();
            rply.text = "新增查詢語成功.\n" + inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #345 mongoDB error: ', error.name, error.reason));
            rply.text = '現在設定: ' + '\n經驗值功能: ';
            rply.text += (doc && doc.SwitchV2) ? '啓動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc && doc.HiddenV2) ? '啓動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            if (!mainMsg[2]) {
                rply.text = '修改失敗。沒有設定onoff\n';
                rply.text += '\nconfig 11 代表啓動功能 \
                \n 數字11代表等級升級時會進行升級通知，10代表不會自動進行升級通知，\
                \n 00的話代表不啓動功能\n'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #370 mongoDB error: ', error.name, error.reason));
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                })
            }
            switch (mainMsg[2]) {
                case '00': {
                    doc.SwitchV2 = false;
                    doc.HiddenV2 = false;
                    await doc.save();
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.SwitchV2 = false;
                    break;
                }
                case '01': {
                    doc.SwitchV2 = false;
                    doc.HiddenV2 = true;
                    await doc.save();
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.SwitchV2 = false;
                    break;
                }
                case '11': {
                    doc.SwitchV2 = true;
                    doc.HiddenV2 = true;
                    await doc.save();
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.SwitchV2 = true;
                    break;
                }
                case '10': {
                    doc.SwitchV2 = true;
                    doc.HiddenV2 = false;
                    await doc.save();
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.SwitchV2 = true;
                }
                    break;
                default:
                    rply.text = '修改失敗。沒有設定onoff\n';
                    rply.text += '\nconfig 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                    return rply
            }
            rply.text = '修改成功: ' + '\n經驗值功能: ';
            rply.text += (doc.SwitchV2) ? '啓動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc.HiddenV2) ? '啓動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            if (!userid) {
                rply.text = '出現問題，你沒有UserID。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid,
                SwitchV2: true
            }).catch(error => {
                console.error('level_system #442 mongoDB error: ', error.name, error.reason)
                checkMongodb.dbErrOccurs();
            });
            if (!doc || !doc.SwitchV2) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能'
                return rply
            }
            let docMember = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({
                EXP: -1
            }).catch(error => console.error('level_system #453 mongoDB error: ', error.name, error.reason));
            //要尋找其中自己的userid
            let myselfIndex = docMember.map(function (members) {
                return members.userid;
            }).indexOf(userid.toString());
            if (myselfIndex < 0) {
                rply.text = '未有你的資料，請稍後再試。'
                return rply
            }
            //6.    ->沒有 使用預設排名語
            //{user.name} 名字 {user.level} 等級 \
            //{user.title} 稱號
            // {user.exp} 經驗值 {user.Ranking} 現在排名 \
            // {user.RankingPer} 現在排名百分比 \
            // {server.member_count} 現在頻道中總人數 \

            //rply.text += '資料庫列表:'
            //1.    讀取 群組有沒有開啓功能


            //5.    讀取群組的排名語

            let rankWord = (doc.RankWord) ? doc.RankWord : DEFAULT_RANK_WORD;

            let username = tgDisplayname || displaynameDiscord || displayname || "無名";

            let userlevel = docMember[myselfIndex].Level;
            let userexp = docMember[myselfIndex].EXP;
            let usermember_count = Math.max(membercount, docMember.length);
            let userRanking = myselfIndex + 1;
            let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
            let userTitle = await this.checkTitle(userlevel, doc.Title || []);
            //Title 首先檢查  trpgLevelSystemfunction.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Title[0].Lvl 有沒有那個LV的TITLE
            //沒有  則使用預設

            //{user.name} 名字 {user.level} 等級 \
            ////{user.title} 稱號
            // { user.exp } 經驗值 { user.Ranking } 現在排名 \
            // { user.RankingPer} 現在排名百分比 \
            // { server.member_count } 現在頻道中總人數 \

            rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle)
            if (rply.text.match(/{user.displayName}/ig)) {
                let userDisplayName = await getDisplayName(discordMessage) || username || "無名";
                rply.text = rply.text.replace(/{user.displayName}/ig, userDisplayName)
            }
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMe$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            //顯示群組頭五名排名
            let RankNumber = 5
            if (mainMsg[2]) {
                if (mainMsg[2] > 5 && mainMsg[2] <= 20)
                    RankNumber = Number(mainMsg[2])
                if (mainMsg[2] > 20)
                    RankNumber = 20
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid,
                SwitchV2: true
            }).catch(error => console.error('level_system #514 mongoDB error: ', error.name, error.reason));
            if (!doc || !doc.SwitchV2) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({
                EXP: -1
            }).limit(RankNumber).catch(error => console.error('level_system #525 mongoDB error: ', error.name, error.reason));
            if (docMember.length < 1) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList(doc, docMember, RankNumber, "群組排行榜");
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeAtTheWorld$/i.test(mainMsg[1]): {
            //顯示自己的排名
            let myExp = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid })
                .catch(error => console.error('level_system #537 mongoDB error: ', error.name, error.reason));
            if (!myExp || !myExp.EXP) {
                rply.text = "未有找到你的資料，請檢查有沒有開啓經驗值功能";
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({ EXP: { $gt: myExp.EXP } }).countDocuments()
                .catch(error => console.error('level_system #543 mongoDB error: ', error.name, error.reason));
            rply.text = `你現在的世界排名是第${docMember + 1}名`
            return rply;

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeTheWorld$/i.test(mainMsg[1]): {
            //顯示世界頭六名排名
            let RankNumber = 6
            if (mainMsg[2]) {
                if (mainMsg[2] > 6 && mainMsg[2] <= 20)
                    RankNumber = Number(mainMsg[2])
                if (mainMsg[2] > 20)
                    RankNumber = 20
            }
            let docMember = await schema.trpgLevelSystemMember.find({}, { name: 1, EXP: 1, Level: 1 }).sort({
                EXP: -1
            }).limit(RankNumber).catch(error => console.error('level_system #559 mongoDB error: ', error.name, error.reason));
            let docMemberCount = await schema.trpgLevelSystemMember.countDocuments({}).catch(error => console.error('level_system #560 mongoDB error: ', error.name, error.reason));

            if (docMember.length < 1) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList({}, docMember, RankNumber, "世界排行榜", docMemberCount);
            return rply;

        }
        default:
            break;
    }

    function setNew(a, result) {
        let b = /-(\d+)\s+(\S+)/ig
        let e = /-(\d+)\s+(\S+)/
        //let f = [];
        let c = a.match(b);
        let d = [];
        if (c)
            for (let i = 0; i < c.length; i++) {
                d[i] = e.exec(c[i])
            }
        if (d)
            for (let i = 0; i < d.length; i++) {
                //限制0-500以內
                if (d[i][1] && d[i][2] && d[i][1] <= 500 && d[i][1] >= 0)
                    result[d[i][1]] = d[i][2]
            }

        return result;
    }




    async function rankingList(gp, who, RankNumber, Title, docMemberCount) {
        let array = [];
        let answer = ""
        let tempTitleAll = gp.Title || [];

        for (let key in who) {
            array.push(who[key]);
        }
        array.sort(function (a, b) {
            return b.Level - a.Level;
        });
        let rank = 1;
        for (let i = 0; i < array.length; i++) {
            if (i > 0 && array[i].Level < array[i - 1].Level) {
                rank++;
            }
            array[i].rank = rank;
        }
        for (let b = 0; b < RankNumber; b++) {
            if (array && array[b]) {
                if (b == 0) {
                    answer += Title
                    answer += (Title == "世界排行榜") ? " (人口: " + docMemberCount + "人)\n┌" : "\n┌";
                } else
                    if (b < RankNumber - 1 && b < array.length - 1) {
                        answer += "├"
                    } else
                        if (b == RankNumber - 1 || b == array.length - 1) {
                            answer += "└"
                        }
                answer += "第" + (Number([b]) + 1) + "名 "
                answer += "《" + await checkTitle(array[b].Level, tempTitleAll) + "》 "
                answer += array[b].name + " " + array[b].Level + "級 " + await kMGTPE(parseInt(array[b].EXP), 1) + "經驗\n";
            }
        }
        return answer;

    }

    //將千位以上變成約數
    async function kMGTPE(num, fixed) {
        if (num === null) {
            return null;
        } // terminate early
        if (num === 0) {
            return '0';
        } // terminate early
        fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
        let b = (num).toPrecision(2).split("e"), // get power
            k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
            c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
            d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
            e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
        return e;
    }
}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    Title: Title,
    checkTitle: checkTitle
};


async function getDisplayName(message) {
    if (!message) return;
    const member = await message.guild.members.fetch(message.author)
    let nickname = member ? member.displayName : message.author.username;
    return nickname;
}

/*
let trpgLevelSystemfunction = [{
        nickname: "Bob",
        EXP: 100
    },
    {
        nickname: "Amy",
        EXP: 200
    },
    {
        nickname: "Grant",
        EXP: 1300
    },
    {
        nickname: "Steve",
        EXP: 4200
    },
    {
        nickname: "Joe",
        EXP: 500
    }
];
function rankingList(who) {
    let array = [];

    for (let key in trpgLevelSystemfunction) {
        array.push(trpgLevelSystemfunction[key]);

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
            document.write("第",Number([b])+1, "名 ",array[b].nickname ," ",array[b].EXP," <br\>");

    }


}
rankingList('Joe');

┌
├
├
├
└

let a = ".lev  -3 a -34 bc -1 DEF -2   Gh i -30 JK -45 ab 23"
let b = /-(\d+)\s+(\S+)/ig
let e = /-(\d+)\s+(\S+)/

let f = [];

let c = a.match(b);
document.write(c,"<br\>");
for (let z=0 ;z<c.length;z++)
{
document.write(z," ", c[z],"<br\>");
}
document.write("<br\>");
let d=[];
for (let i=0 ;i<c.length;i++)
{
d[i]=e.exec(c[i])
f.push({lvl:d[i][1],Title:d[i][2]})

document.write(i," ",d[i],"<br\>");
}
document.write("<br\>");
for(let dd=0;dd<f.length;dd++)
document.write(f[dd].lvl," ",f[dd].Title,"<br\>");
*/