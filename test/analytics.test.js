/* eslint-disable no-undef */
const parseInput = require('../modules/core-analytics').parseInput;
var expect = require('chai').expect;
describe('測試所有指令輸出有反應', () => {
    it('測試 1D100', async () => {
        expect(await parseInput({
            inputStr: '1d100'
        }).text).to.not.be.a('null');
    });
    it('測試 .ca 1+5*6', async () => {
        expect(await parseInput({
            inputStr: '.ca 1+5*6'
        }).text).to.not.be.a('null');
    });
    it('測試 D66', async () => {
        expect(await parseInput({
            inputStr: 'D66'
        }).text).to.not.be.a('null');
    });
    it('測試 D66s', async () => {
        expect(await parseInput({
            inputStr: 'D66s'
        }).text).to.not.be.a('null');
    });
    it('測試 D66sn', async () => {
        expect(await parseInput({
            inputStr: 'D66sn'
        }).text).to.not.be.a('null');
    });
    it('測試 5b10 D6', async () => {
        expect(await parseInput({
            inputStr: '5b10 D6'
        }).text).to.not.be.a('null');
    });
    it('測試 5U10 3 4', async () => {
        expect(await parseInput({
            inputStr: '5U10 3 4'
        }).text).to.not.be.a('null');
    });
    it('測試 .int 4 8', async () => {
        expect(await parseInput({
            inputStr: '.int 4 8'
        }).text).to.not.be.a('null');
    });
    it('測試 choice 1 2 3', async () => {
        expect(await parseInput({
            inputStr: 'choice 1 2 3'
        }).text).to.not.be.a('null');
    });
    it('測試 隨機 2 34 4', async () => {
        expect(await parseInput({
            inputStr: '隨機 2 34 4'
        }).text).to.not.be.a('null');
    });
    it('測試 每日塔羅', async () => {
        expect(await parseInput({
            inputStr: '每日塔羅'
        }).text).to.not.be.a('null');
    });
    it('測試 運勢', async () => {
        expect(await parseInput({
            inputStr: '運勢'
        }).text).to.not.be.a('null');
    });
    it('測試 立flag', async () => {
        expect(await parseInput({
            inputStr: '立flag'
        }).text).to.not.be.a('null');
    });
    it('測試 .me 立flag', async () => {
        expect(await parseInput({
            inputStr: '.me 立flag'
        }).text).to.not.be.a('null');
    });
    it('測試 cc 80 xxx', async () => {
        expect(await parseInput({
            inputStr: 'cc 80 xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 ccn1 80  xxx', async () => {
        expect(await parseInput({
            inputStr: 'ccn1 80  xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 cc2 80  xxx', async () => {
        expect(await parseInput({
            inputStr: 'cc2 80  xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 ccb 5 xxx', async () => {
        expect(await parseInput({
            inputStr: 'ccb 5 xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 ccrt xxx', async () => {
        expect(await parseInput({
            inputStr: 'ccrt xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 ccsu xxx', async () => {
        expect(await parseInput({
            inputStr: 'ccsu xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 .dp 50 xxx', async () => {
        expect(await parseInput({
            inputStr: '.dp 50 xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 .cc7build 44 xxx', async () => {
        expect(await parseInput({
            inputStr: '.cc7build 44 xxx'
        }).text).to.not.be.a('null');
    });
    it('測試 .cc6build xxxx', async () => {
        expect(await parseInput({
            inputStr: '.cc6build xxxx'
        }).text).to.not.be.a('null');
    });
    it('測試 .cc7bg', async () => {
        expect(await parseInput({
            inputStr: '.cc7bg'
        }).text).to.not.be.a('null');
    });
    it('測試 .al 3AL3*5', async () => {
        expect(await parseInput({
            inputStr: '.al 3AL3*5'
        }).text).to.not.be.a('null');
    });
    it('測試 .dx 5DX+3@4', async () => {
        expect(await parseInput({
            inputStr: '.dx 5DX+3@4'
        }).text).to.not.be.a('null');
    });
    it('測試 .dx ET', async () => {
        expect(await parseInput({
            inputStr: '.dx ET'
        }).text).to.not.be.a('null');
    });
    it('測試 .4df1', async () => {
        expect(await parseInput({
            inputStr: '.4df1'
        }).text).to.not.be.a('null');
    });
    it('測試 .kk et', async () => {
        expect(await parseInput({
            inputStr: '.kk et'
        }).text).to.not.be.a('null');
    });
    it('測試 .mk 5mk+3', async () => {
        expect(await parseInput({
            inputStr: '.mk 5mk+3'
        }).text).to.not.be.a('null');
    });
    it('測試 .nc NM', async () => {
        expect(await parseInput({
            inputStr: '.nc NM'
        }).text).to.not.be.a('null');
    });
    it('測試 .nc 2NC+4', async () => {
        expect(await parseInput({
            inputStr: '.nc 2NC+4'
        }).text).to.not.be.a('null');
    });
    it('測試 .nc 2NA+4', async () => {
        expect(await parseInput({
            inputStr: '.nc 2NA+4'
        }).text).to.not.be.a('null');
    });
    it('測試 .ss SR4+4', async () => {
        expect(await parseInput({
            inputStr: '.ss SR4+4'
        }).text).to.not.be.a('null');
    });
    it('測試 .ss FumbleT', async () => {
        expect(await parseInput({
            inputStr: '.ss FumbleT'
        }).text).to.not.be.a('null');
    });
    it('測試 .sg ST', async () => {
        expect(await parseInput({
            inputStr: '.sg ST'
        }).text).to.not.be.a('null');
    });
    it('測試 .SG FT', async () => {
        expect(await parseInput({
            inputStr: '.SG FT'
        }).text).to.not.be.a('null');
    });
    it('測試 .sw K5', async () => {
        expect(await parseInput({
            inputStr: '.sw K5'
        }).text).to.not.be.a('null');
    });
    it('測試 .uk 5uk', async () => {
        expect(await parseInput({
            inputStr: '.uk 5uk'
        }).text).to.not.be.a('null');
    });
    it('測試 .5wd7', async () => {
        expect(await parseInput({
            inputStr: '.5wd7'
        }).text).to.not.be.a('null');
    });
    it('測試 .kc 5d6', async () => {
        expect(await parseInput({
            inputStr: '.kc 5d6'
        }).text).to.not.be.a('null');
    });
    it('測試 .wiki hk', async () => {
        expect(await parseInput({
            inputStr: '.wiki hk'
        }).text).to.not.be.a('null');
    });
    it('測試 .image LOVE', async () => {
        expect(await parseInput({
            inputStr: '.image LOVE'
        }).text).to.not.be.a('null');
    });
    it('測試 1D10', async () => {
        expect(await parseInput({
            inputStr: '1d100'
        }).text).to.not.be.a('null');
    });
    it('測試 .tran LOVE', async () => {
        expect(await parseInput({
            inputStr: '.tran LOVE'
        }).text).to.not.be.a('null');
    });
    it('測試 .ch show', async () => {
        expect(await parseInput({
            inputStr: '.ch show'
        }).text).to.not.be.a('null');
    });
    it('測試 .ch showall', async () => {
        expect(await parseInput({
            inputStr: '.ch showall'
        }).text).to.not.be.a('null');
    });
    it('測試 .ch HP', async () => {
        expect(await parseInput({
            inputStr: '.ch HP'
        }).text).to.not.be.a('null');
    });
    it('測試 .CH HP +3 筆記', async () => {
        expect(await parseInput({
            inputStr: '.CH HP +3 筆記'
        }).text).to.not.be.a('null');
    });
    it('測試 .ch 空手', async () => {
        expect(await parseInput({
            inputStr: '.ch 空手'
        }).text).to.not.be.a('null');
    });
    it('測試 dr 1d5', async () => {
        expect(await parseInput({
            inputStr: 'dr 1d5'
        }).text).to.not.be.a('null');
    });
    it('測試 ddr 3d3', async () => {
        expect(await parseInput({
            inputStr: 'ddr 3d3'
        }).text).to.not.be.a('null');
    });
    it('測試 1D10', async () => {
        expect(await parseInput({
            inputStr: '1d100'
        }).text).to.not.be.a('null');
    });
    it('測試 .level show', async () => {
        expect(await parseInput({
            inputStr: '.level show'
        }).text).to.not.be.a('null');
    });
    it('測試 .ra show', async () => {
        expect(await parseInput({
            inputStr: '.ra show'
        }).text).to.not.be.a('null');
    });
    it('測試 .rap show', async () => {
        expect(await parseInput({
            inputStr: '.rap show'
        }).text).to.not.be.a('null');
    });
    it('測試 .rap ', async () => {
        expect(await parseInput({
            inputStr: '.rap '
        }).text).to.not.be.a('null');
    });
    it('測試 .cmd show', async () => {
        expect(await parseInput({
            inputStr: '.cmd show'
        }).text).to.not.be.a('null');
    });
    it('測試 .cmd add 2 33333', async () => {
        expect(await parseInput({
            inputStr: '.cmd add 2 33333'
        }).text).to.not.be.a('null');
    });
    it('測試 .bk show', async () => {
        expect(await parseInput({
            inputStr: '.bk show'
        }).text).to.not.be.a('null');
    });
    it('測試 .bk add 9d9999', async () => {
        expect(await parseInput({
            inputStr: '.bk add 9d9999'
        }).text).to.not.be.a('null');
    });
    it('測試 .dbp show', async () => {
        expect(await parseInput({
            inputStr: '.dbp show'
        }).text).to.not.be.a('null');
    });
    it('測試 .db show', async () => {
        expect(await parseInput({
            inputStr: '.db show'
        }).text).to.not.be.a('null');
    });
    it('測試 bothelp', async () => {
        expect(await parseInput({
            inputStr: 'bothelp'
        }).text).to.not.be.a('null');
    });
});