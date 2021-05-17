"use strict";
if (!process.env.mongoURL) {
    return;
}
var variables = {};
const rollDice = require('./rollbase').rollDiceCommand;
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
const limitArr = [4, 20, 20, 30, 30, 99, 99, 99];
var gameName = function () {
    return '事件功能 .event (add edit show delete) .evt (event 任何名字)'
}
var gameType = function () {
    return 'Funny:trpgevent:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]event$)|(^[.]evt$)/ig,
        second: null
    }]
}
const regexName = new RegExp(/name\[(.*?)\]~/, 'i');
const regexState = new RegExp(/state\[(.*?)\]~/, 'i');
const regexRoll = new RegExp(/roll\[(.*?)\]~/, 'i');
const regexNotes = new RegExp(/notes\[(.*?)\]~/, 'i');
const re = new RegExp(/(.*?):(.*?)(;|$)/, 'ig');
const opt = {
    upsert: true,
    runValidators: true
}
const convertRegex = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

/*
TODO?
COC export to roll20?

*/


var getHelpMessage = function () {
    return "【事件功能】" + "\n\
    經由新增的事件 可以增加減少EXP\n\
目標是文字團可以快速擲骰，及更新角色狀態。\n\
\n\
https://github.com/hktrpg/TG.line.Discord.Roll.Bot/wiki/Character-Card"
}

var initialize = function () {
    return variables;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    channelid
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: '',
        characterReRoll: false,
        characterName: '',
        characterReRollName: ''
    };
    let filter = {};
    let doc = {};
    let docSwitch = {};
    let Card = {};
    let temp;
    let tempMain = {};
    let lv;
    let limit = limitArr[0];
    let check;
    /**
     * .event
     * .event add 事件    新增事件
     * .event delete 事件  刪除事件
     * .event show  空白/ (事件名稱)
     * 空白顯示列表  
     * .evt 
     */
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
            // .ch(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            Card = await analysicInputCharacterCard(inputStr); //分析輸入的資料
            if (!Card.name) {
                rply.text = '沒有輸入角色咭名字，請重新整理內容 格式為 \n.char add name[XXXX]~ \nstate[HP:15/15;MP:6/6;]~\nroll[投擲:cc 80 投擲;鬥毆:cc 40 鬥毆;]~\nnotes[心靈支柱: 無;notes:這是測試,請試試在群組輸入 .char use Sad;]~\n'
                return rply;
            }
            /*
            只限四張角色卡.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckUser(userid);
            limit = limitArr[lv];
            check = await schema.characterCard.find({
                id: userid
            });
            if (check.length >= limit) {
                rply.text = '你的角色卡上限為' + limit + '張' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply
            }
            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(Card.name) + '$', "i")
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
                console.log('新增角色卡 GET ERROR: ', error)
                rply.text = '新增角色卡失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = await showCharacter(Card, 'addMode');
            return rply;

        case /(^[.]char$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            filter = {
                id: userid,
                name: inputStr.replace(/^\.char\s+delete\s+/ig, '')
            }

            doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡. 注意:刪除角色卡需要名字大小寫完全相同'
                return rply
            }
            try {
                let filterRemove = {
                    cardId: doc._id
                }
                await schema.characterCard.findOneAndRemove(filter);
                await schema.characterGpSwitch.deleteMany(filterRemove);
            } catch (error) {
                console.log('刪除角色卡 GET ERROR:  ', error)
                rply.text = '刪除角色卡失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除角色卡成功: ' + doc.name
            return rply;

 
        default:
            break;

    }
}

async function mainCharacter(doc, mainMsg) {
    mainMsg.shift();
    let findState = [];
    let findNotes = [];
    let findRoll = {};
    let last = ""
    let tempRply = {
        characterReRoll: false,
        text: '',
        characterReRollName: ''
    }
    for (let name in mainMsg) {
        let resutltState = await findObject(doc.state, mainMsg[name]);
        let resutltNotes = await findObject(doc.notes, mainMsg[name]);
        let resutltRoll = await findObject(doc.roll, mainMsg[name]);
        if (resutltRoll) {
            findRoll = resutltRoll;
            last = 'roll';
        } else
        if (resutltNotes) {
            last = 'notes';
            await findNotes.push(resutltNotes);
        } else
        if (resutltState) {
            last = 'state';
            await findState.push(resutltState);
        } else
        if (mainMsg[name].match(/^[+-/*]\S+d\S/i) && last == 'state') {
            last = '';
            let res = mainMsg[name].charAt(0)
            let number = await countNum(mainMsg[name].substring(1));
            number ? await findState.push(res + number) : null;
        } else
        if (mainMsg[name].match(/^[0-9+\-*/.]\S+$/i) && last == 'state') {
            last = '';
            await findState.push(mainMsg[name]);
        } else {
            last = '';
        }

    }
    //如果是roll的, 就變成擲骰MODE(最優先)
    //如果是另外兩個
    async function myAsyncFn(match, p1) {
        let result = await replacer(doc, p1);
        return result;
    }
    if (Object.keys(findRoll).length > 0) { //把{}進行replace
        //https://stackoverflow.com/questions/33631041/javascript-async-await-in-replace
        //ref source
        tempRply.characterReRollItem = await replaceAsync(findRoll.itemA, /\{(.*?)\}/ig, await myAsyncFn);
        tempRply.characterReRollItem = await replaceAsync(tempRply.characterReRollItem, /\[\[(.*?)\]\]/ig, await myAsyncFn2);
        tempRply.characterReRollName = findRoll.name;
        tempRply.characterReRoll = true;
    }
    if (Object.keys(findState).length > 0 || Object.keys(findNotes).length > 0) {
        for (let i = 0; i < findState.length; i++) {
            //如果i 是object , i+1 是STRING 和數字, 就進行加減
            //否則就正常輸出
            if (typeof (findState[i]) == 'object' && typeof (findState[i + 1]) == 'string') {
                doc.state.forEach(async (element, index) => {
                    if (element.name === findState[i].name) {
                        //如果是一個數字, 取代本來的數值
                        //不然就嘗試計算它
                        //還是失敗就強制變成一個數字,進行運算
                        if (findState[i + 1].match(/^([0-9]*[.])?[0-9]+$/i)) {
                            doc.state[index].itemA = findState[i + 1];
                        } else {
                            try {
                                let num = eval(new String(doc.state[index].itemA) + findState[i + 1].replace('--', '-'));
                                if (!isNaN(num)) {
                                    doc.state[index].itemA = num;
                                }
                            } catch (error) {
                                console.log('error of Char:', findState[i + 1])
                            }
                        }

                    }
                });


            }
            if (typeof (findState[i]) == 'object') {
                tempRply.text += findState[i].name + ': ' + findState[i].itemA;
                if (findState[i].itemB) {
                    tempRply.text += "/" + findState[i].itemB;
                }
                tempRply.text += '　\n'
            }

        }
        try {
            if (doc && doc.db)
                await doc.save();
        } catch (error) {
            // console.log('doc ', doc)
            console.log('doc SAVE GET ERROR:', error)
        }

        if (findNotes.length > 0) {
            for (let i = 0; i < findNotes.length; i++) {
                //如果i 是object , i+1 是STRING 和數字, 就進行加減
                //否則就正常輸出
                tempRply.text += findNotes[i].name + ': ' + findNotes[i].itemA + '　\n';
            }
        }

        if (findState.length > 0 || findNotes.length > 0) {
            tempRply.text = doc.name + '　\n' + tempRply.text;
        }
    }
    return tempRply;
}





async function findObject(doc, mainMsg) {
    let re = mainMsg.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let resutlt = doc.find(element => {
        return element.name.match(new RegExp('^' + re + '$', 'i'))
    });
    return resutlt;
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
    returnStr += Card.name + '　\n';
    let a = 1
    if (Card.state.length > 0) {
        for (let i = 0; i < Card.state.length; i++) {
            if ((a) % 4 == 0 && (Card.state[i].itemA || Card.state[i].itemB)) {
                returnStr += '　\n'
            }
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.state[i].name + ': ' + Card.state[i].itemA;
                returnStr += (Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            } else {
                returnStr += (Card.state[i].itemA) ? Card.state[i].name + ': ' + Card.state[i].itemA : '';
                returnStr += (Card.state[i].itemA && Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            }
            if (Card.state[i].itemA || Card.state[i].itemB) {
                a++
            }
            if ((Card.state[i].itemA || Card.state[i].itemB) && mode == 'addMode' || mode == 'showAllMode') {
                returnStr += ' ';
            } else if (Card.state[i].itemA) {
                returnStr += ' ';
            }
        }
        returnStr += '\n-------\n'
    }

    if (Card.roll.length > 0) {
        for (let i = 0; i < Card.roll.length; i++) {
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ';

            } else {
                returnStr += (Card.roll[i].itemA) ? Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ' : '';
            }
            if (i % 2 || i == Card.roll.length - 1) {
                returnStr += '　\n';
            }
        }
        returnStr += '-------\n'
    }
    if (mode == 'addMode' || mode == 'showAllMode')
        if (Card.notes.length > 0) {
            for (let i = 0; i < Card.notes.length; i++) {
                //returnStr += (Card.notes[i].itemA) ? Card.notes[i].name + ': ' + Card.notes[i].itemA + ' \n' : '';
                returnStr += Card.notes[i].name + ': ' + Card.notes[i].itemA + '　\n';
            }

            returnStr += '-------'
        }
    return returnStr;
}


async function replacer(doc, match) {
    let result = ""
    let state = await findObject(doc.state, match);
    let note = await findObject(doc.notes, match);
    result = state.itemA || note.itemA || '';
    return result;
}
async function analysicInputCharacterCard(inputStr) {
    let characterName = (inputStr.match(regexName)) ? inputStr.match(regexName)[1] : '';
    let characterStateTemp = (inputStr.match(regexState)) ? inputStr.match(regexState)[1] : '';
    let characterRollTemp = (inputStr.match(regexRoll)) ? inputStr.match(regexRoll)[1] : '';
    let characterNotesTemp = (inputStr.match(regexNotes)) ? inputStr.match(regexNotes)[1] : '';
    let characterState = (characterStateTemp) ? await analysicStr(characterStateTemp, true) : [];
    let characterRoll = (characterRollTemp) ? await analysicStr(characterRollTemp, false) : [];
    let characterNotes = (characterNotesTemp) ? await analysicStr(characterNotesTemp, false, 'notes') : [];
    //Remove duplicates from an array of objects in JavaScript
    // if (characterState)
    characterState = characterState.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    //if (characterRoll)
    characterRoll = characterRoll.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    //if (characterNotes)
    characterNotes = characterNotes.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    let character = {
        name: characterName.replace(/^\s+/, '').replace(/\s+$/, ''),
        state: characterState,
        roll: characterRoll,
        notes: characterNotes
    }
    return character;
}

async function analysicStr(inputStr, state, term) {
    let character = [];
    let myArray = [];
    while ((myArray = re.exec(inputStr)) !== null) {
        if (myArray[2].match(/.*?\/.*/) && state) {
            let temp2 = /(.*)\/(.*)/.exec(myArray[2])
            myArray[2] = temp2[1]
            myArray[3] = temp2[2]
        }

        //防止誤輸入
        myArray[3] = (myArray[3] == ';') ? '' : myArray[3];
        myArray[1] = myArray[1].replace(/\s+/g, '');
        if (term !== "notes") {
            myArray[2] = myArray[2].replace(/\s+[.]ch\s+/i, ' ').replace(/\s+[.]char\s+/i, ' ');
        }
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
                return sourceElement[prop].match(new RegExp('^' + convertRegex(targetElement[prop]) + '$', 'i'));
            })
            if (updateMode)
                targetElement ? Object.assign(targetElement, sourceElement) : '';
            else
                targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        })
    }

    mergeByProperty(target, source, prop);
    return target;

}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

async function myAsyncFn2(match, p1) {
    let result = ''
    try {
        result = eval(p1)
    } catch (error) {
        result = p1
    }
    return result;
}

async function countNum(num) {
    let result;
    let temp = await rollDice({
        mainMsg: [num]
    })
    if (temp && temp.text) {
        result = temp.text.match(/[+-]?([0-9]*[.])?[0-9]+$/)[0];
    } else if (num.match(/^[+-]?([0-9]*[.])?[0-9]+$/)) {
        result = num;
    }
    return result;
}
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    mainCharacter: mainCharacter
};



/*
以個人為單位, 一張咭可以在不同的群組使用    
.char add 的輸入格式,用來增建角色卡
.char add name[Sad]~
state[HP:5/5;MP:3/3;SAN:50/99;護甲:6]~
roll[投擲:cc 80 投擲;空手鬥毆: cc [[50 +{hp}]]]~
notes[筆記:SAD;心靈支柱: 特質]~

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