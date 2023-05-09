"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【選擇叢書】'
}

const gameType = function () {
    return 'StoryTeller:Funny:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.ST$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【選擇叢書】
這裡是書本的世界，你可以選擇一本書，並且開展它的內容。
輸入 .ST bothelp - 顯示說明
輸入 .ST start - 開始遊戲
輸入 .ST end - 結束遊戲
輸入 .ST book - 選擇書本
輸入 .ST setting - 設定遊戲
-------
輸入 .StoryMaker create - 創建故事
輸入 .StoryMaker delete - 刪除故事
輸入 .StoryMaker list - 列出故事
輸入 .StoryMaker edit - 編輯故事
輸入 .StoryMaker help - 故事說明
-------

`
}

const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = 'Demo' + mainMsg[1] + inputStr + groupid + userid + userrole + botname + displayname + channelid + displaynameDiscord + membercount;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};
/**
{show: XXXX} 顯示某變數
{ask: XXXX} 開啓可以輸入變數
{cal: Var 算式+-/*} 計算變數
{title} 標題
{content} 內容
{MAX 10} ? 最大可以按的次數
{time: XXYYDD HH:MM} <--- 顯示時間
{image: link=XXXX title=XXX content=XXX } 顯示圖片
輸入格式 
=====================
#setting
{cal: hp 100}
{cal: mp 20}
{cal: name none}
=====================
#1
{title} 這是標題(可留空)
{image:} 這是內容
{content} {ask: name} 你現在的HP是{show: HP}這是內容 現在可以輸入名字: .st set name [名字]
{choice1} 選項1 {goto: #2} {cal: HP +1} {cal: SAN -2} {cal: MP *2}
{choice2} 選項2 {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#2
{title} 這是標題(可留空)
{content} 這是內容
{choice2} 選項2 {if: HP >=10} {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#end
{title} 這是標題(可留空)
{content} 這是內容 {show: HP} {show: MP} {show: varA}

=====================
 */


const input = `#setting
{cal: hp 100}
{cal: mp 20}
{cal: name none}
#1
{title:這是標題(可留空)} 
{image:} 這是內容
{content} {ask: name} 你現在的HP是{show: HP}這是內容 現在可以輸入名字: .st set name [名字]
{choice} 選項1 {goto: #2} {cal: HP +1} {cal: SAN -2} {cal: MP *2}
{choice} 選項2 {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice} 選項3 {goto: #end}
#2
{title:這是標題(可留空)} 
{content} 這是內容
{choice} 選項2 {if: HP >=10} {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice} 選項3 {goto: #end}
#end
{title:這是標題(可留空)} 
{content} 這是內容 {show: HP} {show: MP} {show: varA}`;

const lines = input.split('\n');
const data = [];

let currentBlock = {};

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#')) {
        if (currentBlock.id) {
            data.push(currentBlock);
        }
        currentBlock = { id: line.slice(1), other: [], choices: [], content: {} };
    } else {
        const [type, value] = parseLine(line);
        console.log('type', type, value)
        if (!value) continue
        if (type === 'other') {
            currentBlock.other.push(value);
        } else if (type === 'choice') {
            //console.log('choice block', value)
            currentBlock.choices.push(value);
        } else if (type === 'content') {
            //console.log('choice block', value)
            currentBlock.content = value;
        }
    }
}

if (currentBlock.id) {
    data.push(currentBlock);
}

console.log('rusult: ', data, JSON.stringify(data, null, 2));

function parseLine(line) {
    // console.log('line', line)
    //console.log('/xx', line.slice(1, -1))
    let linePurpose = line.match(/\{(.*?)\}/);
    // console.log('linePurpose', linePurpose)
    if (linePurpose[1].match(/choice/i)) {
        line = line.replace(/\{choice\}/i, '')
        return ['choice', analyzieChoice(line)];
    } else
        if (linePurpose[1].match(/content/i)) {
            line = line.replace(/\{content\}/i, '')
            return ['content', analyzieContent(line)];
        } else {
            //if()
            return ['other', analyzieOther(line)];
        }
}
function analyzieOther(line) {
    const result = {
        content: ''
    }
    do {
        let object = line.match(/\{(.*?)\}/);
        if (object[1].match(/.*:.*/)) {
            let objectDetail = object[1].match(/(.*):(.*)/);
            result[objectDetail[1].replace(/^\s+/, '').replace(/\s+$/, '')] = objectDetail[2].replace(/^\s+/, '').replace(/\s+$/, '');
        } else {
            result[object] = null;
        }
        line = line.replace(/\{(.*?)\}/, '')
        // console.log('X', line)
    } while (line.match(/\{.*?\}/));
    result.content = line.replace(/^\s+/, '').replace(/\s+$/, '');
    console.log('return Other', result)
    return result;
}

function analyzieContent(line) {
    const content = {
        content: '',
        ask: ''
    }
    let object = line.match(/\{ask:(.*?)\}/i);
    if (object && object[1]) {
        content.ask = object[1].replace(/^\s+/, '').replace(/\s+$/, '');
        line = line.replace(/\{ask:(.*?)\}/i, '')

    }
    // console.log('X', line)
    content.content = line.replace(/^\s+/, '').replace(/\s+$/, '');

    return content;
}


function analyzieChoice(line) {
    const choice = {
        content: '',
        object: []
    }
    do {
        let object = line.match(/\{(.*?)\}/);
        if (object[1].match(/.*:.*/)) {
            let objectDetail = object[1].match(/(.*):(.*)/);
            choice.object[objectDetail[1].replace(/^\s+/, '').replace(/\s+$/, '')] = objectDetail[2].replace(/^\s+/, '').replace(/\s+$/, '');
        } else {
            choice.object[object] = null;
        }
        line = line.replace(/\{(.*?)\}/, '')
        // console.log('X', line)
    } while (line.match(/\{.*?\}/));
    choice.content = line.replace(/^\s+/, '').replace(/\s+$/, '');
    console.log('return choice', choice)
    return choice;
}