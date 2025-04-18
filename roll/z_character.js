"use strict";
if (!process.env.mongoURL) {
    return;
}
let variables = {};
const mathjs = require('mathjs');
const rollDice = require('./rollbase').rollDiceCommand;
const rollDiceCoc = require('./2_coc').rollDiceCommand;
const rollDiceAdv = require('./0_advroll').rollDiceCommand;
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const records = require('../modules/records.js');
const { SlashCommandBuilder } = require('discord.js');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];
const gameName = () => '【角色卡功能】 .char (add edit show delete use nonuse button) .ch (set show showall button)';
const gameType = () => 'Tool:trpgcharacter:hktrpg';
const prefixs = () => [{ first: /(^[.]char$)|(^[.]ch$)/ig, second: null }];
const regexName = new RegExp(/name\[(.*?)\]~/, 'i');
const regexState = new RegExp(/state\[(.*?)\]~/, 'i');
const regexRoll = new RegExp(/roll\[(.*?)\]~/, 'i');
const regexNotes = new RegExp(/notes\[(.*?)\]~/, 'i');
const re = new RegExp(/(.*?):(.*?)(;|$)/, 'ig');
const regexRollDice = new RegExp(/<([^<>]*)>/, 'ig');
// Discord message link regex: https://discord.com/channels/{guildId}/{channelId}/{messageId}
const discordLinkRegex = new RegExp(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/, 'i');

const opt = { upsert: true, runValidators: true };
const convertRegex = str => str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");

/*
TODO?
COC export to roll20?
*/

const getHelpMessage = async () => `【🎭HKTRPG角色卡系統】
╭──── 📝系統簡介 ────
│ • 個人專屬角色管理系統
│ • 支援跨群組使用單一角色
│ • 網頁版與聊天軟件同步更新
│ • 提供即時擲骰與數值管理
│
├──── 🔰基礎流程 ────
│ 1️⃣ 建立角色卡
│    .char add 製作新角色
│
│ 2️⃣ 建立網頁帳號
│    .admin account [帳號] [密碼]
│
│ 3️⃣ 設定群組可接受從網頁進行的擲骰(非必要)
│    .admin allowrolling
│    .admin registerChannel
│
│ 4️⃣ 開始使用角色
│    .char use [角色名]
│    .ch [各種操作指令]
│
├──── 🆕建立角色 ────
│ ■ 完整建卡格式:
.char add
name[Sad]~
state[HP:15/15;MP:10/10;San:80;力量:50;敏捷:60;]~
roll[鬥毆: cc 50;射擊: cc 45;SanCheck: .sc {San};]~
notes[筆記:這是測試,請試試在群組輸入 .char use Sad]~
│
│ ■ 修改角色卡:
.char edit name[角色名]~
state[...]~ roll[...]~ notes[...]~
│
├──── 💻管理方式 ────
│ ■ 網頁版(推薦):
│ 1) 建立管理帳號
│    .admin account [帳號] [密碼]
│
│ 2) 登入管理網站
│    https://card.hktrpg.com
│
│ 3) 可視化編輯介面
│    直接修改並儲存即可
│
│ ■ 聊天軟件:
│ 1) 使用.char edit指令
│ 2) 格式同建立角色卡
│
├──── 📊數據管理 ────
│ ■ 基礎指令:
│ • .char show (列出清單)
│ • .char show0 (顯示角色卡0號詳細)
│ • .char use [名稱] (使用)
│ • .char nonuse (停用)
│ • .char delete [名稱] (刪除)
│ • .ch show (顯示狀態)
│ • .ch showall (顯示全部內容)
│ 
│ ■ 數值操作:
│ • .ch [項目]
│   顯示當前數值
│ • .ch [項目] [數字]
│   直接設定數值
│ • .ch [項目] +/-[數字]
│   增加或減少數值
│ • .ch [項目] */[數字]
│   乘除數值運算
│ • .ch [項目] +/-[xDy]
│   增減擲骰結果
│ • .ch set [項目] 新內容
│   直接更改內容
│
├──── 🎲特殊功能 ────
│ ■ 快捷按鈕(Discord):
│ • .ch button
│   生成角色狀態按鈕
│ • .char button [角色名]
│   生成擲骰指令按鈕
│
│ ■ 按鈕轉發功能:
│ • .forward [Discord訊息連結]
│   將按鈕結果轉發至指定頻道
│ • .forward show
│   顯示所有轉發設定
│ • .forward delete [編號]
│   刪除指定轉發設定
│
│ ■ 運算功能:
│ • {變數}: 引用角色數值
│   例: {HP} {san}
│   可運算: 1+{HP} -> 1+15
│
│ • <>: 擲骰運算
│   <1D100> 基本擲骰
│   <cc {射擊}> 技能檢定
│   <.sc {san} 1/1d3> 理智檢定
│
│ ■ 實用範例:
│ • .ch hp +3
│   回復3點生命
│ • .ch san -<1d6>
│   減少1D6點理智
│ • .ch str <3D6dl2>
│   擲3D6取低2次
│
├──── 🌐群組設定 ────
│ ■ 管理員指令:
│ • .admin allowrolling
│   允許擲骰結果轉發
│ • .admin registerChannel
│   登記群組至轉發名單
│
│ ■ 取消設定:
│ • .admin disallowrolling
│   取消擲骰結果轉發
│ • .admin unregisterChannel
│   移除群組轉發設定
│
├──── ⚠️注意事項 ────
│ • 項目名稱請勿使用空格
│ • 日常更新建議使用.ch
│ • 大幅修改建議用網頁版
│ • 可Pin按鈕方便重複使用
│ • 跨群組需分別設定使用
╰──────────────`;

const initialize = () => variables;

// eslint-disable-next-line no-unused-vars
const rollDiceCommand = async function ({ inputStr, mainMsg, groupid, botname, userid, channelid, discordMessage, discordClient }) {
    let rply = { default: 'on', type: 'text', text: '', characterReRoll: false, characterName: '', characterReRollName: '' };
    let filter = {};
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
        // ...existing code...

        case /(^[.]char$)/i.test(mainMsg[0]) && /^public+/i.test(mainMsg[1]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^unpublic+/i.test(mainMsg[1]):
            return await handlePublicUnpublic(mainMsg, inputStr, userid, rply);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show\d+/i.test(mainMsg[1]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            return await handleShow(mainMsg, userid, rply);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleAddEdit(mainMsg, inputStr, userid, groupid, rply);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^use$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^nonuse$/i.test(mainMsg[1]):
            return await handleUseNonuse(mainMsg, inputStr, userid, groupid, channelid, rply);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleDelete(mainMsg, inputStr, userid, rply);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]):
            return await handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^set$/i.test(mainMsg[1]) && /^\S+$/i.test(mainMsg[2]) && /^\S+$/i.test(mainMsg[3]):
            return await handleSet(mainMsg, inputStr, userid, groupid, channelid, rply);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^showall$/i.test(mainMsg[1]):
            return await handleShowCh(mainMsg, inputStr, userid, groupid, channelid, rply);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^\S+$/i.test(mainMsg[1]):
            return await handleCh(mainMsg, inputStr, userid, groupid, channelid, rply);

        default:
            break;
    }
};

async function handlePublicUnpublic(mainMsg, inputStr, userid, rply) {
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+(public|unpublic)\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = '沒有此角色卡';
        return rply;
    }
    try {
        doc.public = /^public+/i.test(mainMsg[1]);
        await doc.save();
    } catch (error) {
        console.error('GET ERROR 修改失敗' + error);
        rply.text = '修改失敗\n' + error;
        return rply;
    }
    rply.text = `修改成功\n現在角色卡: ${doc.name} 已經${doc.public ? '公開' : '不公開'}。\n請到以下網址查看\n https://publiccard.hktrpg.com/ `;
    return rply;
}

async function handleShow(mainMsg, userid, rply) {
    let filter = { id: userid };
    if (/^show\d+/i.test(mainMsg[1])) {
        let index = parseInt(mainMsg[1].replace(/^show/i, ''));
        let doc = await schema.characterCard.findOne(filter).skip(index).catch(error => console.error('char show0 GET ERROR: ', error));
        if (!doc) {
            rply.text = `
╭──── ⚠️錯誤提示 ────
│ ❌ 沒有此角色卡
╰─────────────────`;
            return rply;
        }
        rply.text = await showCharacter(doc, 'showMode');
        return rply;
    } else {
        rply.text += '╭──── 📋角色卡列表 ────\n';
        let doc = await schema.characterCard.find(filter).catch(error => console.error('char show GET ERROR: ', error));
        rply.buttonCreate = [];
        rply.text += doc.reduce((text, { name }, index) => {
            rply.buttonCreate.push(`.char use ${name}`);
            return text + `│ ${index}️⃣ ${name}\n`;
        }, '');

        rply.text += `
├──── ⚙️可用指令 ────
│ 🎲 .char show數字   顯示指定角色卡
│ 🔘 .char button 名字 產生角色卡按鈕
│ ✨ .char use 名字    在頻道中登記使用該角色卡
│
├──── 💡注意事項 ────
│ • 使用角色卡後輸入 .ch button 
│   可產生直接擲骰按鈕
│ • 兩種按鈕指令效果不同:
│   - char button: 調用.ch
│   - ch button:  直接擲骰
╰─────────────────`;
        return rply;
    }
}

async function handleAddEdit(mainMsg, inputStr, userid, groupid, rply) {
    let Card = await analysicInputCharacterCard(inputStr);
    if (!Card.name) {
        rply.text = '沒有輸入角色咭名字，請重新整理內容 格式為 \n.char add name[Sad]~ \nstate[HP:15/15;MP:6/6;]~\nroll[投擲:cc 80 投擲;鬥毆:cc 40 鬥毆;]~\nnotes[心靈支柱: 無;notes:這是測試,請試試在群組輸入 .char use Sad;]~\n';
        return rply;
    }
    let lv = await VIP.viplevelCheckUser(userid);
    let gpLv = await VIP.viplevelCheckGroup(groupid);
    lv = (gpLv > lv) ? gpLv : lv;
    let limit = FUNCTION_LIMIT[lv];
    let check = await schema.characterCard.find({ id: userid });
    if (check.length >= limit) {
        rply.text = '你的角色卡上限為' + limit + '張' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
        return rply;
    }
    let filter = { id: userid, name: new RegExp('^' + convertRegex(Card.name) + '$', "i") };
    let doc = await schema.characterCard.findOne(filter);
    if (doc) {
        doc.name = Card.name;
        Card.state = await Merge(doc.state, Card.state, 'name');
        Card.roll = await Merge(doc.roll, Card.roll, 'name');
        Card.notes = await Merge(doc.notes, Card.notes, 'name');
    }
    try {
        await schema.characterCard.updateOne(filter, Card, opt);
    } catch (error) {
        console.error('新增角色卡 GET ERROR: ', error);
        rply.text = '新增角色卡失敗\n因為 ' + error.message;
        return rply;
    }
    rply.text = await showCharacter(Card, 'addMode');
    return rply;
}

async function handleUseNonuse(mainMsg, inputStr, userid, groupid, channelid, rply) {
    if (!groupid) {
        rply.text = '此功能必須在群組中使用';
        return rply;
    }
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+use\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = '沒有此角色卡';
        return rply;
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
        console.error('GET ERROR 修改失敗' + error);
        rply.text = '修改失敗\n' + error;
        return rply;
    }
    rply.text = '修改成功\n現在使用角色卡: ' + doc.name;
    return rply;
}

async function handleDelete(mainMsg, inputStr, userid, rply) {
    let filter = { id: userid, name: inputStr.replace(/^\.char\s+delete\s+/ig, '') };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = '沒有此角色卡. 注意:刪除角色卡需要名字大小寫完全相同';
        return rply;
    }
    try {
        let filterRemove = { cardId: doc._id };
        await schema.characterCard.findOneAndRemove(filter);
        await schema.characterGpSwitch.deleteMany(filterRemove);
    } catch (error) {
        console.error('刪除角色卡 GET ERROR:  ', error);
        rply.text = '刪除角色卡失敗';
        return rply;
    }
    rply.text = '刪除角色卡成功: ' + doc.name;
    return rply;
}

async function handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply) {
    if (!groupid) {
        rply.text = '此功能必須在群組中使用';
        return rply;
    }
    if (botname !== "Discord") {
        rply.text = "這是Discord限定功能";
        return rply;
    }
    if (inputStr.match(/^\.ch\s+button/i)) {
        const filter = {
            id: userid,
            gpid: channelid || groupid,
        }
        const docSwitch = await schema.characterGpSwitch.findOne(filter);
        if (docSwitch && docSwitch.cardId) {
            const doc = await schema.characterCard.findOne({
                _id: docSwitch.cardId
            });
            if (doc.roll) {
                rply.requestRollingCharacter = [handleRequestRollingChMode(doc), doc.name, 'ch'];
            }
            return rply;
        }
    }
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+button\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = '沒有此角色卡';
        return rply;
    }
    if (doc.roll)
        rply.requestRollingCharacter = [handleRequestRolling(doc), doc.name, 'char'];
    return rply;
}

async function handleSet(mainMsg, inputStr, userid, groupid, channelid, rply) {
    if (!groupid) {
        rply.text = '此功能必須在群組中使用';
        return rply;
    }
    if (!mainMsg[3]) {
        return;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let doc;
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記";
    }
    if (doc) {
        let useTarget = new RegExp(mainMsg[0] + '\\s+' + mainMsg[1] + '\\s+' + convertRegex(mainMsg[2]));
        let useName = convertRegex(mainMsg[2]);
        let useItemA = inputStr.replace(useTarget, '').replace(/^\s+/, '');
        let useCard = [{ name: useName, itemA: useItemA.replace(/^[.]ch\s+/, '').replace(/^[.]char\s+/, '') }];
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
            console.error('doc error', doc);
            console.error('inputSTR: ', inputStr);
            console.error('doc SAVE  GET ERROR:', error);
            console.error('更新角色卡失敗: ', error);
            rply.text = '更新角色卡失敗';
            return rply;
        }
    }
    return;
}

async function handleShowCh(mainMsg, inputStr, userid, groupid, channelid, rply) {
    if (!groupid) {
        rply.text = '此功能必須在群組中使用';
        return rply;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    let doc;
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記";
        return rply;
    }
    rply.text = await showCharacter(doc, mainMsg[1] === 'showall' ? 'showAllMode' : 'showMode');
    return rply;
}

async function handleCh(mainMsg, inputStr, userid, groupid, channelid, rply) {
    if (!groupid) {
        rply.text = '此功能必須在群組中使用';
        return rply;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    let doc;
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = "未有登記的角色卡, \n請輸入.char use 角色卡名字  \n進行登記";
        return rply;
    }
    let tempMain = await mainCharacter(doc, mainMsg, inputStr);
    rply = Object.assign({}, rply, tempMain);
    rply.characterName = doc.name;
    return rply;
}

function handleRequestRolling(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        const itemName = new RegExp(convertRegex(roll.name) + '$', 'i');
        text[index] = (roll.itemA.match(itemName)) ? `${roll.itemA}` : `${roll.itemA} [${roll.name}]`;
        text[index] = text[index].substring(0, 80);
    }
    text.push = `.ch use ${doc.name}`;
    return text;
}

function handleRequestRollingChMode(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        text[index] = `.ch ${roll.name}`;
        text[index] = text[index].substring(0, 80);
    }
    return text;
}

async function mainCharacter(doc, mainMsg, inputStr) {
    let tempMsg = await replacePlaceholders(mainMsg, inputStr, doc);
    mainMsg = tempMsg.split(/\s+/);
    mainMsg.shift();
    let findState = [];
    let findNotes = [];
    let findRoll = {};
    let last = "";
    let tempRply = {
        characterReRoll: false,
        text: '',
        characterReRollName: ''
    };
    for (let name in mainMsg) {
        let resutltState = await findObject(doc.state, mainMsg[name]);
        let resutltNotes = await findObject(doc.notes, mainMsg[name]);
        let resutltRoll = await findObject(doc.roll, mainMsg[name]);
        if (resutltRoll) {
            findRoll = resutltRoll;
            last = 'roll';
        } else if (resutltNotes) {
            last = 'notes';
            await findNotes.push(resutltNotes);
        } else if (resutltState) {
            last = 'state';
            await findState.push(resutltState);
        } else if (mainMsg[name].match(/^[+-/*]\d+/i) && last == 'state') {
            last = '';
            let res = mainMsg[name].charAt(0);
            let number = await countNum(mainMsg[name].substring(1));
            number ? await findState.push(res + number) : null;
        } else if (mainMsg[name].match(/^\d+$/i) && last == 'state') {
            last = '';
            await findState.push(mainMsg[name]);
        } else {
            last = '';
        }
    }
    async function myAsyncFn(match, p1) {
        let result = await replacer(doc, p1);
        return result;
    }
    if (Object.keys(findRoll).length > 0) {
        tempRply.characterReRollItem = await replaceAsync(findRoll.itemA, /\{(.*?)\}/ig, await myAsyncFn);
        tempRply.characterReRollItem = await replaceAsync(tempRply.characterReRollItem, /\[\[(.*?)\]\]/ig, await myAsyncFn2);
        tempRply.characterReRollName = findRoll.name;
        tempRply.characterReRoll = true;
    }
    if (Object.keys(findState).length > 0 || Object.keys(findNotes).length > 0) {
        for (let i = 0; i < findState.length; i++) {
            if (typeof (findState[i]) == 'object' && typeof (findState[i + 1]) == 'string') {
                doc.state.forEach(async (element, index) => {
                    if (element.name === findState[i].name) {
                        if (findState[i + 1].match(/^([0-9]*[.])?[0-9]+$/i)) {
                            doc.state[index].itemA = findState[i + 1];
                        } else {
                            try {
                                let num = mathjs.evaluate(new String(doc.state[index].itemA) + findState[i + 1].replace('--', '-'));
                                if (!isNaN(num)) {
                                    doc.state[index].itemA = num;
                                }
                            } catch (error) {
                                console.error('error of Char:', findState[i + 1]);
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
                tempRply.text += '　\n';
            }
        }
        try {
            if (doc && doc.db)
                await doc.save();
        } catch (error) {
            console.error('doc SAVE GET ERROR:', error);
        }
        if (findNotes.length > 0) {
            for (let i = 0; i < findNotes.length; i++) {
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
            return element.name.match(new RegExp('^' + re + '$', 'i'));
    });
    return resutlt;
}
const colorEmoji = [
    "🟫", "🟥", "🟧", "🟨",
];
const colorEmoji2 = [
    "🟢", "🔵", "🟤", "🟣"
];

async function showCharacter(Card, mode) {
    let returnStr = '';
    if (mode == 'addMode') {
        returnStr += '新增/修改成功\n';
    }
    returnStr += Card.name + '　\n';
    let a = 0;
    if (Card.state.length > 0) {
        for (let i = 0; i < Card.state.length; i++) {
            if (a != 0 && (a) % 4 == 0 && (Card.state[i].itemA || Card.state[i].itemB)) {
                returnStr += '　\n';
            }
            returnStr += colorEmoji[(i + 1) % 4];
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.state[i].name + ': ' + Card.state[i].itemA;
                returnStr += (Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            } else {
                returnStr += (Card.state[i].itemA) ? Card.state[i].name + ': ' + Card.state[i].itemA : '';
                returnStr += (Card.state[i].itemA && Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            }
            if (Card.state[i].itemA || Card.state[i].itemB) {
                a++;
            }
            if ((Card.state[i].itemA || Card.state[i].itemB) && mode == 'addMode' || mode == 'showAllMode') {
                returnStr += ' ';
            } else if (Card.state[i].itemA) {
                returnStr += ' ';
            }
        }
        returnStr += '\n-------\n';
    }
    if (Card.roll.length > 0) {
        for (let i = 0; i < Card.roll.length; i++) {
            returnStr += colorEmoji2[(i + 1) % 4];
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ';
            } else {
                returnStr += (Card.roll[i].itemA) ? Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ' : '';
            }
            if (i != 0 && ((i + 1) % 2 == 0 || (i == Card.roll.length - 1))) {
                returnStr += '　\n';
            }
        }
        returnStr += '-------\n';
    }
    if (mode == 'addMode' || mode == 'showAllMode')
        if (Card.notes.length > 0) {
            for (let i = 0; i < Card.notes.length; i++) {
                returnStr += Card.notes[i].name + ': ' + Card.notes[i].itemA + '　\n';
            }
            returnStr += '-------';
        }
    return returnStr;
}

async function replacer(doc, match) {
    let result = "";
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
    characterState = characterState.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    characterRoll = characterRoll.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    characterNotes = characterNotes.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    let character = {
        name: characterName.replace(/^\s+/, '').replace(/\s+$/, ''),
        state: characterState,
        roll: characterRoll,
        notes: characterNotes
    };
    return character;
}

async function analysicStr(inputStr, state, term) {
    let character = [];
    let myArray = [];
    while ((myArray = re.exec(inputStr)) !== null) {
        if (myArray[2].match(/.*?\/.*/) && state) {
            let temp2 = /(.*)\/(.*)/.exec(myArray[2]);
            myArray[2] = temp2[1];
            myArray[3] = temp2[2];
        }
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
            });
        else
            character.push({
                name: myArray[1],
                itemA: myArray[2]
            });
    }
    return character;
}

async function Merge(target, source, prop, updateMode) {
    if (!target) target = [];
    if (!source) source = [];
    const mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop].match(new RegExp('^' + convertRegex(targetElement[prop]) + '$', 'i'));
            });
            if (updateMode)
                targetElement ? Object.assign(targetElement, sourceElement) : '';
            else
                targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        });
    };
    mergeByProperty(target, source, prop);
    return target;
}

async function replacePlaceholders(mainMsg, inputStr, doc) {
    const matches = [...inputStr.matchAll(regexRollDice)];
    const replacedMatches = await Promise.all(matches.map(async (match) => {
        const content = match[1];
        const contentSplit = content.split(/\s+/);
        let replacedContent = content;
        for (const str of contentSplit) {
            const result = await findObject(doc.state, str);
            if (result !== undefined) {
                replacedContent = replacedContent.replace(str, result.itemA);
            }
        }
        return replacedContent;
    }));
    const results = await Promise.all(replacedMatches.map(async (match) => {
        const contentSplit = match.split(/\s+/);
        const [resultOne, resultTwo, resultThree] = await Promise.all([
            await rollDice({ mainMsg: contentSplit, inputStr: match }),
            await rollDiceCoc({ mainMsg: contentSplit, inputStr: match }),
            await rollDiceAdv({ mainMsg: contentSplit, inputStr: match })
        ]);
        const texts = [resultOne?.text, resultTwo?.text, resultThree?.text];
        const numbers = texts
            .map(text => (text ? text.match(/(\d+)(?=\D*$)/) : null))
            .filter(num => num !== null)
            .map(num => num[0]);
        return numbers.length > 0 ? numbers[numbers.length - 1] : match;
    }));
    let resultString = inputStr;
    matches.forEach((match, index) => {
        resultString = resultString.replace(match[0], results[index]);
    });
    return resultString;
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
    let result = '';
    try {
        result = mathjs.evaluate(p1);
    } catch (error) {
        result = p1;
    }
    return result;
}

async function countNum(num) {
    let result;
    let temp = await rollDice({ mainMsg: [num] });
    if (temp && temp.text) {
        result = temp.text.match(/[+-]?([0-9]*[.])?[0-9]+$/)[0];
    } else if (num.match(/^[+-]?([0-9]*[.])?[0-9]+$/)) {
        result = num;
    }
    return result;
}

// Discord slash commands
const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('char')
            .setDescription('【角色卡功能】管理你的角色卡')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('建立新角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('state')
                            .setDescription('狀態數值 (格式: HP:15/15;MP:10/10;San:80)'))
                    .addStringOption(option =>
                        option.setName('roll')
                            .setDescription('擲骰指令 (格式: 鬥毆: cc 50;射擊: cc 45)'))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註內容')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('edit')
                    .setDescription('修改現有角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('state')
                            .setDescription('狀態數值'))
                    .addStringOption(option =>
                        option.setName('roll')
                            .setDescription('擲骰指令'))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註內容')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示角色卡列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show0')
                    .setDescription('顯示角色卡0號詳細'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('use')
                    .setDescription('使用指定的角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('nonuse')
                    .setDescription('停用當前角色卡'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除指定的角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('button')
                    .setDescription('生成角色卡按鈕')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('public')
                    .setDescription('公開角色卡'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unpublic')
                    .setDescription('取消公開角色卡')),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            const name = interaction.options.getString('name');
            const state = interaction.options.getString('state');
            const roll = interaction.options.getString('roll');
            const notes = interaction.options.getString('notes');

            switch (subcommand) {
                case 'add':
                    return `.char add name[${name}]~${state ? `\nstate[${state}]~` : ''}${roll ? `\nroll[${roll}]~` : ''}${notes ? `\nnotes[${notes}]~` : ''}`;
                case 'edit':
                    return `.char edit name[${name}]~${state ? `\nstate[${state}]~` : ''}${roll ? `\nroll[${roll}]~` : ''}${notes ? `\nnotes[${notes}]~` : ''}`;
                case 'show':
                    return `.char show`;
                case 'show0':
                    return `.char show0`;
                case 'use':
                    return `.char use ${name}`;
                case 'nonuse':
                    return `.char nonuse`;
                case 'delete':
                    return `.char delete ${name}`;
                case 'button':
                    return `.char button ${name}`;
                case 'public':
                    return `.char public ${name}`;
                case 'unpublic':
                    return `.char unpublic ${name}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('ch')
            .setDescription('【角色卡操作】操作當前使用的角色卡')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示當前角色卡狀態'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('showall')
                    .setDescription('顯示當前角色卡全部內容'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('button')
                    .setDescription('生成角色卡狀態按鈕'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('設定角色卡數值')
                    .addStringOption(option =>
                        option.setName('item')
                            .setDescription('項目名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('新數值')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('modify')
                    .setDescription('修改角色卡數值')
                    .addStringOption(option =>
                        option.setName('item')
                            .setDescription('項目名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('operation')
                            .setDescription('運算符號 (+/-/*//)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('數值或擲骰指令')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'show':
                    return `.ch show`;
                case 'showall':
                    return `.ch showall`;
                case 'button':
                    return `.ch button`;
                case 'set':
                    return `.ch set ${interaction.options.getString('item')} ${interaction.options.getString('value')}`;
                case 'modify':
                    return `.ch ${interaction.options.getString('item')} ${interaction.options.getString('operation')}${interaction.options.getString('value')}`;
            }
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    mainCharacter: mainCharacter,
    discordCommand: discordCommand
};