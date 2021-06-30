if (!process.env.mongoURL) return;
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
//60000 一分鐘多久可以升級及增加經驗
exports.rollbase = require('../roll/rollbase');
exports.z_Level_system = require('../roll/z_Level_system');
const schema = require('../modules/core-schema.js');
//trpgEventSystem
const opt = {
    upsert: true,
    runValidators: true
}

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


async function get(who, data) {

}







module.exports = {
    event
};