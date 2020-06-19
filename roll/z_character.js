"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: '',
    save: ''
};
const schema = require('../modules/core-schema.js');
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
/*
以個人為單位, 一張咭可以在不同的群組使用    


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

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    rply.text = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
            // .ch(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /\S+/.test(mainMsg[2]):
            let Card = await analysicInputCharacterCard(inputStr); //分析輸入的資料
            console.log('Card: ', Card)
            if (!Card.name) {
                rply.text = '沒有輸入角色咭名字，請重新整理內容 格式為 name[XXXX]'
                return rply;
            }
            /*
            只限六張角色卡.
            */
            let check = await schema.characterCard.find({
                id: userid
            });
            if (check.length > 6) {
                rply.text = '每人角色卡上限為6'
                return rply;
            }



            //取得本來的資料, 如有重覆, 以新的覆蓋
            let filter = {
                gpid: groupid,
                id: userid,
                name: Card.name
            }
            let doc = await schema.characterCard.findOne({
                filter
            });
            //把舊和新的合併
            if (doc) {
                Card.state = await Merge(doc.state, Card.state, 'name');
                Card.roll = await Merge(doc.roll, Card.roll, 'name');
                Card.notes = await Merge(doc.notes, Card.notes, 'name');
            }
            try {
                await schema.characterCard.updateOne(filter, Card, {
                    upsert: true
                });
            } catch (error) {
                console.log('新增角色卡失敗: ', error)
                rply.text = '新增角色卡失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = await showCharecter(Card);
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
    let returnStr = '';
    returnStr = Card.name + '\n';

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
        if (myArray[2].match(/\w\/\w/) && state) {
            let temp2 = /(\w)\/(\w)/.exec(myArray[2])
            myArray[2] = temp2[1]
            myArray[3] = temp2[2]
        }
        myArray[3] = (myArray[3] == ';') ? '' : myArray[3];
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
async function Merge(obj1, obj2, prop) {
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
    //var merge = (obj1, obj2, prop) => obj1.filter( aa => ! obj2.find ( bb => aa[p] === bb[p]) ).concat(obj2);
    if (!obj1) obj1 = []
    if (!obj2) obj2 = []
    var reduced = obj1.filter(aitem => !obj2.find(bitem => aitem[prop] === bitem[prop]))
    return reduced.concat(obj2);

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