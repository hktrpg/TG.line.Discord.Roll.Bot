/* eslint-disable no-undef */
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'parseInput... Remove this comment to see the full error message
const parseInput = require('../modules/analytics').parseInput;
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
var expect = require('chai').expect;

// @ts-expect-error TS(2582): Cannot find name 'describe'. Do you need to instal... Remove this comment to see the full error message
describe('測試所有指令輸出有反應', async () => {
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('1D100', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '1d100'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ca 1+5*6', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ca 1+5*6'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('D66', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'D66'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('D66s', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'D66s'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('D66n', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'D66n'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('5b10 D6', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '5b10 D6'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('5U10 3 4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '5U10 3 4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.int 4 8', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.int 4 8'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('choice 1 2 3', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'choice 1 2 3'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('隨機 2 34 4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '隨機 2 34 4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('每日塔羅', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '每日塔羅'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('運勢', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '運勢'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('立flag', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '立flag'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.me 立flag', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.me 立flag'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('cc 80 xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'cc 80 xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('ccn1 80  xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'ccn1 80  xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('cc2 80  xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'cc2 80  xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('ccb 5 xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'ccb 5 xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('ccrt xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'ccrt xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('ccsu xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'ccsu xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.dp 50 xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.dp 50 xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.cc7build 44 xxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.cc7build 44 xxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.cc6build xxxx', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.cc6build xxxx'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.cc7bg', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.cc7bg'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.al 3AL3*5', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.al 3AL3*5'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.dx 5DX+3@4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.dx 5DX+3@4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.dx ET', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.dx ET'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.4df1', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.4df1'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.kk et', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.kk et'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.mk 5mk+3', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.mk 5mk+3'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.nc NM', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.nc NM'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.nc 2NC+4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.nc 2NC+4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.nc 2NA+4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.nc 2NA+4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ss SR4+4', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ss SR4+4'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ss FumbleT', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ss FumbleT'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.sg ST', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.sg ST'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.SG FT', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.SG FT'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.sw K5', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.sw K5'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.uk 5uk', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.uk 5uk'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.5wd7', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.5wd7'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.kc 5d6', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.kc 5d6'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.wiki hk', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.wiki hk'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.image LOVE', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.image LOVE'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('1D10', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '1d100'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.tran LOVE', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.tran LOVE'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ch show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ch show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ch showall', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ch showall'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ch HP', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ch HP'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.CH HP +3 筆記', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.CH HP +3 筆記'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ch 空手', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ch 空手'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.level show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.level show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.ra show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.ra show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.rap show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.rap show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.rap ', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.rap '
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.cmd show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.cmd show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.cmd add 2 33333', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.cmd add 2 33333'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.bk show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.bk show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.bk add 9d9999', async () => {
        let a = await parseInput({
            inputStr: '.bk add 9d9999',
            // @ts-expect-error TS(2322): Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
            groupid: 'test',
            // @ts-expect-error TS(2322): Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
            userid: 'test'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.dbp show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.dbp show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('.db show', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: '.db show'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('bothelp', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'bothelp'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('bothelp', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'bothelp admin'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('bothelp', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'bothelp link'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
    // @ts-expect-error TS(2582): Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
    it('bothelp', async () => {
        // @ts-expect-error TS(2345): Argument of type '{ inputStr: string; }' is not as... Remove this comment to see the full error message
        let a = await parseInput({
            inputStr: 'bothelp req'
        })
        console.log(a.text)
        expect(a.text).to.not.equal('')
    });
});