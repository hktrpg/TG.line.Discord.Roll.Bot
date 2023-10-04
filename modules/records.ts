/* eslint-disable no-unused-vars */
"use strict";
const {
    EventEmitter
} = require("events");
require('events').EventEmitter.defaultMaxListeners = Infinity;
const schema = require('./schema.js');
let instance;
let MAX = 100;
const Message = schema.chatRoom;

class Records extends EventEmitter {
    constructor() {
        super();
    }
    set(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                blockfunction: msg.blockfunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushblockfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }

    //randomAns開始
    pushrandomAnsfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setrandomAnsfunction(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                randomAnsfunction: msg.randomAnsfunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushrandomAnsAllgroup(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setrandomAnsAllgroup(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({}, {
            $set: {
                randomAnsAllgroup: msg.randomAnsAllgroup
            }
        }, {
            upsert: true
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    get(target, callback) {
        // 取出所有資料
        if (schema[target])
            schema[target].find({}, (err, msgs) => {
                callback(msgs);
            });
    }

    /*
        trpgDatabase開始
    */
    pushtrpgDatabasefunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDatabasefunction(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgDatabasefunction: msg.trpgDatabasefunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    pushtrpgDatabaseAllgroup(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDatabaseAllgroup(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({}, {
            $set: {
                trpgDatabaseAllgroup: msg.trpgDatabaseAllgroup
            }
        }, {
            upsert: true
        }, (err, doc) => {
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
    pushGroupSettingfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    setGroupSettingfunction(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                GroupSettingfunction: msg.GroupSettingfunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
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
    pushtrpgCommandfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgCommandfunction(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgCommandfunction: msg.trpgCommandfunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
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

    pushtrpgDarkRollingfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgDarkRollingfunction(dbbase, msg, callback) {
        schema[dbbase].findOneAndUpdate({
            groupid: msg.groupid
        }, {
            $set: {
                trpgDarkRollingfunction: msg.trpgDarkRollingfunction
            }
        }, {
            upsert: true
        }, (err, doc) => {
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
    pushtrpgLevelSystemfunction(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
        });
    }
    settrpgLevelSystemfunctionLevelUpWord(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionRankWord(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionConfig(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionNewUser(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error(`log #476 ${err}`);
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }
    settrpgLevelSystemfunctionTitleWord(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error("Something wrong when updating data!");
            } else
                callback();
            // return JSON.stringify(doc).toString();
        });
    }

    settrpgLevelSystemfunctionEXPup(dbbase, msgA, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error(`log #531 ${err}`);
                console.error("Something wrong when updating data!");
            } else {
                callback();
            }
            // return JSON.stringify(doc).toString();
        });
    }

    maxtrpgLevelSystemfunctionEXPup(dbbase, userid, exp, lv, msgA, msg, callback) {
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
        }, (err, doc) => {
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
    settrpgSaveLogfunctionRealTime(dbbase, msg, callback) {
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
        }, (err, doc) => {
            if (err) {
                console.error(`log #608 ${err}`);
                console.error("Something wrong when updating data!");
            } else {
                callback();
            }
            // return JSON.stringify(doc).toString();
        });
    }

    maxTrpgSaveLogfunction(dbbase, msg, callback) {
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
            (err, doc) => {
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

    async chatRoomPush(msg) {
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

    chatRoomGet(roomNumber, callback) {
        Message.find({
            roomNumber: roomNumber
        }, (err, msgs) => {
            callback(msgs);
        });
    }

    chatRoomSetMax(max) {
        MAX = max;
    }

    chatRoomGetMax() {
        return MAX;
    }

}

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }

    return instance;
})();