'use strict';

const {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
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
});
