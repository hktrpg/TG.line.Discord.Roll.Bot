//參考
//https://github.com/cookkkie/mee6
"use strict";
if (!process.env.mongoURL) {
    return;
}
var tempSwitch = require('../modules/level');
const schema = require('../modules/core-schema.js');
const defaultRankWord = "{user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點！\n現在排名是{server.member_count}人中的第{user.Ranking}名！{user.RankingPer}！\n調查經驗是{user.exp}點。 "

var gameName = function () {
    return '(公測中)經驗值功能 .level (show config LevelUpWord RankWord)'
}
var gameType = function () {
    return 'funny:trpgLevelSystem:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]level$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【經驗值功能】" + "\n\
這是根據開源Discord bot Mee6開發的功能\n\
按發言次數增加經驗，提升等級，實現服務器內排名等歡樂功能\n\
當經驗達到要求，就會彈出通知，提示你已提升等級。\n\
預設並不開啓，需要輸入.level config 11 啓動功能 \n\
數字11代表等級升級時會進行通知，10代表不會通知，\n\
00的話代表關閉功能，\n\
預設回應是「 XXXX 《稱號》， 你的克蘇魯神話知識現在是 X點！\n\
現在排名是XX人中的第XX名！XX%！\n\
調查經驗是XX點。」\n\
P.S.如果沒立即生效 用.level show 刷新一下\n\
        \n\
輸入.level LevelUpWord (內容) 修改在這群組升級時彈出的升級語\n\
輸入.level RankWord (內容) 修改在這群組查詢等級時的回應\n\
輸入.level TitleWord -(LV) (內容)，修改稱號，大於等級即會套用\n\
建議由-0開始，可一次輸入多個，如 .level TitleWord -0 幼童 -5 學徒 -10 武士 \n\
輸入.level RankWord/LevelUpWord/TitleWord del 即使用預設字句\n\
輸入.level RankWord/LevelUpWord/TitleWord show 即顯示現在設定\n\
輸入.level show 可以查詢你現在的等級\n\
輸入.level showMe (數字) 可以查詢這群組排名 預設頭5名\n\
輸入.level showMeTheworld (數字) 可以查詢世界排名 預設頭6名\n\
修改內容可使用不同代碼\n\
{user.name} 名字 {user.level} 等級 \n\
{user.title} 稱號 \n\
{user.exp} 經驗值 {user.Ranking} 現在排名 \n\
{user.RankingPer} 現在排名百分比 \n\
{server.member_count} 現在頻道中總人數 \n\
"
}
var initialize = function () {
    return;
}
var checkTitle = async function (userlvl, DBTitle) {
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
var Title = function () {
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
var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            if (botname == "Line")
                rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
            return rply;
        // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)

        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '刪除失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '新增失敗。只有GM以上才可新增。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });

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
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!doc || doc.Title.length < 1) {
                rply.text = "正在使用預設稱號。"
                return rply
            }
            rply.text = '稱號:\n'

            for (let te = 0; te < doc.Title.length; te++) {
                if (doc.Title[te])
                    rply.text += [te] + '等級: ' + doc.Title[te] + "\n"
            }
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]): {
            //
            //稱號Title
            //
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '新增失敗。只有GM以上才可新增。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            let temprply = await setNew(inputStr);
            if (temprply.length < 1) {
                rply.text = '新增失敗。 未有稱號輸入，格式為 \n.level TitleWord -(等級) (稱號).'
                return rply
            }
            doc.Title = temprply;
            await doc.save();
            rply.text = '新增稱號成功: \n'
            for (let te = 0; te < temprply.length; te++) {
                rply.text += temprply[te][1] + '等級: ' + temprply[te][2] + '\n'
            }
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!doc || !doc.LevelUpWord) {
                rply.text = '正在使用預設升級語. ';
                return rply;
            }
            rply.text = '現在升級語:';
            rply.text += ("\n") + doc.LevelUpWord;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '刪除失敗。\n你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '刪除失敗。只有GM以上才可刪除。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            doc.LevelUpWord = "";
            await doc.save();
            rply.text = "刪除升級語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '新增失敗。只有GM以上才可新增。'
                return rply
            }

            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            doc.LevelUpWord = inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            await doc.save();
            rply.text = "新增升級語成功.\n" + inputStr.replace(/\s?.*\s+\w+\s+/i, '');

            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!doc || !doc.RankWord) {
                rply.text = '正在使用預設查詢語. ';
                return rply;
            }
            rply.text = '現在查詢語:';
            rply.text += ("\n") + doc.RankWord;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '刪除失敗。\n你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '刪除失敗。只有GM以上才可刪除。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            doc.RankWord = "";
            await doc.save();
            rply.text = "刪除查詢語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '新增失敗。只有GM以上才可新增。'
                return rply
            }

            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
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
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            rply.text = '現在設定: ' + '\n經驗值功能: ';
            rply.text += (doc.Switch) ? '啓動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc.Hidden) ? '啓動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '修改失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            if (userrole <= 2) {
                rply.text = '修改失敗。只有GM以上才可修改設定。'
                return rply
            }
            if (!mainMsg[2]) {
                rply.text = '修改失敗。沒有設定onoff\n';
                rply.text += '\nconfig 11 代表啓動功能 \
                \n 數字11代表等級升級時會進行升級通知，10代表不會自動進行升級通知，\
                \n 00的話代表不啓動功能\n'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            switch (mainMsg[2]) {
                case '00': {
                    doc.Switch = false;
                    doc.Hidden = false;
                    await doc.save();
                    let temp = tempSwitch.tempSwitch.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.Switch = false;
                    break;
                }
                case '01': {
                    doc.Switch = false;
                    doc.Hidden = true;
                    await doc.save();
                    let temp = tempSwitch.tempSwitch.find(function (group) {
                        return group.groupid == groupid;
                    });
                    temp.Switch = false;
                    break;
                }
                case '11':
                    {
                        doc.Switch = true;
                        doc.Hidden = true;
                        await doc.save();
                        let temp = tempSwitch.tempSwitch.find(function (group) {
                            return group.groupid == groupid;
                        });
                        temp.Switch = true;
                        break;
                    }
                case '10':
                    {
                        doc.Switch = true;
                        doc.Hidden = false;
                        await doc.save();
                        let temp = tempSwitch.tempSwitch.find(function (group) {
                            return group.groupid == groupid;
                        });
                        temp.Switch = true;
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
            rply.text += (doc.Switch) ? '啓動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc.Hidden) ? '啓動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            {
                if (!groupid) {
                    rply.text = '你不在群組當中，請在群組中使用。'
                    return rply
                }
                if (!userid) {
                    rply.text = '出現問題，你沒有UserID。'
                    return rply
                }
                let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
                if (!doc || !doc.Switch) {
                    rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能'
                    return rply
                }
                let docMember = await schema.trpgLevelSystemMember.find({ groupid: groupid }).sort({ EXP: -1 });

                //要尋找其中自己的userid
                let myselfIndex = docMember.map(function (members) {
                    return members.userid;
                }).indexOf(userid);
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

                let rankWord = (doc.rankWord) ? doc.rankWord : defaultRankWord;

                let username = displaynameDiscord || displayname || "無名";

                let userlevel = docMember[myselfIndex].Level;
                let userexp = docMember[myselfIndex].EXP;
                //console.log('trpgLevelSystemfunction.trpgLevelSystemfunction[i]',
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
            let doc = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!doc || !doc.Switch) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({ groupid: groupid }).sort({ EXP: -1 }).limit(RankNumber)
            if (docMember.length < 1) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.text = await rankingList(doc, docMember, RankNumber, "群組排行榜");
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeTheWorld$/i.test(mainMsg[1]): {
            //顯示群組頭五名排名
            let RankNumber = 6
            if (mainMsg[2]) {
                if (mainMsg[2] > 6 && mainMsg[2] <= 20)
                    RankNumber = Number(mainMsg[2])
                if (mainMsg[2] > 20)
                    RankNumber = 20
            }
            let docMember = await schema.trpgLevelSystemMember.find({}).sort({ EXP: -1 }).limit(RankNumber)
            if (docMember.length < 1) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.text = await rankingList({}, docMember, RankNumber, "世界排行榜");
            return rply;

        }
        default:
            break;
    }

    async function setNew(a) {
        let b = /-(\d+)\s+(\S+)/ig
        let e = /-(\d+)\s+(\S+)/
        //let f = [];
        let c = a.match(b);
        let d = [];
        if (c)
            for (let i = 0; i < c.length; i++) {
                d[i] = e.exec(c[i])
            }
        return d;
    }



    async function rankingList(gp, who, RankNumber, Title) {
        var array = [];
        let answer = ""
        let tempTitleAll = gp.Title || [];
        //console.log('tempTitleAll ', tempTitleAll)
        //console.log('who ', who)
        for (var key in who) {
            array.push(who[key]);
        }
        array.sort(function (a, b) {
            return b.EXP - a.EXP;
        });
        var rank = 1;
        for (var i = 0; i < array.length; i++) {
            if (i > 0 && array[i].EXP < array[i - 1].EXP) {
                rank++;
            }
            array[i].rank = rank;
        }
        for (var b = 0; b < RankNumber; b++) {
            if (array && array[b]) {
                if (b == 0) {
                    answer += Title
                    answer += (Title == "世界排行榜") ? " (人口: " + array.length + "人)\n┌" : "\n┌";
                } else
                    if (b < RankNumber - 1 && b < array.length - 1) {
                        answer += "├"
                    } else
                        if (b == RankNumber - 1 || b == array.length - 1) {
                            answer += "└"
                        }
                answer += "第" + (Number([b]) + 1) + "名 "
                answer += "《" + await checkTitle(array[b].Level, tempTitleAll) + "》 "
                answer += array[b].name + " " + array[b].Level + "級 " + await kMGTPE(parseInt(array[b].EXP), 0) + "經驗\n";
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
        var b = (num).toPrecision(2).split("e"), // get power
            k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
            c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
            d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
            e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
        return e;
    }
    /*
            function kMGTPE(n, d) {
                x = ('' + n).length, p = math.pow, d = p(10, d)
                x -= x % 3
                return math.round(n * d / p(10, x)) / d + " kMGTPE" [x / 3]
            }
    */
    async function ranking(who, data) {
        var array = [];
        let answer = ""
        for (var key in data) {
            array.push(data[key]);

        }

        array.sort(function (a, b) {
            return b.EXP - a.EXP;
        });

        var rank = 1;
        //console.log('array.length', array.length)
        //console.log('array', array)
        for (var i = 0; i < array.length; i++) {
            if (i > 0 && array[i].EXP < array[i - 1].EXP) {
                rank++;
            }
            array[i].rank = rank;
        }
        for (var b = 0; b < array.length; b++) {
            if (array[b].userid == who)
                answer = b + 1;
            //  document.write(b + 1);

        }
        //console.log('answer', answer)
        return answer;
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


/*
var trpgLevelSystemfunction = [{
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
    var array = [];

    for (var key in trpgLevelSystemfunction) {
        array.push(trpgLevelSystemfunction[key]);

    }

    array.sort(function (a, b) {
        return b.EXP - a.EXP;
    });

    var rank = 1;
    for (var i = 0; i < array.length; i++) {
        if (i > 0 && array[i].EXP < array[i - 1].EXP) {
            rank++;
        }
        array[i].rank = rank;
    }
    for (var b = 0; b < array.length; b++) {
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
for (var z=0 ;z<c.length;z++)
{
document.write(z," ", c[z],"<br\>");
}
document.write("<br\>");
let d=[];
for (var i=0 ;i<c.length;i++)
{
d[i]=e.exec(c[i])
f.push({lvl:d[i][1],Title:d[i][2]})

document.write(i," ",d[i],"<br\>");
}
document.write("<br\>");
for(let dd=0;dd<f.length;dd++)
document.write(f[dd].lvl," ",f[dd].Title,"<br\>");
*/
