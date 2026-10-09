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

module.exports = {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
};
