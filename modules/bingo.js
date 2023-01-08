"use strict";

const schema = require('../modules/schema.js');
class BingoGame {
    constructor(size) {
        this.size = size;
        this.board = [];
        for (let i = 0; i < size * size; i++) {
            this.board.push(i + 1);
        }
        //Bingo條件
        this.prizes = [];
        for (let i = 0; i < size; i++) {
            // 橫排
            this.prizes.push({ type: 'row', indices: Array.from({ length: size }, (_, j) => i * size + j) });
            // 直排
            this.prizes.push({ type: 'column', indices: Array.from({ length: size }, (_, j) => j * size + i) });
        }
        // 左上至右下
        this.prizes.push({ type: 'diagonal', indices: Array.from({ length: size }, (_, i) => i * size + i) });
        // 右上至左下
        this.prizes.push({ type: 'diagonal', indices: Array.from({ length: size }, (_, i) => i * size + size - i - 1) });

        //        this.calledNumbers = [];
    }
    checkScore(calledNumbers) {
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
            await schema.AchievementUserScore.create({
                groupID, userID, title: gameName[1], achieved: [input],
                score: 1
            });
            //await message.reply({ content: `恭喜你獲得成就 ${gameName[1]} 的第一個成就點數`, ephemeral: true }).catch();
            await message.edit({ content: `${messageContent}\n${displayname}獲得1分`}).catch();
        }
        else {
            if (achievementUser.achieved.includes(input)) {
                //remove achievementUser.achieved input
                achievementUser.achieved = achievementUser.achieved.filter(item => item !== input)
                return await message.reply({ content: `${displayname}你已經按過這個了`, ephemeral: true }).catch();
            }
            else {
                achievementUser.achieved.push(input);

            }
            let score = achievementUser.score + 1;
            await schema.AchievementUserScore.updateOne({ groupID, userID, title: gameName[1] }, {
                achieved: achievementUser.achieved, score
            });

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


}

const bingoThree = new BingoGame(3);
const bingoFour = new BingoGame(4);
const bingoFive = new BingoGame(5);


module.exports = {
    BingoGame
};

function checkBingo(bingo, rowLength) {
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