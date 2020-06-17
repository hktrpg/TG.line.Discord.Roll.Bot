try {
    var rply = {
        default: 'on',
        type: 'text',
        text: '',
        save: ''
    };
    const records = require('../modules/records.js');
    var gameName = function () {
        return '(公測中)儲存角色卡功能 .ch (add del show 自定關鍵字)'
    }
    var gameType = function () {
        return 'trpgcharacter:hktrpg'
    }
    var prefixs = function () {
        return [{
            first: /(^[.]char$)|(^[.]ch$)/ig,
            second: null
        }]
    }
    const characterName = new RegExp(/name\[.+?\]/, 'i');
    const characterState = new RegExp(/state\[.+?\]/, 'i');
    const characterRoll = new RegExp(/roll\[.+?\]/, 'i');
    const characterNotes = new RegExp(/notes\[.+?\]/, 'i');
    /*
    

.char add 的輸入格式,用來增建角色卡
.char add name[Sad]
state[HP:5/5;MP:3/3;SAN:50/99;護甲:6;]
roll[投擲:cc 80 投擲;空手 cc 50;]
notes[筆記:SAD;心靈支柱: 特質]

// state 可以進行增減
// notes 文字筆記
// roll 擲骰指令

如果沒有名字 會更新修正正在USE的角色卡
但沒有的話,  就會出錯
============

===
.char use 使用角色卡
.ch use sad
會自動使用名叫Sad 的角色卡
====

顯示SHOW 功能:

.ch show (顯示 名字 state 和roll) 
.ch shows  (顯示 名字 state,notes 和roll)
.ch show notes (顯示 名字 和notes)


角色名字
HP: 5/5 MP: 3/3 SAN: 50/90 護甲: 6
-------
投擲: cc 80 投擲 
空手: cc 50
-------
筆記: SAD
心靈支柱: 特質

======

功能 使用角色卡的state 和notes

.ch HP MP 顯示該內容 
HP 5/5 MP 3/3  

.ch HP -5 如果HP是State 自動減5 
.ch HP +5  如果HP是State 自動加5 如果是
.ch HP . +5  如果HP是State 後面的數字加5 變成5/10
.ch HP +5 +5  如果HP是State 前面和後面的數字加5 變成10/10

.ch set HP  10 直接把現在值變成10
.ch set HP  10 20 直接把現在值變成10 最大值變成20
.ch set HP  . 20 直接把現在值變成空白 最大值變成20

============
.ch 輸出指令
.ch  投擲
cc 80 投擲 
在指令中可以加上 +{HP} -{san}  (X)
在結果中會進行運算。


======

*/

    var getHelpMessage = function () {
        return "【儲存擲骰指令功能】" + "\
        \n 這是根據關鍵字來再現擲骰指令,\
        \n 例如輸入 .ch add  pc1鬥毆 cc 80 鬥毆 \
        \n 再輸入.ch pc1鬥毆  就會執行後方的指令\
        \n add 後面第一個是關鍵字, 可以是符號或任何字\
        \n P.S.如果沒立即生效 用.ch show 刷新一下\
    \n 輸入.ch add (關鍵字) (指令)即可增加關鍵字\
    \n 輸入.ch show 顯示所有關鍵字\
    \n 輸入.ch del(編號)或all 即可刪除\
    \n 輸入.ch  (關鍵字) 即可執行 \
    \n "
    }

    var initialize = function () {
        return rply;
    }

    var rollDiceCommand = function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
        rply.text = '';
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
                return rply;
                // .ch(0) ADD(1) TOPIC(2) CONTACT(3)
            case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) :
                //console.log('mainMsg: ', mainMsg)
                //增加資料庫
                //檢查有沒有重覆

                return rply;

            case /(^[.]ch$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //刪除資料庫


                return rply;
            case /(^[.]ch$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除資料庫
                return rply;

            case /(^[.]ch$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
                //顯示

                //顯示資料庫
                rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply
            case /(^[.]ch$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
                //顯示關鍵字
                //let times = /^[.]ch/.exec(mainMsg[0])[1] || 1
                //if (times > 30) times = 30;
                //if (times < 1) times = 1
                //console.log(times)

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