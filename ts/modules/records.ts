/* eslint-disable no-unused-vars */
"use strict";
const {
    EventEmitter
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
} = require("events");
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
require('events').EventEmitter.defaultMaxListeners = Infinity;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
let instance;
let MAX = 100;
const Message = schema.chatRoom;

class Records extends EventEmitter {
    emit: any;
    constructor() {
        super();
    }
    set(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                blockfunction: msg.blockfunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushblockfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                blockfunction: msg.blockfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }

    //randomAns開始
    pushrandomAnsfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                randomAnsfunction: msg.randomAnsfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setrandomAnsfunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                randomAnsfunction: msg.randomAnsfunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushrandomAnsAllgroup(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({}, {
            $push: {
                randomAnsAllgroup: msg.randomAnsAllgroup
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setrandomAnsAllgroup(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({}, {
            $set: {
                randomAnsAllgroup: msg.randomAnsAllgroup
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    get(target: any, callback: any) {
        // 取出所有資料
        if (schema[target])
            schema[target].find({}, (err: any, msgs: any) => {
                callback(msgs);
            });
    }

    /*
        trpgDatabase開始
    */
    pushtrpgDatabasefunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                trpgDatabasefunction: msg.trpgDatabasefunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDatabasefunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgDatabasefunction: msg.trpgDatabasefunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushtrpgDatabaseAllgroup(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({}, {
            $push: {
                trpgDatabaseAllgroup: msg.trpgDatabaseAllgroup
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDatabaseAllgroup(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({}, {
            $set: {
                trpgDatabaseAllgroup: msg.trpgDatabaseAllgroup
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }


    /*
          setGroupSetting開始
      */
    pushGroupSettingfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                GroupSettingfunction: msg.GroupSettingfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setGroupSettingfunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                GroupSettingfunction: msg.GroupSettingfunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }


    /*
        trpgsaveCommand開始
    */
    pushtrpgCommandfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                trpgCommandfunction: msg.trpgCommandfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgCommandfunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgCommandfunction: msg.trpgCommandfunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }


    /*
            trpgDarkRollingfunction開始
        */

    pushtrpgDarkRollingfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                trpgDarkRollingfunction: msg.trpgDarkRollingfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDarkRollingfunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgDarkRollingfunction: msg.trpgDarkRollingfunction
            }
        }, {
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    /*
            trpgLevelSystem開始
        */
    pushtrpgLevelSystemfunction(dbbase: any, msg: any, callback: any) {
        /*
            提醒:
            $push 加入新的
            $set  重置舊的
         */
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            new: true,
            upsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgLevelSystemfunctionLevelUpWord(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord,
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                //trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionRankWord(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                //trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionConfig(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                Hidden: msg.Hidden
                //是否顯示升級語 config X1 則1
                //trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionNewUser(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $push: {
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            upsert: true,
            //   setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error(`log #476 ${err}`);
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionTitleWord(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                //在這群的稱號
                Title: msg.Title
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                //trpgLevelSystemfunction: msg.trpgLevelSystemfunction
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    settrpgLevelSystemfunctionEXPup(dbbase: any, msgA: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msgA.groupid
        }, {
            $set: {
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                trpgLevelSystemfunction: msg
            }
        }, {
            //   setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error(`log #531 ${err}`);
                console.error("Something wrong when updating data!");
            } else {
                callback();
            }
            // return JSON.stringify(doc).toString();
        });
    }

    maxtrpgLevelSystemfunctionEXPup(dbbase: any, userid: any, exp: any, lv: any, msgA: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            groupid: msgA.groupid,
            'trpgLevelSystemfunction.userid': userid
        }, {
            $max: {
                //LevelUpWord: msg.LevelUpWord
                //在這群組升級時的升級語
                //RankWord: msg.RankWord
                //在這群組查詢等級時的回應
                //Switch: msg.Switch,
                //是否啓動功能 config 1X 則1
                //Hidden: msg.Hidden,
                //是否顯示升級語 config X1 則1
                'trpgLevelSystemfunction.$.EXP': exp,
                'trpgLevelSystemfunction.$.Level': lv
            }
        }, {
            //   setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error(`log #562 ${err}`);
                console.error("Something wrong when updating data!");
            } else {
                callback();
            }
            // return JSON.stringify(doc).toString();
        });
    }

    /*
    SAVE THE LOG
    SAVELOG功能
    */
    settrpgSaveLogfunctionRealTime(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({}, {
            $setOnInsert: {
                "RealTimeRollingLogfunction.StartTime": msg.StartTime,
            },
            $set: {
                "RealTimeRollingLogfunction.LogTime": msg.LogTime,
                "RealTimeRollingLogfunction.LastTimeLog": msg.LastTimeLog
            },
            $max: {
                //實時資料 使用SET
                "RealTimeRollingLogfunction.DiscordCountRoll": msg.DiscordCountRoll,
                "RealTimeRollingLogfunction.DiscordCountText": msg.DiscordCountText,
                "RealTimeRollingLogfunction.LineCountRoll": msg.LineCountRoll,
                "RealTimeRollingLogfunction.LineCountText": msg.LineCountText,
                "RealTimeRollingLogfunction.TelegramCountRoll": msg.TelegramCountRoll,
                "RealTimeRollingLogfunction.TelegramCountText": msg.TelegramCountText,
                "RealTimeRollingLogfunction.WhatsappCountRoll": msg.WhatsappCountRoll,
                "RealTimeRollingLogfunction.WhatsappCountText": msg.WhatsappCountText,
                "RealTimeRollingLogfunction.WWWCountRoll": msg.WWWCountRoll,
                "RealTimeRollingLogfunction.WWWCountText": msg.WWWCountText
                //中途紀錄資料 使用PUSH 每天紀錄一次
                // RollingLogfunction: msg,
                //擲骰的結果紀錄
                //Sided: msg
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true
            //   setDefaultsOnInsert: true
        }, (err: any, doc: any) => {
            if (err) {
                console.error(`log #608 ${err}`);
                console.error("Something wrong when updating data!");
            } else {
                callback();
            }
            // return JSON.stringify(doc).toString();
        });
    }

    maxTrpgSaveLogfunction(dbbase: any, msg: any, callback: any) {
        schema[dbbase].findOneAndUpdate({
            "RollingLogfunction.LogTime": {
                '$gte': msg.start,
                '$lte': msg.end
            }
        }, {
            $set: {
                "RollingLogfunction.LogTime": msg.LogTime,
            },
            $max: {
                //大於則更新
                "RollingLogfunction.DiscordCountRoll": msg.DiscordCountRoll,
                "RollingLogfunction.DiscordCountText": msg.DiscordCountText,
                "RollingLogfunction.LineCountRoll": msg.LineCountRoll,
                "RollingLogfunction.LineCountText": msg.LineCountText,
                "RollingLogfunction.TelegramCountRoll": msg.TelegramCountRoll,
                "RollingLogfunction.TelegramCountText": msg.TelegramCountText,
                "RollingLogfunction.WhatsappCountRoll": msg.WhatsappCountRoll,
                "RollingLogfunction.WhatsappCountText": msg.WhatsappCountText,
                "RollingLogfunction.WWWCountRoll": msg.WWWCountRoll,
                "RollingLogfunction.WWWCountText": msg.WWWCountText
                //中途紀錄資料 使用PUSH 每天紀錄一次
                // RollingLogfunction: msg,
                //擲骰的結果紀錄
                //Sided: msg
            }
        }, {
            upsert: true
            //   setDefaultsOnInsert: true
        },
            (err: any, doc: any) => {
                if (err) {
                    console.error(`log #651 ${err}`);
                    console.error("Something wrong when updating data!");
                } else {
                    callback();
                }
                // return JSON.stringify(doc).toString();
            });
    }


    //chatRoomWWW Record

    async chatRoomPush(msg: any) {
        const m = new Message(msg);
        await m.save();
        this.emit("new_message", msg);
        let count = await Message.countDocuments({
            'roomNumber': msg.roomNumber
        });
        /**
         * 計算有多少個
         * 比較超出了多少個
         * 找出那個的日子
         * 之前的全部刪除
         */
        if (count < MAX) return;
        let over = count - MAX;
        let d = await Message.find({
            'roomNumber': msg.roomNumber
        }).sort({
            'time': 1,
        })
        if (!d[over - 1]) return;
        await Message.deleteMany({
            'roomNumber': msg.roomNumber,
            time: {
                $lt: d[over - 1].time
            }

        })
    }

    chatRoomGet(roomNumber: any, callback: any) {
        Message.find({
            roomNumber: roomNumber
        }, (err: any, msgs: any) => {
            callback(msgs);
        });
    }

    chatRoomSetMax(max: any) {
        MAX = max;
    }

    chatRoomGetMax() {
        return MAX;
    }
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }

    return instance;
})();