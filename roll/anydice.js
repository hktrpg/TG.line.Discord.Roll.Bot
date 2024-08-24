"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const gameName = function () {
    return '【Demo】'
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
const getHelpMessage = function () {
    return `【示範】
只是一個Demo的第一行
只是一個Demo末行
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
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = 'Demo' + mainMsg[1] + inputStr + groupid + userid + userrole + botname + displayname + channelid + displaynameDiscord + membercount;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};


function calculateDiceProbabilities(diceNotation, atMost = false) {
    const parseDiceNotation = (notation) => {
        const parts = notation.toLowerCase().split('+');
        let totalCount = 0;
        let diceGroups = [];
        let totalModifier = 0;

        parts.forEach(part => {
            if (part.includes('d')) {
                const [count, sides] = part.split('d').map(Number);
                totalCount += count || 1;
                diceGroups.push({ count: count || 1, sides });
            } else {
                totalModifier += parseInt(part);
            }
        });

        return { diceGroups, totalModifier, totalCount };
    };

    const { diceGroups, totalModifier, totalCount } = parseDiceNotation(diceNotation);

    // 計算最小值和最大值
    const minValue = totalCount + totalModifier; // 每個骰子的最小值是1
    const maxValue = diceGroups.reduce((sum, { count, sides }) => sum + count * sides, 0) + totalModifier; // 每個骰子的最大值是其面數

    const outcomes = new Array(maxValue - minValue + 1).fill(0);

    // 使用迴圈來計算所有可能的擲出結果
    const rollResults = (diceGroups) => {
        let results = [0]; // 初始結果為0
        for (const { count, sides } of diceGroups) {
            let newResults = [];
            for (let i = 0; i < count; i++) {
                const tempResults = [];
                for (const result of results) {
                    for (let face = 1; face <= sides; face++) {
                        tempResults.push(result + face);
                    }
                }
                results = tempResults; // 更新 results
            }
        }
        return results;
    };

    const rolls = rollResults(diceGroups);
    rolls.forEach(roll => {
        outcomes[roll + totalModifier - minValue]++;
    });

    const totalCombinations = diceGroups.reduce((product, { count, sides }) => product * Math.pow(sides, count), 1);
    const probabilities = outcomes.map(count => count / totalCombinations);
    const expectedValue = probabilities.reduce((sum, prob, index) => sum + (index + minValue) * prob, 0);

    // 計算 "at most" 機率
    const atMostProbabilities = new Array(maxValue - minValue + 1).fill(0);
    let cumulativeProbability = 0;

    probabilities.forEach((prob, index) => {
        cumulativeProbability += prob;
        atMostProbabilities[index] = cumulativeProbability;
    });

    // 根據 atMost 的值返回不同的結果
    if (atMost) {
        return {
            notation: diceNotation,
            probabilities: atMostProbabilities.map((prob, index) => ({
                value: index + minValue,
                probability: (prob * 100).toFixed(2) + '%'
            })),
            expectedValue: expectedValue.toFixed(2),
            minValue,
            maxValue
        };
    } else {
        return {
            notation: diceNotation,
            probabilities: probabilities.map((prob, index) => ({
                value: index + minValue,
                probability: (prob * 100).toFixed(2) + '%'
            })),
            expectedValue: expectedValue.toFixed(2),
            minValue,
            maxValue
        };
    }
}

// 使用範例
const testCases = [
    { notation: '1d6', atMost: false },
    { notation: '1d6+1', atMost: true },
    { notation: '3d6', atMost: false },
    { notation: '1d100', atMost: true },
    { notation: '1d6+1d6', atMost: false },
    { notation: '1d6+2d6+3', atMost: true }
];

testCases.forEach(({ notation, atMost }) => {
    console.log(`\n計算 ${notation} 的機率分布：`);
    const result = calculateDiceProbabilities(notation, atMost);
    console.log(JSON.stringify(result, null, 2));
});


/////////////////
function calculateDiceProbabilities(diceNotation) {
    const parseDiceNotation = (notation) => {
        const parts = notation.toLowerCase().split('+');
        let diceGroups = [];
        let totalModifier = 0;

        parts.forEach(part => {
            if (part.includes('d')) {
                const [count, sides] = part.split('d').map(Number);
                diceGroups.push({ count: count || 1, sides });
            } else {
                totalModifier += parseInt(part);
            }
        });

        return { diceGroups, totalModifier };
    };

    const { diceGroups, totalModifier } = parseDiceNotation(diceNotation);

    const minValue = diceGroups.reduce((sum, { count }) => sum + count, 0) + totalModifier;
    const maxValue = diceGroups.reduce((sum, { count, sides }) => sum + count * sides, 0) + totalModifier;
    const outcomes = new Array(maxValue - minValue + 1).fill(0);

    function rollDice(groupIndex, currentSum) {
        if (groupIndex === diceGroups.length) {
            outcomes[currentSum - minValue]++;
            return;
        }
        const { count, sides } = diceGroups[groupIndex];
        for (let i = 0; i < count; i++) {
            for (let face = 1; face <= sides; face++) {
                rollDice(groupIndex + 1, currentSum + face);
            }
        }
    }

    rollDice(0, totalModifier);

    const totalCombinations = diceGroups.reduce((product, { count, sides }) => product * Math.pow(sides, count), 1);
    const probabilities = outcomes.map(count => count / totalCombinations);
    const expectedValue = probabilities.reduce((sum, prob, index) => sum + (index + minValue) * prob, 0);

    return { probabilities, expectedValue, minValue, maxValue };
}

function parseInput(input) {
    const match = input.match(/(\d+)d(\d+)(kh(\d+))?/i);
    if (!match) throw new Error("Invalid input format");
    return {
        numDice: parseInt(match[1]),
        numSides: parseInt(match[2]),
        keepHighest: match[4] ? parseInt(match[4]) : null
    };
}

function calculateProbability(input) {
    const { numDice, numSides, keepHighest } = parseInput(input);
    let results = {};

    function generateCombinations(dice, current) {
        if (current.length === numDice) {
            current.sort((a, b) => b - a);
            let key = current.slice(0, keepHighest || numDice).reduce((a, b) => a + b, 0);
            if (results[key]) {
                results[key]++;
            } else {
                results[key] = 1;
            }
            return;
        }
        for (let i = 1; i <= numSides; i++) {
            generateCombinations(dice, current.concat(i));
        }
    }

    generateCombinations(numDice, []);

    let totalOutcomes = Math.pow(numSides, numDice);
    for (let key in results) {
        results[key] = (results[key] / totalOutcomes) * 100;
    }

    return results;
}

function combinedProbability(diceNotation) {
    const parts = diceNotation.split('+');
    let totalProbabilities = {};
    let totalExpectedValue = 0;

    parts.forEach(part => {
        if (part.includes('kh')) {
            const probabilities = calculateProbability(part);
            for (let key in probabilities) {
                totalProbabilities[key] = (totalProbabilities[key] || 0) + probabilities[key];
            }
        } else {
            const { probabilities, expectedValue, minValue } = calculateDiceProbabilities(part);
            probabilities.forEach((prob, index) => {
                const value = index + minValue;
                totalProbabilities[value] = (totalProbabilities[value] || 0) + prob * 100;
            });
            totalExpectedValue += expectedValue;
        }
    });

    return { totalProbabilities, totalExpectedValue };
}

// Example usage
const testCases2 = ['3d6kh2'];

testCases.forEach(testCase => {
    console.log(`\nCalculating probabilities for ${testCase}:`);
    const { totalProbabilities, totalExpectedValue } = combinedProbability(testCase);

    for (let key in totalProbabilities) {
        console.log(`${key}: ${totalProbabilities[key].toFixed(2)}%`);
    }
    console.log(`Expected Value: ${totalExpectedValue.toFixed(2)}`);
});
