"use strict";

const advroll = require('../roll/0-advroll');

test('Test getHelpMessage returns correct help text', () => {
    const helpText = advroll.getHelpMessage();
    expect(helpText).toContain('【🎲進階擲骰指南】');
    expect(helpText).toContain('數學計算');
    expect(helpText).toContain('特殊擲骰');
    expect(helpText).toContain('進階擲骰');
    expect(helpText).toContain('快速範圍');
});

test('Test gameName returns correct name', () => {
    expect(advroll.gameName()).toBe('【進階擲骰】 .ca (計算)|D66(sn)|5B10 Dx|5U10 x y|.int x y');
});

test('Test gameType returns correct type', () => {
    expect(advroll.gameType()).toBe('Dice:advRoll');
});

test('Test prefixs returns correct patterns', () => {
    const patterns = advroll.prefixs();
    expect(patterns).toHaveLength(5);
    expect(patterns[0].first.toString()).toContain('^[.][c][a]$');
    expect(patterns[1].first.toString()).toContain('^d66s$|^d66$|^d66n$');
    expect(patterns[2].first.toString()).toMatch(/\^\(\\d\+\)\(u\)\(\\d\+\)\$/);
    expect(patterns[3].first.toString()).toMatch(/\^\(\(\\d\+\)\(b\)\(\\d\+\)\)\(S\?\)/);
    expect(patterns[4].first.toString()).toContain('^[.][i][n][t]$');
});

test('Test rollDiceCommand with .ca help', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: '.ca help',
        mainMsg: ['.ca', 'help'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBe(advroll.getHelpMessage());
    expect(result.quotes).toBe(true);
});

test('Test rollDiceCommand with D66', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: 'D66 test',
        mainMsg: ['D66', 'test'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toContain('D66：test');
    expect(result.text).toMatch(/\d{2}/); // Should contain 2 digits
});

test('Test rollDiceCommand with D66s', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: 'D66s test',
        mainMsg: ['D66s', 'test'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toContain('D66s：test');
    expect(result.text).toMatch(/\d{2}/); // Should contain 2 digits
});

test('Test rollDiceCommand with D66n', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: 'D66n test',
        mainMsg: ['D66n', 'test'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toContain('D66n：test');
    expect(result.text).toMatch(/\d{2}/); // Should contain 2 digits
});

test('Test rollDiceCommand with 5B10', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: '5B10',
        mainMsg: ['5B10'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toContain('(5B10)');
    expect(result.text).toMatch(/→\s*\d+(,\s*\d+){4}/);
});

test('Test rollDiceCommand with 5U10', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: '5U10 8',
        mainMsg: ['5U10', '8'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\(5U10.*\[8\]\)/);
    expect(result.text).toMatch(/\d+(,\s*\d+)*/); // Should contain numbers
});

test('Test rollDiceCommand with .int', async () => {
    const result = await advroll.rollDiceCommand({
        inputStr: '.int 20 50',
        mainMsg: ['.int', '20', '50'],
        botname: 'test'
    });
    expect(result.type).toBe('text');
    expect(result.text).toContain('投擲 20 - 50');
    expect(result.text).toMatch(/\d+/); // Should contain a number
});

test('Test discordCommand ca', async () => {
    const command = advroll.discordCommand[0];
    expect(command.data.name).toBe('ca');
    expect(command.data.description).toBe('【數學計算】 (不支援擲骰) ');
    
    const result = await command.execute({
        options: {
            getString: jest.fn().mockReturnValue('1 + 1')
        }
    });
    expect(result).toBe('.ca 1 + 1');
});

test('Test discordCommand int', async () => {
    const command = advroll.discordCommand[1];
    expect(command.data.name).toBe('int');
    expect(command.data.description).toBe('int 20 50: 立即骰出20-50');
    
    const result = await command.execute({
        options: {
            getString: jest.fn()
                .mockReturnValueOnce('20')
                .mockReturnValueOnce('50')
        }
    });
    expect(result).toBe('.int 20 50');
}); 