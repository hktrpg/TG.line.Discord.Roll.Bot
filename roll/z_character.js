"use strict";
if (!process.env.mongoURL) {
    return;
}
var variables = {};
const mathjs = require('mathjs');
const rollDice = require('./rollbase').rollDiceCommand;
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];
const gameName = function () {
    return '【角色卡功能】 .char (add edit show delete use nonuse button) .ch (set show showall button)'
}
const gameType = function () {
    return 'Tool:trpgcharacter:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]char$)|(^[.]ch$)/ig,
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


const getHelpMessage = async function () {
    return `【角色卡功能】
以個人為單位, 一張卡可以在不同的群組使用
目標是文字團可以快速擲骰，及更新角色狀態。

簡單新增角色卡 .char add name[Sad]~ state[HP:15/15;]~ roll[鬥毆: cc 50;]~ notes[筆記:這是測試,請試試在群組輸入 .char use Sad;]~ 
新增了角色卡後，可以輸入 .admin account (username) (password) 
然後在網頁: https://www.hktrpg.com:20721/card/ 中直接進行修改

把結果傳送到已登記的Discord，TG，LINE上的聊天群組的登記方法: 
由該群組的Admin授權允許 輸入 .admin allowrolling  
登記該群組到自己的名單中 輸入 .admin registerChannel  
取消方法
由該群組的Admin取消授權 輸入 .admin disallowrolling  
取消登記該群組到名單 輸入 .admin unregisterChannel  

最後網站會顯示群組名稱，點擊就可以使用了

-----.char-----
.char add name[Sad]~ state[HP:15/15;con:60;san:60]~ roll[鬥毆: cc 50;投擲: cc 15;sc:cc {san}]~ notes[筆記:這是測試,請試試在群組輸入 .char use Sad;]~  
- 可以新增及更新角色卡
.char Show - 可以顯示角色卡列表
.char Show0 - 可以顯示0號角色卡內容 0可以用其他數字取代
.char edit name[角色卡名字]~ - 可以以add的格式修改指定角色卡
.char use 角色卡名字 - 可以在該群組中使用指定角色卡
.char nonuse - 可以在該群組中取消使用角色卡
.char delete 角色卡名字 - 可以刪除指定角色卡
.char button 角色卡名字 - Discord限定，可以產生按鈕指令，會使用直接擲骰指令
-----.ch 功能-----
在群組中使用.char use (角色名) 後, 就可以啟動角色卡功能
.ch 項目名稱 項目名稱 - 沒有加減的話, 會單純顯示數據或擲骰
.ch 項目名稱 (數字)  - 可以立即把如HP變成該數字
.ch 項目名稱 (+-*/數字)  - 可以立即對如HP進行四則運算
.ch 項目名稱 (+-*/xDy)  - 可以對如HP進行擲骰四則運算
.ch set 項目名稱 新內容 - 直接更改內容
.ch show - 顯示角色卡的state 和roll 內容
.ch showall - 顯示角色卡的所有內容
.ch button  - Discord限定，可以產生按鈕指令，會調用.ch 指令
-----範例及運算式-----
角色卡還可以進行運算，詳情請看
https://github.com/hktrpg/TG.line.Discord.Roll.Bot/wiki/Character-Card `
}

const initialize = function () {
    return variables;
}

// eslint-disable-next-line no-unused-vars
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    botname,
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
    let limit = FUNCTION_LIMIT[0];
    let check;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        // .ch(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]char$)/i.test(mainMsg[0]) && /^public+/i.test(mainMsg[1]):
            if (!mainMsg[2]) {
                rply.text = "未輸入要公開的角色卡名字"
                return rply;
            }
            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+public\s+/i, '')) + '$', "i")
            }
            doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡'
                return rply
            }
            try {
                doc.public = true;
                await doc.save();

            } catch (error) {
                console.error('GET ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }

            rply.text = '修改成功\n現在角色卡: ' + doc.name + ' 已經公開。\n請到以下網址查看\n https://www.hktrpg.com:20721/publiccard/ ';
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^unpublic+/i.test(mainMsg[1]):
            if (!mainMsg[2]) {
                rply.text = "未輸入要公開的角色卡名字"
                return rply;
            }
            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+unpublic\s+/i, '')) + '$', "i")
            }
            doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡'
                return rply
            }
            try {
                doc.public = false;
                await doc.save();

            } catch (error) {
                console.error('GET ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }

            rply.text = '修改成功\n現在角色卡: ' + doc.name + ' 已經不公開。\n請到以下網址查看\n https://www.hktrpg.com:20721/publiccard/ ';
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show\d+/i.test(mainMsg[1]):
            filter = {
                id: userid
            }
            temp = mainMsg[1].replace(/^show/ig, '');
            //取得本來的資料, 如有重覆, 以新的覆蓋
            try {
                doc = await schema.characterCard.find(filter);
            } catch (error) {
                console.error('char  show GET ERROR: ', error);
            }
            if (temp < doc.length) {
                rply.text = await showCharacter(doc[temp], 'showAllMode');
            }
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            filter = {
                id: userid
            }
            rply.text += '角色卡列表\n';
            //取得本來的資料, 如有重覆, 以新的覆蓋
            try {
                doc = await schema.characterCard.find(filter);
            } catch (error) {
                console.error('char  show GET ERROR: ', error);
            }
            for (let index = 0; index < doc.length; index++) {
                rply.text += index + ': ' + doc[index].name + '　\n';
            }
            rply.text += `\n輸入 .char show0 可以顯示0號角色卡
            .char button 角色名字 可以產生你的角色卡按鈕
            輸入 .char use 角色名字  可以在頻道中使用角色卡
            
            輸入use後，
            再輸入 .ch button 也可以產生你的角色卡按鈕
            
            兩種產生的按鈕指令會有所不同，前者調用.ch後者產生直接擲骰的指令 `;
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
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
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            limit = FUNCTION_LIMIT[lv];
            check = await schema.characterCard.find({
                id: userid
            });
            if (check.length >= limit) {
                rply.text = '你的角色卡上限為' + limit + '張' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
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
                console.error('新增角色卡 GET ERROR: ', error)
                rply.text = '新增角色卡失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = await showCharacter(Card, 'addMode');
            return rply;
        }

        case /(^[.]char$)/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            Card = await analysicInputCharacterCard(inputStr); //分析輸入的資料
            if (!Card.name) {
                rply.text = '沒有輸入角色咭名字，請重新整理內容 格式為 .char edit name[XXXX]~ \nstate[HP:15/15;MP:6/6;]~\nroll[投擲:cc 80 投擲;鬥毆:cc 40 鬥毆;]~\nnotes[心靈支柱: 無;notes:這是測試,請試試在群組輸入 .char use Sad;]~\n'
                return rply;
            }
            /*
            只限四張角色卡.
            使用VIPCHECK
            */
            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(Card.name) + "$", "i")
            }
            //取得本來的資料, 如有重覆, 以新的覆蓋

            doc = await schema.characterCard.findOne(filter);
            //把舊和新的合併
            if (doc) {
                doc.name = Card.name;
                Card.state = await Merge(doc.state, Card.state, 'name');
                Card.roll = await Merge(doc.roll, Card.roll, 'name');
                Card.notes = await Merge(doc.notes, Card.notes, 'name');
            } else {
                rply.text = '沒有此角色卡, 請重新檢查'
                return rply;
            }
            try {
                await schema.characterCard.updateOne(filter,
                    Card);
            } catch (error) {
                console.error('修改角色卡 GET ERROR:  ', error)
                rply.text = '修改角色卡失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = await showCharacter(Card, 'addMode');
            return rply;


        case /(^[.]char$)/i.test(mainMsg[0]) && /^use$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }

            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+use\s+/i, '')) + '$', "i")
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
                console.error('GET ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }

            rply.text = '修改成功\n現在使用角色卡: ' + doc.name;
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^nonuse$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
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
                console.error('GET ERROR 修改失敗' + error)
                rply.text = '修改失敗\n' + error;
                return rply;
            }
            rply.text = '修改成功。\n現在這群組沒有使用角色卡， .ch 不會出現效果。'
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
                console.error('刪除角色卡 GET ERROR:  ', error)
                rply.text = '刪除角色卡失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除角色卡成功: ' + doc.name
            return rply;
        case /(^[.]char$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }

            filter = {
                id: userid,
                name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+button\s+/i, '')) + '$', "i")
            }
            const doc = await schema.characterCard.findOne(filter);
            if (!doc) {
                rply.text = '沒有此角色卡'
                return rply
            }
            if (doc.roll)
                rply.requestRollingCharacter = [handleRequestRolling(doc), doc.name, 'char']
            return rply;
        }

        case /(^[.]ch$)/i.test(mainMsg[0]) && /^set$/i.test(mainMsg[1]) && /^\S+$/i.test(mainMsg[2]) && /^\S+$/i.test(mainMsg[3]):
            //更新功能
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (!mainMsg[3]) {
                return;
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
                let useTarget = new RegExp(mainMsg[0] + '\\s+' + mainMsg[1] + '\\s+' + convertRegex(mainMsg[2]));
                let useName = convertRegex(mainMsg[2]);
                let useItemA = inputStr.replace(useTarget, '').replace(/^\s+/, '');
                let useCard = [{
                    name: useName,
                    itemA: useItemA.replace(/^[.]ch\s+/, '').replace(/^[.]char\s+/, '')
                }];
                doc.state = await Merge(doc.state, useCard, 'name', true);
                doc.roll = await Merge(doc.roll, useCard, 'name', true);
                doc.notes = await Merge(doc.notes, useCard, 'name', true);
                try {
                    let a = await doc.save();
                    if (a) {
                        let resutltState = await findObject(doc.state, mainMsg[2]) || '';
                        let resutltNotes = await findObject(doc.notes, mainMsg[2]) || '';
                        let resutltRoll = await findObject(doc.roll, mainMsg[2]) || '';
                        if (resutltState) {
                            rply.text += a.name + '\n' + resutltState.name + ': ' + resutltState.itemA;
                            rply.text += (resutltState.itemB) ? '/' + resutltState.itemB : '';
                        }
                        if (resutltNotes) {
                            rply.text += a.name + '\n' + resutltNotes.name + ': ' + resutltNotes.itemA;
                        }
                        if (resutltRoll) {
                            rply.text += a.name + '\n' + resutltRoll.name + ': ' + resutltRoll.itemA;
                        }
                        return rply;
                    }
                } catch (error) {
                    console.error('doc error', doc)
                    console.error('inputSTR: ', inputStr)
                    console.error('doc SAVE  GET ERROR:', error)
                    console.error('更新角色卡失敗: ', error)
                    rply.text = '更新角色卡失敗'
                    return rply;
                }
            }
            return;


        case /(^[.]ch$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
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
                rply.text = '此功能必須在群組中使用'
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
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }
            const filter = {
                id: userid,
                gpid: channelid || groupid,
            }

            const docSwitch = await schema.characterGpSwitch.findOne(
                filter);
            if (docSwitch && docSwitch.cardId) {
                const doc = await schema.characterCard.findOne({
                    _id: docSwitch.cardId
                });
                if (doc.roll)
                    rply.requestRollingCharacter = [handleRequestRollingChMode(doc), doc.name, 'ch']
            }
            //  rply.requestRolling = handleRequestRolling(inputStr)
            return rply;
        }

        case /(^[.]ch$)/i.test(mainMsg[0]) && /^\S+$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '此功能必須在群組中使用'
                return rply
            }
            filter = {
                id: userid,
                gpid: channelid || groupid,
            };

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

            tempMain = await mainCharacter(doc, mainMsg);
            rply = Object.assign({}, rply, tempMain)
            rply.characterName = doc.name;
            return rply;
        default:
            break;

    }
}
function handleRequestRolling(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        const itemName = new RegExp(convertRegex(roll.name) + '$', 'i')
        text[index] = (roll.itemA.match(itemName)) ? `${roll.itemA}` : `${roll.itemA} ${roll.name}`
        text[index] = text[index].substring(0, 80);
    }
    text.push = `.ch use ${doc.name}`
    return text;
}

function handleRequestRollingChMode(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        text[index] = `.ch ${roll.name}`
        text[index] = text[index].substring(0, 80);
    }
    return text;
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
                                let num = mathjs.evaluate(new String(doc.state[index].itemA) + findState[i + 1].replace('--', '-'));
                                if (!isNaN(num)) {
                                    doc.state[index].itemA = num;
                                }
                            } catch (error) {
                                console.error('error of Char:', findState[i + 1])
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
            // console.error('doc ', doc)
            console.error('doc SAVE GET ERROR:', error)
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
        if (element.name)
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

    if (state && state.itemA) {
        result = state.itemA;
    } else {
        let note = await findObject(doc.notes, match);
        if (note && note.itemA) {
            result = note.itemA;
        }
    }
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
        result = mathjs.evaluate(p1)
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