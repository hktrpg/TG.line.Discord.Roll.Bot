if (process.env.mongoURL) {
    var rply = {
        default: 'on',
        type: 'text',
        text: ''
    };


    /*
    var unforgivable = [
            "password",
            "12345678",
            "8675309",
            "[a-z]{8,}",
            "qwerty",
            "asdfg",
            "qazwsx",
            "zxcvb",
            "letmein",
            "trustno1",
            "omnicloud",
            "monkey"
        ];
        var re = new RegExp(unforgivable.join("|"), "i");
     */

    //const db = require('../modules/db-connector.js');
    //const schema = require('../modules/schema.js'); // 新增這行

    //const mongoose = require('mongoose');
    const records = require('../modules/records.js'); // 新增這行

    //var save;
    records.get('block', (msgs) => {
        //console.log('exports.records.get(): 0 0 stop', msgs);
        rply.save = msgs
        // console.log(rply)
    })
    gameName = function () {
        return '擲骰開關功能 .block (add del show)'
    }

    gameType = function () {
        return 'Block:hktrpg'
    }
    prefixs = function () {
        return [/^[.]block$/ig, ]
    }
    getHelpMessage = function () {
        return "【Block】" + "\
        \n 這是根據關鍵字來開關功能,只要符合內容,\
        \n 例如運勢,那麼只要字句中包括,就不會讓Bot有反應\
        \n 所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.\
    \n 輸入.block add xxxxx 即可增加關鍵字 每次一個\
    \n 輸入.block show 顯示關鍵字\
    \n 輸入.block del (編號) 即可刪除\
    \n "
    }
    initialize = function () {
        return rply;
    }

    rollDiceCommand = function (inputStr, mainMsg, groupid, userid) {
        rply.text = '';
        switch (true) {
            /*
            case /^dev$/i.test(mainMsg[1]):
                //rply.text = exports.records.get();
                //console.log(exports.records.get())
                rply.text = mainMsg[3];
                records.push(mainMsg[2], rply, 'blockfunction', rply.blockfunction)
                console.log('dev')
                records.get((msgs) => {
                    console.log('exports.records.get():', msgs.toString());
                })
                console.log('save:  ', save)
                break;
                */
            case /^add$/i.test(mainMsg[1]) && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/ig.test(mainMsg[2]):
                //增加阻擋用關鍵字
                console.log('step1: ', (groupid && mainMsg[2]))
                if (groupid && mainMsg[2]) {
                    let temp = {
                        groupid: groupid,
                        blockfunction: mainMsg[2]
                    }
                    console.log('step2: ', (temp))

                    records.pushblockfunction('block', temp, 'blockfunction', temp.blockfunction)


                    rply.text = '新增成功: ' + mainMsg[2]
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += '沒有關鍵字. '
                    if (!groupid)
                        rply.text += '不在群組. '
                }

                records.get('block', (msgs) => {
                    //console.log('exports.records.get(): 0 0 stop', msgs);
                    rply.save = msgs
                    //  console.log('new: 01: ', rply)
                })
                return rply;
            case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除阻擋用關鍵字
                console.log('mainMsg[2]:', /^\d+$/i.test(mainMsg[2]))
                if (groupid && mainMsg[2] && rply.save) {
                    for (var i = 0; i < rply.save.length; i++) {
                        console.log('step[2]: ', rply.save.length)
                        console.log('step[2]2: ', rply.save[i].groupid == groupid)
                        console.log('step[2]3: ', rply.save[i].blockfunction.length)
                        console.log('step[2]4: ', mainMsg[2] < rply.save[i].blockfunction.length)
                        if (rply.save[i].groupid == groupid && mainMsg[2] < rply.save[i].blockfunction.length && mainMsg[2] >= 0) {
                            console.log('step[3]:', rply.save[i])
                            let temp = rply.save[i]
                            temp.blockfunction.splice(mainMsg[2], 1)
                            //console.log(rply.save[i])
                            records.set('block', temp)
                            console.log('rply.save[i].blockfunction.length ', rply.save[i].blockfunction.length)
                            rply.text = '刪除成功: ' + mainMsg[2]
                            console.log('step[4]: 刪除成功?', rply.save[i].blockfunction.length)



                        }
                    }

                    //records.push('block', temp)

                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += '沒有關鍵字. '
                    if (!groupid)
                        rply.text += '不在群組. '
                }
                records.get('block', (msgs) => {
                    //console.log('exports.records.get(): 0 0 stop', msgs);
                    rply.save = msgs
                    //console.log('new: ', rply)
                })
                return rply;
            case /^show$/i.test(mainMsg[1]):
                if (groupid) {
                    console.log(groupid)
                    let temp = 0;
                    for (var i = 0; i < rply.save.length; i++) {
                        if (rply.save[i].groupid == groupid) {
                            rply.text += '阻擋用關鍵字列表:'
                            for (var a = 0; a < rply.save[i].blockfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + '. ' + rply.save[i].blockfunction[a]
                            }
                        }
                    }
                    if (temp == 0) rply.text = '沒有阻擋用關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示阻擋用關鍵字
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

    // socket.emit("chatRecord", records.get()); // 砍掉這行
    // 改成下面這個
}