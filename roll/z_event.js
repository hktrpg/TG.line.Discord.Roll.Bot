"use strict";
if (!process.env.mongoURL) {
    return;
}
const checkMongodb = require('../modules/dbWatchdog.js');
const debugMode = (process.env.DEBUG) ? true : false;
let variables = {};
const rollDice = require('./rollbase');
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];
const EN_RECOVER_TIME = 10 * 60 * 1000; //每10分鐘回複一點;
const gameName = function () {
    return '【事件功能】 .event (add edit show delete) .evt (event 任何名字)'
}
const gameType = function () {
    return 'Funny:trpgevent:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]event$)|(^[.]evt$)/ig,
        second: null
    }]

}

const convertRegex = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};
const regexMain = new RegExp(/^((-)?\d):(.*)/, 'igm');
const regexExp = new RegExp(/^exp:(.*)/, 'im');
const regexName = new RegExp(/^name:(.*)/, 'im');
const regexChainTitle = new RegExp(/^chain:(.*)/, 'im');

const opt = {
    upsert: true,
    runValidators: true
}
const ENemoji = function (per) {
    switch (true) {
        case (per <= 0):
            return '▯▯▯▯▯▯'
        case (per <= 20):
            return '▮▯▯▯▯▯'
        case (per <= 40):
            return '▮▮▯▯▯▯'
        case (per <= 60):
            return '▮▮▮▯▯▯'
        case (per <= 80):
            return '▮▮▮▮▯▯'
        case (per <= 99):
            return '▮▮▮▮▮▯'
        default:
            return '▮▮▮▮▮▮'
    }
}

/**
 * 
 * TODO:
 * 狀態包括HKTRPG 有特別效果, 如名字改變?動物EMOJI?
 * @!$%#&%$&^%亂碼ETC?
 * 
 * 
 */


const getHelpMessage = function () {
    return `【事件功能】.event (add delete show) .evt (random/事件名稱)
經由新增的事件，會得到一些狀態或增加減少經驗值，
並可以賺取額外經驗值。
---
.event add 詳情看下面說明 - 新增事件
.event delete (事件名稱) - 刪除事件
.event show             - 顯示你新增的所有事件, 及賺取了的EXP
.event show (事件名稱)   - 顯示你新增的指定事件詳情
.event useExp           - 在群組中使用, 將會得到你賺取的EXP
---
.evt random     - 進入隨機的事件, 消耗5EN
.evt (系列名稱)  - 進入指定的系列事件, 消耗10EN
.evt (事件名稱)  - 進入指定的事件, 消耗15EN
---
EN上限 = 20+LV
每10分鐘回複1點EN
得知事件名稱的方法，別人告知 或 經隨機事件知道名字
設計事件的好處
能夠吸收對方消耗的en和經驗值 作為自己賺取到的經驗值
---
新增事件的格式範例
.event add
name:Haha
chain:開心系列
exp:SAN
0:你今天的運氣真好;你是個好人;我愛你
-1:你中招了;你不好運要-SAN了
1:你吃了好味的糖，加SAN
----
name -> 事件標題
chain-> 系列名稱，別人可以指定該系列來進行抽選
exp  -> (可選)經驗值的名稱, 例如改成SAN, 會變成「你損失了X點SAN」
0:你今天的運氣真好;你是個好人;我愛你 ->
(事件類型):(事件的描述);(事件的描述2);(事件的描述3)
事件的描述 ->會從描述1,2,3選取其中一個.
事件類型  -> 
0. 沒有事發生
1. 直接增加X點經驗
2. 未來X次裡會得到 X 倍經驗值
3. 贈送群組所有人1點經驗
4. 贈送作者已賺取到的經驗給玩家
5. 從整個CHANNEL 的X人吸收X點經驗
-1. 直接減少X點經驗
-2. 停止得到經驗(X次)
-3. 被事件開發者吸收X點經驗
-4. 分發X經驗給整個CHANNEL中的X人
-5. 每次發言減少X經驗(X次內)
----
限制
A. 一個事件中，正面選項要比負面選項多
B. 一個事件中，可以有3+(ROUNDDOWN 設計者LV/10)  項選項
C. 一個事件中，不可以全部正面效果
D. 一個事件可用的總EN 為(10+LV)，負面事件消耗X點EN
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
    displayname,
    displaynameDiscord
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: '',
        characterReRoll: false,
        characterName: '',
        characterReRollName: '',
        qu: true
    };
    let filter = {};
    let doc = {};
    let events = {};
    let temp;
    let tempMain = {};
    let lv;
    let limit = FUNCTION_LIMIT[0];
    let check;
    let levelLv = 0;
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
    if (!checkMongodb.isDbOnline()) return;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
            events = await analysicInputData(inputStr); //分析輸入的資料

            if (!events || !events.MainData || !events.eventName) {
                rply.text = `沒有輸入事件或名字，請重新整理內容 格式為
.event add
name:Haha
chain:開心系列
exp:SAN
0:你今天的運氣真好;你是個好人;我愛你
-1:你中招了;你不好運要-SAN了
1:你吃了好味的糖，加SAN`
                return rply;
            }

            /*
            基本只限四次事件.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = (gpLv > lv) ? gpLv : lv;
            limit = FUNCTION_LIMIT[lv];
            check = await schema.eventList.find({
                userID: userid
            });
            levelLv = await findMaxLv(userid);

            //取得本來的資料, 如有重覆, 以新的覆蓋
            //doc = await schema.event.findOne(filter);
            let mainSplit = await analysicDetail(events.MainData)
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

            let listDatas = {
                title: events.eventName,
                userID: userid,
                userName: displaynameDiscord || displayname || '',
                detail: mainSplit,
                expName: events.expName || '',
                chainTitle: events.eventChain || ''
            }


            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp('^' + convertRegex(events.eventName) + '$', "i")
                }
            }
            try {
                doc = await schema.eventList.updateOne(filter, listDatas, opt);
            } catch (error) {
                console.error('新增事件 GET ERROR: ', error)
                rply.text = '新增事件失敗\n因為 ' + error.message
                return rply;
            }
            if (!doc && check && check.length >= limit) {
                rply.text = '你的事件上限為' + limit + '件' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                return rply
            }
            tempMain = await schema.eventList.findOne(filter);

            let eventsDatas = {
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
                    let findEventId = temp.eventList.findIndex((obj => obj.eventID == tempMain._id));
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
                console.error('新增事件 GET ERROR: ', error)
                rply.text = '新增事件失敗\n因為 ' + error.message
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '新增/修改事件 - ' + tempMain.title + '\n經驗值的名稱: ' + tempMain.expName + '\n';
            rply.text += (tempMain.chainTitle) ? `系列名稱: ${tempMain.chainTitle}\n` : '';
            for (let index = 0; index < tempMain.detail.length; index++) {
                rply.text += '類型:' + tempMain.detail[index].result + ' 內容: ' + tempMain.detail[index].event + '\n';

            }
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp('^' + convertRegex(inputStr.replace(/^\.event\s+delete\s+/ig, '').replace(/\s+$/, '')) + '$', "i")
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
                console.error('刪除事件 GET ERROR:  ', error)
                rply.text = '刪除事件失敗'
                return rply;
            }
            //增加資料庫
            //檢查有沒有重覆
            rply.text = '刪除事件成功: ' + doc.title
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^useExp$/i.test(mainMsg[1]): {
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
            let eventMember = await schema.eventMember.findOne({
                userID: userid
            });
            let thisMember = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });
            if (!eventMember || !thisMember) {
                rply.text = `未有你的資料, 未符合使用取得EXP的條件。`
                return rply;
            }
            if (eventMember.earnedEXP > 0) {
                let exp = eventMember.earnedEXP;
                try {
                    await thisMember.updateOne({
                        $inc: {
                            EXP: exp
                        }
                    })

                    rply.text = `你已把${exp}EXP加到這群組的帳號裡。\n你最新的EXP是${thisMember.EXP + exp}`
                    eventMember.earnedEXP = 0;
                    await eventMember.save();
                    return rply;
                } catch (error) {
                    rply.text = `發生錯誤未能更新。`
                    console.error('%cz_event.js line:282 error', 'color: #007acc;', error);
                    return rply;
                }
            }
            else {
                rply.text = `你未有賺取到EXP。\n賺取條件為有人使用你所寫的事件，請更多使用吧!`
                return rply;
            }
        }
        case (/(^[.]event$)/i.test(mainMsg[0]) || /(^[.]evt$)/i.test(mainMsg[0])) && /^show$/i.test(mainMsg[1]):
            {
                rply.quotes = true;
                filter = {
                    userID: userid
                }
                let eventMember = await schema.eventMember.findOne(filter);
                doc = await schema.eventList.find(filter);


                let maxLv = await findMaxLv(userid);
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
                if (!eventMember.energy || !eventMember.lastActiveAt) {
                    eventMember.energy = maxLv + 20;
                }

                //回複EN
                let EnergyRecover = Math.round(((new Date(Date.now()) - new Date(eventMember.lastActiveAt))) / EN_RECOVER_TIME);
                eventMember.energy = Math.min(maxLv + 20, EnergyRecover + eventMember.energy);
                eventMember.lastActiveAt = new Date(Date.now());
                (debugMode) ? eventMember.energy = 99 : null;



                rply.text = `姓名: ${displaynameDiscord || displayname || '無名'}
EN: ${eventMember.energy} / ${maxLv + 20} ${ENemoji(Math.round(eventMember.energy / (maxLv + 20) * 100))}
總共賺取EXP: ${(eventMember.totailEarnedEXP) ? eventMember.totailEarnedEXP : 0}\n未使用EXP: ${(eventMember.earnedEXP) ? eventMember.earnedEXP : 0}`
                if (eventMember.activityList.length > 0) {
                    let result = eventMember.activityList;
                    rply.text += "\n====最近發生的事件===="
                    for (let index = 0; index < result.length; index++) {
                        rply.text += `\n${result[index].date.getMonth() + 1}月${result[index].date.getDate()}日 ${result[index].date.getHours()}:${(result[index].date.getMinutes() < 10) ? '0' + result[index].date.getMinutes() : result[index].date.getMinutes()} - ${result[index].activityDetail}`
                    }
                }
                if (doc && doc.length > 0)
                    rply.text += "\n====你創作的事件列表===="
                for (let index = 0; index < doc.length; index++) {
                    rply.text += "\n" + doc[index].title + "\n";
                    if (doc[index].expName) rply.text += '經驗值的名稱: ' + doc[index].expName + "\n";
                    rply.text += (doc[index].chainTitle) ? `系列名稱: ${doc[index].chainTitle} \n` : '';
                    if (mainMsg[2] && mainMsg[2].match(new RegExp('^' + convertRegex(doc[index].title) + '$', 'i'))) {
                        rply.text += getDetail(doc[index]) + '\n';
                    }
                }
                return rply;
            }
        case /(^[.]evt$)/i.test(mainMsg[0]) && /^\S+$/i.test(mainMsg[1]): {
            {
                rply.quotes = true;
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
                let thisMember = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });
                if (!thisMember) {
                    rply.text = `錯誤發生，未有這群組的資料`;
                    return rply;
                }
                let maxLv = await findMaxLv(userid);
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

                if (!eventMember.energy || !eventMember.lastActiveAt) {
                    eventMember.energy = maxLv + 20;
                }

                //回複EN
                let EnergyRecover = Math.round(((new Date(Date.now()) - new Date(eventMember.lastActiveAt))) / EN_RECOVER_TIME);

                eventMember.energy = Math.min(maxLv + 20, EnergyRecover + eventMember.energy);
                if (EnergyRecover > 0 || !eventMember.lastActiveAt)
                    eventMember.lastActiveAt = new Date(Date.now());
                (debugMode) ? eventMember.energy = 99 : null;


                //查看是什麼事件, 隨機, 系列, 指定
                const targetEventName = convertRegex(mainMsg[1]);
                let eventMode = '';
                let eventList = [];
                if (targetEventName.match(/^random$/i)) {
                    eventMode = 'random';
                } else {
                    if (eventMember.energy < 10) {
                        rply.text = "沒有足夠EN, 你現在只有" + eventMember.energy + "EN";
                        return rply;
                    }
                    eventList = await schema.eventList.aggregate([{
                        $match: {
                            chainTitle: {
                                $regex: new RegExp('^' + convertRegex(targetEventName) + '$', "i")
                            }
                        }
                    }, { $sample: { size: 1 } }]);
                    if (eventList.length > 0) {
                        eventMode = 'chain'
                    } else {
                        if (eventMember.energy < 15) {
                            rply.text = "沒有足夠EN, 你現在只有" + eventMember.energy + "EN";
                            return rply;
                        }
                        eventList = await schema.eventList.aggregate([{
                            $match: {
                                title: {
                                    $regex: new RegExp('^' + convertRegex(targetEventName) + '$', "i")
                                }
                            }
                        }, { $sample: { size: 1 } }]);
                        if (eventList.length > 0) {
                            eventMode = 'title'
                        }


                    }
                }


                let earedXP = 0;

                if (thisMember.EXP <= 0) {
                    rply.text = `你使用太多經驗值了……你現在的經驗值過低: ${thisMember.EXP} ，賺取更多經驗值再來玩吧…`
                    return rply;
                }

                switch (eventMode) {
                    case 'random':
                        if (eventMember.energy < 5) {
                            rply.text = `隨機事件需要5EN, 你現在只有 ${eventMember.energy} EN`
                            return rply;
                        } else {
                            eventList = await schema.eventList.aggregate([{ $sample: { size: 1 } }]);
                            if (eventList.length == 0) {
                                rply.text = '未有人新增事件，你可以成為第一個事件產生者!'
                                return rply;
                            }
                            eventMember.energy -= 5
                            earedXP = 5;
                        }
                        break;

                    case 'chain':
                        eventMember.energy -= 10;
                        earedXP = 10;
                        break;
                    case 'title':
                        if (eventList[0].userID == userid) {
                            rply.text = `不可以指定進入自己新增的事件呢.`
                            return rply;
                        }
                        eventMember.energy -= 15;
                        earedXP = 15;
                        break;

                    default:

                        rply.text = `沒有以「${targetEventName} 」命名的事件呢.`
                        return rply;
                }

                await eventMember.save();
                let randomDetail = eventList[0].detail[await rollDice.Dice(eventList[0].detail.length) - 1];
                let eventText = randomDetail.event.split(';');

                const formatEvent = (chainTitle, title, text) => {
                    chainTitle = (chainTitle || '').toString();
                    title = (title || '').toString();
                    text = (text || '').toString();
                    chainTitle = chainTitle.trim();
                    title = title.trim();
                    text = text.trim();
                    const maxLength = Math.max(
                        chainTitle.length,
                        title.length,
                        text.length,
                        4
                    );

                    const line = "─".repeat(Math.min(maxLength + 2, 10));

                    return `🔗 **隨機事件發生**
╭${line}
│ ${chainTitle}
├${line}
│ ⭐ ${title}
│ 
│ 💭 ${text}
╰${line}`;
                }

                rply.text += formatEvent(
                    eventList[0].chainTitle,
                    eventList[0].title,
                    eventText[await rollDice.Dice(eventText.length) - 1]
                );
                rply.text += `\n${await eventProcessExp({ randomDetail: randomDetail, groupid: groupid, eventList: eventList[0], thisMember: thisMember })} `
                await schema.eventMember.findOneAndUpdate({ userID: eventList[0].userID }, { $inc: { earnedEXP: earedXP, totailEarnedEXP: earedXP } })
                return rply;
            }
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

async function analysicInputData(inputStr) {
    let MainData = (inputStr.match(regexMain)) ? inputStr.match(regexMain) : '';
    let ExpName = (inputStr.match(regexExp)) ? inputStr.match(regexExp)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let eventName = (inputStr.match(regexName)) ? inputStr.match(regexName)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let eventChain = (inputStr.match(regexChainTitle)) ? inputStr.match(regexChainTitle)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let result = {
        expName: ExpName,
        MainData: MainData,
        eventName: eventName,
        eventChain: eventChain
    }
    return result;
}
async function analysicDetail(data) {
    let info = [];
    for (let index = 0; index < data.length; index++) {
        let temp = data[index].match(/(-?\d+):(.*)/);
        if (temp[1] <= 5 && temp[1] >= -5)
            info.push({
                event: temp[2],
                result: temp[1]
            })
    }
    return info;
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
    let expName = (eventList.expName) ? `「${eventList.expName} 」` : '經驗'
    switch (randomDetail.result) {
        case 1: {
            let exp = await calXP(eventList, thisMember.Level, "exp")
            await thisMember.updateOne({
                $inc: { EXP: exp }
            })
            await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                $push: {
                    activityList: {
                        $each: [{
                            date: Date.now(),
                            activityDetail: `你已增加 ${exp} 點${expName} `
                        }],
                        $sort: { date: -1 },
                        $slice: 10
                    }
                }
            })
            return `你已增加 ${exp} 點${expName} `;
        }

        case 2:
            //  8. 使用者得到經驗值 X 倍(多少次)
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                let multi = await calXP(eventList, thisMember.Level, "multi")
                await thisMember.updateOne({
                    $max: { multiEXP: multi, multiEXPTimes: times }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你在${Math.max(isNaN(thisMember.multiEXPTimes) ? 0 : thisMember.multiEXPTimes, times)} 次內都會有 ${Math.max(isNaN(thisMember.multiEXP) ? 0 : thisMember.multiEXP, multi)} 倍${expName}  `
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })
                return `你在${Math.max(isNaN(thisMember.multiEXPTimes) ? 0 : thisMember.multiEXPTimes, times)} 次內都會有 ${Math.max(isNaN(thisMember.multiEXP) ? 0 : thisMember.multiEXP, multi)} 倍${expName} `;
            }
        case 3:
            //  群組所有人增加1點經驗
            {
                await schema.trpgLevelSystemMember.updateMany({
                    groupid: groupid
                }, {
                    $inc: { EXP: 1 }
                })
                /**
                 , $push: {
                                        date: Date.now(),
                                        activityDetail: `因為${thisMember.name} 你增加 1 點${expName} `
                                    }
                 */
                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList:
                        {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你已增加 此群組所有人1點 ${expName}`
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })

                let reply = `你已增加 此群組所有人1點 ${expName} `;
                return reply;
            }

        case 4:
            //  贈送作者的Erned經驗給玩家
            {
                //ERROR
                let createEventerLV = await findMaxLv(eventList.userID);

                let createEventer = await findCreater(eventList.userID);

                let exp = await calXP(eventList, Math.min(createEventerLV, thisMember.Level), "exp");

                //防止減到0
                exp = Math.min(Math.max(0, Number(createEventer.earnedEXP) - exp), exp)


                await thisMember.updateOne({
                    $inc: { EXP: exp }
                })
                await createEventer.updateOne({
                    userID: eventList.userID,
                }, {
                    $inc: { earnedEXP: -exp, totailEarnedEXP: exp }, $push: {
                        activityList:
                        {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你已贈送 ${thisMember.name}  ${exp} 點${expName}`
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList:
                        {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: `你已被 ${eventList.userName} 贈送了 ${exp} 點${expName}`
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })



                return `你已被 ${eventList.userName} 贈送了 ${exp} 點${expName} `;
            }
        case 5:
            //  9. 從整個CHANNEL 的X人吸收X點經驗
            {
                let times = await calXP(eventList, thisMember.Level, "times");
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
                let name = [],
                    expMember = [],
                    totalEXP = 0;

                for (let index = 0; index < targetMember.length; index++) {
                    let exp = await calXP(eventList, Math.min(thisMember.Level, targetMember[index].Level), "exp");

                    //防止變成0以下
                    exp = Math.min(Math.max(0, Number(targetMember[index].EXP) - exp), exp);


                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: targetMember[index].groupid,
                        userid: targetMember[index].userid,
                    }, {
                        $inc: { EXP: -exp }
                    })
                    await schema.eventMember.updateOne({ userID: targetMember[index].userid }, {
                        $push: {
                            activityList: {
                                $each: [{
                                    date: Date.now(),
                                    activityDetail: `你被 ${eventList.userName} 吸收了 ${exp} 點${expName}`
                                }],
                                $sort: { date: -1 },
                                $slice: 10
                            }
                        }
                    })
                    name.push(targetMember[index].name)
                    expMember.push(exp)
                    totalEXP += exp;
                }


                await thisMember.updateOne({
                    $inc: { EXP: totalEXP }
                });

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你吸收 ${targetMember.length}人 共 ${totalEXP} 點${expName}`
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                let reply = `你已增加 ${totalEXP} 點${expName} `;
                for (let index = 0; index < name.length; index++) {
                    reply += `及 \n${name[index] || '無名'} 減少了${expMember[index]} 點${expName} `
                }
                return reply;
            }
        case -1:
            // -1. 直接減少X點經驗
            //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個負面) 
            {
                let exp = await calXP(eventList, thisMember.Level, "expNeg")
                //防止變成0以下
                exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);
                await thisMember.updateOne({
                    $inc: { EXP: -exp }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: `你減少了 ${exp} 點${expName}`
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return `你已減少 ${exp} 點${expName} `;
            }

        case -2:
            //   -2. 停止得到經驗(X次內)
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                await thisMember.updateOne({
                    $max: { stopExp: times }
                })
                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: `你${Math.max(isNaN(thisMember.stopExp) ? 0 : thisMember.stopExp, times)} 次內會失去得到${expName} 的機會`
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })


                return `你在未來${Math.max(isNaN(thisMember.stopExp) ? 0 : thisMember.stopExp, times)} 次都會失去得到${expName} 的機會`;
            }

        case -3:
            //   7. 吸收對方X點經驗
            {
                let createEventerLV = await findMaxLv(eventList.userID);
                let exp = await calXP(eventList, Math.min(createEventerLV, thisMember.Level), "expNeg");

                //防止變成0以下
                exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);

                await thisMember.updateOne({
                    $inc: { EXP: -exp }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你被 ${eventList.userName} 吸收了 ${exp} 點${expName} `
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })

                await schema.eventMember.findOneAndUpdate({
                    userID: eventList.userID,
                }, {
                    $inc: { earnedEXP: exp, totailEarnedEXP: exp }, $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你吸收了 ${thisMember.name}  ${exp} 點${expName} `
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return `你已被 ${eventList.userName} 吸收了 ${exp} 點${expName} `;
            }
        case -4:
            //  5. 分發X經驗給整個CHANNEL中的X人
            {
                let times = await calXP(eventList, thisMember.Level, "times");
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
                let name = [],
                    expMember = [],
                    totalEXP = 0;
                for (let index = 0; index < targetMember.length; index++) {
                    let exp = await calXP(eventList, Math.min(thisMember.Level, targetMember[index].Level), "expNeg");


                    //防止變成0以下
                    exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);

                    thisMember.EXP -= exp;

                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: targetMember[index].groupid,
                        userid: targetMember[index].userid,
                    }, {
                        $inc: { EXP: exp }
                    })

                    await schema.eventMember.updateOne({ userID: targetMember[index].userid }, {
                        $push: {
                            activityList: {
                                $each: [{
                                    date: Date.now(),
                                    activityDetail: ` ${thisMember.name} (被強行)分發了 ${exp} 點${expName} 給你 `
                                }],
                                $sort: { date: -1 },
                                $slice: 10
                            }
                        }
                    })
                    name.push(targetMember[index].name)
                    expMember.push(exp)
                    totalEXP += exp;
                }
                await thisMember.updateOne({
                    $inc: { EXP: -totalEXP }
                });

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你(被強行)分發了共 ${totalEXP} 點${expName} 給 ${targetMember.length}人 `
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })

                let reply = `你已減少 ${totalEXP} 點${expName} `;
                for (let index = 0; index < name.length; index++) {
                    reply += `及 \n${name[index] || '無名'} 增加了${expMember[index]} 點${expName} `
                }

                return reply;
            }
        case -5:
            //  6. 每次發言減少X經驗(X次內)
            {
                let exp = Math.round(await calXP(eventList, thisMember.Level, "expNeg"));
                let times = await calXP(eventList, thisMember.Level, "times");
                await thisMember.updateOne({
                    $max: { decreaseEXP: exp, decreaseEXPTimes: times }
                })


                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: `你接下來${Math.max(thisMember.decreaseEXPTimes, times)} 次發言都會減少 ${Math.max(isNaN(thisMember.decreaseEXP) ? 0 : thisMember.decreaseEXP, exp)} ${expName}  `
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return `你在未來 ${Math.max(isNaN(thisMember.decreaseEXPTimes) ? 0 : thisMember.decreaseEXPTimes, times)} 次發言都會減少 ${Math.max(isNaN(thisMember.decreaseEXP) ? 0 : thisMember.decreaseEXP, exp)} ${expName} `;
            }

        default:
            //     0. 沒有事發生
            return `沒有事發生呢`;


    }
}
async function calXP(eventList, thisMemberLV, type) {

    let typeNumber = 1;
    switch (type) {
        case "exp": {
            //正面事件  把負面的數字相加
            let eventPosit = eventList.detail.map(item => {
                if (item.result < 0 && !isNaN(item.result)) {
                    return item.result;
                } else return 0
            });
            eventPosit = eventPosit.filter(item => item < 0);
            let eventPositiveLV = (eventPosit.length > 0) ? eventPosit.reduce((b, a) =>
                Number(a) + Number(b)) : 1;


            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(Math.max(createEventerLV, thisMemberLV) + 20, Math.min(createEventerLV, thisMemberLV)) + 15;

            typeNumber *= (Math.abs(createEventerLV - thisMemberLV) / 20 + 1);

            typeNumber *= ((eventPositiveLV ^ 2) / 20 + 1) > 1 ? ((eventPositiveLV ^ 2) / 20 + 1) : 1;

            typeNumber *= (eventPosit.length / 5 + 1);

            return Math.round(typeNumber);
        }
        case "expNeg": {
            //負面事件  把正面的數字相加
            let eventNeg = eventList.detail.map(item => {
                if (item.result > 0 && !isNaN(item.result)) {
                    return item.result;
                } else return 0
            });
            eventNeg = eventNeg.filter(item => item < 0);
            let eventNegLV = (eventNeg.length > 0) ? eventNeg.reduce((b, a) =>
                Number(a) + Number(b)) : 1;


            let createEventerLV = await findMaxLv(eventList.userID);

            typeNumber = await rollDice.DiceINT(Math.max(createEventerLV, thisMemberLV) + 20, Math.min(createEventerLV, thisMemberLV)) + 15;

            typeNumber *= (Math.abs(createEventerLV - thisMemberLV) / 20 + 1);

            typeNumber *= ((eventNegLV ^ 2) / 20 + 1) > 1 ? ((eventNegLV ^ 2) / 20 + 1) : 1;

            typeNumber *= (eventNeg.length / 5 + 1);

            return Math.round(typeNumber);
        }
        case "times": {
            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(5, ((createEventerLV - thisMemberLV) > 0) ? Math.min(createEventerLV - thisMemberLV, 20) : 1);
            if (isNaN(typeNumber)) typeNumber = 1;
            if (typeNumber < 1) typeNumber = 1;
            return typeNumber;
        }

        case "multi": {
            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(3, ((createEventerLV - thisMemberLV) > 0) ? Math.round((createEventerLV - thisMemberLV) / 3) : 2);
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


async function findCreater(userid) {
    let creater = await schema.eventMember.findOne({ userID: userid }).sort({ Level: -1 });
    if (!creater) return null;
    return creater;
}




/**
 EVENT 功能修改點
(##TODO##)

[X]1. 10分鐘回複一點EN.
[X]2. 隨機事件 5EN, 系列事件10EN, 指定事件15EN
[X]3. 吸收的經驗值根據 (被吸收者和吸收者LV+20 隨機) 來決定



[X]4. 增加種類選項
[X]A) 贈送作者經驗給玩家
B) 每次發言增加Ｘ經驗
[X]C) 群組所有人增加1點經驗

[X]5. 能否不骰到別群的事件
增加 參數: 系列,chain of events
可以指定該系列的事件
如 修真 系列

會自動尋



[ ]6.是否能指定某人觸發事件 <---
在.evt XXX  @XXXX 後, 會嘗試根據對方的名字,
但LINE的話, 需要對方和HKTRPG成為朋友, 才可能成功.
不會搜尋無名


[X] 7.經驗避免被扣到負值，最低歸零
對方不可零, 自己不可零

[ ]8.能否贈送別人經驗 <---
同6,  傳功消耗, 6折
不會搜尋無名


[X]9. 狀態欄
姓名:
EN:  /   ▬▬▬▬▬▬▭▭▭▭▮▮▮▮▯▯▯▯:white_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:
earnedEXP
totailEarnedEXP
eventList
最高等級?

10次最後發生的事件
---


 */