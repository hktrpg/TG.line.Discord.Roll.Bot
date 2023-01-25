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
    static checkScore(calledNumbers) {
        const { size, board, prizes } = this;
        let score = calledNumbers.length;
        // 檢查行是否有中獎
        for (const prize of prizes) {
            let win = true;
            for (const index of prize.indices) {
                if (!calledNumbers.includes(board[index])) {
                    win = false;
                }
            }
            if (win) score += size;
        }
        return score;
    }
    static async handlingInput(data) {
        let resultText = '';
        const { input, buttonlist, gameName, groupID, userID, message, displayname } = data;
        const achievement = await schema.Achievement.findOne({ groupID, title: gameName[1] });
        //2.1.1	沒有的話，回覆沒有這個成就，玩不了
        if (!achievement) return await message.reply({ content: `${gameName} 這個成就好像已被刪除，玩不了啊`, ephemeral: true }).catch();
        const achievementUser = await schema.AchievementUserScore.findOne({ groupID, userID, title: gameName[1] });
        if (!achievementUser) {
            //沒有的話，新增一個User
            return await this.newUser({ groupID, userID, gameName, input, messageContent, displayname })
        }
        else {
            //檢查有沒有按過 - 有，進行還原
            if (achievementUser.achieved.includes(input)) {
                achievementUser.achieved = achievementUser.achieved.filter(item => item !== input);
                //remove achievementUser.achieved input        
            }
            else {
                //檢查有沒有按過 - 沒有，進行+分及計分，更新DB及回覆
                achievementUser.achieved.push(input);
            }
            //，計分
            let score = achievementUser.score + 1;
            //，更新DB
            await schema.AchievementUserScore.updateOne({ groupID, userID, title: gameName[1] }, {
                achieved: achievementUser.achieved, score
            });
            //回覆

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
            return await message.reply({ content: `${displayname}${resultText}`, ephemeral: false }).catch();
        }
    }
    static async newUser({ groupID, userID, gameName, input, messageContent, displayname }) {
        let obj = {
            groupID, userID, title: gameName[1], achieved: [input],
        }
        if (achievement.countScore) obj.score = 1;
        await schema.AchievementUserScore.create(obj);
        //await message.reply({ content: `恭喜你獲得成就 ${gameName[1]} 的第一個成就點數`, ephemeral: true }).catch();
        let data = this.getString(messageContent)
        let newAction = this.updateAction(data.action, displayname, true, input)
        let newScore = this.updateScore(data.score, displayname, 1)
        let newMessageContent = this.updateMessageContent({ messageContent, score: newScore, action: newAction })
        return await message.edit({ content: `${newMessageContent}` }).catch();
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
    static updateSring({ messageContent, action, score }) {
        //const inputString = "Bingos遊戲 - 名字\n----------------\nXXX已取得 - YYYY\nYYY已還原 - ZZZZ\n----------------\n得分\nXXXXX : 20分\n----------------";
        const delimiter = "----------------";
        const parts = messageContent.split(delimiter);
        (action) ? parts[1] = action : null;
        (score) ? parts[2] = score : null;
        return parts.join(delimiter);

    }

    static updateAction(inputString, updateName, updateStatus, newItem) {
        // const inputString = "XXX已取得 - YYYY\nYYY已還原 - ZZZZ";
        // const updateName = "XXX";
        // const updateStatus = "已還原";
        // const newItem = "新項目";
        const status = (updateStatus) ? "已取得" : "已還原";
        const lines = inputString.split("\n");
        let updated = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(updateName)) {
                const parts = lines[i].split(" - ");
                parts[0] = updateName + status;
                parts[1] = newItem;
                lines[i] = parts.join(" - ");
                updated = true;
                break;
            }
        }
        if (!updated) {
            lines.push(updateName + updateStatus + " - " + newItem);
        }
        return lines.join("\n");
        //const newString = updateString("XXX", "已還原", "新項目");
        //console.log(newString);
    }
    static updateScore(inputString, updateName, newScore) {
        // const inputString = "XXX已取得 - YYYY\nYYY已還原 - ZZZZ";
        // const updateName = "XXX";
        // const updateStatus = "已還原";
        // const newItem = "新項目";
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
            lines.push(updateName + updateStatus + " - " + newScore + '分');
        }
        return lines.join("\n");
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

