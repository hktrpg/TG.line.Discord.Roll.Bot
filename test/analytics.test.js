/* eslint-disable no-undef */
const parseInput = require('../modules/core-analytics').parseInput;
var expect = require('chai').expect;
describe('測試所有指令輸出有反應', () => {
    it('測試 1D100', async () => {
        expect(await parseInput('1d100').text).to.not.be.a('null');
    });
    it('測試 .ca 1+5*6', async () => {
        expect(await parseInput('.ca 1+5*6').text).to.not.be.a('null');
    });
    it('測試 D66', async () => {
        expect(await parseInput('D66').text).to.not.be.a('null');
    });
    it('測試 D66s', async () => {
        expect(await parseInput('D66s').text).to.not.be.a('null');
    });
    it('測試 D66sn', async () => {
        expect(await parseInput('D66sn').text).to.not.be.a('null');
    });
    it('測試 5b10 D6', async () => {
        expect(await parseInput('5b10 D6').text).to.not.be.a('null');
    });
    it('測試 5U10 3 4', async () => {
        expect(await parseInput('5U10 3 4').text).to.not.be.a('null');
    });
    it('測試 .int 4 8', async () => {
        expect(await parseInput('.int 4 8').text).to.not.be.a('null');
    });
    it('測試 choice 1 2 3', async () => {
        expect(await parseInput('choice 1 2 3').text).to.not.be.a('null');
    });
    it('測試 隨機 2 34 4', async () => {
        expect(await parseInput('隨機 2 34 4').text).to.not.be.a('null');
    });
    it('測試 每日塔羅', async () => {
        expect(await parseInput('每日塔羅').text).to.not.be.a('null');
    });
    it('測試 運勢', async () => {
        expect(await parseInput('運勢').text).to.not.be.a('null');
    });
    it('測試 立flag', async () => {
        expect(await parseInput('立flag').text).to.not.be.a('null');
    });
    it('測試 .me 立flag', async () => {
        expect(await parseInput('.me 立flag').text).to.not.be.a('null');
    });
    it('測試 cc 80 xxx', async () => {
        expect(await parseInput('cc 80 xxx').text).to.not.be.a('null');
    });
    it('測試 ccn1 80  xxx', async () => {
        expect(await parseInput('ccn1 80  xxx').text).to.not.be.a('null');
    });
    it('測試 cc2 80  xxx', async () => {
        expect(await parseInput('cc2 80  xxx').text).to.not.be.a('null');
    });
    it('測試 ccb 5 xxx', async () => {
        expect(await parseInput('ccb 5 xxx').text).to.not.be.a('null');
    });
    it('測試 ccrt xxx', async () => {
        expect(await parseInput('ccrt xxx').text).to.not.be.a('null');
    });
    it('測試 ccsu xxx', async () => {
        expect(await parseInput('ccsu xxx').text).to.not.be.a('null');
    });
    it('測試 .dp 50 xxx', async () => {
        expect(await parseInput('.dp 50 xxx').text).to.not.be.a('null');
    });
    it('測試 .cc7build 44 xxx', async () => {
        expect(await parseInput('.cc7build 44 xxx').text).to.not.be.a('null');
    });
    it('測試 .cc6build xxxx', async () => {
        expect(await parseInput('.cc6build xxxx').text).to.not.be.a('null');
    });
    it('測試 .cc7bg', async () => {
        expect(await parseInput('.cc7bg').text).to.not.be.a('null');
    });
    it('測試 .al 3AL3*5', async () => {
        expect(await parseInput('.al 3AL3*5').text).to.not.be.a('null');
    });
    it('測試 .dx 5DX+3@4', async () => {
        expect(await parseInput('.dx 5DX+3@4').text).to.not.be.a('null');
    });
    it('測試 .dx ET', async () => {
        expect(await parseInput('.dx ET').text).to.not.be.a('null');
    });
    it('測試 .4df1', async () => {
        expect(await parseInput('.4df1').text).to.not.be.a('null');
    });
    it('測試 .kk et', async () => {
        expect(await parseInput('.kk et').text).to.not.be.a('null');
    });
    it('測試 .mk 5mk+3', async () => {
        expect(await parseInput('.mk 5mk+3').text).to.not.be.a('null');
    });
    it('測試 .nc NM', async () => {
        expect(await parseInput('.nc NM').text).to.not.be.a('null');
    });
    it('測試 .nc 2NC+4', async () => {
        expect(await parseInput('.nc 2NC+4').text).to.not.be.a('null');
    });
    it('測試 .nc 2NA+4', async () => {
        expect(await parseInput('.nc 2NA+4').text).to.not.be.a('null');
    });
    it('測試 .ss SR4+4', async () => {
        expect(await parseInput('.ss SR4+4').text).to.not.be.a('null');
    });
    it('測試 .ss FumbleT', async () => {
        expect(await parseInput('.ss FumbleT').text).to.not.be.a('null');
    });
    it('測試 .sg ST', async () => {
        expect(await parseInput('.sg ST').text).to.not.be.a('null');
    });
    it('測試 .SG FT', async () => {
        expect(await parseInput('.SG FT').text).to.not.be.a('null');
    });
    it('測試 .sw K5', async () => {
        expect(await parseInput('.sw K5').text).to.not.be.a('null');
    });
    it('測試 .uk 5uk', async () => {
        expect(await parseInput('.uk 5uk').text).to.not.be.a('null');
    });
    it('測試 .5wd7', async () => {
        expect(await parseInput('.5wd7').text).to.not.be.a('null');
    });
    it('測試 .kc 5d6', async () => {
        expect(await parseInput('.kc 5d6').text).to.not.be.a('null');
    });
    it('測試 .wiki hk', async () => {
        expect(await parseInput('.wiki hk').text).to.not.be.a('null');
    });
    it('測試 .image LOVE', async () => {
        expect(await parseInput('.image LOVE').text).to.not.be.a('null');
    });
    it('測試 1D10', async () => {
        expect(await parseInput('1d100').text).to.not.be.a('null');
    });
    it('測試 .tran LOVE', async () => {
        expect(await parseInput('.tran LOVE').text).to.not.be.a('null');
    });
    it('測試 .ch show', async () => {
        expect(await parseInput('.ch show').text).to.not.be.a('null');
    });
    it('測試 .ch showall', async () => {
        expect(await parseInput('.ch showall').text).to.not.be.a('null');
    });
    it('測試 .ch HP', async () => {
        expect(await parseInput('.ch HP').text).to.not.be.a('null');
    });
    it('測試 .CH HP +3 筆記', async () => {
        expect(await parseInput('.CH HP +3 筆記').text).to.not.be.a('null');
    });
    it('測試 .ch 空手', async () => {
        expect(await parseInput('.ch 空手').text).to.not.be.a('null');
    });
    it('測試 dr 1d5', async () => {
        expect(await parseInput('dr 1d5').text).to.not.be.a('null');
    });
    it('測試 ddr 3d3', async () => {
        expect(await parseInput('ddr 3d3').text).to.not.be.a('null');
    });
    it('測試 1D10', async () => {
        expect(await parseInput('1d100').text).to.not.be.a('null');
    });
    it('測試 .level show', async () => {
        expect(await parseInput('.level show').text).to.not.be.a('null');
    });
    it('測試 .ra show', async () => {
        expect(await parseInput('.ra show').text).to.not.be.a('null');
    });
    it('測試 .rap show', async () => {
        expect(await parseInput('.rap show').text).to.not.be.a('null');
    });
    it('測試 .rap ', async () => {
        expect(await parseInput('.rap ').text).to.not.be.a('null');
    });
    it('測試 .cmd show', async () => {
        expect(await parseInput('.cmd show').text).to.not.be.a('null');
    });
    it('測試 .cmd add 2 33333', async () => {
        expect(await parseInput('.cmd add 2 33333').text).to.not.be.a('null');
    });
    it('測試 .bk show', async () => {
        expect(await parseInput('.bk show').text).to.not.be.a('null');
    });
    it('測試 .bk add 9d9999', async () => {
        expect(await parseInput('.bk add 9d9999').text).to.not.be.a('null');
    });
    it('測試 .dbp show', async () => {
        expect(await parseInput('.dbp show').text).to.not.be.a('null');
    });
    it('測試 .db show', async () => {
        expect(await parseInput('.db show').text).to.not.be.a('null');
    });
    it('測試 bothelp', async () => {
        expect(await parseInput('bothelp').text).to.not.be.a('null');
    });
});