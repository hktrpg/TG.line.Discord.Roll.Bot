"use strict";

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