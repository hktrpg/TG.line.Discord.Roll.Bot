"use strict";
try {
    var rply = {
        default: 'on',
        type: 'text',
        text: '',
        save: ''
    };
    const math = require('mathjs');
    const records = require('../modules/records.js');
    records.get('trpgLevelSystem', (msgs) => {
        rply.trpgLevelSystemfunction = msgs
    })
    const rollbase = require('./rollbase.js');


    var gameName = function () {
        return '(公測中)經驗值功能 .level (show config LevelUpWord RankWord)'
    }
    var gameType = function () {
        return 'trpgLevelSystem:hktrpg'
    }
    var prefixs = function () {
        return [/(^[.]level$)/ig, ]
    }
    var getHelpMessage = function () {
        return "【經驗值功能】" + "\
        \n 這是根據發言次數增加經驗，提升等級，實現服務器內排名的歡樂功能\
        \n 當經驗達到要求，就會彈出通知，提示你已提升等級。\
        \n 預設並不開啓，需要輸入.level config 11 啓動功能 \
        \n 數字11代表等級升級時會進行通知，10代表不會通知，\
        \n 00的話代表關閉功能，\
        \n 預設回應是「 XXXX 《稱號》， 你的克蘇魯神話知識現在是 X點！\
        \n 現在排名是XX人中的第XX名！XX%！\
        \n 調查經驗是XX點。」\
        \n P.S.如果沒立即生效 用.level show 刷新一下\
        \n\
        \n 輸入.level LevelUpWord (內容) 修改在這群組升級時彈出的升級語\
        \n 輸入.level RankWord (內容) 修改在這群組查詢等級時的回應\
        \n 輸入.level TitleWord -(LV) (內容)，修改稱號，大於等級即會套用\
        \n 建議由-0開始，可一次輸入多個，如 .level TitleWord -0 幼童 -5 學徒 -10 武士 \
        \n 輸入.level RankWord/LevelUpWord/TitleWord del 即使用預設字句\
        \n 輸入.level RankWord/LevelUpWord/TitleWord show 即顯示現在設定\
        \n 輸入.level show 可以查詢你現在的等級\
        \n 輸入.level showMe (數字) 可以查詢這群組排名 預設頭5名\
        \n 輸入.level showMeTheworld (數字) 可以查詢世界排名 預設頭6名\
        \n 修改內容可使用不同代碼\
        \n {user.name} 名字 {user.level} 等級 \
        \n {user.title} 稱號 \
        \n {user.exp} 經驗值 {user.Ranking} 現在排名 \
        \n {user.RankingPer} 現在排名百分比 \
        \n {server.member_count} 現在頻道中總人數 \
        \n "
    }
    var initialize = function () {
        return rply;
    }
    var checkTitle = function (userlvl, DBTitle) {
        let templvl = 0;
        let temptitle = ""
        //console.log("DBTitle: ", DBTitle)
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
    var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
        rply.text = '';
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
                if (botname == "Line")
                    rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
                return rply;
                // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)

            case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]):
                //
                //稱號Title
                //
                let temprply = []
                if (groupid && userrole >= 2 && mainMsg[2] && inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1 && !mainMsg[2].match(/^show$/)) {
                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                // console.log('checked1')
                                if (mainMsg[2].match(/^del$/ig)) {
                                    rply.trpgLevelSystemfunction[i].Title = []
                                    rply.text = "刪除稱號成功."
                                    let temp = {
                                        groupid: groupid,
                                        Title: []
                                    }
                                    records.settrpgLevelSystemfunctionTitleWord('trpgLevelSystem', temp, () => {})
                                } else
                                if (rply.trpgLevelSystemfunction[i].Title) {
                                    temprply = setNew(inputStr, i);
                                    if (temprply && temprply.length > 0) {
                                        rply.text = '新增稱號成功: \n'
                                        for (let te = 0; te < temprply.length; te++) {
                                            rply.text += temprply[te][1] + '等級: ' + temprply[te][2] + '\n'
                                        }
                                        let temp = {
                                            groupid: groupid,
                                            Title: rply.trpgLevelSystemfunction[i].Title
                                        }
                                        records.settrpgLevelSystemfunctionTitleWord('trpgLevelSystem', temp, () => {})
                                    }

                                }

                            }
                        }
                    //設定內容
                    //限制500LVL內

                } else {
                    rply.text = '新增失敗.'
                    if (!temprply)
                        rply.text += ' 未有稱號輸入，格式為 .level TitleWord -(等級) (稱號).'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有GM以上才可新增.'
                    if (inputStr.toString().match(/[\s\S]{1,1900}/g).length > 1)
                        rply.text += ' 內容太長,只可以1900字元以內.'
                }
                if (mainMsg[2] && mainMsg[2].match(/^show$/)) {
                    if (groupid) {
                        let temp = 0;
                        if (rply.trpgLevelSystemfunction)
                            for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                                if (rply.trpgLevelSystemfunction[i].groupid == groupid && rply.trpgLevelSystemfunction[i].Title && rply.trpgLevelSystemfunction[i].Title.length > 0) {
                                    rply.text = '稱號:\n'
                                    temp = 1
                                    //console.log(rply.trpgLevelSystemfunction[i].Title)
                                    for (let te = 0; te < rply.trpgLevelSystemfunction[i].Title.length; te++) {
                                        if (rply.trpgLevelSystemfunction[i].Title[te])
                                            rply.text += [te] + '等級: ' + rply.trpgLevelSystemfunction[i].Title[te] + "\n"
                                    }
                                }
                            }
                        if (temp == 0) rply.text = '正在使用預設稱號. '
                    } else {
                        rply.text = '不在群組. '
                    }
                }
                return rply;
            case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]):
                //
                //升級語
                //
                //增加資料庫
                //檢查有沒有重覆
                let checkifsamename = 0
                if (groupid && userrole >= 2 && mainMsg[2] && inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1 && !mainMsg[2].match(/^show$/)) {
                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                // console.log('checked1')
                                if (rply.trpgLevelSystemfunction[i].LevelUpWord) {
                                    //   console.log('checked')
                                    checkifsamename = 1
                                }
                            }
                        }
                    let temp = {
                        groupid: groupid,
                        LevelUpWord: inputStr.replace(mainMsg[0], "").replace(mainMsg[1], "").replace("  ", "")
                        //在這群組升級時的升級語
                    }
                    if (mainMsg[2].match(/^del$/ig)) {
                        checkifsamename = 0
                    }
                    if (checkifsamename == 0) {
                        rply.text = '新增升級語成功: ' + '\n' + inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '').replace(/^\s+/, '')
                        if (mainMsg[2].match(/^del$/ig)) {
                            temp.LevelUpWord = ""
                            rply.text = "刪除升級語成功."
                        }
                        records.settrpgLevelSystemfunctionLevelUpWord('trpgLevelSystem', temp, () => {
                            records.get('trpgLevelSystem', (msgs) => {
                                rply.trpgLevelSystemfunction = msgs
                                //  console.log(rply.trpgLevelSystemfunction)
                                // console.log(rply);
                            })

                        })

                    } else rply.text = '修改失敗. 已有升級語, 先使用.level LevelUpWord del 刪除舊升級語'
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有內容.'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有GM以上才可新增.'
                    if (inputStr.toString().match(/[\s\S]{1,1900}/g).length > 1)
                        rply.text += ' 內容太長,只可以1900字元以內.'
                }
                if (mainMsg[2] && mainMsg[2].match(/^show$/)) {
                    if (groupid) {
                        let temp = 0;
                        if (rply.trpgLevelSystemfunction)
                            for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                                if (rply.trpgLevelSystemfunction[i].groupid == groupid && rply.trpgLevelSystemfunction[i].LevelUpWord) {
                                    rply.text = '現在升級語:'
                                    temp = 1
                                    rply.text += ("\n") + rply.trpgLevelSystemfunction[i].LevelUpWord
                                }
                            }
                        if (temp == 0) rply.text = '正在使用預設升級語. '
                    } else {
                        rply.text = '不在群組. '
                    }
                }
                return rply;
                //
                //
                //查詢語
                //
                //
            case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]):
                //console.log('mainMsg: ', mainMsg)
                //增加資料庫
                //檢查有沒有重覆
                let checkifsamenameRankWord = 0
                if (groupid && userrole >= 2 && mainMsg[2] && inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1 && !mainMsg[2].match(/^show$/)) {
                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                // console.log('checked1')
                                if (rply.trpgLevelSystemfunction[i].RankWord) {
                                    //   console.log('checked')
                                    checkifsamenameRankWord = 1
                                }
                            }
                        }
                    let temp = {
                        groupid: groupid,
                        RankWord: inputStr.replace(mainMsg[0], "").replace(mainMsg[1], "").replace("  ", "")
                        //在這群組查詢等級時的回應
                    }
                    if (mainMsg[2].match(/^del$/ig)) {
                        checkifsamenameRankWord = 0
                    }
                    if (checkifsamenameRankWord == 0) {
                        rply.text = '新增查詢語成功: ' + '\n' + inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '').replace(/^\s+/, '')
                        if (mainMsg[2].match(/^del$/ig)) {
                            temp.RankWord = ""
                            rply.text = "刪除查詢語成功."
                        }
                        records.settrpgLevelSystemfunctionRankWord('trpgLevelSystem', temp, () => {
                            records.get('trpgLevelSystem', (msgs) => {
                                rply.trpgLevelSystemfunction = msgs
                                //  console.log(rply.trpgLevelSystemfunction)
                                // console.log(rply);
                            })

                        })

                    } else rply.text = '修改失敗. 已有查詢語, 先使用.level RankWord del 刪除舊查詢語'
                } else {
                    rply.text = '新增查詢語失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有內容.'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有GM以上才可新增.'
                    if (inputStr.toString().match(/[\s\S]{1,1900}/g).length > 1)
                        rply.text += ' 內容太長,只可以1900字元以內.'
                }
                if (mainMsg[2] && mainMsg[2].match(/^show$/)) {
                    if (groupid) {
                        let temp = 0;
                        if (rply.trpgLevelSystemfunction)
                            for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                                if (rply.trpgLevelSystemfunction[i].groupid == groupid && rply.trpgLevelSystemfunction[i].RankWord) {
                                    rply.text = '現在查詢語:'
                                    temp = 1
                                    rply.text += ("\n") + rply.trpgLevelSystemfunction[i].RankWord
                                }
                            }
                        if (temp == 0) rply.text = '正在使用預設查詢語. '
                    } else {
                        rply.text = '不在群組. '
                    }
                }
                return rply;

                //
                //
                //設定
                //
                //
            case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]):
                //console.log('mainMsg: ', mainMsg)
                //增加資料庫
                //檢查有沒有重覆
                if (groupid && userrole >= 2 && mainMsg[2] && (mainMsg[2] == "00" || mainMsg[2] == "01" || mainMsg[2] == "10" || mainMsg[2] == "11")) {

                    let Switch, Hidden = 0;
                    if (mainMsg[2] == "00") {
                        Switch = 0;
                        Hidden = 0;
                    }
                    if (mainMsg[2] == "01") {
                        Switch = 0;
                        Hidden = 1;
                    }
                    if (mainMsg[2] == "10") {
                        Switch = 1;
                        Hidden = 0;
                    }
                    if (mainMsg[2] == "11") {
                        Switch = 1;
                        Hidden = 1;
                    }

                    let temp = {
                        groupid: groupid,
                        Switch: Switch,
                        Hidden: Hidden
                        //在這群組查詢等級時的回應
                    }
                    rply.text = '修改成功: ' + '\n開關: ';
                    if (Switch == 1) rply.text += '啓動\n通知: '
                    if (Switch == 0) rply.text += '關閉\n通知: '
                    if (Hidden == 1) rply.text += '啓動'
                    if (Hidden == 0) rply.text += '關閉'
                    records.settrpgLevelSystemfunctionConfig('trpgLevelSystem', temp, () => {
                        records.get('trpgLevelSystem', (msgs) => {
                            rply.trpgLevelSystemfunction = msgs
                            //  console.log(rply.trpgLevelSystemfunction)
                            // console.log(rply);
                        })

                    })

                } else {
                    rply.text = '修改開關失敗.'
                    if (!mainMsg[2] || !(mainMsg[2] == "00" || mainMsg[2] == "01" || mainMsg[2] == "10" || mainMsg[2] == "11"))
                        rply.text += '\nconfig 11 代表啓動功能 \
                        \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                        \n 00的話代表不啓動功能\n'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有GM以上才可新增.'
                }
                if (mainMsg[2] && mainMsg[2].match(/^show$/)) {
                    if (groupid) {
                        let temp = 0;
                        if (rply.trpgLevelSystemfunction)
                            for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                                if (rply.trpgLevelSystemfunction[i].groupid == groupid && rply.trpgLevelSystemfunction[i].Switch) {
                                    rply.text = '現在設定:\n開關: '
                                    temp = 1
                                    if (rply.trpgLevelSystemfunction[i].Switch == 1) rply.text += '啓動\n通知: '
                                    if (rply.trpgLevelSystemfunction[i].Switch == 0) rply.text += '關閉\n通知: '
                                    if (rply.trpgLevelSystemfunction[i].Hidden == 1) rply.text += '啓動'
                                    if (rply.trpgLevelSystemfunction[i].Hidden == 0) rply.text += '關閉'

                                    //'\n開關: ' + rply.trpgLevelSystemfunction[i].Switch.replace(1, '啓動').replace(0, '關閉')+ '\n通知: ' + rply.trpgLevelSystemfunction[i].Hidden.replace(1, '啓動').replace(0, '關閉')
                                }
                            }
                        if (temp == 0) rply.text = '現在設定: \n開關: 關閉\n通知: 關閉'
                    } else {
                        rply.text = '不在群組. '
                    }
                }
                return rply;


            case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
                //
                //顯示現在排名
                //1.    讀取 群組有沒有開啓功能
                //2.    ->沒有 告知開啓
                //3.    ->有   檢查有沒有個人資料
                //4.    沒有則新增一個, 隨機1-10 給經驗值.
                //5.    讀取群組的排名語
                //6.    ->沒有 使用預設排名語
                //7.    使用排名語, 根據內容進行替換.
                //8.    
                //{user.name} 名字 {user.level} 等級 \
                //{user.title} 稱號
                // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                // { user.RankingPer} 現在排名百分比 \
                // { server.member_count } 現在頻道中總人數 \

                //console.log(rply.trpgLevelSystemfunction)
                if (groupid) {
                    let temp = 0;
                    let tempHaveUser = 0;
                    //6.    ->沒有 使用預設排名語
                    //{user.name} 名字 {user.level} 等級 \
                    //{user.title} 稱號
                    // {user.exp} 經驗值 {user.Ranking} 現在排名 \
                    // {user.RankingPer} 現在排名百分比 \
                    // {server.member_count} 現在頻道中總人數 \
                    let rankWord = "{user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點！\n現在排名是{server.member_count}人中的第{user.Ranking}名！{user.RankingPer}！\n調查經驗是{user.exp}點。 "

                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                //rply.text += '資料庫列表:'
                                //1.    讀取 群組有沒有開啓功能
                                if (rply.trpgLevelSystemfunction[i].Switch == 1) {
                                    temp = 1;
                                    //5.    讀取群組的排名語
                                    if (rply.trpgLevelSystemfunction[i].RankWord) {
                                        rankWord = rply.trpgLevelSystemfunction[i].RankWord
                                    }

                                    //3.    ->有   檢查有沒有個人資料
                                    for (var a = 0; a < rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length; a++) {
                                        if (rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].userid == userid) {
                                            tempHaveUser = 1;
                                            let username = displaynameDiscord || displayname || "無名"

                                            let userlevel = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level;
                                            let userexp = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].EXP;
                                            //console.log('rply.trpgLevelSystemfunction[i]',
                                            let usermember_count = membercount || rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length;
                                            let userRanking = ranking(userid, rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction);
                                            let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                                            let userTitle = this.checkTitle(userlevel, rply.trpgLevelSystemfunction[i].Title);
                                            //Title 首先檢查  rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Title[0].Lvl 有沒有那個LV的TITLE
                                            //沒有  則使用預設 

                                            //{user.name} 名字 {user.level} 等級 \
                                            ////{user.title} 稱號
                                            // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                                            // { user.RankingPer} 現在排名百分比 \
                                            // { server.member_count } 現在頻道中總人數 \

                                            if ((5 / 6 * (Number(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level) + 1) * (2 * (Number(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level) + 1) * (Number(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level) + 1) + 27 * (Number(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level) + 1) + 91)) <= rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].EXP) {
                                                //現EXP >於需求LV
                                                //LVUP
                                                let TMEPuserlevel = Number(userlevel) + 1
                                                rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, TMEPuserlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle)
                                            } else {
                                                rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle)
                                            }

                                        }

                                    } //2.    ->沒有 告知開啓
                                    if (tempHaveUser == 0) {
                                        //4.    沒有則新增一個, 隨機1-10 給經驗值.
                                        let username = displaynameDiscord || displayname || "無名"
                                        let userlevel = 0;
                                        //let userexp = math.floor(math.random() * 10) + 15
                                        let userexp = (await rollbase.Dice(10) - 1) + 15
                                        //console.log('rply.trpgLevelSystemfunction[i]',
                                        let usermember_count = membercount || rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length;
                                        let userRanking = ranking(userid, rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction);
                                        let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                                        let userTitle = this.checkTitle(userlevel, rply.trpgLevelSystemfunction[i].Title);

                                        //{user.name} 名字 {user.level} 等級 \
                                        //{user.title} 稱號
                                        // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                                        // { user.RankingPer} 現在排名百分比 \
                                        // { server.member_count } 現在頻道中總人數 \
                                        rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle)

                                    }
                                }

                            }
                        }

                    if (temp == 0) rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                } else {
                    rply.text = '不在群組. '
                }
                //顯示資料庫
                //rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply
            case /(^[.]level$)/i.test(mainMsg[0]) && /^showMe$/i.test(mainMsg[1]):
                //顯示群組頭五名排名
                if (groupid) {
                    let temp = 0;
                    let RankNumber = "5"
                    if (mainMsg[2]) {
                        if (mainMsg[2] > 5 && mainMsg[2] < 21)
                            RankNumber = mainMsg[2]
                        if (mainMsg[2] > 20)
                            RankNumber = 20
                    }
                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                //rply.text += '資料庫列表:'
                                //1.    讀取 群組有沒有開啓功能
                                if (rply.trpgLevelSystemfunction[i].Switch == 1) {
                                    temp = 1;
                                    //3.    ->有   檢查有沒有個人資料
                                    for (var a = 0; a < rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length; a++) {
                                        if (rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].userid == userid) {
                                            rply.text = rankingList(rply.trpgLevelSystemfunction[i], RankNumber, "群組排行榜");
                                        }
                                    } //2.    ->沒有 告知開啓
                                }
                            }
                        }

                    if (temp == 0) rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                } else {
                    rply.text = '不在群組. '
                }
                //顯示資料庫
                //rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply
            case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeTheWorld$/i.test(mainMsg[1]):
                //顯示全世界頭六名排名
                if (rply.trpgLevelSystemfunction) {
                    let tempPush = {
                        trpgLevelSystemfunction: []
                    };
                    let RankNumber = 6
                    if (mainMsg[2]) {
                        if (mainMsg[2] > 6 && mainMsg[2] < 21)
                            RankNumber = mainMsg[2]
                        if (mainMsg[2] > 20)
                            RankNumber = 20
                    }
                    for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                        for (var a = 0; a < rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length; a++) {
                            tempPush.trpgLevelSystemfunction.push(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a])
                        }

                    }
                    rply.text = rankingList(tempPush, RankNumber, "世界排行榜");
                }
                return rply
            default:
                break;
        }

        function setNew(a, which) {
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
                        rply.trpgLevelSystemfunction[which].Title[d[i][1]] = d[i][2]
                    //  console.log(rply.trpgLevelSystemfunction[which].Title)
                }
            return d;
        }



        function rankingList(who, RankNumber, Title) {
            var array = [];
            let answer = ""
            let tempTitleAll = who.Title;
            //console.log('tempTitleAll ', tempTitleAll)
            //console.log('who ', who)
            for (var key in who.trpgLevelSystemfunction) {
                array.push(who.trpgLevelSystemfunction[key]);
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
            //checkTitle(lVL,Title)
            for (var b = 0; b < RankNumber; b++) {
                if (array && array[b]) {
                    if (b == 0) {
                        answer += Title + "\n┌"
                    } else
                    if (b < RankNumber - 1 && b < array.length - 1) {
                        answer += "├"
                    } else
                    if (b == RankNumber - 1 || b == array.length - 1) {
                        answer += "└"
                    }
                    answer += "第" + (Number([b]) + 1) + "名 "
                    answer += "《" + checkTitle(array[b].Level, tempTitleAll) + "》 "
                    answer += array[b].name + " " + array[b].Level + "級 " + kMGTPE(parseInt(array[b].EXP), 0) + "經驗\n";
                }
            }
            return answer;

        }

        //將千位以上變成約數
        function kMGTPE(num, fixed) {
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
        function ranking(who, data) {
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
} catch (e) {
    console.log(e)
}

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