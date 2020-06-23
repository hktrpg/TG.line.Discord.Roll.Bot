"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: '',
    characterRoll: ''
};
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
var gameName = function () {
    return '(公測中)角色卡功能 .char (add delete use nonuse) .ch (set show showall)'
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
const regexName = new RegExp(/name\[(.*?)\]/, 'i');
const regexState = new RegExp(/state\[(.*?)\]/, 'i');
const regexRoll = new RegExp(/roll\[(.*?)\]/, 'i');
const regexNotes = new RegExp(/notes\[(.*?)\]/, 'i');
const re = new RegExp(/(.*?)\:(.*?)(\;|$)/, 'ig');
const limitArr = [4, 10, 30, 100, 200, 999]
const opt = {
    upsert: true,
    runValidators: true
}

/*
TODO?
COC export to roll20?

*/
/*
以個人為單位, 一張咭可以在不同的群組使用    
.char add 的輸入格式,用來增建角色卡
.char add name[Sad]
state[HP:5/5;MP:3/3;SAN:50/99;護甲:6]
roll[投擲:cc 80 投擲;空手鬥毆: cc 50]
notes[筆記:SAD;心靈支柱: 特質]

// state 可以進行增減
// notes 文字筆記
// roll 擲骰指令

如果沒有名字 會更新修正正在USE的角色卡
但沒有的話,  就會出錯
============


===
.char use 使用角色卡
.char use sad
會自動使用名叫Sad 的角色卡
====
.char nonuse 
.char use 
會取消在此群組使用角色卡

====
.char delete  角色卡
.char delete Sad
刪除角色卡

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

.ch set HP  10 直接把現在值變成10
.ch set HP  10/20 直接把現在值變成10 最大值變成20



.ch HP MP 顯示該內容 
HP 5/5 MP 3/3  

.ch HP -5 如果HP是State 自動減5 
.ch HP +5  如果HP是State 自動加5 如果是



============
.ch 輸出指令
.ch  投擲
cc 80 投擲 
在指令中可以加上 +{HP} -{san}  
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

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
    rply.text = '';
    let filter = {};
    let doc = {};
    let docSwitch = {};
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
            // .ch(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            let Card = await analysicInputCharacterCard(inputStr); //分析輸入的資料
            if (!Card.name) {
                rply.text = '沒有輸入角色咭名字，請重新整理內容 格式為 name[XXXX]'
            }
            /*
            只限四張角色卡.
            使用VIPCHECK
            */
            rply.text = await VIP.viplevelCheck(userid, limitArr)
            if (rply.text) {
                return rply;
            }

            filter = {
                id: userid,
                name: new RegExp(Card.name, "i")
            }
            //取得本來的資料, 如有重覆, 以新的覆蓋

            doc = await schema.characterCard.findOne(filter);
            //把舊和新的合併
            if (doc) {
                doc.name = Card.name;
                Card.state = await Merge(doc.state, Card.state, 'name');
                Card.roll = await Merge(doc.roll, Card.roll, 'name');
                Card.notes = await Merge(doc.notes, Card.notes, 'name');
            }
            try {
                await schema.characterCard.updateOne(filter,
                    Card, opt);
            } catch (error) {
                console.log('新增角色卡失敗: ', error)
                rply.text = '新增角色卡失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = await showCharacter(Card, 'addMode');
            return rply;

        case /(^[.]char$)/i.test(mainMsg[0]) && /^use$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            filter = {
                id: userid,
                name: new RegExp(mainMsg[2], "i")
            }
            doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡'
                return rply
            }
            try {
                await schema.characterGpSwitch.findOneAndUpdate({
                    gpid: channelid || groupid,
                    id: userid,
                }, {
                    name: doc.name,
                    cardId: doc._id
                }, opt);
            } catch (error) {
                console.log('ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }

            rply.text = '修改成功\n現在使用角色卡: ' + doc.name;
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^nonuse$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            try {
                await schema.characterGpSwitch.findOneAndUpdate({
                    gpid: channelid || groupid,
                    id: userid,
                }, {
                    name: '',
                    cardId: ''
                }, opt);
            } catch (error) {
                console.log('ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }
            rply.text = '修改成功。\n現在這群組沒有使用角色卡，.ch 沒有效果。'
            return rply;

        case /(^[.]char$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            filter = {
                id: userid,
                name: mainMsg[2]
            }

            doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡, 刪除角色卡需要名字大小階完全相同'
                return rply
            }
            try {
                let filterRemove = {
                    cardId: doc._id
                }
                await schema.characterCard.findOneAndRemove(filterDelete);
                await schema.characterGpSwitch.deleteMany(filterRemove);
            } catch (error) {
                console.log('刪除角色卡失敗: ', error)
                rply.text = '刪除角色卡失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除角色卡成功: ' + doc.name
            return rply;

        case /(^[.]ch$)/i.test(mainMsg[0]) && /^set$/i.test(mainMsg[1]) && /^\S+$/i.test(mainMsg[2]) && /^\S+$/i.test(mainMsg[3]):
            //更新功能
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            /**
             * 流程
             * .ch 功能需要在charactergpswitches 中, 找出現在在使用那張角色卡
             * 再用charactergpswitches 中的名字, 到charactercard 使用那張咭的資料
             * 
             * 
             * SET 直接改變數據
             * 
             */

            filter = {
                id: userid,
                gpid: channelid || groupid,
            }

            docSwitch = await schema.characterGpSwitch.findOne(
                filter);
            if (docSwitch && docSwitch.cardId) {
                doc = await schema.characterCard.findOne({
                    _id: docSwitch.cardId
                });
            } else {
                rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記"
            }
            if (doc) {
                let useTarget = new RegExp(mainMsg[0] + '\\s+' + mainMsg[1] + '\\s+' + mainMsg[2])
                let useName = mainMsg[2];
                let useItemA = inputStr.replace(useTarget, '').replace(/^\s+/, '')
                let useCard = [{
                    name: useName,
                    itemA: useItemA
                }]
                doc.state = await Merge(doc.state, useCard, 'name', true);
                doc.roll = await Merge(doc.roll, useCard, 'name', true);
                doc.notes = await Merge(doc.notes, useCard, 'name', true);
                try {
                    let a = await doc.save();
                    if (a) {
                        rply.text = a.name + ' 更新角色卡成功'
                        return rply;
                    }
                } catch (error) {
                    console.log('更新角色卡失敗: ', error)
                    rply.text = '更新角色卡失敗'
                    return rply;
                }
            }
            return;


        case /(^[.]ch$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            filter = {
                id: userid,
                gpid: channelid || groupid,
            }

            docSwitch = await schema.characterGpSwitch.findOne(
                filter);
            if (docSwitch && docSwitch.cardId) {
                doc = await schema.characterCard.findOne({
                    _id: docSwitch.cardId
                });
            } else {
                rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記"
                return rply;
            }
            rply.text = await showCharacter(doc, 'showMode');
            return rply;
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^showall$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            filter = {
                id: userid,
                gpid: channelid || groupid,
            }

            docSwitch = await schema.characterGpSwitch.findOne(
                filter);
            if (docSwitch && docSwitch.cardId) {
                doc = await schema.characterCard.findOne({
                    _id: docSwitch.cardId
                });
            } else {
                rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記"
                return rply;
            }
            rply.text = await showCharacter(doc, 'showAllMode');
            return rply;


        case /(^[.]ch$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            filter = {
                id: userid,
                gpid: channelid || groupid,
            }

            docSwitch = await schema.characterGpSwitch.findOne(
                filter);
            if (docSwitch && docSwitch.cardId) {
                doc = await schema.characterCard.findOne({
                    _id: docSwitch.cardId
                });
            } else {
                rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記"
                return rply;
            }
            //顯示關鍵字
            /**
             * 對mainMsg 1以後的內容全部進行對比
             * 如果是roll的, 就變成擲骰MODE(最優先)
             * 在roll指令中, 如果有{\w+} 轉換成數字
             * 沒有的話, 再對比所有, 如果有state 的內容
             * 而且後面跟著數字 +3 -3, 會進行+-運算
             * 然後顯示State
             * 如果只有一個, 則顯示該項目
             * 
             */

            rply.text = await mainCharacter(doc, inputStr, mainMsg)
            return rply;

        default:
            break;

    }
}

async function mainCharacter(doc, inputStr, mainMsg) {
    let regex = /\s+/
    let newInput = inputStr.replace(mainMsg[0], '').replace(regex, '')
    //如果是roll的, 就變成擲骰MODE(最優先)
    console.log(doc)
    const findState = doc.state.find(element =>
        element.name == newInput
    );
    console.log(findState)
    return findState;



}


async function showCharacter(Card, mode) {
    /*
    角色名字
    HP: 5/5 MP: 3/3 SAN: 50/90 護甲: 6
    -------
    投擲: cc 80 投擲 
    空手: cc 50
    -------
    筆記: SAD
    心靈支柱: 特質

    ======
    */
    let returnStr = '';
    if (mode == 'addMode') {
        returnStr += '新增/修改成功\n'
    }
    returnStr += Card.name + '\n';
    let a = 1
    if (Card.state.length > 0) {
        for (let i = 0; i < Card.state.length; i++) {
            if ((a) % 4 == 0 && (Card.state[i].itemA || Card.state[i].itemB)) {
                returnStr += '\n'
            }
            returnStr += (Card.state[i].itemA) ? Card.state[i].name + ': ' + Card.state[i].itemA : '';
            returnStr += (Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            if (Card.state[i].itemA || Card.state[i].itemB) {
                a++
                returnStr += ' '
            }
        }
        returnStr += '\n-------\n'
    }

    if (Card.roll.length > 0) {
        for (let i = 0; i < Card.roll.length; i++) {
            returnStr += (Card.roll[i].itemA) ? Card.roll[i].name + ': ' + Card.roll[i].itemA + '\n' : '';

        }
        returnStr += '-------\n'
    }
    if (mode == 'addMode' || mode == 'showAllMode')
        if (Card.notes.length > 0) {
            for (let i = 0; i < Card.notes.length; i++) {
                returnStr += (Card.notes[i].itemA) ? Card.notes[i].name + ': ' + Card.notes[i].itemA + '\n' : '';
            }

            returnStr += '-------'
        }
    return returnStr;
}
async function analysicInputCharacterCard(inputStr) {
    let characterName = (inputStr.match(regexName)) ? inputStr.match(regexName)[1] : '';
    let characterStateTemp = (inputStr.match(regexState)) ? inputStr.match(regexState)[1] : '';
    let characterRollTemp = (inputStr.match(regexRoll)) ? inputStr.match(regexRoll)[1] : '';
    let characterNotesTemp = (inputStr.match(regexNotes)) ? inputStr.match(regexNotes)[1] : '';

    let characterState = (characterStateTemp) ? await analysicStr(characterStateTemp, true) : [];
    let characterRoll = (characterRollTemp) ? await analysicStr(characterRollTemp, false) : [];
    let characterNotes = (characterNotesTemp) ? await analysicStr(characterNotesTemp, false) : [];

    //Remove duplicates from an array of objects in JavaScript
    // if (characterState)
    characterState = characterState.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    //if (characterRoll)
    characterRoll = characterRoll.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    //if (characterNotes)
    characterNotes = characterNotes.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)

    let character = {
        name: characterName,
        state: characterState,
        roll: characterRoll,
        notes: characterNotes
    }

    return character;
}

async function analysicStr(inputStr, state) {
    let character = [];
    let myArray;
    while ((myArray = re.exec(inputStr)) !== null) {
        if (myArray[2].match(/\w+\/\w+/) && state) {
            let temp2 = /(\w+)\/(\w+)/.exec(myArray[2])
            myArray[2] = temp2[1]
            myArray[3] = temp2[2]
        }

        //防止誤輸入
        myArray[3] = (myArray[3] == ';') ? '' : myArray[3];
        myArray[1] = myArray[1].replace(/^\s+/, '').replace(/\s+$/, '');
        myArray[2] = myArray[2].replace(/^\s+/, '').replace(/\s+$/, '');
        myArray[3] = myArray[3].replace(/^\s+/, '').replace(/\s+$/, '');

        if (state)
            character.push({
                name: myArray[1],
                itemA: myArray[2],
                itemB: myArray[3]
            })
        else
            character.push({
                name: myArray[1],
                itemA: myArray[2]
            })
    }

    return character;
}
/*
character = {
            gpid: String,
            id: String,
            acrossGroup: boolem,
            active:boolem, 
            acrossActive:boolem,
            name: String,
            nameShow:boolem,
            state: [{name:String,itemA:String,itemB:String}],
            roll: [{name:String,itemA:String}],
            notes: [{name:String,itemA:String}]

        }
*/

//https://stackoverflow.com/questions/7146217/merge-2-arrays-of-objects
async function Merge(target, source, prop, updateMode) {
    /**
     * target 本來的資料
     * source 新資料
     * prop  以什麼項目作比較對像
     * updateMode True 只會更新已有資料 False 沒有的話, 加上去
     */
    if (!target) target = []
    if (!source) source = []
    const mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop].match(new RegExp(targetElement[prop], 'i'));
            })
            if (updateMode)
                targetElement ? Object.assign({}, targetElement, sourceElement) : '';
            else
                targetElement ? Object.assign({}, targetElement, sourceElement) : target.push(sourceElement);
        })
    }

    mergeByProperty(target, source, prop);
    return target;

}



module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};