"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const adminSecret = process.env.ADMIN_SECRET || '';
const schema = require('../modules/schema.js');
const gameName = function () {
    return '【成就Bingo遊戲】.bingo'
}
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [5, 100, 200, 500, 500, 500, 500, 500];

const gameType = function () {
    return 'funny:achievenment:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.bingo|\.bingos$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【成就Bingo遊戲】
這是以成就為主題的Bingo遊戲，
每個Bingo遊戲都有一個標題，並且有3X3 到5X5 的內容。
當你開始一個Bingo遊戲時，會以那些成就內容拼出Bingo圖案，
當你看到那個成就是你已達成的，就可以點擊它，
下面會出現分數計算。
所有人都可以點擊，並進行分數計算。
--------------------------------
【私人群組版】
.bingo help - 查看說明
.bingo achievement - 查看你已達成的成就列表
.bingo achievement 標題 - 查看你已達成的成就列表
.bingo list - 查看現在有的Bingo遊戲列表
.bingo list 標題 - 查看該Bingo遊戲的內容列表
.bingo add  標題 內容1 內容2 .... 內容N (至少9個或以上) - 新增一個Bingo遊戲
.bingo remove 標題 - 刪除一個Bingo遊戲 (限機械人管理員)
.bingo 標題名字 - 開始bingo遊戲
--------------------------------
【公用版】
.bingos help - 查看說明
.bingos achievement - 查看你已達成的成就列表
.bingos list - 查看現在有的Bingo遊戲列表
.bingos list 標題 - 查看該Bingo遊戲的內容列表
.bingos add  標題 內容1 內容2 .... 內容N (至少9個或以上) - 新增一個Bingo遊戲
.bingos remove 標題 - 刪除一個Bingo遊戲 (限頻道管理員)
.bingos 標題名字 - 開始bingo遊戲
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
            rply.buttonCreate = ['.bingos list']
            return rply;
        }
        case /^.bingos$/.test(mainMsg[0]) && /^achievement$/.test(mainMsg[1]): {
            rply.text = 'Demo'
            return rply;
        }
        case /^.bingos$/.test(mainMsg[0]) && /^list$/.test(mainMsg[1]): {
            console.log('button')
            let achievement = await Achievement.init('0000000000');
            console.log('achievement', achievement);
            try {
                let list = achievement.list(mainMsg[2]);
                (list.list) ? rply.text = list.list : null;
                (list.button && list.button.length) ? rply.buttonCreate = list.button : null;
            } catch (e) {
                console.log('e', e)
                rply.text = e;
            }
            console.log('rply', rply)
            return rply;
        }
        case /^.bingos$/.test(mainMsg[0]) && /^add$/.test(mainMsg[1]): {
            try {
                console.log('add')
                let achievement = await Achievement.init('0000000000');
                let docCount = await achievement.countDoc('0000000000');
                console.log('docCount', docCount)
                if (docCount >= 20) return rply.text = '遊戲數量已達上限';

                let result = await Achievement.add('0000000000', mainMsg);

                let achievement2 = await Achievement.init('0000000000', mainMsg[2]);
                try {
                    let list = achievement2.play(mainMsg[2]);
                    rply.text = list.list;
                    rply.bingoButtonCreate = list.button;
                } catch (e) {
                    console.log('e', e)
                    rply.text = e;
                }
            } catch (error) {
                rply.text = error;
            }
            return rply;
        }
        case /^.bingos$/.test(mainMsg[0]) && /^remove$/.test(mainMsg[1]): {
            try {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                rply.text = await Achievement.remove('0000000000', mainMsg);
            } catch (error) {
                console.log('error', error)
                rply.text = error;
            }
            return rply;
        }
        case /^.bingos$/.test(mainMsg[0]) && /^\S+$/.test(mainMsg[1]): {
            let achievement = await Achievement.init('0000000000', mainMsg[1]);
            console.log('achievement', achievement);

            try {
                let list = achievement.play(mainMsg[1]);
                rply.text = list.list;
                rply.bingoButtonCreate = list.button;
            } catch (e) {
                console.log('e', e)
                rply.text = e;
            }
            return rply;
        }
        default: {
            break;
        }
    }
}


function sliceString(str, length) {
    console.log('str', str)
    let result = [];
    if (typeof str === 'string') {
        return str.slice(0, 50)
    }
    for (let i = 0; (i < 35 && i < str.length); i++) {
        result[i] = str[i].slice(0, 50)
    }
    console.log('result', result)
    return result;

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

class Achievement {
    constructor() {
        this.achievements = [];
    }
    static init(groupID, title) {
        console.log('AAA', groupID, title)
        return (async function (groupID, title) {
            console.log('AAA2', groupID, title)
            try {
                let achievement = new Achievement()
                // Do async stuff
                console.log('title3', title)
                let data = await achievement.build(groupID, title)
                console.log('data', data)
                // Return instance
                achievement.achievements = data;
                return achievement
            } catch (error) {
                console.log('error', error)
                return
            }
        }(groupID, title))
    }
    async countDoc(groupID) {
        return await schema.Achievement.countDocuments({ groupID: groupID }).catch(error => console.error(error));
    }
    async build(groupID, title = null) {
        console.log('groupID', groupID)
        let obj = { groupID: groupID };
        if (title) obj.title = title;
        console.log('obj', obj)
        let data = schema.Achievement.find(obj).catch(error => console.error(error));
        console.log('data', data)
        return data
    }
    //https://stackoverflow.com/questions/43431550/async-await-class-constructor

    list(target) {
        if (!this.achievements || this.achievements.length === 0)
            throw '未有遊戲，請先新增遊戲\n.bingos add 標題 內容1 內容2 .... 內容N (至少9個或以上) - 新增一個Bingo遊戲';
        let response = { list: '', button: [] };
        if (target) {
            for (let index = 0; index < this.achievements.length; index++) {
                if (this.achievements[index].title === target) {
                    console.log('this.achievements[index].title', this.achievements[index].title)
                    response.list += `${this.achievements[index].title} 內容列表\n----------------\n`
                    for (let i = 0; i < this.achievements[index].detail.length; i++) {
                        response.list += `${i + 1}. ${this.achievements[index].detail[i]}\n`
                    }
                    console.log('response', response)
                    return response
                }
            }
            throw `找不到遊戲${target}，可以使用\n.bingos list - 查看遊戲列表`;
        }

        for (let index = 0; index < this.achievements.length; index++) {
            response.button.push(`.bingos ${this.achievements[index].title}`)
            response.list += `${index + 1}. ${this.achievements[index].title}\n`
        }
        return response


    }
    static async add(groupID, text) {
        return (async function (groupID, text) {
            let countScore = (text.match('--'))
            if (text.length <= 11) throw '至少需要9個內容';
            let data = {
                groupID: groupID,
                title: sliceString(text[2], 50),
                detail: sliceString(text.splice(3), 30)
            }
            console.log('data,3', data)
            let query = { groupID: data.groupID, title: data.title };

            let result = await schema.Achievement.findOne(query)
                .catch(error => console.error(error));
            console.log('result', result)
            if (result) throw '已有相同標題的Bingo遊戲，請用其他標題重新輸入';
            console.log('????')
            try {
                let achievement = new schema.Achievement({ groupID: data.groupID, title: data.title, detail: data.detail })
                let addResult = await achievement.save()
                console.log('addResult', addResult)
                if (addResult) return { text: '已新增成功', button: data.detail }
                else throw '新增失敗，請重新輸入';
            } catch (error) {
                console.log('error', error)
            }


        }(groupID, text))
    }

    static checkVariable(input) {
        const options = {
            "--noscore": false,
            "--score": false,
            "-v": false,
            "-ver": false
        };

        const words = input.split(" ");
        let newInput = ""

        for (let i = 0; i < words.length; i++) {
            if (options.hasOwnProperty(words[i])) {
                options[words[i]] = true;
            } else {
                newInput += words[i] + " ";
            }
        }

        console.log("Found options:", options);
        console.log("New input:", newInput);
    }

    static getString() {
        const inputString = "Bingos遊戲 - 名字\n----------------\nXXX已取得 - YYYY\nYYY已還原 - ZZZZ\n----------------\n得分\nXXXXX : 20分\n----------------";

        const delimiter = "----------------";

        const parts = inputString.split(delimiter);

        console.log(parts[1]);  // "XXX已取得 - YYYY\nYYY已還原 - ZZZZ\n"
        console.log(parts[2]);  // "得分\nXXXXX : 20分\n"
    }

    static updateString(name, action, newItem) {
        const inputString = "XXX已取得 - YYYY\nYYY已還原 - ZZZZ";

        const updateName = "XXX";
        const updateStatus = "已還原";
    //    const newItem = "新項目";

        const lines = inputString.split("\n");
        let updated = false;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(updateName)) {
                const parts = lines[i].split(" - ");
                parts[0] = updateName + updateStatus;
                parts[1] = newItem;
                lines[i] = parts.join(" - ");
                updated = true;
                break;
            }
        }

        if (!updated) {
            lines.push(updateName + updateStatus + " - " + newItem);
        }

        const result = lines.join("\n");
        console.log(result);

        //const newString = updateString("XXX", "已還原", "新項目");
        //console.log(newString);
    }


    static randomOrderArray(array) {
        let result = [];
        let temp = [];
        for (let i = 0; i < array.length; i++) {
            temp.push(array[i]);
        }
        for (let i = 0; i < array.length; i++) {
            let index = Math.floor(Math.random() * temp.length);
            result.push(temp[index]);
            temp.splice(index, 1);
        }
        return result;
    }
    static async remove(groupID, text) {
        let data = {
            groupID: groupID,
            title: sliceString(text[2], 50)
        }
        let query = { groupID: data.groupID, title: data.title };

        let result = await schema.Achievement.findOneAndRemove(query)
            .catch(error => console.error(error));
        console.log('result', result)
        if (result) return '已刪除成功'
        else throw '刪除失敗，請檢查然後重新輸入\n.bingos list - 列出所有遊戲';
    }
    play() {
        if (this.achievements && this.achievements.length === 1) {
            console.log('this.achievements',)
            let response = { list: '', button: [] };
            for (let index = 0; index < this.achievements[0].detail.length; index++) {
                response.button.push(`${this.achievements[0].detail[index]}`)
            }
            response.list = `Bingo${this.achievements[0].groupID === '0000000000' ? 's' : ''}遊戲 - ${this.achievements[0].title}\n----------------\n----------------\n----------------\n`
            response.button = Achievement.randomOrderArray(response.button);
            return response
        }
        else {
            throw '沒有此遊戲，請先檢查遊戲標題是否正確\n.bingos list - 列出所有遊戲';
        }
    }
}

class AchievementUserSroce {
    constructor(data) {
        this.userID = data.userID;
        this.achievement = data.achievement;
    }
}


/**
 成就系統
A. 分成四個部分
1. 成就系統
    i. 不同的身份
        1. TRPG玩家
        2. 占卜師
        3. 管理員
    ii. 不同的成就
        1. 玩家
            1. 玩家總數
2. 每日任務
    i. 每日簽到
    ii. 每日抽卡
    iii. 每日占卜
    iv. 每日獲得經驗值 
    v. 系統的每日任務
3. 每日抽獎
4. 定時訊息
5. 獎勵?

    1. 用戶可以自行設定公用成就
    2. 用戶可以自行設定私人成就
    3. 用戶可以自行設定每日任務
    4. 用戶可以自行設定每週任務
    3. 用戶可以自行打開成就列表，然後點擊表示已經完成
    4. 用戶可以自行設定成就的條件

 */