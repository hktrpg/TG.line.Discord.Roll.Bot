/* eslint-disable no-undef */
const parseInput = require('../modules/core-analytics').parseInput;
var expect = require('chai').expect;

describe('測試所有指令輸出有反應', async () => {
    it('1D100', async () => {
        let a = await parseInput({
            inputStr: '1d100'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ca 1+5*6', async () => {
        let a = await parseInput({
            inputStr: '.ca 1+5*6'
        })
        expect(a.text).to.not.equal('')
    });
    it('D66', async () => {
        let a = await parseInput({
            inputStr: 'D66'
        })
        expect(a.text).to.not.equal('')
    });
    it('D66s', async () => {
        let a = await parseInput({
            inputStr: 'D66s'
        })
        expect(a.text).to.not.equal('')
    });
    it('D66n', async () => {
        let a = await parseInput({
            inputStr: 'D66n'
        })
        expect(a.text).to.not.equal('')
    });
    it('5b10 D6', async () => {
        let a = await parseInput({
            inputStr: '5b10 D6'
        })
        expect(a.text).to.not.equal('')
    });
    it('5U10 3 4', async () => {
        let a = await parseInput({
            inputStr: '5U10 3 4'
        })
        expect(a.text).to.not.equal('')
    });
    it('.int 4 8', async () => {
        let a = await parseInput({
            inputStr: '.int 4 8'
        })
        expect(a.text).to.not.equal('')
    });
    it('choice 1 2 3', async () => {
        let a = await parseInput({
            inputStr: 'choice 1 2 3'
        })
        expect(a.text).to.not.equal('')
    });
    it('隨機 2 34 4', async () => {
        let a = await parseInput({
            inputStr: '隨機 2 34 4'
        })
        expect(a.text).to.not.equal('')
    });
    it('每日塔羅', async () => {
        let a = await parseInput({
            inputStr: '每日塔羅'
        })
        expect(a.text).to.not.equal('')
    });
    it('運勢', async () => {
        let a = await parseInput({
            inputStr: '運勢'
        })
        expect(a.text).to.not.equal('')
    });
    it('立flag', async () => {
        let a = await parseInput({
            inputStr: '立flag'
        })
        expect(a.text).to.not.equal('')
    });
    it('.me 立flag', async () => {
        let a = await parseInput({
            inputStr: '.me 立flag'
        })
        expect(a.text).to.not.equal('')
    });
    it('cc 80 xxx', async () => {
        let a = await parseInput({
            inputStr: 'cc 80 xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('ccn1 80  xxx', async () => {
        let a = await parseInput({
            inputStr: 'ccn1 80  xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('cc2 80  xxx', async () => {
        let a = await parseInput({
            inputStr: 'cc2 80  xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('ccb 5 xxx', async () => {
        let a = await parseInput({
            inputStr: 'ccb 5 xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('ccrt xxx', async () => {
        let a = await parseInput({
            inputStr: 'ccrt xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('ccsu xxx', async () => {
        let a = await parseInput({
            inputStr: 'ccsu xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('.dp 50 xxx', async () => {
        let a = await parseInput({
            inputStr: '.dp 50 xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('.cc7build 44 xxx', async () => {
        let a = await parseInput({
            inputStr: '.cc7build 44 xxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('.cc6build xxxx', async () => {
        let a = await parseInput({
            inputStr: '.cc6build xxxx'
        })
        expect(a.text).to.not.equal('')
    });
    it('.cc7bg', async () => {
        let a = await parseInput({
            inputStr: '.cc7bg'
        })
        expect(a.text).to.not.equal('')
    });
    it('.al 3AL3*5', async () => {
        let a = await parseInput({
            inputStr: '.al 3AL3*5'
        })
        expect(a.text).to.not.equal('')
    });
    it('.dx 5DX+3@4', async () => {
        let a = await parseInput({
            inputStr: '.dx 5DX+3@4'
        })
        expect(a.text).to.not.equal('')
    });
    it('.dx ET', async () => {
        let a = await parseInput({
            inputStr: '.dx ET'
        })
        expect(a.text).to.not.equal('')
    });
    it('.4df1', async () => {
        let a = await parseInput({
            inputStr: '.4df1'
        })
        expect(a.text).to.not.equal('')
    });
    it('.kk et', async () => {
        let a = await parseInput({
            inputStr: '.kk et'
        })
        expect(a.text).to.not.equal('')
    });
    it('.mk 5mk+3', async () => {
        let a = await parseInput({
            inputStr: '.mk 5mk+3'
        })
        expect(a.text).to.not.equal('')
    });
    it('.nc NM', async () => {
        let a = await parseInput({
            inputStr: '.nc NM'
        })
        expect(a.text).to.not.equal('')
    });
    it('.nc 2NC+4', async () => {
        let a = await parseInput({
            inputStr: '.nc 2NC+4'
        })
        expect(a.text).to.not.equal('')
    });
    it('.nc 2NA+4', async () => {
        let a = await parseInput({
            inputStr: '.nc 2NA+4'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ss SR4+4', async () => {
        let a = await parseInput({
            inputStr: '.ss SR4+4'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ss FumbleT', async () => {
        let a = await parseInput({
            inputStr: '.ss FumbleT'
        })
        expect(a.text).to.not.equal('')
    });
    it('.sg ST', async () => {
        let a = await parseInput({
            inputStr: '.sg ST'
        })
        expect(a.text).to.not.equal('')
    });
    it('.SG FT', async () => {
        let a = await parseInput({
            inputStr: '.SG FT'
        })
        expect(a.text).to.not.equal('')
    });
    it('.sw K5', async () => {
        let a = await parseInput({
            inputStr: '.sw K5'
        })
        expect(a.text).to.not.equal('')
    });
    it('.uk 5uk', async () => {
        let a = await parseInput({
            inputStr: '.uk 5uk'
        })
        expect(a.text).to.not.equal('')
    });
    it('.5wd7', async () => {
        let a = await parseInput({
            inputStr: '.5wd7'
        })
        expect(a.text).to.not.equal('')
    });
    it('.kc 5d6', async () => {
        let a = await parseInput({
            inputStr: '.kc 5d6'
        })
        expect(a.text).to.not.equal('')
    });
    it('.wiki hk', async () => {
        let a = await parseInput({
            inputStr: '.wiki hk'
        })
        expect(a.text).to.not.equal('')
    });
    it('.image LOVE', async () => {
        let a = await parseInput({
            inputStr: '.image LOVE'
        })
        expect(a.text).to.not.equal('')
    });
    it('1D10', async () => {
        let a = await parseInput({
            inputStr: '1d100'
        })
        expect(a.text).to.not.equal('')
    });
    it('.tran LOVE', async () => {
        let a = await parseInput({
            inputStr: '.tran LOVE'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ch show', async () => {
        let a = await parseInput({
            inputStr: '.ch show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ch showall', async () => {
        let a = await parseInput({
            inputStr: '.ch showall'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ch HP', async () => {
        let a = await parseInput({
            inputStr: '.ch HP'
        })
        expect(a.text).to.not.equal('')
    });
    it('.CH HP +3 筆記', async () => {
        let a = await parseInput({
            inputStr: '.CH HP +3 筆記'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ch 空手', async () => {
        let a = await parseInput({
            inputStr: '.ch 空手'
        })
        expect(a.text).to.not.equal('')
    });
    it('.level show', async () => {
        let a = await parseInput({
            inputStr: '.level show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.ra show', async () => {
        let a = await parseInput({
            inputStr: '.ra show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.rap show', async () => {
        let a = await parseInput({
            inputStr: '.rap show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.rap ', async () => {
        let a = await parseInput({
            inputStr: '.rap '
        })
        expect(a.text).to.not.equal('')
    });
    it('.cmd show', async () => {
        let a = await parseInput({
            inputStr: '.cmd show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.cmd add 2 33333', async () => {
        let a = await parseInput({
            inputStr: '.cmd add 2 33333'
        })
        expect(a.text).to.not.equal('')
    });
    it('.bk show', async () => {
        let a = await parseInput({
            inputStr: '.bk show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.bk add 9d9999', async () => {
        let a = await parseInput({
            inputStr: '.bk add 9d9999',
            groupid: 'test',
            userid: 'test'
        })
        expect(a.text).to.not.equal('')
    });
    it('.dbp show', async () => {
        let a = await parseInput({
            inputStr: '.dbp show'
        })
        expect(a.text).to.not.equal('')
    });
    it('.db show', async () => {
        let a = await parseInput({
            inputStr: '.db show'
        })
        expect(a.text).to.not.equal('')
    });
    it('bothelp', async () => {
        let a = await parseInput({
            inputStr: 'bothelp'
        })
        expect(a.text).to.not.equal('')
    });
    it('bothelp', async () => {
        let a = await parseInput({
            inputStr: 'bothelp admin'
        })
        expect(a.text).to.not.equal('')
    });
    it('bothelp', async () => {
        let a = await parseInput({
            inputStr: 'bothelp link'
        })
        expect(a.text).to.not.equal('')
    });
    it('bothelp', async () => {
        let a = await parseInput({
            inputStr: 'bothelp req'
        })
        expect(a.text).to.not.equal('')
    });
});