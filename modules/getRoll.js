const rollDice = require('./analytics').parseInput;

// Function to roll text with embedded dice roll expressions
async function rollText(text) {
    // Replace all instances of [[expression]] with the result of the dice roll
    let result = await replaceAsync(text, /\[\[(.*?)\]\]/ig, rollDiceExpression);
    return result;
}

// Helper function to replace regex matches with asynchronous function results
async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        promises.push(asyncFn(match, ...args));
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

// Asynchronous function to process each dice roll expression
async function rollDiceExpression(match, expression) {
    let result = await rollDice({ inputStr: expression });
    return (result && result.text) ? result.text : match;
}

module.exports = {
    rollText
};