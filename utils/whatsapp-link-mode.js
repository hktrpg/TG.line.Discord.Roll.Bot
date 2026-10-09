'use strict';

/**
 * Digits only, country code included. Empty means stay on QR.
 * Pairing code and QR cannot both be live on one WhatsApp Web session.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
function resolvePairPhone(env = process.env) {
	const digits = String(env.WHATSAPP_PAIR_PHONE || '').replaceAll(/\D/g, '');
	// E.164 is 8–15 digits. A shorter value must not turn QR off.
	if (digits.length < 8 || digits.length > 15) return '';
	return digits;
}

/**
 * @param {object} clientOptions
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {object}
 */
function applyPairingLink(clientOptions, env = process.env) {
	const pairPhone = resolvePairPhone(env);
	if (!pairPhone) return { ...clientOptions };
	return {
		...clientOptions,
		pairWithPhoneNumber: {
			phoneNumber: pairPhone,
			showNotification: true,
		},
	};
}

/** 8-character WhatsApp pairing code, shown as ABCD-EFGH. Empty if unusable. */
function formatPairingCode(code) {
	const raw = String(code || '').replaceAll(/[^a-zA-Z0-9]/g, '').toUpperCase();
	if (raw.length !== 8) return '';
	return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Log line check-qrcode.sh matches. Empty when the code cannot be shown. */
function pairingCodeLogLine(code) {
	const formatted = formatPairingCode(code);
	if (!formatted) return '';
	return `[Whatsapp] PAIRING CODE ${formatted}`;
}

function isMainFrame(frame) {
	if (!frame || typeof frame.parentFrame !== 'function') return true;
	try {
		return frame.parentFrame() === null;
	} catch {
		return true;
	}
}

function frameUrl(frame) {
	try {
		return typeof frame.url === 'function' ? String(frame.url()) : '';
	} catch {
		return '';
	}
}

/**
 * whatsapp-web.js runs this on every frame. A subframe whose URL contains
 * post_logout=1 makes it delete LocalAuth while the phone is still linking.
 * Other iframe navigations must still be delivered; the library re-injects on them.
 */
function wrapWhatsappFrameHandler(handler) {
	return function onFrameNavigated(frame) {
		if (!isMainFrame(frame) && frameUrl(frame).includes('post_logout=1')) {
			return;
		}
		return handler.call(this, frame);
	};
}

function installFrameNavigationGuard(Page) {
	if (!Page?.prototype?.on || Page.prototype.__hktrpgFrameGuard) return;
	const originalOn = Page.prototype.on;
	Page.prototype.on = function onGuarded(event, handler) {
		if (event === 'framenavigated' && typeof handler === 'function') {
			return originalOn.call(this, event, wrapWhatsappFrameHandler(handler));
		}
		return originalOn.call(this, event, handler);
	};
	Page.prototype.__hktrpgFrameGuard = true;
}

module.exports = {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
	isMainFrame,
	wrapWhatsappFrameHandler,
	installFrameNavigationGuard,
};
