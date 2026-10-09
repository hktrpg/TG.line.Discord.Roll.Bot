'use strict';

const {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
	wrapWhatsappFrameHandler,
	installFrameNavigationGuard,
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

	it('keeps a false userAgent so Chrome 101 is not forced', () => {
		const plain = applyPairingLink({ userAgent: false, puppeteer: {} }, {});
		const paired = applyPairingLink({ userAgent: false }, { WHATSAPP_PAIR_PHONE: '85291234567' });
		expect(plain.userAgent).toBe(false);
		expect(paired.userAgent).toBe(false);
		expect(paired.pairWithPhoneNumber.phoneNumber).toBe('85291234567');
	});

	it('ignores only a subframe post_logout so linking can finish', () => {
		const seen = [];
		const handler = wrapWhatsappFrameHandler(function (frame) {
			seen.push(frame.id);
		});
		const subframe = (id, url) => ({
			id,
			url: () => url,
			parentFrame: () => ({}),
		});
		handler(subframe('logout-iframe', 'https://web.whatsapp.com/?post_logout=1'));
		handler(subframe('other-iframe', 'https://web.whatsapp.com/'));
		handler({
			id: 'main-logout',
			url: () => 'https://web.whatsapp.com/?post_logout=1',
			parentFrame: () => null,
		});
		expect(seen).toEqual(['other-iframe', 'main-logout']);
	});

	it('installs the guard once and only wraps framenavigated', () => {
		const events = [];
		function Page() {}
		Page.prototype.on = function (event, handler) {
			events.push(event);
			this.handlers = this.handlers || {};
			this.handlers[event] = handler;
			return this;
		};
		installFrameNavigationGuard(Page);
		installFrameNavigationGuard(Page);
		const page = new Page();
		const seen = [];
		page.on('framenavigated', (frame) => seen.push(frame.id));
		page.on('request', () => seen.push('request'));
		page.handlers.framenavigated({
			id: 'iframe',
			url: () => 'https://web.whatsapp.com/?post_logout=1',
			parentFrame: () => ({}),
		});
		page.handlers.framenavigated({
			id: 'main',
			url: () => 'https://web.whatsapp.com/',
			parentFrame: () => null,
		});
		page.handlers.request();
		expect(events).toEqual(['framenavigated', 'request']);
		expect(seen).toEqual(['main', 'request']);
	});
});
