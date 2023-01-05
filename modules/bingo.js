"use strict";


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
}

const bingoThree = new BingoGame(3);
const bingoFour = new BingoGame(4);
const bingoFive = new BingoGame(5);


module.exports = {
    bingoThree,
    bingoFour,
    bingoFive
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