"use strict";

const overlays = require('../modules/i18n-overlays.js');

describe('i18n-overlays helpers', () => {
    test('listOverlayFiles returns sorted json files for known locale', () => {
        const files = overlays.listOverlayFiles('zh-tw');
        expect(files.length).toBeGreaterThan(0);
        expect(files.every((f) => f.endsWith('.json'))).toBe(true);
        expect([...files].sort()).toEqual(files);
    });

    test('listOverlayFiles returns empty array for missing locale dir', () => {
        expect(overlays.listOverlayFiles('no-such-locale-xyz')).toEqual([]);
    });

    test('parseOverlayNamespace extracts namespace or null', () => {
        expect(overlays.parseOverlayNamespace('funny.joke.json')).toEqual({ namespace: 'funny' });
        expect(overlays.parseOverlayNamespace('coc.mania.json')).toEqual({ namespace: 'coc' });
        expect(overlays.parseOverlayNamespace('badjson.txt')).toBeNull();
        expect(overlays.parseOverlayNamespace('nodotjson')).toBeNull();
    });

    test('readOverlayFile and loadLocaleBundle merge overlays', () => {
        const files = overlays.listOverlayFiles('en');
        const jokeFile = files.find((f) => f.includes('joke'));
        expect(jokeFile).toBeTruthy();
        const content = overlays.readOverlayFile('en', jokeFile);
        expect(typeof content).toBe('object');

        const bundle = overlays.loadLocaleBundle('en', { funny: { keep_me: true } });
        expect(bundle.funny.keep_me).toBe(true);
        expect(Object.keys(bundle.funny).length).toBeGreaterThan(1);
    });

    test('split funny/coc bulk keys and file name helpers', () => {
        expect(overlays.isFunnyBulkKey('joke_0')).toBe(true);
        expect(overlays.isFunnyBulkKey('help')).toBe(false);
        expect(overlays.isCocBulkKey('mania_1')).toBe(true);
        expect(overlays.isCocBulkKey('help')).toBe(false);

        const funny = overlays.splitFunnyBulkKeys({
            joke_0: 'a',
            joke_1: 'b',
            help: 'keep'
        });
        expect(funny.keep).toEqual({ help: 'keep' });
        expect(funny.bundles.joke).toEqual({ joke_0: 'a', joke_1: 'b' });

        const coc = overlays.splitCocBulkKeys({
            mania_0: 'm',
            help: 'keep'
        });
        expect(coc.keep).toEqual({ help: 'keep' });
        expect(coc.bundles.mania).toEqual({ mania_0: 'm' });

        expect(overlays.funnyBundleFileName('joke')).toBe('funny.joke.json');
        expect(overlays.cocBundleFileName('mania')).toBe('coc.mania.json');
        expect(overlays.splitFunnyBulkKeys()).toEqual({ bundles: {}, keep: {} });
        expect(overlays.splitCocBulkKeys()).toEqual({ bundles: {}, keep: {} });
    });
});
