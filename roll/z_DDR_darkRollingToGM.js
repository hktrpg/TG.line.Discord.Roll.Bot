"use strict";
if (!process.env.mongoURL) {
    return;
}
const records = require('../modules/records.js');
var trpgDarkRollingfunction = {};
records.get('trpgDarkRolling', (msgs) => {
    trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
})
var gameName = function () {
    return '(公測中)暗骰GM功能 .drgm (addgm del show) dr ddr dddr'
}
var gameType = function () {
    return 'trpgDarkRolling:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]drgm$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【暗骰GM功能】.drgm(addgm del show) dr ddr dddr" + "\n\
這是讓你可以私骰GM的功能\n\
想成為GM的人先輸入.drgm addgm\n\
然後別人DDR 或DDDR (指令)即可以私訊給這位GM\n\
例如輸入 ddr cc 80 鬥毆 \n\
就會把結果私訊GM及自己\n\
例如輸入 dddr cc 80 鬥毆 \n\
就會把結果只私訊GM\n\
P.S.如果沒立即生效 用.drgm show 刷新一下\n\
輸入.drgm addgm (代名) 即可成為GM,如果想化名一下,\n\
可以在addgm 後輸入一個名字, 暗骰時就會顯示\n\
不輸入就會顯示原名\n\
輸入.drgm show 顯示所有GM\n\
輸入.drgm del(編號)或all 即可刪除\n\
輸入dr  (指令) 私訊自己 \n\
輸入ddr (指令) 私訊GM及自己\n\
輸入dddr(指令) 私訊GM\n\
"
}
var initialize = function () {
    return trpgDarkRollingfunction;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    let checkifsamename = 0;
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
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^addgm$/i.test(mainMsg[1]):
            //
            //增加自定義關鍵字
            // .drgm[0] addgm[1] 代替名字[2]  
            checkifsamename = 0
            if (channelid)
                groupid = channelid
            //因為在DISCROD以頻道作單位
            if (groupid && userrole >= 1 && userid) {
                if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                    for (var i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                        if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                            // console.log('checked1')
                            for (var a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid == userid) {
                                    //   console.log('checked')
                                    checkifsamename = 1
                                }
                            }
                        }
                    }
                let temp = {
                    groupid: groupid,
                    trpgDarkRollingfunction: [{
                        userid: userid,
                        diyName: mainMsg[2] || "",
                        displayname: displayname
                    }]
                    //|| displayname

                }
                //console.log(temp)
                if (checkifsamename == 0) {
                    records.pushtrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                        records.get('trpgDarkRolling', (msgs) => {
                            trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                            // console.log(rply);
                        })

                    })
                    rply.text = '新增成功: ' + (mainMsg[2] || displayname ||
                        "")
                } else rply.text = '新增失敗. 你已在GM列表'
            } else {
                rply.text = '新增失敗.'
                if (!userid)
                    rply.text += ' 沒有個人ID....如果是LINE的話, 要先LIKE 這個BOT.'
                if (!groupid)
                    //&& !channelid
                    rply.text += ' 不在群組.'
                if (groupid && userrole < 1)
                    rply.text += ' 只有GM以上才可新增.'
            }
            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //    
            //刪除所有自定義關鍵字
            //
            if (channelid)
                groupid = channelid
            if (!mainMsg[2]) return;
            if (groupid && mainMsg[2] && trpgDarkRollingfunction.trpgDarkRollingfunction && userrole >= 2) {
                for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                        let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                        temp.trpgDarkRollingfunction = []
                        records.settrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                            records.get('trpgDarkRolling', (msgs) => {
                                trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                            })
                        })
                        rply.text = '刪除所有在表GM'
                    }
                }
            } else {
                rply.text = '刪除失敗.'
                if (!groupid)
                    rply.text += '不在群組. '
                if (groupid && userrole < 2)
                    rply.text += '只有GM以上才可刪除所有在表GM. '
            }

            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //
            //刪除GM
            //
            if (channelid)
                groupid = channelid
            if (groupid && mainMsg[2] && trpgDarkRollingfunction.trpgDarkRollingfunction && userrole >= 1) {
                for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid && mainMsg[2] < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length && mainMsg[2] >= 0) {
                        let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                        temp.trpgDarkRollingfunction.splice(mainMsg[2], 1)
                        //console.log('trpgDarkRollingfunction.trpgDarkRollingfunction: ', temp)
                        records.settrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                            records.get('trpgDarkRolling', (msgs) => {
                                trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                            })
                        })
                    }
                    rply.text = '刪除成功: ' + mainMsg[2]
                }
            } else {
                rply.text = '刪除失敗.'
                if (!mainMsg[2])
                    rply.text += '沒有已註冊GM. '
                if (!groupid)
                    rply.text += '不在群組. '
                if (groupid && userrole < 1)
                    rply.text += '只有GM以上才可刪除. '
            }
            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            if (channelid)
                groupid = channelid
            records.get('trpgDarkRolling', (msgs) => {
                trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
            })
            if (groupid) {
                let temp = 0;
                if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                    for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                        if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                            rply.text += '已註冊暗骰GM列表:'
                            for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + '. ' + (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName || trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname) + ("\n")
                            }
                        }
                    }
                if (temp == 0) rply.text = '沒有已註冊的暗骰GM. '
            } else {
                rply.text = '不在群組. '
            }
            //顯示GM
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
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