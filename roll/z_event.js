"use strict";
if (!process.env.mongoURL) {
    return;
}
var variables = {};
const rollDice = require('./rollbase');
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
const regexMain = new RegExp(/^((-)?\d):(.*)/, 'igm');
const regexExp = new RegExp(/^exp:(.*)/, 'im');
const regexName = new RegExp(/^name:(.*)/, 'im');

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
\n.event add \n\
name:Haha\n\
exp:SAN *不是必需 \ns0:你今天的運氣真好;你是個好人;我愛你\n-1:你中招了;你不好運要-SAN了\n1:你吃了好味的糖，加SAN人\n\
"
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
    channelid,
    displayname,
    displaynameDiscord
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
    let events = {};
    let temp;
    let tempMain = {};
    let lv;
    let temp2;
    let limit = limitArr[0];
    let check;
    let levelLv = 0;
    let temp3 = 0;
    /**
     * .event
     * .event add 事件    新增事件
     * .event delete 事件  刪除事件
     * .event show  空白/ (事件名稱)
     * 空白顯示列表  
     * .evt 
     */
    /**
     * .event add 
     * name:神奇事件
     * exp:SAN
     * 0:你今天的運氣真好;你是個好人;我愛你
     * -1:你中招了:你不好運要-SAN了
     * 1:你吃了好味的糖，加SAN人
     */

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /(^[.]event$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            events = await analysicInputData(inputStr); //分析輸入的資料
            if (!events.MainData || !events.eventName) {
                rply.text = '沒有輸入事件或名字，請重新整理內容 格式為 \n.event add \nname:Haha \nexp:SAN *不是必需 \ns0:你今天的運氣真好;你是個好人;我愛你\n-1:你中招了;你不好運要-SAN了\n1:你吃了好味的糖，加SAN人\n'
                return rply;
            }

            /*
            基本只限四次事件.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckUser(userid);
            limit = limitArr[lv];
            check = await schema.eventList.find({
                userID: userid
            });
            levelLv = await findMaxLv(userid);

            //取得本來的資料, 如有重覆, 以新的覆蓋
            //doc = await schema.event.findOne(filter);
            var mainSplit = await analysicDetail(events.MainData)
            if (mainSplit.length < 3 || mainSplit.length > Number(3 + levelLv)) {
                rply.text = '新增事件失敗\n一個事件需要至少設定 3 個結果\n你現在的VIP LV最多同時可設定 ' + Number(3 + levelLv) + ' 個事件'
                return rply;
            }
            //至少一個是正面
            let positiveCheck = false;
            for (let index = 0; index < mainSplit.length; index++) {
                (Number(mainSplit[index].result) > 0) ? positiveCheck = true : null;
                levelLv += Number(mainSplit[index].result);
            }

            if (!positiveCheck) {
                rply.text = '新增事件失敗\n需要至少設定一個正面事件'
                return rply;
            }
            if (levelLv < 0) {
                rply.text = '新增事件失敗\n因為不可以過多負面事件\n事件種類加(使用者LV/10)必需高於0\n現在加起來是' + levelLv + ' 點'
                return rply;
            }
            var listDatas = {
                title: events.eventName,
                userID: userid,
                userName: displaynameDiscord || displayname || '',
                detail: mainSplit,
                expName: events.expName || ''
            }
            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp(events.eventName, "i")
                }
            }
            try {
                doc = await schema.eventList.updateOne(filter, listDatas, opt);
            } catch (error) {
                console.log('新增事件 GET ERROR: ', error)
                rply.text = '新增事件失敗\n因為 ' + error.message
                return rply;
            }
            if (!doc && check && check.length >= limit) {
                rply.text = '你的事件上限為' + limit + '件' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply
            }
            tempMain = await schema.eventList.findOne(filter);

            var eventsDatas = {
                userID: userid,
                userName: displaynameDiscord || displayname || '',
                eventList: {
                    title: events.eventName,
                    eventID: tempMain._id
                }
            }
            if (!tempMain._id) {
                rply.text = '新增事件失敗'
                return rply;
            }
            try {
                filter = {
                    userID: userid
                }
                temp = await schema.eventMember.findOne(filter);
                if (!temp) {
                    temp = new schema.eventMember(eventsDatas);
                } else {
                    var findEventId = temp.eventList.findIndex((obj => obj.eventID == tempMain._id));
                    if (findEventId >= 0) {
                        temp.eventList[findEventId] = {
                            title: events.eventName,
                            eventID: tempMain._id
                        }
                        temp.userName = displaynameDiscord || displayname || '';
                    } else {
                        temp.eventList.push({
                            title: events.eventName,
                            eventID: tempMain._id
                        })
                        temp.userName = displaynameDiscord || displayname || '';
                    }


                }
                await temp.save();

            } catch (error) {
                console.log('新增事件 GET ERROR: ', error)
                rply.text = '新增事件失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '新增/修改事件 - ' + tempMain.title + '\n經驗值的名稱: ' + tempMain.expName + '\n';
            for (let index = 0; index < tempMain.detail.length; index++) {
                rply.text += '類型:' + tempMain.detail[index].result + ' 內容: ' + tempMain.detail[index].event + '\n';

            }
            return rply;
        case /(^[.]event$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp(inputStr.replace(/^\.event\s+delete\s+/ig, '').replace(/\s+$/, ''), "i")
                }
            }
            doc = await schema.eventList.findOne(filter);
            if (!doc) {
                rply.text = '沒有此事件.'
                return rply
            }
            try {
                await schema.eventList.findOneAndRemove(filter);
                await schema.eventMember.updateOne({
                    userID: userid
                }, {
                    $pull: {
                        eventList: {
                            eventID: doc._id
                        }
                    }
                })
            } catch (error) {
                console.log('刪除事件 GET ERROR:  ', error)
                rply.text = '刪除事件失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除事件成功: ' + doc.title
            return rply;
        case /(^[.]event$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            filter = {
                userID: userid
            }
            doc = await schema.eventList.find(filter);
            rply.text = "====你創作的事件列表====\n"
            for (let index = 0; index < doc.length; index++) {
                rply.text += doc[index].title + "\n";
                if (doc[index].expName) rply.text += '經驗值的名稱: ' + doc[index].expName + "\n";
                rply.text += getDetail(doc[index]) + '\n';

            }
            return rply;
        case /(^[.]evt$)/i.test(mainMsg[0]) && /^random$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '你不在群組.請在群組使用此功能 '
                return rply
            }
            let gp = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!gp || !gp.SwitchV2) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                return rply;
            }
            //用來看EN還有多少, 沒有就RETURN
            //沒有就新增一個

            let eventMember = await schema.eventMember.findOne({
                userID: userid
            });


            //尋找所有群組的資料，用來設定EN上限            
            let maxLv = await findMaxLv(userid);
            let thisMember = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });
            if (!thisMember) rply.text = `錯誤發生，未有在這群組的資料`;
            /**
             * 檢查ENERGY，如果沒有則新增，數字為EN= 20+LV
             */
            if (!eventMember) {
                eventMember = new schema.eventMember({
                    userID: userid,
                    userName: displaynameDiscord || displayname || '',
                    energy: maxLv + 20,
                    lastActiveAt: new Date(Date.now())
                });

            }
            if (!eventMember.energy) {
                eventMember.energy = maxLv + 20;
            }

            //TODO:計算EN的回複量

            if (eventMember.energy < 5) {
                rply.text = "隨機事件需要5EN, 你現在只有" + eventMember.energy + "EN"
                return rply;
            } else {
                eventMember.energy -= 5
            }
            await eventMember.save();

            let eventList = await schema.eventList.aggregate([{ $sample: { size: 1 } }]);
            if (eventList.length == 0) {
                rply.text = '未有人新增事件，你可以成為第一個事件產生者!'
                return rply;
            }

            let randomDetail = eventList[0].detail[await rollDice.Dice(eventList[0].detail.length) - 1];
            let eventText = randomDetail.event.split(';');

            rply.text += "====事件====\n" + eventText[await rollDice.Dice(eventText.length) - 1];

            rply.text += `\n${await eventProcessExp({ randomDetail: randomDetail, groupid: groupid, eventList: eventList[0], thisMember: thisMember })}`


            return rply;
        }
        default:
            break;

    }
}

function getDetail(doc) {
    let text = '';
    for (let index = 0; index < doc.detail.length; index++) {
        text += '類型:' + doc.detail[index].result + ' 內容: ' + doc.detail[index].event + '\n'
    }
    return text;
}






async function findObject(doc, mainMsg) {
    let re = mainMsg.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let resutlt = doc.find(element => {
        return element.name.match(new RegExp('^' + re + '$', 'i'))
    });
    return resutlt;
}


async function replacer(doc, match) {
    let result = ""
    let state = await findObject(doc.state, match);
    let note = await findObject(doc.notes, match);
    result = state.itemA || note.itemA || '';
    return result;
}
async function analysicInputData(inputStr) {
    let MainData = (inputStr.match(regexMain)) ? inputStr.match(regexMain) : '';
    let ExpName = (inputStr.match(regexExp)) ? inputStr.match(regexExp)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let eventName = (inputStr.match(regexName)) ? inputStr.match(regexName)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';

    //let characterState = (characterStateTemp) ? await analysicStr(characterStateTemp, true) : [];
    //let characterRoll = (characterRollTemp) ? await analysicStr(characterRollTemp, false) : [];
    //Remove duplicates from an array of objects in JavaScript
    // if (characterState)
    // characterState = characterState.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    //if (characterRoll)
    let result = {
        expName: ExpName,
        MainData: MainData,
        eventName: eventName
    }
    return result;
}
async function analysicDetail(data) {
    let info = [];
    for (let index = 0; index < data.length; index++) {
        let temp = data[index].match(/(-?\d+):(.*)/);
        if (temp[1] <= 3 && temp[1] >= -5)
            info.push({
                event: temp[2],
                result: temp[1]
            })
    }
    return info;
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

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};



/**
 * TODO:
 * 1. .evt (event)系統設計
經由新增的事件 可以增加減少EXP
功能及設計列表
1. 舉報不良項目, 有幾個個舉報, 自動隱藏
3. 
進入事件的方法
輸入 .evt event ->   即 進入 隨機事件, 消耗5EN
輸入 .evt (事件名稱) ->   即 進入 指定事件, 消耗15EN

EN= 20+LV
每5分鐘回複1點EN

得知事件名稱的方法，別人告知 或 經隨機事件知道名字

4. 
事件效果
-1. 直接減少X點經驗(X分鐘內)
-2. 停止得到經驗(X分鐘內)
-3. 分發X經驗給整個CHANNEL中的X人
-4. 停止得到經驗(X分鐘內)並每次減少發言減少X經驗
-5. 吸收對方X點經驗
0. 沒有事發生
1. 直接增加X點經驗(X分鐘內)
2. 對方得到經驗值 X 倍(X分鐘內)
3. 從整個CHANNEL 的X人吸收X點經驗

5. 
設計事件的好處
能夠吸收對方消耗的en 作為自己的exp

6.
設計方式
輸入 .evt add 天命
你被雷打中 得到{exp}點真氣  2  (直接增加X點經驗)
你掉下山中 頭破血流，損失{exp}點真氣  3  (直接減少X點經驗)
今天風平浪靜 1 (無事發生)

可以有3+(ROUNDDOWN 設計者LV/10)  項結果
由設計者自己設定
一個事件由以下三項組成
事件名稱，事件內容及設定事件結果 

7. 
限制
A. 一個事件中，正面選項要比負面選項多
B. 事件效果隨著設計者LV 而開發
如: 效果1-3 LV0-10 可用
4 需要LV11-20LV
5 需要LV21-30
C. 一個事件中，不可以全部正面效果
D. 一個事件可用的總EN 為(10+LV)，負面事件消耗X點EN

8.
變數X 普通為
設計者LV , 
使用者LV, 
設計者LV 與使用者LV 的相差,
負面效果的程度(即如果一個事件中有負面效果，那正面效果會增加)
 * 
 * 
 * A) .evt event / .evt 指定名字   - roll/event.js  (檢查有沒有開EXP功能)
 * B) 沒有則RETURN，
 *      有->傳送GP ID, USER ID, 名字 到 MODULES/EVENT.JS
 *      取得MONGOOSE資料 ->進行  (randomEvent)
 *       i)   抽選整個列表      
 *      ii)   抽選指定列表
 * C)   從該列表中抽選一個結果 (randomEvent)
 * D)   得到結果後，進行 該運算 (event)
 *      1/8個結果   -> (expChange)
 * E)   得到結果，修改MONGOOSE (editExp)
 * F)   翻回文字結果到使用者(roll/event.js)
 * 
 * 
 * 
 */

async function eventProcessExp({ randomDetail, groupid, eventList, thisMember }) {
    switch (randomDetail.result) {
        case 1: {
            let exp = await calXP(eventList, thisMember, "exp")
            await thisMember.updateOne({ $inc: { EXP: exp } })
            return `你已增加 ${exp} 點經驗`;
        }

        case 2:
            //  8. 對方得到經驗值 X 倍(多少次)
            {
                let times = await calXP(eventList, thisMember, "times");
                let multi = await calXP(eventList, thisMember, "multi")
                let updateData = await thisMember.updateOne({ $max: { multiEXP: multi, multiEXPTimes: times } })
                return `你在${thisMember.multiEXPTimes}次內都會有 ${thisMember.multiEXP} 倍經驗`;
            }
        case 3:
            //  9. 從整個CHANNEL 的X人吸收X點經驗
            {
                let exp = await calXP(eventList, thisMember, "exp");
                let times = await calXP(eventList, thisMember, "times");
                let targetMember = await schema.trpgLevelSystemMember.aggregate([{
                    $match:
                    {
                        groupid: groupid,
                        userid: {
                            $not: { $regex: new RegExp(thisMember.userid, 'i') }
                        }
                    }
                }, {
                    $sample: { size: times }
                }]);
                let name = [];
                targetMember.forEach(async element => {
                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: element.groupid,
                        userid: element.userid,
                    }, { $inc: { EXP: -exp } })
                    name.push(element.name)
                });
                await thisMember.updateOne({ $inc: { EXP: exp * targetMember.length } });

                return `你已增加 ${exp * targetMember.length} 點經驗及 ${name} 已減少${exp}點經驗`;
            }
        case -1:
            // -1. 直接減少X點經驗
            //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個負面) 
            {

                let exp = await calXP(eventList, thisMember, "exp")
                await thisMember.updateOne({ $inc: { EXP: -exp } })

                return `你已減少 ${exp} 點經驗`;

            }

        case -2:
            //   -2. 停止得到經驗(X次內)
            {
                let times = await calXP(eventList, thisMember, "times");
                let targetMember = await thisMember.updateOne({ $max: { stopExp: times } })
                return `你在${thisMember.stopExp}次內都會停止得到經驗`;
            }

        case -3:
            //   7. 吸收對方X點經驗
            {
                let exp = await calXP(eventList, thisMember, "exp");
                await thisMember.updateOne({ $inc: { EXP: -exp * 2 } })
                let targetMember = await schema.eventMember.findOneAndUpdate({
                    userID: eventList.userID,
                }, { $inc: { earnedEXP: exp * 2 } })
                return `你已被 ${targetMember.userName} 吸收了 ${exp * 2} 點經驗`;
            }
        case -4:
            //  5. 分發X經驗給整個CHANNEL中的X人
            {
                let exp = await calXP(eventList, thisMember, "exp");
                let times = await calXP(eventList, thisMember, "times");
                let targetMember = await schema.trpgLevelSystemMember.aggregate([{
                    $match:
                    {
                        groupid: groupid,
                        userid: {
                            $not: { $regex: new RegExp(thisMember.userid, 'i') }
                        }
                    }
                }, {
                    $sample: { size: times }
                }]);
                let name = [];
                targetMember.forEach(async element => {
                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: element.groupid,
                        userid: element.userid,
                    }, { $inc: { EXP: exp } })
                    name.push(element.name)
                });
                await thisMember.updateOne({ $inc: { EXP: -exp * targetMember.length } });

                return `你已減少 ${exp * targetMember.length} 點經驗及${name}已增加${exp}點經驗`;

            }
        case -5:
            //  6. 每次發言減少X經驗(X次內)
            {
                let exp = await calXP(eventList, thisMember, "exp");
                let times = await calXP(eventList, thisMember, "times");
                let updateData = await thisMember.updateOne({ $max: { decreaseEXP: exp, decreaseEXPTimes: times } })
                return `你在之後${thisMember.decreaseEXPTimes}次發言都會減少 ${thisMember.decreaseEXP}經驗`;
            }
        default:
            //     0. 沒有事發生
            return `沒有事發生呢`;


    }
}
async function calXP(eventList, thisMember, type) {
    let eventNeg = eventList.detail.map(item => {
        if (item.result < 0 && !isNaN(item.result)) {
            return item.result;
        } else return 0
    });
    eventNeg = eventNeg.filter(item => item < 0);


    let eventNegLV = (eventNeg.length > 0) ? eventNeg.reduce((a, b) =>
        Number(a) + Number(b)) : 1;
    let typeNumber = 1;
    switch (type) {
        case "exp": {
            typeNumber = Math.round(5 / 6 * (thisMember.Level) * (2 * (thisMember.Level) * (thisMember.Level) + 30 * (thisMember.Level)) + 100);
            typeNumber = await rollDice.DiceINT(typeNumber / 100, typeNumber / 50);
            let createEventer = await findMaxLv(eventList.userID);
            typeNumber *= (Math.abs(createEventer - thisMember.Level) / 100 + 1);
            typeNumber *= ((eventNegLV ^ 2) / 100 + 1) > 0 ? ((eventNegLV ^ 2) / 100 + 1) : 1;
            typeNumber *= (eventNeg.length / 100 + 1);
            return Math.round(typeNumber);
        }
        case "times": {
            let createEventer = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(5, ((createEventer - thisMember.Level) > 0) ? createEventer - thisMember.Level : 1);
            return typeNumber;
        }

        case "multi": {
            let createEventer = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(2, ((createEventer - thisMember.Level) > 0) ? Math.round((createEventer - thisMember.Level) / 3) : 2);
            return typeNumber;
        }
        default:
            return typeNumber;
    }
    //   1. 直接增加X點經驗
    //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個事件) 

}
async function findMaxLv(userid) {
    let maxLV = await schema.trpgLevelSystemMember.findOne({ userid: userid }).sort({ Level: -1 });
    if (!maxLV) return 1;
    return maxLV.Level;
}
//TODO:
/**
 *
   multiEXPTimes: Number,
    multiEXP: Number,
    stopExp: Number,
    decreaseEXP: Number,
    decreaseEXPTimes: Number,

    取得earnedEXP

    扣EN, 而增加earnedEXP

    回複EN

 */