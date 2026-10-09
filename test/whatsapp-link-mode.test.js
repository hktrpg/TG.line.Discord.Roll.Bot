'use strict';

const {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
	formatPairingFailure,
	collectPairingCode,
	installPairingRequestGuard,
} = require('../utils/whatsapp-link-mode.js');

describe('WhatsApp link mode', () => {
	const baseOptions = { puppeteer: { headless: true } };

	it('uses pairing code when WHATSAPP_PAIR_PHONE has digits', () => {
		const env = { WHATSAPP_PAIR_PHONE: '85291234567' };
		expect(resolvePairPhone(env)).toBe('85291234567');

		const options = applyPairingLink(baseOptions, env);
		expect(options.pairWithPhoneNumber).toEqual({
			phoneNumber: '85291234567',
			showNotification: true,
		});
		expect(options.puppeteer).toBe(baseOptions.puppeteer);
	});

	it('strips plus signs and separators before enabling pairing', () => {
		const options = applyPairingLink(baseOptions, { WHATSAPP_PAIR_PHONE: '+852 9123-4567' });
		expect(options.pairWithPhoneNumber.phoneNumber).toBe('85291234567');
	});

	it('stays on QR when the phone number is missing or too short', () => {
		expect(resolvePairPhone({})).toBe('');
		expect(resolvePairPhone({ WHATSAPP_PAIR_PHONE: '++ --' })).toBe('');
		expect(resolvePairPhone({ WHATSAPP_PAIR_PHONE: '852' })).toBe('');
		expect(resolvePairPhone({ WHATSAPP_PAIR_PHONE: '1234567890123456' })).toBe('');

		const unset = applyPairingLink(baseOptions, {});
		const blank = applyPairingLink(baseOptions, { WHATSAPP_PAIR_PHONE: '' });
		const shortNumber = applyPairingLink(baseOptions, { WHATSAPP_PAIR_PHONE: '852' });
		expect(unset.pairWithPhoneNumber).toBeUndefined();
		expect(blank.pairWithPhoneNumber).toBeUndefined();
		expect(shortNumber.pairWithPhoneNumber).toBeUndefined();
	});

	it('formats the pairing code the monitor script greps', () => {
		expect(formatPairingCode('abcdefgh')).toBe('ABCD-EFGH');
		expect(formatPairingCode('abcd-efgh')).toBe('ABCD-EFGH');
		expect(formatPairingCode('')).toBe('');
		expect(formatPairingCode(null)).toBe('');
		expect(formatPairingCode('abc')).toBe('');
		expect(pairingCodeLogLine('abcdefgh')).toBe('[Whatsapp] PAIRING CODE ABCD-EFGH');
		expect(pairingCodeLogLine('')).toBe('');
		expect(pairingCodeLogLine('abc')).toBe('');
	});

	it('names a rate-limit refusal without the phone number', () => {
		const detail = {
			name: 't',
			type: { name: 'IQErrorRateOverlimit', value: { text: 'rate-overlimit', code: 429 } },
		};
		const line = formatPairingFailure(detail);
		expect(line).toContain('rate-overlimit');
		expect(line).not.toContain('852');
	});

	it('returns a pairing code from the page flow', async () => {
		const seen = [];
		const previous = {
			AuthStore: globalThis.AuthStore,
			onCodeReceivedEvent: globalThis.onCodeReceivedEvent,
			require: globalThis.require,
			codeInterval: globalThis.codeInterval,
		};
		globalThis.AuthStore = {
			PairingCodeLinkUtils: {
				setPairingType() {},
				async initializeAltDeviceLinking() {},
				async startAltLinkingFlow() { return 'abcdefgh'; },
			},
		};
		globalThis.onCodeReceivedEvent = async (code) => { seen.push(code); };
		globalThis.require = () => ({ Socket: { state: 'UNPAIRED' } });
		try {
			const result = await collectPairingCode('85290000000', true, 60_000);
			expect(result).toEqual({ ok: true, code: 'abcdefgh' });
			expect(seen).toEqual(['abcdefgh']);
		} finally {
			clearInterval(globalThis.codeInterval);
			globalThis.AuthStore = previous.AuthStore;
			globalThis.onCodeReceivedEvent = previous.onCodeReceivedEvent;
			globalThis.require = previous.require;
			globalThis.codeInterval = previous.codeInterval;
		}
	});

	it('logs a page refusal instead of rejecting', async () => {
		const logs = [];
		const client = {
			pupPage: {
				evaluate: async () => ({
					ok: false,
					error: { name: 't', message: 't' },
				}),
			},
		};
		installPairingRequestGuard(client, (line) => logs.push(line), 60_000);
		await client.requestPairingCode('85290000000', true, 180_000);
		expect(logs).toEqual([formatPairingFailure({ name: 't', message: 't' })]);
		expect(client.pairingRetryTimer).toBeUndefined();
	});

	it('schedules one retry when WhatsApp rate-limits the code', async () => {
		const client = {
			pupPage: {
				evaluate: async () => ({
					ok: false,
					error: { type: { value: { text: 'rate-overlimit', code: 429 } } },
				}),
			},
		};
		installPairingRequestGuard(client, () => {}, 60_000);
		await client.requestPairingCode('85290000000', true, 180_000);
		expect(client.pairingRetryTimer).toBeTruthy();
		clearTimeout(client.pairingRetryTimer);
	});
});
