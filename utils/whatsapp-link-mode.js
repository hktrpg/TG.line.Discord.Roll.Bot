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

const PAIRING_RATE_LIMIT_RETRY_MS = 1_800_000;

function isPairingRateLimit(detail) {
	const text = JSON.stringify(detail || '').toLowerCase();
	return text.includes('rate-overlimit')
		|| text.includes('rate_overlimit')
		|| text.includes('"code":429')
		|| text.includes('"status":429');
}

/** One log line. Never includes the phone number. */
function formatPairingFailure(detail) {
	if (isPairingRateLimit(detail)) {
		return '[Whatsapp] Pairing code refused: rate-overlimit. Wait about 30 minutes before restarting; another restart extends the block.';
	}
	const body = JSON.stringify(detail || {});
	const clipped = body.length > 500 ? `${body.slice(0, 500)}…` : body;
	return `[Whatsapp] Pairing code refused: ${clipped}`;
}

/**
 * Runs inside the WhatsApp page. Returns { ok, code } or { ok:false, error }.
 * A failed first attempt does not start the refresh interval; that interval
 * would ask WhatsApp again every 3 minutes and extend a rate limit.
 */
async function collectPairingCode(phoneNumber, showNotification, intervalMs) {
	const describe = (error) => {
		const seen = new Set();
		const walk = (value, depth) => {
			if (value == null || depth > 4) return value ?? null;
			const kind = typeof value;
			if (kind === 'string' || kind === 'number' || kind === 'boolean') return value;
			if (kind !== 'object') return String(value);
			if (seen.has(value)) return null;
			seen.add(value);
			if (Array.isArray(value)) return value.slice(0, 6).map((item) => walk(item, depth + 1));
			const out = {};
			for (const key of Object.getOwnPropertyNames(value).slice(0, 12)) {
				if (key === 'stack') continue;
				try {
					out[key] = walk(value[key], depth + 1);
				} catch {
					out[key] = null;
				}
			}
			return out;
		};
		return walk(error, 0);
	};

	const getCode = async () => {
		const started = Date.now();
		while (!globalThis.AuthStore?.PairingCodeLinkUtils) {
			if (Date.now() - started > 20_000) {
				return { ok: false, error: { message: 'PairingCodeLinkUtils missing' } };
			}
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
		const utils = globalThis.AuthStore.PairingCodeLinkUtils;
		try {
			if (typeof utils.setPairingType === 'function') {
				utils.setPairingType('ALT_DEVICE_LINKING');
			}
			if (typeof utils.initializeAltDeviceLinking === 'function') {
				await utils.initializeAltDeviceLinking();
			}
			if (typeof utils.startAltLinkingFlow !== 'function') {
				return {
					ok: false,
					error: { message: 'startAltLinkingFlow missing', keys: Object.keys(utils) },
				};
			}
			const code = await utils.startAltLinkingFlow(phoneNumber, showNotification);
			return { ok: true, code };
		} catch (error) {
			return { ok: false, error: describe(error) };
		}
	};

	const first = await getCode();
	if (!first.ok) {
		if (globalThis.codeInterval) {
			clearInterval(globalThis.codeInterval);
			globalThis.codeInterval = null;
		}
		return first;
	}

	if (globalThis.codeInterval) clearInterval(globalThis.codeInterval);
	globalThis.codeInterval = setInterval(async () => {
		try {
			const loadModule = globalThis['require'];
			// WhatsApp Web's own loader. Not a Node package.
			// eslint-disable-next-line n/no-missing-require
			const state = loadModule('WAWebSocketModel').Socket.state;
			if (state != 'UNPAIRED' && state != 'UNPAIRED_IDLE') {
				clearInterval(globalThis.codeInterval);
				return;
			}
			const next = await getCode();
			if (next.ok && globalThis.onCodeReceivedEvent) await globalThis.onCodeReceivedEvent(next.code);
		} catch {
			// Next tick retries. A throw here must not escape the page timer.
		}
	}, intervalMs);
	if (globalThis.onCodeReceivedEvent) await globalThis.onCodeReceivedEvent(first.code);
	return first;
}

/**
 * whatsapp-web.js calls requestPairingCode() without await. WhatsApp's page
 * throws a minified error ("t"), which becomes an unhandled rejection and
 * never reaches the code listener. This replacement logs that refusal.
 */
function installPairingRequestGuard(client, log = console.log, retryMs = PAIRING_RATE_LIMIT_RETRY_MS) {
	if (!client) return;
	client.requestPairingCode = function requestPairingCodeGuarded(phoneNumber, showNotification = true, intervalMs = 180_000) {
		const run = async () => {
			if (!client.pupPage) {
				log(formatPairingFailure({ message: 'WhatsApp page is not open' }));
				return;
			}
			const result = await client.pupPage.evaluate(
				collectPairingCode,
				phoneNumber,
				showNotification,
				intervalMs,
			);
			if (result?.ok) return result.code;
			log(formatPairingFailure(result?.error));
			if (!isPairingRateLimit(result?.error) || client.pairingRetryTimer) return;
			client.pairingRetryTimer = setTimeout(() => {
				client.pairingRetryTimer = null;
				client.requestPairingCode(phoneNumber, showNotification, intervalMs);
			}, retryMs);
			if (typeof client.pairingRetryTimer.unref === 'function') client.pairingRetryTimer.unref();
		};
		return run().catch((error) => {
			log(formatPairingFailure({ message: error?.message || String(error) }));
		});
	};
}

module.exports = {
	resolvePairPhone,
	applyPairingLink,
	formatPairingCode,
	pairingCodeLogLine,
	isPairingRateLimit,
	formatPairingFailure,
	collectPairingCode,
	installPairingRequestGuard,
};
