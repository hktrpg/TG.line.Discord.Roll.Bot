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


class StoryMaker {
    constructor() {
        this.story = {}
    }
    createStory() {

    }
    deleteStory() {

    }
    editStory() {

    }
    listStory() {

    }
    helpStory() {

    }
}

class StoryInputer {
    constructor() {
        this.story = {}
    }
    //document.write(a[1].choices[1].object['goto']);
    static parse(input) {
        const lines = input.split('\n');
        const data = [];

        let currentBlock = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.match(/^\s+$/)) continue
            if (line.startsWith('#')) {
                if (currentBlock.id) {
                    data.push(currentBlock);
                }
                currentBlock = { id: line.slice(1), other: [], choices: [], content: {} };
            } else {

                const [type, value] = StoryInputer.parseLine(line);
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
        // let result = (data, null, 2)
        return data;
    }

    static parseLine(line) {
        //         
        if (!line) return
        document.write('line', line)
        //console.log('/xx', line.slice(1, -1))
        let linePurpose = line.match(/\{(.*?)\}/);


        document.write('linePurpose', linePurpose)
        if (linePurpose[1].match(/choice/i)) {
            line = line.replace(/\{choice\}/i, '')
            return ['choice', StoryInputer.analyzieChoice(line)];
        } else
            if (linePurpose[1].match(/content/i)) {
                line = line.replace(/\{content\}/i, '')
                return ['content', StoryInputer.analyzieContent(line)];
            } else {
                //if()
                return ['other', StoryInputer.analyzieOther(line)];
            }
    }
    static analyzieOther(line) {
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

    static analyzieContent(line) {
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


    static analyzieChoice(line) {
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

}

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


const example_Love_language =
    `
    #setting
{title: 你的名字是?}
{cal: A 0}
{cal: B 0}
{cal: C 0}
{cal: D 0}
{cal: E 0}

{choice} 選項$3 {goto: #$1} {cal: $4 +1}
#0
{choice} 我喜歡收到寫滿讚美與肯定的小紙條 {goto: #1} {cal: A +1}
{choice} 我喜歡被擁抱的感覺 {goto: #1} {cal: E +1}
#1
{choice} 我喜歡和在我心目中佔有特殊地位的人獨處 {goto: #2} {cal: B +1}
{choice} 每當有人給我實際的幫助，我就會覺得他是愛我的 {goto: #2} {cal: D +1}
#2
{choice} 我喜歡收到禮物 {goto: #3} {cal: C +1}
{choice} 我有空就喜歡去探訪朋友和所愛的人 {goto: #3} {cal: B +1}
#3
{choice} 有人幫我做事，我就會覺得被愛 {goto: #4} {cal: D +1}
{choice} 有人碰觸我的身體，我就會覺得被愛 {goto: #4} {cal: E +1}
#4
{choice} 當我所愛、所景仰的人攬著我的肩膀，我就會有被愛的感覺 {goto: #5} {cal: E +1}
{choice} 當我所愛、所景仰的人送我禮物，我就會有被愛的感覺 {goto: #5} {cal: C +1}
#5
{choice} 我喜歡和朋友或所愛的人到處走走 {goto: #6} {cal: B +1}
{choice} 我喜歡和在我心目中有特殊地位的人擊掌或牽手 {goto: #6} {cal: E +1}
#6
{choice} 愛的具體象徵（禮物）對我很重要 {goto: #7} {cal: C +1}
{choice} 受到別人的肯定讓我有被愛的感覺 {goto: #7} {cal: A +1}
#7
{choice} 我喜歡和我所喜歡的人促膝長談 {goto: #8} {cal: E +1}
{choice} 我喜歡聽到別人說我很漂亮，很迷人或很有氣質 {goto: #8} {cal: A +1}
#8
{choice} 我喜歡和好友及所愛的人在一起 {goto: #9} {cal: B +1}
{choice} 我喜歡收到朋友或所愛的人贈送的禮物 {goto: #9} {cal: C +1}
#9
{choice} 我喜歡聽到別人接納我的話 {goto: #10} {cal: A +1}
{choice} 如果有人幫我的忙，我會知道他是愛我的 {goto: #10} {cal: D +1}
#10
{choice} 我喜歡和朋友與所愛的人一起做同一件事 {goto: #11} {cal: B +1}
{choice} 我喜歡聽到別人對我說友善的話 {goto: #11} {cal: A +1}
#11
{choice} 別人的表現要比他的言語更能感動我  {goto: #12} {cal: D +1}
{choice} 被擁抱讓我覺得與對方很親近，也覺得自己很重要 {goto: #12} {cal: E +1}
#12
{choice} 我珍惜別人的讚美，儘量避免受到批評 {goto: #13} {cal: A +1}
{choice} 送我許多小禮物要比送我一份大禮物更能感動我 {goto: #13} {cal: C +1}
#13
{choice} 當我和人聊天或一起做事時，我會覺得與他很親近 {goto: #14} {cal: B +1}
{choice} 朋友或所愛的人若常常與我有身體的接觸，我會覺得與他很親近 {goto: #14} {cal: E +1}
#14
{choice} 我喜歡聽到別人稱讚我的成就 {goto: #15} {cal: A +1}
{choice} 當別人勉強自己為我做一件事，我會覺得他很愛我 {goto: #15} {cal: D +1}
#15
{choice} 我喜歡朋友或所愛的人走過我身邊時，故意用身體觸碰我的感覺 {goto: #16} {cal: E +1}
{choice} 我喜歡別人聽我說話，而且表現出興趣十足的樣子 {goto: #16} {cal: B +1}
#16
{choice} 當朋友或所愛的人幫助我完成工作，我會覺得被愛 {goto: #17} {cal: D +1}
{choice} 我很喜歡收到朋友或所愛的人送的禮物 {goto: #17} {cal: C +1}
#17
{choice} 我喜歡聽到別人稱讚我的外表 {goto: #18} {cal: A +1}
{choice} 當別人願意體諒我的感受時，我會有被愛的感覺 {goto: #18} {cal: B +1}
#18
{choice} 在我心目中有特殊地位的人觸碰我的身體時，我覺得有安全感   {goto: #19} {cal: E +1}
{choice} 服務的行動讓我覺得被愛 {goto: #19} {cal: D +1}
#19
{choice} 我很感激在我心目中有特殊地位的人為我付出那麼多 {goto: #20} {cal: D +1}
{choice} 我喜歡收到在我心目中有特殊地位的人送我禮物 {goto: #20} {cal: C +1}
#20
{choice} 我很喜歡被人呵護備至的感覺 {goto: #21} {cal: B +1}
{choice} 我很喜歡被人服務的感覺 {goto: #21} {cal: D +1}
#21
{choice} 有人送我生日禮物時，我會覺得被愛及受重視 {goto: #22} {cal: C +1}
{choice} 有人在我生日那天對我說出特別的話，我會覺得被愛 {goto: #22} {cal: A +1}
#22
{choice} 有人送我禮物，我就知道他有想到我的需要 {goto: #23} {cal: C +1}
{choice} 有人幫我作家事，我會覺得被愛 {goto: #23} {cal: D +1}
#23
{choice} 我很感激有人耐心聽我說話而且不插嘴 {goto: #24} {cal: B +1}
{choice} 我很感激有人記得某個特別日子並且送我禮物 {goto: #24} {cal: C +1}
#24
{choice} 我喜歡知道我所愛的人因為關心我，幫我做家事或買麵包等  {goto: #25} {cal: D +1}
{choice} 我喜歡和在我心目中有特殊地位的人一起去逛街、旅行 {goto: #25} {cal: B +1}
#25
{choice} 我喜歡和最親近的人牽手、擁抱、親吻 {goto: #26} {cal: E +1}
{choice} 有人不為了特別理由而送我禮物，我會覺得很開心 {goto: #26} {cal: C +1}
#26
{choice} 我喜歡聽到有人向我表示感謝 {goto: #27} {cal: A +1}
{choice} 與人交談時，我喜歡對方注視我的眼睛 {goto: #27} {cal: B +1}
#27
{choice} 朋友或所愛的人所送的禮物，我會特別珍惜 {goto: #28} {cal: C +1}
{choice} 朋友或所愛的人碰觸我的身體，那種感覺真好 {goto: #28} {cal: E +1}
#28
{choice} 有人熱心做我所要求的事時，我會覺得被愛 {goto: #29} {cal: D +1}
{choice} 聽到別人對我表示感激，我會覺得被愛 {goto: #29} {cal: A +1}
#29
{choice} 我每天都需要身體的接觸 {goto: #30} {cal: E +1}
{choice} 我每天都需要肯定的言語（如：別人表達感激我的付出和努力） {goto: #30} {cal: A +1}
#30
{content} 
{show: A }分 肯定的言詞 (Words of affirmation)
提示: 想要說肯定的言詞，就必須學會用正面的態度處理心中的傷痛及憤怒。
{show: A }分精心的時刻 (Quality time)
提示: 精心時刻隱含的意義是：「我在乎你，你也在乎我。我們喜歡兩人在一起的感覺。」
{show: A }分接受禮物(Receiving gifts)
提示: 重要的不是禮物本身，而是籍禮物所傳達的愛。
{show: A }分 服務的行動(Acts of service)
提示: 服務的行動是真心誠意的付出，不是出於害怕，而是自由意志的選擇。
{show: A }分 身體的接觸(Physical touch)
提示: 你必須了解你要觸摸的對象，到底何種形式的觸摸對他／她來說才代表愛。
`;



/**
 [ { "id": "setting", "other": [ { "content": "", "cal": "A 0" }, { "content": "", "cal": "B 0" }, { "content": "", "cal": "C 0" }, { "content": "", "cal": "D 0" }, { "content": "", "cal": "E 0" } ], "choices": [ { "content": "選項$3", "object": [] } ], "content": {} }, { "id": "0", "other": [], "choices": [ { "content": "我喜歡收到寫滿讚美與肯定的小紙條", "object": [] }, { "content": "我喜歡被擁抱的感覺", "object": [] } ], "content": {} }, { "id": "1", "other": [], "choices": [ { "content": "我喜歡和在我心目中佔有特殊地位的人獨處", "object": [] }, { "content": "每當有人給我實際的幫助，我就會覺得他是愛我的", "object": [] } ], "content": {} }, { "id": "2", "other": [], "choices": [ { "content": "我喜歡收到禮物", "object": [] }, { "content": "我有空就喜歡去探訪朋友和所愛的人", "object": [] } ], "content": {} }, { "id": "3", "other": [], "choices": [ { "content": "有人幫我做事，我就會覺得被愛", "object": [] }, { "content": "有人碰觸我的身體，我就會覺得被愛", "object": [] } ], "content": {} }, { "id": "4", "other": [], "choices": [ { "content": "當我所愛、所景仰的人攬著我的肩膀，我就會有被愛的感覺", "object": [] }, { "content": "當我所愛、所景仰的人送我禮物，我就會有被愛的感覺", "object": [] } ], "content": {} }, { "id": "5", "other": [], "choices": [ { "content": "我喜歡和朋友或所愛的人到處走走", "object": [] }, { "content": "我喜歡和在我心目中有特殊地位的人擊掌或牽手", "object": [] } ], "content": {} }, { "id": "6", "other": [], "choices": [ { "content": "愛的具體象徵（禮物）對我很重要", "object": [] }, { "content": "受到別人的肯定讓我有被愛的感覺", "object": [] } ], "content": {} }, { "id": "7", "other": [], "choices": [ { "content": "我喜歡和我所喜歡的人促膝長談", "object": [] }, { "content": "我喜歡聽到別人說我很漂亮，很迷人或很有氣質", "object": [] } ], "content": {} }, { "id": "8", "other": [], "choices": [ { "content": "我喜歡和好友及所愛的人在一起", "object": [] }, { "content": "我喜歡收到朋友或所愛的人贈送的禮物", "object": [] } ], "content": {} }, { "id": "9", "other": [], "choices": [ { "content": "我喜歡聽到別人接納我的話", "object": [] }, { "content": "如果有人幫我的忙，我會知道他是愛我的", "object": [] } ], "content": {} }, { "id": "10", "other": [], "choices": [ { "content": "我喜歡和朋友與所愛的人一起做同一件事", "object": [] }, { "content": "我喜歡聽到別人對我說友善的話", "object": [] } ], "content": {} }, { "id": "11", "other": [], "choices": [ { "content": "別人的表現要比他的言語更能感動我", "object": [] }, { "content": "被擁抱讓我覺得與對方很親近，也覺得自己很重要", "object": [] } ], "content": {} }, { "id": "12", "other": [], "choices": [ { "content": "我珍惜別人的讚美，儘量避免受到批評", "object": [] }, { "content": "送我許多小禮物要比送我一份大禮物更能感動我", "object": [] } ], "content": {} }, { "id": "13", "other": [], "choices": [ { "content": "當我和人聊天或一起做事時，我會覺得與他很親近", "object": [] }, { "content": "朋友或所愛的人若常常與我有身體的接觸，我會覺得與他很親近", "object": [] } ], "content": {} }, { "id": "14", "other": [], "choices": [ { "content": "我喜歡聽到別人稱讚我的成就", "object": [] }, { "content": "當別人勉強自己為我做一件事，我會覺得他很愛我", "object": [] } ], "content": {} }, { "id": "15", "other": [], "choices": [ { "content": "我喜歡朋友或所愛的人走過我身邊時，故意用身體觸碰我的感覺", "object": [] }, { "content": "我喜歡別人聽我說話，而且表現出興趣十足的樣子", "object": [] } ], "content": {} }, { "id": "16", "other": [], "choices": [ { "content": "當朋友或所愛的人幫助我完成工作，我會覺得被愛", "object": [] }, { "content": "我很喜歡收到朋友或所愛的人送的禮物", "object": [] } ], "content": {} }, { "id": "17", "other": [], "choices": [ { "content": "我喜歡聽到別人稱讚我的外表", "object": [] }, { "content": "當別人願意體諒我的感受時，我會有被愛的感覺", "object": [] } ], "content": {} }, { "id": "18", "other": [], "choices": [ { "content": "在我心目中有特殊地位的人觸碰我的身體時，我覺得有安全感", "object": [] }, { "content": "服務的行動讓我覺得被愛", "object": [] } ], "content": {} }, { "id": "19", "other": [], "choices": [ { "content": "我很感激在我心目中有特殊地位的人為我付出那麼多", "object": [] }, { "content": "我喜歡收到在我心目中有特殊地位的人送我禮物", "object": [] } ], "content": {} }, { "id": "20", "other": [], "choices": [ { "content": "我很喜歡被人呵護備至的感覺", "object": [] }, { "content": "我很喜歡被人服務的感覺", "object": [] } ], "content": {} }, { "id": "21", "other": [], "choices": [ { "content": "有人送我生日禮物時，我會覺得被愛及受重視", "object": [] }, { "content": "有人在我生日那天對我說出特別的話，我會覺得被愛", "object": [] } ], "content": {} }, { "id": "22", "other": [], "choices": [ { "content": "有人送我禮物，我就知道他有想到我的需要", "object": [] }, { "content": "有人幫我作家事，我會覺得被愛", "object": [] } ], "content": {} }, { "id": "23", "other": [], "choices": [ { "content": "我很感激有人耐心聽我說話而且不插嘴", "object": [] }, { "content": "我很感激有人記得某個特別日子並且送我禮物", "object": [] } ], "content": {} }, { "id": "24", "other": [], "choices": [ { "content": "我喜歡知道我所愛的人因為關心我，幫我做家事或買麵包等", "object": [] }, { "content": "我喜歡和在我心目中有特殊地位的人一起去逛街、旅行", "object": [] } ], "content": {} }, { "id": "25", "other": [], "choices": [ { "content": "我喜歡和最親近的人牽手、擁抱、親吻", "object": [] }, { "content": "有人不為了特別理由而送我禮物，我會覺得很開心", "object": [] } ], "content": {} }, { "id": "26", "other": [], "choices": [ { "content": "我喜歡聽到有人向我表示感謝", "object": [] }, { "content": "與人交談時，我喜歡對方注視我的眼睛", "object": [] } ], "content": {} }, { "id": "27", "other": [], "choices": [ { "content": "朋友或所愛的人所送的禮物，我會特別珍惜", "object": [] }, { "content": "朋友或所愛的人碰觸我的身體，那種感覺真好", "object": [] } ], "content": {} }, { "id": "28", "other": [], "choices": [ { "content": "有人熱心做我所要求的事時，我會覺得被愛", "object": [] }, { "content": "聽到別人對我表示感激，我會覺得被愛", "object": [] } ], "content": {} }, { "id": "29", "other": [], "choices": [ { "content": "我每天都需要身體的接觸", "object": [] }, { "content": "我每天都需要肯定的言語（如：別人表達感激我的付出和努力）", "object": [] } ], "content": {} } ]#1
 * 
 * 
 * 1 幻想現在你即將要走入一片森林，如果你可以帶一隻動物陪你，那是甚麼？形容一下牠。

2 步入森林，你覺得現在是白天還是夜晚呢？

3 進入森林後，你看見的第一隻動物會是甚麼？形容一下牠。

4 途中你看見地上有一條鑰匙，你會把它撿起來嗎？

5 突然有隻大灰熊慢慢地朝著你走過來，你會怎樣？

6 此時你看見有間屋在正前方，你認為那是一間小木屋還是豪宅？

7 你走到屋前，屋門正在打開還是關上？

8 進了屋裡，你看見枱上有杯水，裡面有幾多水？

9 枱上還有一個花瓶，裡面有多少支花呢？

10 除了枱外，還有椅子，你認為有多少張？

11 屋裡有幾間房，你覺得有多少間？

12 房裡有個老人家，你覺得他會是一個怎樣的人？

13 走出屋外，有個小女孩在賣花，你正打算買100支送給愛人，你會選擇多少支紅玫瑰和白玫瑰？

14 你發現屋旁邊有一個湖，這個湖被一片草原還是樹林圍繞著？

15 湖的旁邊有一個正在釣魚的漁夫，他打算送你一條魚，你會選擇收下嗎？

16 你正準備離開這個森林，你會跟剛才陪在身邊的動物再次回來遊逛嗎？



#1", "options": [{ "type": "A", "text": "我喜歡收到寫滿讚美與肯定的小紙條" }, { "type": "E", "text": "我喜歡被擁抱的感覺" }] },
            #2", "options": [{ "type": "B", "text": "我喜歡和在我心目中佔有特殊地位的人獨處" }, { "type": "D", "text": "每當有人給我實際的幫助，我就會覺得他是愛我的" }] },
            #3", "options": [{ "type": "C", "text": "我喜歡收到禮物" }, { "type": "B", "text": "我有空就喜歡去探訪朋友和所愛的人" }] },
            #4", "options": [{ "type": "D", "text": "有人幫我做事，我就會覺得被愛" }, { "type": "E", "text": "有人碰觸我的身體，我就會覺得被愛" }] },
            #5", "options": [{ "type": "E", "text": "當我所愛、所景仰的人攬著我的肩膀，我就會有被愛的感覺" }, { "type": "C", "text": "當我所愛、所景仰的人送我禮物，我就會有被愛的感覺" }] },
            #6", "options": [{ "type": "B", "text": "我喜歡和朋友或所愛的人到處走走" }, { "type": "E", "text": "我喜歡和在我心目中有特殊地位的人擊掌或牽手" }] },
            #7", "options": [{ "type": "C", "text": "愛的具體象徵（禮物）對我很重要" }, { "type": "A", "text": "受到別人的肯定讓我有被愛的感覺" }] },
            #8", "options": [{ "type": "E", "text": "我喜歡和我所喜歡的人促膝長談" }, { "type": "A", "text": "我喜歡聽到別人說我很漂亮，很迷人或很有氣質" }] },
            #9", "options": [{ "type": "B", "text": "我喜歡和好友及所愛的人在一起" }, { "type": "C", "text": "我喜歡收到朋友或所愛的人贈送的禮物" }] },
            #10", "options": [{ "type": "A", "text": "我喜歡聽到別人接納我的話" }, { "type": "D", "text": "如果有人幫我的忙，我會知道他是愛我的" }] },
            #11", "options": [{ "type": "B", "text": "我喜歡和朋友與所愛的人一起做同一件事" }, { "type": "A", "text": "我喜歡聽到別人對我說友善的話" }] },
            #12", "options": [{ "type": "D", "text": "別人的表現要比他的言語更能感動我 " }, { "type": "E", "text": "被擁抱讓我覺得與對方很親近，也覺得自己很重要" }] },
            #13", "options": [{ "type": "A", "text": "我珍惜別人的讚美，儘量避免受到批評" }, { "type": "C", "text": "送我許多小禮物要比送我一份大禮物更能感動我" }] },
            #14", "options": [{ "type": "B", "text": "當我和人聊天或一起做事時，我會覺得與他很親近" }, { "type": "E", "text": "朋友或所愛的人若常常與我有身體的接觸，我會覺得與他很親近" }] },
            #15", "options": [{ "type": "A", "text": "我喜歡聽到別人稱讚我的成就" }, { "type": "D", "text": "當別人勉強自己為我做一件事，我會覺得他很愛我" }] },
            #16", "options": [{ "type": "E", "text": "我喜歡朋友或所愛的人走過我身邊時，故意用身體觸碰我的感覺" }, { "type": "B", "text": "我喜歡別人聽我說話，而且表現出興趣十足的樣子" }] },
            #17", "options": [{ "type": "D", "text": "當朋友或所愛的人幫助我完成工作，我會覺得被愛" }, { "type": "C", "text": "我很喜歡收到朋友或所愛的人送的禮物" }] },
            #18", "options": [{ "type": "A", "text": "我喜歡聽到別人稱讚我的外表" }, { "type": "B", "text": "當別人願意體諒我的感受時，我會有被愛的感覺" }] },
            #19", "options": [{ "type": "E", "text": "在我心目中有特殊地位的人觸碰我的身體時，我覺得有安全感  " }, { "type": "D", "text": "服務的行動讓我覺得被愛" }] },
            #20", "options": [{ "type": "D", "text": "我很感激在我心目中有特殊地位的人為我付出那麼多" }, { "type": "C", "text": "我喜歡收到在我心目中有特殊地位的人送我禮物" }] },
            #21", "options": [{ "type": "B", "text": "我很喜歡被人呵護備至的感覺" }, { "type": "D", "text": "我很喜歡被人服務的感覺" }] },
            #22", "options": [{ "type": "C", "text": "有人送我生日禮物時，我會覺得被愛及受重視" }, { "type": "A", "text": "有人在我生日那天對我說出特別的話，我會覺得被愛" }] },
            #23", "options": [{ "type": "C", "text": "有人送我禮物，我就知道他有想到我的需要" }, { "type": "D", "text": "有人幫我作家事，我會覺得被愛" }] },
            #24", "options": [{ "type": "B", "text": "我很感激有人耐心聽我說話而且不插嘴" }, { "type": "C", "text": "我很感激有人記得某個特別日子並且送我禮物" }] },
            #25", "options": [{ "type": "D", "text": "我喜歡知道我所愛的人因為關心我，幫我做家事或買麵包等 " }, { "type": "B", "text": "我喜歡和在我心目中有特殊地位的人一起去逛街、旅行" }] },
            #26", "options": [{ "type": "E", "text": "我喜歡和最親近的人牽手、擁抱、親吻" }, { "type": "C", "text": "有人不為了特別理由而送我禮物，我會覺得很開心" }] },
            #27", "options": [{ "type": "A", "text": "我喜歡聽到有人向我表示感謝" }, { "type": "B", "text": "與人交談時，我喜歡對方注視我的眼睛" }] },
            #28", "options": [{ "type": "C", "text": "朋友或所愛的人所送的禮物，我會特別珍惜" }, { "type": "E", "text": "朋友或所愛的人碰觸我的身體，那種感覺真好" }] },
            #29", "options": [{ "type": "D", "text": "有人熱心做我所要求的事時，我會覺得被愛" }, { "type": "A", "text": "聽到別人對我表示感激，我會覺得被愛" }] },
            #30", "options": [{ "type": "E", "text": "我每天都需要身體的接觸" }, { "type": "A", "text": "我每天都需要肯定的言語（如：別人表達感激我的付出和努力）" }] }
	


            {
                "type": "A",
                "short_name": "肯定的言詞",
                "name": "肯定的言詞 (Words of affirmation)",
                "description": "想要說肯定的言詞，就必須學會用正面的態度處理心中的傷痛及憤怒。"
            },
            {
                "type": "B",
                "short_name": "精心的時刻",
                "name": "精心的時刻 (Quality time)",
                "description": "精心時刻隱含的意義是：「我在乎你，你也在乎我。我們喜歡兩人在一起的感覺。」"
            },
            {
                "type": "C",
                "short_name": "接受禮物",
                "name": "接受禮物(Receiving gifts)",
                "description": "重要的不是禮物本身，而是籍禮物所傳達的愛。"
            },
            {
                "type": "D",
                "short_name": "服務的行動",
                "name": "服務的行動(Acts of service)",
                "description": "服務的行動是真心誠意的付出，不是出於害怕，而是自由意志的選擇。"
            },
            {
                "type": "E",
                "short_name": "身體的接觸",
                "name": "身體的接觸(Physical touch)",
                "description": "你必須了解你要觸摸的對象，到底何種形式的觸摸對他／她來說才代表愛。"
            }],
 */