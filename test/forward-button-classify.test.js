'use strict';

const i18n = require('../modules/i18n/i18n.js');
const {
	classifyForwardButtonContent,
	extractForwardButtonName,
	matchForwardButtonContent,
	resetMatchersCache,
	buildMatchers,
} = require('../modules/roll-worker/forward-button-content.js');

describe('forward button content from i18n templates', () => {
	const translate = (key) => (key === 'forward.request_roll_button' ? 'Request roll button' : key);

	beforeAll(async () => {
		await i18n.init();
		resetMatchersCache();
	});

	test('builds matchers from every supported locale', () => {
		const matchers = buildMatchers();
		expect(matchers.length).toBeGreaterThanOrEqual(3);
		expect(matchers.some((m) => m.kind === 'card' && m.suffix.includes('角色卡'))).toBe(true);
		expect(matchers.some((m) => m.kind === 'char' && m.suffix.includes('的角色'))).toBe(true);
		expect(matchers.some((m) => m.kind === 'card' && /character card/i.test(m.suffix))).toBe(true);
		expect(matchers.some((m) => m.kind === 'char' && /'s character$/i.test(m.suffix))).toBe(true);
		expect(matchers.some((m) => m.kind === 'request')).toBe(true);
	});

	test('accepts zh-tw character / card / request', () => {
		expect(classifyForwardButtonContent('Sad的角色')).toBe('char');
		expect(classifyForwardButtonContent('Sad的角色卡')).toBe('card');
		expect(classifyForwardButtonContent('zzz要求擲骰/點擊')).toBe('request');
	});

	test('accepts zh-hans request label', () => {
		expect(classifyForwardButtonContent('zzz要求掷骰/点击')).toBe('request');
	});

	test('accepts English character / card / request', () => {
		expect(classifyForwardButtonContent("Sad's character")).toBe('char');
		expect(classifyForwardButtonContent("Sad's character card")).toBe('card');
		expect(classifyForwardButtonContent('zzz — roll / click request')).toBe('request');
	});

	test('card wins over char when both could match', () => {
		expect(matchForwardButtonContent("Sad's character card")?.kind).toBe('card');
		expect(matchForwardButtonContent('Sad的角色卡')?.kind).toBe('card');
	});

	test('rejects unrelated content', () => {
		expect(classifyForwardButtonContent('hello world')).toBeNull();
		expect(classifyForwardButtonContent('')).toBeNull();
	});

	test('extracts names from i18n-derived suffixes', () => {
		expect(extractForwardButtonName("Sad's character", 'char', translate)).toBe('Sad');
		expect(extractForwardButtonName("Sad's character card", 'card', translate)).toBe('Sad');
		expect(extractForwardButtonName('zzz — roll / click request', 'request', translate))
			.toBe('Request roll button');
	});
});
