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
        \n 輸入.level show 可以查詢你現在的等級\
        \n 修改內容可使用不同代碼\
        \n {user.name} 名字 {user.level} 等級 \
        \n {user.exp} 經驗值 {user.Ranking} 現在排名 \
        \n {user.Ranking%} 現在排名百分比 \
        \n {server.member_count} 現在排名中總人數 \
        \n "
    }
    initialize = function () {
        return rply;
    }

    rollDiceCommand = function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
        records.get('trpgLevelSystem', (msgs) => {
            rply.trpgLevelSystemfunction = msgs
        })
        rply.text = '';
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
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
                        rply.text += ' 沒有標題.'
                    if (!mainMsg[3])
                        rply.text += ' 沒有擲骰指令'
                    if (mainMsg[3] && mainMsg[3].toLowerCase() == ".level")
                        rply.text += '指令不可以儲存.level啊'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 1)
                        rply.text += ' 只有GM以上才可新增.'
                    if (inputStr.toString().match(/[\s\S]{1,1900}/g).length <= 1)
                        rply.text += ' 內容太長,只可以1900字元以內.'
                }
                if (mainMsg[2].match(/^show$/)) {
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

            case /(^[.]level$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //刪除資料庫
                if (groupid && mainMsg[2] && rply.trpgLevelSystemfunction && userrole >= 1) {
                    for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                        if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                            let temp = rply.trpgLevelSystemfunction[i]
                            temp.trpgLevelSystemfunction = []
                            records.settrpgLevelSystemfunction('trpgLevelSystem', temp, () => {
                                records.get('trpgLevelSystem', (msgs) => {
                                    rply.trpgLevelSystemfunction = msgs
                                })
                            })
                            rply.text = '刪除所有關鍵字'
                        }
                    }
                } else {
                    rply.text = '刪除失敗.'
                    if (!groupid)
                        rply.text += '不在群組. '
                    if (groupid && userrole < 1)
                        rply.text += '只有GM以上才可刪除. '
                }

                return rply;
            case /(^[.]level$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除資料庫
                if (groupid && mainMsg[2] && rply.trpgLevelSystemfunction && userrole >= 1) {
                    for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                        if (rply.trpgLevelSystemfunction[i].groupid == groupid && mainMsg[2] < rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length && mainMsg[2] >= 0) {
                            let temp = rply.trpgLevelSystemfunction[i]
                            temp.trpgLevelSystemfunction.splice(mainMsg[2], 1)
                            //console.log('rply.trpgLevelSystemfunction: ', temp)
                            records.settrpgLevelSystemfunction('trpgLevelSystem', temp, () => {
                                records.get('trpgLevelSystem', (msgs) => {
                                    rply.trpgLevelSystemfunction = msgs
                                })
                            })
                        }
                        rply.text = '刪除成功: ' + mainMsg[2]
                    }
                } else {
                    rply.text = '刪除失敗.'
                    if (!mainMsg[2])
                        rply.text += '沒有關鍵字. '
                    if (!groupid)
                        rply.text += '不在群組. '
                    if (groupid && userrole < 1)
                        rply.text += '只有GM以上才可刪除. '
                }
                return rply;

            case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
                //顯示
                records.get('trpgLevelSystem', (msgs) => {
                    rply.trpgLevelSystemfunction = msgs
                })
                //console.log(rply.trpgLevelSystemfunction)
                if (groupid) {
                    let temp = 0;
                    if (rply.trpgLevelSystemfunction)
                        for (var i = 0; i < rply.trpgLevelSystemfunction.length; i++) {
                            if (rply.trpgLevelSystemfunction[i].groupid == groupid) {
                                rply.text += '資料庫列表:'
                                for (var a = 0; a < rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction.length; a++) {
                                    temp = 1
                                    rply.text += ("\n") + a + '. ' + rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].topic + '\n' + rply.trpgLevelSystemfunction[i].trpgLevelSystemfunction[a].contact + '\n'
                                }
                            }
                        }
                    if (temp == 0) rply.text = '沒有已設定的關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示資料庫
                rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply


            default:
                break;

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