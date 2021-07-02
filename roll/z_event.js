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
    function findMaxLv(gp) {
        gp.forEach(function (members) {
            if (members.userid == userid && Number(members.Level) > levelLv) {
                levelLv = Math.floor(Number(members.Level) / 10);
            }
        });
    }
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
            temp2 = await schema.trpgLevelSystem.find({
                "trpgLevelSystemfunction.userid": userid
            })
            temp2.forEach(function (item) {
                findMaxLv(item.trpgLevelSystemfunction);
            });
            console.log('levelLv', levelLv)

            //取得本來的資料, 如有重覆, 以新的覆蓋
            //doc = await schema.event.findOne(filter);
            var mainSplit = await analysicDetail(events.MainData)
            console.log('mainSplit', mainSplit)
            if (mainSplit.length < 3 || mainSplit.length > Number(3 + levelLv)) {
                rply.text = '新增事件失敗\n需要至少設定 3 個事件\n同時最多 ' + Number(3 + levelLv) + ' 個事件'
                return rply;
            }
            //至少一個是正面
            for (let index = 0; index < mainSplit.length; index++) {
                temp3 = (Number(mainSplit[index].result) > 0)
                levelLv += Number(mainSplit[index].result);
            }
            if (temp3 <= 0) {
                rply.text = '新增事件失敗\n需要至少設定一個正面事件'
                return rply;
            }
            console.log('levelLv', levelLv)
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
                temp = await schema.event.findOne(filter);
                if (!temp) {
                    temp = new schema.event(eventsDatas);
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
                await schema.event.updateOne({
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
            rply.text = "====事件列件====\n"
            console.log(doc[0].detail);
            for (let index = 0; index < doc.length; index++) {
                rply.text += doc[index].title + "\n";
                if (doc[index].expName) rply.text += '經驗值的名稱: ' + doc[index].expName + "\n";
                rply.text += getDetail(doc[index]) + '\n';

            }
            return rply;
        case /(^[.]evt$)/i.test(mainMsg[0]) && /^random$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '你不在群組.請在群組使用此功能 '
                return rply
            }
            tempMain = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!tempMain || tempMain.Switch == 0) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
            }
            filter = {
                userID: userid
            }
            events = await schema.event.findOne(filter);
            /**
             * 檢查ENERGY，如果沒有則新增，數字為EN= 20+LV
             */
            if (!events || !events.energy) {
                //events.energy = 0;
            }
            doc = await schema.eventList.aggregate([{ $sample: { size: 1 } }]);
            console.log('doc', doc)
            rply.text = "====事件列件====\n"
            console.log(doc[0].detail);
            for (let index = 0; index < doc.length; index++) {
                rply.text += doc[index].title + "\n";
                if (doc[index].expName) rply.text += '經驗值的名稱: ' + doc[index].expName + "\n";
                rply.text += getDetail(doc[index]) + '\n';

            }
            return rply;

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
                                console.log('error of event:', findState[i + 1])
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

async function showCharacter(events, mode) {
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
    returnStr += events.name + '　\n';
    let a = 1
    if (events.state.length > 0) {
        for (let i = 0; i < events.state.length; i++) {
            if ((a) % 4 == 0 && (events.state[i].itemA || events.state[i].itemB)) {
                returnStr += '　\n'
            }
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += events.state[i].name + ': ' + events.state[i].itemA;
                returnStr += (events.state[i].itemB) ? '/' + events.state[i].itemB : '';
            } else {
                returnStr += (events.state[i].itemA) ? events.state[i].name + ': ' + events.state[i].itemA : '';
                returnStr += (events.state[i].itemA && events.state[i].itemB) ? '/' + events.state[i].itemB : '';
            }
            if (events.state[i].itemA || events.state[i].itemB) {
                a++
            }
            if ((events.state[i].itemA || events.state[i].itemB) && mode == 'addMode' || mode == 'showAllMode') {
                returnStr += ' ';
            } else if (events.state[i].itemA) {
                returnStr += ' ';
            }
        }
        returnStr += '\n-------\n'
    }

    if (events.roll.length > 0) {
        for (let i = 0; i < events.roll.length; i++) {
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += events.roll[i].name + ': ' + events.roll[i].itemA + '  ';

            } else {
                returnStr += (events.roll[i].itemA) ? events.roll[i].name + ': ' + events.roll[i].itemA + '  ' : '';
            }
            if (i % 2 || i == events.roll.length - 1) {
                returnStr += '　\n';
            }
        }
        returnStr += '-------\n'
    }
    if (mode == 'addMode' || mode == 'showAllMode')
        if (events.notes.length > 0) {
            for (let i = 0; i < events.notes.length; i++) {
                //returnStr += (events.notes[i].itemA) ? events.notes[i].name + ': ' + events.notes[i].itemA + ' \n' : '';
                returnStr += events.notes[i].name + ': ' + events.notes[i].itemA + '　\n';
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
        info[index] = {
            event: temp[2],
            result: temp[1]
        }
    }
    return info;
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
1. 沒有事發生
2. 直接增加X點經驗(X分鐘內)
3. 直接減少X點經驗(X分鐘內)
4. 停止得到經驗(X分鐘內)
5. 分發X經驗給整個CHANNEL中的X人
6. 停止得到經驗(X分鐘內)並每次減少發言減少X經驗
7. 吸收對方X點經驗
8. 對方得到經驗值 X 倍(X分鐘內)
9. 從整個CHANNEL 的X人吸收X點經驗

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
async function randomEvent({
    freeMode,
    eventName
}) {
    //free mode = 從整個列表抽選
    if (freeMode) {
        const target = await schema.eventList.find({});
        if (!target.length) return;
        const targetEvent = target[exports.rollbase.Dice(target.length) - 1]
        return targetEvent[exports.rollbase.Dice(targetEvent.length) - 1]
    } else if (eventName) {
        const target = await schema.eventList.findOne({
            title: eventName
        });
        if (!target) return;
        return target[exports.rollbase.Dice(target.length) - 1]
    } else return;

}

async function event(key, needExp, eventLV, myLV, eventNeg) {
    let random
    switch (key) {
        case 2:
            //   2. 直接增加X點經驗
            //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個負面) 
            random = exports.rollbase.DiceINT(needExp / 100, needExp / 50)
            random *= (eventLV ^ 2 - myLV) > 0 ? ((eventLV ^ 2 - myLV) / 100 + 1) : 1;
            random *= (eventNeg / 100 + 1)
            return random;
        case 3:
            // 3. 直接減少X點經驗
            //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個負面) 
            random = exports.rollbase.DiceINT(needExp / 200, needExp / 50)
            random *= (eventLV - myLV ^ 2) > 0 ? ((eventLV - myLV ^ 2) / 100 + 1) : 1;
            random *= (1 - eventNeg / 100)
            return random;

        case 4:
            //   4. 停止得到經驗(X分鐘內)
            random = eventLV;

            break;
        case 5:
            //  5. 分發X經驗給整個CHANNEL中的X人
            random = exports.rollbase.DiceINT(needExp / 50, needExp / 20)
            random *= (eventLV ^ 2 - myLV) > 0 ? ((eventLV ^ 2 - myLV) / 100 + 1) : 1;
            random *= (eventNeg / 100 + 1)
            return random;
        case 6:
            //  6. 停止得到經驗(X分鐘內) 並每次減少發言減少X經驗
            random = eventLV;
            break;
        case 7:
            //  7. 吸收對方X點經驗

            break;
        case 8:
            //  8. 對方得到經驗值 X 倍(X分鐘內)
            random = exports.rollbase.DiceINT(needExp / 200, needExp / 50)
            random *= (eventLV - myLV ^ 2) > 0 ? ((eventLV - myLV ^ 2) / 100 + 1) : 1;
            random *= (1 - eventNeg / 100)
            break;
        case 9:
            //  9. 從整個CHANNEL 的X人吸收X點經驗

            break;

        default:
            //     1. 沒有事發生
            break;
    }
}