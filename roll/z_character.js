"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: '',
    save: ''
};
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
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

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    rply.text = '';

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
            只限六張角色卡.
            使用VIPCHECK
            */
            rply.text = await VIP.viplevelCheck(userid, limitArr)
            if (rply.text) {
                return rply;
            }

            let filter = {
                id: userid,
                name: Card.name
            }
            //取得本來的資料, 如有重覆, 以新的覆蓋

            let doc = await schema.characterCard.findOne(filter);
            //把舊和新的合併
            if (doc) {
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
            rply.text = await showCharecter(Card);
            return rply;

        case /(^[.]char$)/i.test(mainMsg[0]) && /^use$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            let filterUse = {
                id: userid,
                name: mainMsg[2]
            }
            let docUse = await schema.characterCard.findOne(filterUse);
            if (!docUse) {
                rply.text = '沒有此角色卡'
                return rply
            }

            await schema.characterGpSwitch.findOneAndUpdate({
                gpid: channelid || groupid,
                id: userid,
            }, {
                name: mainMsg[2]
            }, opt);
            rply.text = '修改成功\n現在使用角色卡: ' + mainMsg[2];
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^nonuse$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }
            await schema.characterGpSwitch.findOneAndUpdate({
                gpid: channelid || groupid,
                id: userid,
            }, {
                name: ''
            }, opt);
            rply.text = '修改成功'
            return rply;

        case /(^[.]char$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }


            let filterDelete = {
                id: userid,
                name: mainMsg[2]
            }

            let docDelete = await schema.characterCard.findOne(filterDelete);
            if (!docDelete) {
                rply.text = '沒有此角色卡'
                return rply
            }
            try {
                await schema.characterCard.findOneAndRemove(filterDelete);
                await schema.characterGpSwitch.deleteMany(filterDelete);
            } catch (error) {
                console.log('刪除角色卡失敗: ', error)
                rply.text = '刪除角色卡失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除角色卡成功: ' + mainMsg[2]
            return rply;

        case /(^[.]ch$)/i.test(mainMsg[0]) && /^set$/i.test(mainMsg[1]) && /^\S$/i.test(mainMsg[2]):
            //修改
            if (!groupid) {
                rply.text = '不在群組'
                return rply
            }



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

async function showCharecter(Card) {
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
    let returnStr = '新增/修改成功\n';
    returnStr += Card.name + '\n';
    let a = 1
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
    if (Card.state.length > 0)
        returnStr += '\n-------\n'
    for (let i = 0; i < Card.roll.length; i++) {
        returnStr += (Card.roll[i].itemA) ? Card.roll[i].name + ': ' + Card.roll[i].itemA + '\n' : '';

    }
    if (Card.roll.length > 0)
        returnStr += '-------\n'
    for (let i = 0; i < Card.notes.length; i++) {
        returnStr += (Card.notes[i].itemA) ? Card.notes[i].name + ': ' + Card.notes[i].itemA + '\n' : '';
    }
    if (Card.notes.length > 0)
        returnStr += '-------'
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

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};
//https://stackoverflow.com/questions/7146217/merge-2-arrays-of-objects
async function Merge(target, source, prop) {
    /*var odd = [
        { name : "1", arr: "in odd" },
        { name : "3", arr: "in odd" }
    ];

    var even = [
        { name : "1", arr: "in even" },
        { name : "2", arr: "in even" },
        { name : "4", arr: "in even" }
    ];
    */
    if (!target) target = []
    if (!source) source = []
    const mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop] === targetElement[prop];
            })
            targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        })
    }

    mergeByProperty(target, source, prop);
    return target;

}


/*
https://js.do/code/457118
<script>
    const regexName = new RegExp(/name\[(.*?)\]/, 'i');
    const regexState = new RegExp(/state\[(.*?)\]/, 'i');
    const regexRoll = new RegExp(/roll\[(.*?)\]/, 'i');
    const regexNotes = new RegExp(/notes\[(.*?)\]/, 'i');
let characterName 
        let characterStateTemp 
        let characterRollTemp 
       let characterNotesTemp 
       
       
        const re = new RegExp(/(.*?)\:(.*?)(\;|$)/, 'ig');
        
        const inputStr = '.char add name[hi] state[hp:;san:36/99;str:90;str:90] roll[格鬥:cc 80 鬥歐;sc: cc {san}] note[筆記:這是Demo]'
    try{
     characterName = inputStr.match(regexName)[1]
         characterStateTemp = inputStr.match(regexState)[1]
         characterRollTemp = inputStr.match(regexRoll)[1]
        characterNotesTemp = inputStr.match(regexNotes)[1]
}
catch(error){}
let temp;
let characterState=[];
let myArray;
while (( myArray = re.exec(characterStateTemp)) !== null) {
if(myArray[2].match(/\w\/\w/)){
let temp2 = /(\w)\/(\w)/.exec(myArray[2])
document.write()
myArray[2] = temp2[1]
myArray[3] = temp2[2]
}
myArray[3]= (myArray[3] ==';' )? '':myArray[3];
  characterState.push({name:myArray[1],stateA:myArray[2],stateB:myArray[3]})
}

document.write('characterStateTemp===',characterStateTemp+"<br>"+characterRollTemp+"<br>"+characterNotesTemp+"<br>")
document.write(JSON.stringify(characterState)+"<br>")

</script>


*/