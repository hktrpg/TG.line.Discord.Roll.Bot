try {
    var rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    const records = require('../modules/records.js');
    records.get('randomAns', (msgs) => {
        rply.randomAnsfunction = msgs
    })
    gameName = function () {
        return '(公測中)暗骰GM功能 .drgm  (add del show 自定關鍵字)'
    }
    gameType = function () {
        return 'trpgDarkRolling:hktrpg'
    }
    prefixs = function () {
        return [/(^[.]drgm$)/ig,]
    }
    getHelpMessage = function () {
        return "【暗骰GM功能】.drgm dr ddr dddr" + "\
        \n 這是讓你可以私骰GM的功能,\
        \n 例如輸入 .ddr cc 80 鬥毆 \
        \n 就會把結果私訊GM及自己\
        \n 例如輸入 .dddr cc 80 鬥毆 \
        \n 就會把結果只私訊GM\
        \n P.S.如果沒立即生效 用.drgm show 刷新一下\
    \n 輸入.drgm addgm 即可成為GM\
    \n 輸入.drgm show 顯示所有GM\
    \n 輸入.drgm del(編號)或all 即可刪除\
    \n 輸入.dr  (指令) 私訊自己 \
    \n 輸入.ddr (指令) 私訊GM及自己\
    \n 輸入.dddr(指令) 私訊GM\
    \n "
    }
    initialize = function () {
        return rply;
    }

    rollDiceCommand = function (inputStr, mainMsg, groupid, userid, userrole) {
        records.get('randomAns', (msgs) => {
            rply.randomAnsfunction = msgs
        })
        rply.text = '';
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
                return rply;
                break;

            case /(^[.]drgm$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
                //
                //增加自定義關鍵字
                // .ra[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
                let checkifsamename = 0
                if (groupid && userrole >= 1 && mainMsg[3] && mainMsg[4]) {
                    if (rply.randomAnsfunction)
                        for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                            if (rply.randomAnsfunction[i].groupid == groupid) {
                                // console.log('checked1')
                                for (var a = 0; a < rply.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                    if (rply.randomAnsfunction[i].randomAnsfunction[a][0].toLowerCase() == mainMsg[2].toLowerCase()) {
                                        //   console.log('checked')
                                        checkifsamename = 1
                                    }
                                }
                            }
                        }
                    let temp = {
                        groupid: groupid,
                        randomAnsfunction: [mainMsg.slice(2)]
                    }
                    if (checkifsamename == 0) {
                        records.pushrandomAnsfunction('randomAns', temp, () => {
                            records.get('randomAns', (msgs) => {
                                rply.randomAnsfunction = msgs
                                // console.log(rply);
                            })

                        })
                        rply.text = '新增成功: ' + mainMsg[2]
                    } else rply.text = '新增失敗. 重複關鍵字'
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有關鍵字.'
                    if (!mainMsg[3] && !mainMsg[4])
                        rply.text += ' 沒有自定義回應,至少兩個.'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 1)
                        rply.text += ' 只有GM以上才可新增.'
                }
                return rply;
                break;
            case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //    
                //刪除所有自定義關鍵字
                //
                if (!mainMsg[2]) return;
                if (groupid && mainMsg[2] && rply.randomAnsfunction && userrole >= 2) {
                    for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                        if (rply.randomAnsfunction[i].groupid == groupid) {
                            let temp = rply.randomAnsfunction[i]
                            temp.randomAnsfunction = []
                            records.setrandomAnsfunction('randomAns', temp, () => {
                                records.get('randomAns', (msgs) => {
                                    rply.randomAnsfunction = msgs
                                })
                            })
                            rply.text = '刪除所有關鍵字'
                        }
                    }
                } else {
                    rply.text = '刪除失敗.'
                    if (!groupid)
                        rply.text += '不在群組. '
                    if (groupid && userrole < 2)
                        rply.text += '只有GM以上才可刪除所有關鍵字. '
                }

                return rply;
                break;
            case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //
                //刪除自定義關鍵字
                //
                if (groupid && mainMsg[2] && rply.randomAnsfunction && userrole >= 1) {
                    for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                        if (rply.randomAnsfunction[i].groupid == groupid && mainMsg[2] < rply.randomAnsfunction[i].randomAnsfunction.length && mainMsg[2] >= 0) {
                            let temp = rply.randomAnsfunction[i]
                            temp.randomAnsfunction.splice(mainMsg[2], 1)
                            //console.log('rply.randomAnsfunction: ', temp)
                            records.setrandomAnsfunction('randomAns', temp, () => {
                                records.get('randomAns', (msgs) => {
                                    rply.randomAnsfunction = msgs
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
                break;
            case /(^[.]drgm$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
                //
                //顯示列表
                //
                records.get('randomAns', (msgs) => {
                    rply.randomAnsfunction = msgs
                })
                if (groupid) {
                    let temp = 0;
                    if (rply.randomAnsfunction)
                        for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                            if (rply.randomAnsfunction[i].groupid == groupid) {
                                rply.text += '自定義關鍵字列表:'
                                for (var a = 0; a < rply.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                    temp = 1
                                    rply.text += ("\n") + a + '. ' + rply.randomAnsfunction[i].randomAnsfunction[a] + ("\n")
                                }
                            }
                        }
                    if (temp == 0) rply.text = '沒有已設定的關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示自定義關鍵字
                rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply
                break;
            case /(^[.]drgm$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
                //
                //RA使用抽選功能
                //
                let times = /^[.]ra(\d+|)/i.exec(mainMsg[0])[1] || 1
                if (times > 30) times = 30;
                if (times < 1) times = 1
                //console.log(times)
                if (groupid) {
                    //    console.log(mainMsg[1])
                    let temp = 0;
                    if (rply.randomAnsfunction)
                        for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                            if (rply.randomAnsfunction[i].groupid == groupid) {
                                // console.log(rply.randomAnsfunction[i])
                                //rply.text += '自定義關鍵字列表:'
                                for (let aa = 1; aa < mainMsg.length; aa++)
                                    for (var a = 0; a < rply.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                        if (rply.randomAnsfunction[i].randomAnsfunction[a][0].toLowerCase() == mainMsg[aa].toLowerCase()) {
                                            temp = 1
                                            let temptitle = rply.randomAnsfunction[i].randomAnsfunction[a][0];
                                            let tempcontact = [...rply.randomAnsfunction[i].randomAnsfunction[a]];
                                            tempcontact.shift();
                                            rply.text += temptitle + ' → ';
                                            let result = [];


                                            for (; result.length < times;) {
                                                result = result.concat(shuffle([...tempcontact]))
                                            }
                                            rply.text += result[0];
                                            for (let t = 1; t < times; t++) {
                                                rply.text += ' , ' + result[t];
                                            }
                                            rply.text += '\n'
                                        }

                                    }
                            }
                        }
                    if (temp == 0) rply.text = '沒有相關關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                return rply;
                break;
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