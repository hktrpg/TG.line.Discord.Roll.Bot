if (process.env.mongoURL) {
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
        return '(公測中)自定義回應功能 .ra (add del show 編號 標題)'
    }
    gameType = function () {
        return 'randomAns:hktrpg'
    }
    prefixs = function () {
        return [/^[.]ra$/ig,]
    }
    getHelpMessage = function () {
        return "【自定義回應功能】" + "\
        \n 這是根據關鍵字來隨機抽選功能,只要符合內容,\
        \n 例如.運勢,那麼只要字句中包括,就不會讓Bot有反應\
        \n 所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.\
        \n 另外不可擋b,k,bk, 只可以擋漢字,數字和英文,emoji\
        \n P.S.如果沒立即生效 用.bk show 刷新一下\
    \n 輸入.ra add xxxxx 即可增加關鍵字 每次一個\
    \n 輸入.ra show 顯示關鍵字\
    \n 輸入.ra del (編號)或all 即可刪除\
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
        console.log(/^add$/i.test(mainMsg[1]))
        console.log(/^[\u4e00-\u9fa5a-z0-9]+$/ig.test(mainMsg[2]))
        console.log(/^\S+$/ig.test(mainMsg[3]))
        console.log(/^\S+$/ig.test(mainMsg[4]))

        switch (true) {
            case /^add$/i.test(mainMsg[1]) && /^(([\u4e00-\u9fa5a-z0-9])|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))+$/ig.test(mainMsg[2]):
                //增加自定義關鍵字
                //(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])
                console.log('step 1: ')
                if (groupid && userrole >= 2 && mainMsg[3] && mainMsg[4]) {
                    ;
                    let temp = {
                        groupid: groupid,
                        randomAnsfunction: [mainMsg.slice(2)]
                    }
                    records.pushrandomAnsfunction('randomAns', temp, () => {
                        records.get('randomAns', (msgs) => {
                            rply.randomAnsfunction = msgs
                            console.log(rply);
                        })

                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有關鍵字.'
                    if (!mainMsg[3] && !mainMsg[4])
                        rply.text += ' 沒有自定應回應,至少兩個.'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有DM以上才可新增.'
                }
                return rply;

            case /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //刪除自定義關鍵字
                if (groupid && mainMsg[2] && rply.randomAnsfunction && userrole >= 2) {
                    for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                        if (rply.randomAnsfunction[i].groupid == groupid) {
                            let temp = rply.randomAnsfunction[i]
                            temp.randomAnsfunction = []
                            records.set('randomAns', temp, () => {
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
                        rply.text += '只有DM以上才可刪除. '
                }

                return rply;
            case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除自定義關鍵字
                if (groupid && mainMsg[2] && rply.randomAnsfunction && userrole >= 2) {
                    for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                        if (rply.randomAnsfunction[i].groupid == groupid && mainMsg[2] < rply.randomAnsfunction[i].randomAnsfunction.length && mainMsg[2] >= 0) {
                            let temp = rply.randomAnsfunction[i]
                            temp.randomAnsfunction.splice(mainMsg[2], 1)
                            //console.log(rply.randomAns[i])
                            records.set('randomAns', temp, () => {
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
                    if (groupid && userrole < 2)
                        rply.text += '只有DM以上才可刪除. '
                }
                return rply;

            case /^show$/i.test(mainMsg[1]):
                records.get('randomAns', (msgs) => {
                    rply.randomAnsfunction = msgs
                })
                if (groupid) {
                    let temp = 0;
                    for (var i = 0; i < rply.randomAnsfunction.length; i++) {
                        if (rply.randomAnsfunction[i].groupid == groupid) {
                            rply.text += '自定義關鍵字列表:'
                            for (var a = 0; a < rply.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + '. ' + rply.randomAnsfunction[i].randomAnsfunction[a]
                            }
                        }
                    }
                    if (temp == 0) rply.text = '沒有自定義關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示自定義關鍵字
                return rply;
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
}