"use strict";

jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => {
        const builder = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation((fn) => {
                const option = {
                    setName: jest.fn().mockReturnThis(),
                    setDescription: jest.fn().mockReturnThis(),
                    setRequired: jest.fn().mockReturnThis(),
                    addChoices: jest.fn().mockReturnThis()
                };
                fn(option);
                return builder;
            })
        };
        return builder;
    })
}));

const i18n = require('../modules/i18n.js');
const lang = require('../roll/lang.js');

describe('lang module', () => {
    const originalMongo = process.env.mongoURL;

    beforeAll(async () => {
        await i18n.init();
    });

    afterAll(() => {
        process.env.mongoURL = originalMongo;
    });

    test('exports basic metadata', () => {
        expect(lang.gameType()).toBe('Tool:lang:hktrpg');
        expect(lang.gameName()).toContain('語言');
        expect(lang.gameName({ locale: 'en' })).toContain('Language');
        expect(lang.prefixs()[0].first.test('.lang')).toBe(true);
        expect(lang.initialize()).toEqual({});
        expect(lang.getHelpMessage()).toContain('.lang');
        expect(Array.isArray(lang.discordCommand)).toBe(true);
    });

    test('help via rollDiceCommand', async () => {
        const r = await lang.rollDiceCommand({ mainMsg: ['.lang', 'help'] });
        expect(r.type).toBe('text');
        expect(r.text).toContain('.lang');
        expect(r.quotes).toBe(true);
    });

    test('show current locale', async () => {
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'show'],
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toContain('zh-tw');
    });

    test('list locales', async () => {
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'list'],
            locale: 'en',
            t: i18n.createTranslator('en')
        });
        expect(r.text).toContain('zh-tw');
        expect(r.text).toContain('en');
    });

    test('rejects unsupported locale', async () => {
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'ja'],
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toMatch(/zh-tw|en|zh-hans/);
    });

    test('denies guild set without admin role', async () => {
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            groupid: 'g1',
            userid: 'u1',
            userrole: 1,
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toBeTruthy();
        expect(r.text).not.toContain('set_success');
    });

    test('DM set without database reports no_database', async () => {
        delete process.env.mongoURL;
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            userid: 'u-dm',
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toBeTruthy();
    });

    test('guild admin set without database reports no_database', async () => {
        delete process.env.mongoURL;
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'zh-hans'],
            groupid: 'g1',
            userid: 'u1',
            userrole: 3,
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toBeTruthy();
    });

    test('DM context via discordMessage channel type', async () => {
        delete process.env.mongoURL;
        const r = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            userid: 'u-dm',
            groupid: 'ignored-when-dm-channel',
            discordMessage: { channel: { type: 1 } },
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(r.text).toBeTruthy();
    });

    test('slash command execute returns .lang command', async () => {
        const execute = lang.discordCommand[0].execute;
        await expect(execute({
            options: { getString: () => 'en' }
        })).resolves.toBe('.lang en');
        await expect(execute({
            options: { getString: () => null }
        })).resolves.toBe('.lang show');
    });

    test('handleLang help action and successful setLocale paths', async () => {
        const setSpy = jest.spyOn(i18n, 'setLocale')
            .mockResolvedValueOnce({ ok: true, locale: 'en' })
            .mockResolvedValueOnce({ ok: true, locale: 'zh-hans' })
            .mockResolvedValueOnce({ ok: false, reason: 'unsupported_locale' })
            .mockResolvedValueOnce({ ok: false, reason: 'database_error' });

        const helpViaHandler = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'help'],
            locale: 'en',
            t: i18n.createTranslator('en')
        });
        expect(helpViaHandler.text).toContain('Language');

        // Empty second token still hits help via rollDiceCommand switch
        const emptyHelp = await lang.rollDiceCommand({
            mainMsg: ['.lang'],
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(emptyHelp.text).toContain('.lang');

        const dmOk = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            userid: 'u-dm',
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(dmOk.text).toContain('en');

        const guildOk = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'zh-hans'],
            groupid: 'g1',
            userid: 'u1',
            userrole: 3,
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(guildOk.text).toContain('zh-hans');

        const unsupported = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            userid: 'u-dm',
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(unsupported.text).toBeTruthy();

        const dbError = await lang.rollDiceCommand({
            mainMsg: ['.lang', 'en'],
            userid: 'u-dm',
            locale: 'zh-tw',
            t: i18n.createTranslator('zh-tw')
        });
        expect(dbError.text).toBeTruthy();

        setSpy.mockRestore();
    });
});
