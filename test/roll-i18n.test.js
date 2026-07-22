"use strict";

const i18n = require('../modules/i18n.js');
const rollI18n = require('../modules/roll-i18n.js');

describe('roll-i18n helpers', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    test('getT uses provided translator or creates one for locale', () => {
        const custom = jest.fn(() => 'custom');
        expect(rollI18n.getT({ t: custom })('any.key')).toBe('custom');
        expect(custom).toHaveBeenCalledWith('any.key');

        const t = rollI18n.getT({ locale: 'en' });
        expect(t('lang.game_name')).toContain('Language');
    });

    test('getInteractionT prefers interaction translator then locale then default', () => {
        const defaultT = rollI18n.getInteractionT(null);
        expect(defaultT('lang.game_name')).toContain('語言');

        const fromLocale = rollI18n.getInteractionT({ _hktrpgLocale: 'en' });
        expect(fromLocale('lang.game_name')).toContain('Language');

        const custom = jest.fn(() => 'from-interaction');
        expect(rollI18n.getInteractionT({ _hktrpgT: custom })('x')).toBe('from-interaction');
    });

    test('getLocale / isDefaultLocale / isEnglish', () => {
        expect(rollI18n.getLocale()).toBe(i18n.DEFAULT_LOCALE);
        expect(rollI18n.getLocale({ locale: 'en' })).toBe('en');
        expect(rollI18n.isDefaultLocale({})).toBe(true);
        expect(rollI18n.isDefaultLocale({ locale: 'en' })).toBe(false);
        expect(rollI18n.isEnglish({ locale: 'en' })).toBe(true);
        expect(rollI18n.isEnglish({ locale: 'zh-tw' })).toBe(false);
    });

    test('resolveHelp uses locale translation, legacy fallbacks, then default', () => {
        const enHelp = rollI18n.resolveHelp({ locale: 'en' }, 'lang.help');
        expect(enHelp).toContain('Language');

        expect(rollI18n.resolveHelp({ locale: 'en' }, 'missing.key.zzz', 'legacy-string')).toBe('legacy-string');
        expect(rollI18n.resolveHelp({ locale: 'en' }, 'missing.key.zzz', () => 'legacy-fn')).toBe('legacy-fn');

        const withOptions = rollI18n.resolveHelp({ locale: 'zh-tw' }, 'lang.current', { locale: 'zh-tw' });
        expect(withOptions).toContain('zh-tw');

        const defaultHelp = rollI18n.resolveHelp({}, 'lang.help');
        expect(defaultHelp).toContain('語言');
    });

    test('withPartialTranslationNotice adds banner only for non-default locales', () => {
        expect(rollI18n.withPartialTranslationNotice('body', { locale: 'zh-tw' })).toBe('body');
        const noticed = rollI18n.withPartialTranslationNotice('body', { locale: 'en' });
        expect(noticed).toContain('body');
        expect(noticed.split('\n').length).toBeGreaterThan(1);
    });

    test('resolveGameName returns translation or fallback', () => {
        expect(rollI18n.resolveGameName({ locale: 'en' }, 'lang.game_name', 'fallback')).toContain('Language');
        expect(rollI18n.resolveGameName({ locale: 'en' }, 'missing.game.name', 'fallback')).toBe('fallback');
    });
});
