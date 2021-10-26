
const rollDice = require('./core-analytics').parseInput;

async function rollText(text) {
    let result = await replaceAsync(text, /\[\[(.*?)\]\]/ig, await myAsyncFn);
    return result;
}


async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


async function myAsyncFn(match, p1) {
    let result = await rollDice({ inputStr: p1 });
    return (result && result.text) ? result.text.replace(/\n/g, '') : match;
}


module.exports = {
    rollText
};