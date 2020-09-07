const parseInput = require('../modules/core-analytics').parseInput;
describe('測試所有指令輸出有反應', () => {
    it('測試 1D10', () => {
        if (parseInput('1D10')) {
            throw new Error("兩數相加結果不為兩數和");
        }
    });
});