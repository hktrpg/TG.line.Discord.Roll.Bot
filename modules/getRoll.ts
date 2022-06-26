
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollDice'.
const rollDice = require('./analytics').parseInput;

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollText'.
async function rollText(text: any) {
    let result = await replaceAsync(text, /\[\[(.*?)\]\]/ig, await myAsyncFn);
    return result;
}


// @ts-expect-error TS(2393): Duplicate function implementation.
async function replaceAsync(str: any, regex: any, asyncFn: any) {
    const promises: any = [];
    str.replace(regex, (match: any, ...args: any[]) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


async function myAsyncFn(match: any, p1: any) {
    let result = await rollDice({ inputStr: p1 });
    return (result && result.text) ? result.text : match;
}


// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollText
};