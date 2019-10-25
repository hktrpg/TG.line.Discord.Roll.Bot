try {
    var rply = {
        default: 'on',
        type: 'text',
        text: '',
        save: ''
    };
    const records = require('../modules/records.js');
    records.get('trpgLevelSystem', (msgs) => {
        rply.trpgLevelSystemfunction = msgs
    })

    gameName = function () {
        return '(公測中)經驗值功能 .level (show config LevelUpWord RankWord)'
    }
    gameType = function () {
        return 'trpgLevelSystem:hktrpg'
    }
    prefixs = function () {
        return [/(^[.]level$)/ig,]
    }
    getHelpMessage = function () {
        return "【經驗值功能】" + "\
        \n 這是根據發言增加經驗實現排名的歡樂功能\
        \n 首先輸入.level config 11 啓動功能 \
        \n 數字11代表等級升級時會進行通知，10代表不會通知，\
        \n 00的話代表不啓動功能，預設為不啟動功能\
        \n P.S.如果沒立即生效 用.level show 刷新一下\
        \n 輸入.level LevelUpWord (內容) 修改在這群組升級時彈出的升級語\
        \n 輸入.level RankWord (內容) 修改在這群組查詢等級時的回應\
        \n 輸入.level RankWord/LevelUpWord del 即使用預設字句\
        \n 輸入.level RankWord/LevelUpWord show 即顯示現在設定\
        \n 輸入.level show 可以查詢你現在的等級\
        \n 修改內容可使用不同代碼\
        \n {user.name} 名字 {user.level} 等級 \
        \n {user.exp} 經驗值 {user.Ranking} 現在排名 \
        \n {user.RankingPer} 現在排名百分比 \
        \n {server.member_count} 現在頻道中總人數 \
        \n "
    }
    initialize = function () {
        return rply;
    }

    rollDiceCommand = function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {

        rply.text = '';
        switch (true) {

            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
                //console.log(userid);
                return rply;
            // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)
            case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]):
                //console.log('mainMsg: ', mainMsg)
                //增加資料庫
                //檢查有沒有重覆
                let checkifsamename = 0
                if (groupid && userrole >= 1 && mainMsg[2] && inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1 && !mainMsg[2].match(/^show$/)) {
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
                        rply.text = '新增成功: ' + '\n' + inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '').replace(/^\s+/, '')
                        if (mainMsg[2].match(/^del$/ig)) {
                            temp.LevelUpWord = ""
                            rply.text = "刪除成功."
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
                    if (groupid && userrole < 1)
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
                if (groupid && userrole >= 1 && mainMsg[2] && inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1 && !mainMsg[2].match(/^show$/)) {
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
                        rply.text = '新增成功: ' + '\n' + inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '').replace(/^\s+/, '')
                        if (mainMsg[2].match(/^del$/ig)) {
                            temp.RankWord = ""
                            rply.text = "刪除成功."
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
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有內容.'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 1)
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
                if (groupid && userrole >= 1 && mainMsg[2] && (mainMsg[2] == "00" || mainMsg[2] == "01" || mainMsg[2] == "10" || mainMsg[2] == "11")) {

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
                    rply.text = '修改失敗.'
                    if (!mainMsg[2] || !(mainMsg[2] == "00" || mainMsg[2] == "01" || mainMsg[2] == "10" || mainMsg[2] == "11"))
                        rply.text += '\nconfig 11 代表啓動功能 \
                        \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                        \n 00的話代表不啓動功能\n'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 1)
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
                // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                // { user.RankingPer} 現在排名百分比 \
                // { server.member_count } 現在頻道中總人數 \

                //console.log(rply.trpgLevelSystemfunction)
                if (groupid) {
                    let temp = 0;
                    let tempHaveUser = 0;
                    //6.    ->沒有 使用預設排名語
                    //{user.name} 名字 {user.level} 等級 \
                    // {user.exp} 經驗值 {user.Ranking} 現在排名 \
                    // {user.RankingPer} 現在排名百分比 \
                    // {server.member_count} 現在頻道中總人數 \
                    let rankWord = " @{user.name}，你的克蘇魯神話知識現在是 {user.level}點！"

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
                                            let username = displayname || "無名"
                                            let userlevel = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level;
                                            let userexp = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].EXP;
                                            //console.log('rply.trpgLevelSystemfunction[i]',

                                            let userRanking = ranking(userid, rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction);
                                            let userRankingPer = Math.ceil(userRanking / rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length * 10000) / 100 + '%';
                                            let usermember_count = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length;
                                            //{user.name} 名字 {user.level} 等級 \
                                            // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                                            // { user.RankingPer} 現在排名百分比 \
                                            // { server.member_count } 現在頻道中總人數 \
                                            if ((100 * Math.pow(rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level, 2) + 50 * rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].Level + 100) <= rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].EXP) {
                                                //現EXP >於需求LV
                                                //LVUP
                                                let TMEPuserlevel = Number(userlevel)+1
                                                rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, TMEPuserlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count)
                                            } else {
                                                rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count)
                                            }

                                        }

                                    } //2.    ->沒有 告知開啓
                                    if (tempHaveUser == 0) {
                                        //4.    沒有則新增一個, 隨機1-10 給經驗值.
                                        let username = displayname || "無名"
                                        let userlevel = 0;
                                        let userexp = Math.floor(Math.random() * 10) + 1
                                        //console.log('rply.trpgLevelSystemfunction[i]',

                                        let userRanking = ranking(userid, rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction);
                                        let userRankingPer = Math.ceil(userRanking / rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length * 10000) / 100 + '%';
                                        let usermember_count = rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length;
                                        //{user.name} 名字 {user.level} 等級 \
                                        // { user.exp } 經驗值 { user.Ranking } 現在排名 \
                                        // { user.RankingPer} 現在排名百分比 \
                                        // { server.member_count } 現在頻道中總人數 \
                                        rply.text = rankWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count)
                                        let temp = {
                                            groupid: groupid,
                                            trpgLevelSystemfunction: {
                                                userid: userid,
                                                name: username,
                                                EXP: userexp,
                                                Level: "0",
                                                LastSpeakTime: Date.now()
                                            }


                                        }
                                        records.settrpgLevelSystemfunctionNewUser('trpgLevelSystem', temp, () => {
                                            records.get('trpgLevelSystem', (msgs) => {
                                                rply.trpgLevelSystemfunction = msgs
                                                //  console.log(rply.trpgLevelSystemfunction)
                                                // console.log(rply);
                                            })

                                        })
                                    }
                                }

                            }
                        }

                    if (temp == 0) rply.text = '此群組並有沒有開啓LEVEL功能. \nconfig 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                } else {
                    rply.text = '不在群組. '
                }
                //顯示資料庫
                rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply


            default:
                break;

        }

        function ranking(who, data) {
            var array = [];
            let answer = "0"
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
        gameName: gameName
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

function ranking(who) {
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
        if (array[b].nickname == who)
            document.write(b + 1);

    }


}
ranking('Joe');
*/