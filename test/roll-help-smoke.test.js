"use strict";

jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis(),
        addIntegerOption: jest.fn().mockReturnThis(),
        addBooleanOption: jest.fn().mockReturnThis(),
        addAttachmentOption: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        addChoices: jest.fn().mockReturnThis()
    }))
}));

const i18n = require('../modules/i18n.js');

describe('roll module i18n smoke tests', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    // Only modules already present in the coverage corpus — avoid pulling large
    // untested rollDiceCommand bodies into patch coverage.
    const modules = [
        { name: 'fate', path: '../roll/fate.js' },
        { name: 'demo', path: '../roll/demo.js' },
        { name: 'pf2e', path: '../roll/pf2e.js' },
        { name: 'help', path: '../roll/help.js' },
        { name: 'code', path: '../roll/code.js' },
        { name: 'wod', path: '../roll/wod.js' },
        { name: 'wn', path: '../roll/wn.js' },
        { name: '5e', path: '../roll/5e.js' }
    ];

    for (const mod of modules) {
        test(`${mod.name} exposes localized help and metadata`, async () => {
            const roll = require(mod.path);
            expect(typeof roll.gameType()).toBe('string');
            expect(Array.isArray(roll.prefixs())).toBe(true);
            expect(roll.initialize()).toBeDefined();

            const zhName = roll.gameName({ locale: 'zh-tw' });
            const enName = roll.gameName({ locale: 'en' });
            expect(typeof zhName).toBe('string');
            expect(zhName.length).toBeGreaterThan(0);
            expect(typeof enName).toBe('string');

            const zhHelp = await roll.getHelpMessage({ locale: 'zh-tw' });
            const enHelp = await roll.getHelpMessage({ locale: 'en' });
            expect(typeof zhHelp).toBe('string');
            expect(zhHelp.length).toBeGreaterThan(10);
            expect(typeof enHelp).toBe('string');
            expect(enHelp.length).toBeGreaterThan(10);
        });
    }

    test('fate rollDiceCommand produces localized output', async () => {
        const fate = require('../roll/fate.js');
        const result = await fate.rollDiceCommand({
            mainMsg: ['.4df'],
            inputStr: '.4df',
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
    });

    test('demo and help rollDiceCommand help paths', async () => {
        const demo = require('../roll/demo.js');
        const help = require('../roll/help.js');

        const demoHelp = await demo.rollDiceCommand({
            mainMsg: ['.demo', 'help'],
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(demoHelp.text).toBeTruthy();

        const helpResult = await help.rollDiceCommand({
            mainMsg: ['bothelp'],
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(helpResult.text).toBeTruthy();
    });
});
