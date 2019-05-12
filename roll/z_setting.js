try {
    var rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    /*  1. 顯示USER ID (showid)
        2. 設定如果暗骰, 也私訊給自己(too)(dr 普通私 drgm同時私GM drto只有GM收到 )
        3. 設定擲骰前有名字(name XXXXX)
        4. 更改PL 身份 (GM XXXXXX)
        
    */
    const records = require('../modules/records.js');
    records.get('GroupSetting', (msgs) => {
        rply.GroupSettingfunction = msgs
    })
    gameName = function () {
        return '(公測中)設定功能 .set (showid to name GM)'
    }
    gameType = function () {
        return 'GroupSetting:hktrpg'
    }
    prefixs = function () {
        return [/(^[.]set$)/ig,]
    }
    getHelpMessage = function () {
        return "【資料庫功能】" + "\
        \n 這是根據關鍵字來顯示數據的,\
        \n 例如輸入 .set add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 \
        \n 再輸入.set 九大陣營  守序善良 (...太長省略) 中立邪惡 混亂邪惡\
        \n add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji\
        \n P.S.如果沒立即生效 用.set show 刷新一下\
    \n 輸入.set add (關鍵字) (內容)即可增加關鍵字\
    \n 輸入.set show 顯示所有關鍵字\
    \n 輸入.set del(編號)或all 即可刪除\
    \n 輸入.set  (關鍵字) 即可顯示 \
    \n 如使用輸入.setp 會變成全服版,全服可看, 可用add show功能 \
    \n "
    }
    initialize = function () {
        return rply;
    }

    rollDiceCommand = function (inputStr, mainMsg, groupid, userid, userrole) {
        records.get('GroupSetting', (msgs) => {
            rply.GroupSettingfunction = msgs
        })
        rply.text = '';
        switch (true) {
            // .set(0) ADD(1) TOPIC(2) CONTACT(3) 
            case /(^[.]set$)/i.test(mainMsg[0]) && /^showid$/i.test(mainMsg[1]):
                //顯示USER ID (showid)
                rply.text = userid;
                return rply;

            case /(^[.]set$)/i.test(mainMsg[0]) && /^too$/i.test(mainMsg[1]):
                //設定如果暗骰, 也私訊給自己(too)(dr 普通私 drgm同時私GM drto只有GM收到 )
                let existed = false
                if (groupid && userrole >= 2) {
                    let temp = {
                        groupid: groupid,
                        togm: []
                    }
                    if (rply.GroupSettingfunction)
                        for (var i = 0; i < rply.GroupSettingfunction.length; i++) {
                            if (rply.GroupSettingfunction[i].groupid == groupid) {
                                // console.log('checked1')
                                temp = rply.GroupSettingfunction[i];
                                existed = true
                                //a.push('addd')
                            }
                        }

                    if (existed == false) {
                        temp.togm = [userid]
                        records.pushGroupSettingfunction('GroupSetting', temp, () => {
                            records.get('GroupSetting', (msgs) => {
                                rply.GroupSettingfunction = msgs
                                // console.log(rply);
                            })

                        })
                        rply.text = '新增成功: ' + mainMsg[2]
                    } else rply.text = '新增失敗. 重複標題'
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有標題.'
                    if (!mainMsg[3])
                        rply.text += ' 沒有內容'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 2)
                        rply.text += ' 只有GM以上才可新增.'
                }
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
} catch (e) {
    console.log(e)
}