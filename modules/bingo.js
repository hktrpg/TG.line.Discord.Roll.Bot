"use strict";

const schema = require('../modules/schema.js');
class BingoGame {
    constructor(size) {
        this.size = size;
        this.board = [];
        for (let i = 0; i < size * size; i++) {
            this.board.push(i + 1);
        }
        //console.log('this.board', this.board)
        //3X3 = [1, 2, 3, 4, 5, 6, 7, 8, 9] 
        //Bingo條件
        this.prizes = [];
        for (let i = 0; i < size; i++) {
            // 橫排  [0, 1, 2] [3, 4, 5] [6, 7, 8]
            this.prizes.push({ type: 'row', indices: Array.from({ length: size }, (_, j) => i * size + j) });
            // 直排
            this.prizes.push({ type: 'column', indices: Array.from({ length: size }, (_, j) => j * size + i) });
        }
        // 左上至右下
        this.prizes.push({ type: 'diagonal', indices: Array.from({ length: size }, (_, i) => i * size + i) });
        // 右上至左下 [3, 5, 7]
        this.prizes.push({ type: 'diagonal', indices: Array.from({ length: size }, (_, i) => i * size + size - i - 1) });
        console.log('this.prizes', this.prizes)
        //        this.calledNumbers = [];
    }
    checkScore(calledNumbers) {
        const { size, board, prizes } = this;
        let score = calledNumbers.length;
        console.log('calledNumbers', calledNumbers, 'size', size, 'board', board, 'prizes', prizes)
        // 檢查行是否有中獎
        for (const prize of prizes) {
            let win = true;
            for (const index of prize.indices) {
                if (!calledNumbers.includes(index)) {
                    win = false;
                    break;
                }
            }
            if (win) score += size;
        }
        return score;
    }
    static async handlingInput(data) {
        let resultText = '';
        const { input, buttonlist, gameName, groupID, userID, message, displayname } = data;
        console.log('message', message)
        const messageContent = message.message.content;
        const achievement = await schema.Achievement.findOne({ groupID, title: gameName[1] });
        //2.1.1	沒有的話，回覆沒有這個成就，玩不了
        if (!achievement) return await message.reply({ content: `${gameName} 這個成就好像已被刪除，玩不了啊`, ephemeral: true }).catch();
        const countScore = achievement.countScore;
        const achievementUser = await schema.AchievementUserScore.findOne({ groupID, userID, title: gameName[1] });
        let displaynameUpdated = displayname.replace(/\n/, '');
        let newMessageContent = '';
        if (!achievementUser) {
            //沒有的話，新增一個User
            newMessageContent = await this.newUser({ groupID, userID, gameName, input, messageContent, displayname: displaynameUpdated, countScore })
            return await message.update({ content: newMessageContent, ephemeral: true }).catch();
        }
        else {
            let state = false;
            // await this.updateUser({ groupID, userID, gameName, input, messageContent, displayname })
            //檢查有沒有按過 - 有，進行還原
            if (achievementUser.achieved.includes(input)) {
                achievementUser.achieved = achievementUser.achieved.filter(item => item !== input);
                //remove achievementUser.achieved input        
            }
            else {
                //檢查有沒有按過 - 沒有，
                achievementUser.achieved.push(input);
                state = true;
            }
            console.log('achievementUser.achieved', achievementUser, achievementUser.achieved)
            console.log('buttonlist', buttonlist)
            console.log('achievement', achievement)

            //，計分 --- 使用achievementUser.achieved和buttonlist進行對比，
            //找出那個buttonlist的index，然後對比achievementUser.achieved的index
            let length = buttonlist[0].components.length;
            console.log('length', length);
            let acceptedList = this.buttonlistCheck(buttonlist, achievementUser.achieved);
            let score = 0;
            switch (length) {
                case 3:
                    score = bingoThree.checkScore(acceptedList);
                    break;
                case 4:
                    score = bingoFour.checkScore(acceptedList);
                    break;
                case 5:
                    score = bingoFive.checkScore(acceptedList);
                    break;
            }
            //，更新DB
            console.log('score', score)
            await schema.AchievementUserScore.updateOne({ groupID, userID, title: gameName[1] }, {
                achieved: achievementUser.achieved, score
            });
            //更新回覆
            newMessageContent = await this.updateUser({ groupID, userID, gameName, input, messageContent, displayname: displaynameUpdated, score, state, countScore })
            /**
             * 1.	確認按了那個
             * 2.	對比db
             * 			2.1	 find Achievement 確認是否有這個成就
             * 					2.1.1	沒有的話，回覆沒有這個成就，玩不了
             * 					2.1.2	有的話，繼續
             * 			2.2	 find AchievementUserScore
             * 						2.2.1	沒有的話，新增一個User
             * 						2.2.2	對比achieved 和enter，進行開關更新
             * 						2.2.3	把fullList變成Array [1-X]，然後用checkScore檢查分數
             * 3.
             * 4.	以新Message 回覆這個按鈕的結果(隱藏)，但有顯示的按鈕
             * 5.	更新原本的Message的分數
             * ----------------------------------
             * 
             */
            console.log('newMessageContent', newMessageContent)
            console.log('message', message)
            return await message.update({ content: newMessageContent, ephemeral: true }).catch();
        }
    }
    static buttonlistCheck(buttonlist, achieved) {
        let buttonSort = [];
        let result = [];
        for (const buttons of buttonlist) {
            for (const button of buttons.components) {
                buttonSort.push(button.label);
            }
        }
        for (const [index, value] of buttonSort.entries()) {
            console.log(index, value);
            if (achieved.includes(value)) {
                result.push(index);
            }
        }
        return result;
    }
    static async updateUser({ input, messageContent, displayname, score, state = false, countScore }) {
        //await message.reply({ content: `恭喜你獲得成就 ${gameName[1]} 的第一個成就點數`, ephemeral: true }).catch();
        console.log('state', state)
        let data = this.getString(messageContent)
        let newAction = this.updateAction(data.action, displayname, state, input)
        console.log('newAction', newAction)
        let newScore = this.updateScore(data.score, displayname, score)
        console.log('newScore', newScore)
        let newMessageContent = this.updateString({ messageContent, score: newScore, action: newAction, countScore })
        return newMessageContent;
        /*
        Bingos遊戲 - 名字
        ----------------
        XXX已取得 - YYYY
        YYY已還原 - ZZZZ
        ----------------
        XXXXX : 20分
        ----------------";

        */
    }
    static async newUser({ groupID, userID, gameName, input, messageContent, displayname, countScore }) {
        let obj = {
            groupID, userID, title: gameName[1], achieved: [input], score: 1
        }
        // if (achievement.countScore) obj.score = 1;
        await schema.AchievementUserScore.create(obj);
        //await message.reply({ content: `恭喜你獲得成就 ${gameName[1]} 的第一個成就點數`, ephemeral: true }).catch();
        let data = this.getString(messageContent)
        let newAction = this.updateAction(data.action, displayname, true, input)
        let newScore = this.updateScore(data.score, displayname, 1)
        return this.updateString({ messageContent, score: newScore, action: newAction, countScore })
        /*
        Bingos遊戲 - 名字
        ----------------
        XXX已取得 - YYYY
        YYY已還原 - ZZZZ
        ----------------
        XXXXX : 20分
        ----------------";

        */
    }
    static getString(inputString) {
        //const inputString = "Bingos遊戲 - 名字\n----------------\nXXX已取得 - YYYY\nYYY已還原 - ZZZZ\n----------------\n得分\nXXXXX : 20分\n----------------";
        const delimiter = "----------------";
        const parts = inputString.split(delimiter) || [];
        return { action: parts[1], score: parts[2] }
        // console.log(parts[1]);  // "XXX已取得 - YYYY\nYYY已還原 - ZZZZ\n"
        // console.log(parts[2]);  // "得分\nXXXXX : 20分\n"
    }
    static updateString({ messageContent, action, score, countScore }) {
        //const inputString = "Bingos遊戲 - 名字\n----------------\nXXX已取得 - YYYY\nYYY已還原 - ZZZZ\n----------------\n得分\nXXXXX : 20分\n----------------";
        const delimiter = "----------------";
        const parts = messageContent.split(delimiter);
        (action) ? parts[1] = action : null;
        (score) ? parts[2] = score : null;
        (countScore) ? null : parts[2] = '';
        return parts.join(delimiter);

    }

    static updateAction(inputString, updateName, updateStatus, newItem) {
        console.log('inputString', inputString, 'updateName', updateName, 'newItem', newItem)
        const status = (updateStatus) ? "已取得" : "已還原";
        let lines = inputString.split("\n");
        if (lines.length > 7) {
            lines = lines.slice(-7);
        }
        lines.push(updateName + status + " - " + newItem);
        console.log('lines', lines);
        return "\n" + (lines.join("\n") + "\n").replace(/(^[ \t]*\n)/gm, "");
        //const newString = updateString("XXX", "已還原", "新項目");
        //console.log(newString);
    }
    static updateScore(inputString, updateName, newScore) {
        const lines = inputString.split("\n");
        let updated = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(updateName)) {
                const parts = lines[i].split(" - ");
                parts[0] = updateName;
                parts[1] = newScore + '分';
                lines[i] = parts.join(" - ");
                updated = true;
                break;
            }
        }
        if (!updated) {
            lines.push(updateName + " - " + newScore + '分');
        }
        return "\n" + (lines.join("\n") + "\n").replace(/(^[ \t]*\n)/gm, "");
        //const newString = updateString("XXX", "已還原", "新項目");
        //console.log(newString);
    }

    static checkBingo(bingo, rowLength) {
        //上至下
        for (let i = 0; i < rowLength.length; i++) {
            let bingoRow = []
            for (let index = 0; index < rowLength.length; index++) {
                bingoRow[index] = bingo[i + (index * rowLength)];//rowLength = 3 , 0,3,6 ; 1,4,7 ; 2,5,8
                if (bingoRow.every((value) => value === true)) {
                    return true;
                }
            }
        }
        //左至右
        for (let i = 0; i < rowLength.length; i++) {
            let bingoColumn = []
            for (let index = 0; index < rowLength.length; index++) {
                bingoColumn[index] = bingo[(rowLength * i) + index];//rowLength = 3 , 0,1,2 ; 3,4,5 ; 6,7,8
                if (bingoColumn.every((value) => value === true)) {
                    return true;
                }
            }
        }
        //左上至右下
    }

}

const bingoThree = new BingoGame(3);
const bingoFour = new BingoGame(4);
const bingoFive = new BingoGame(5);


module.exports = {
    BingoGame
};

