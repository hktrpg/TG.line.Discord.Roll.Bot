"use strict";

const LANGUAGES = Object.freeze({ 'zh-TW': '繁體中文', en: 'English', ja: '日本語' });

// Keep the original keyless provider. The package calls Google's web translation
// endpoint; this is not the official Google Cloud Translation API.
// Each Gateway process allows one in-flight request, at least one second apart.
// A 429 opens a one-minute cooldown. No retries, proxies or paid fallback.
function createTranslator({ env = process.env, now = Date.now,
    translateImpl = (...args) => require('@vitalets/google-translate-api').translate(...args) } = {}) {
    let nextRequestAt = 0;
    let cooldownUntil = 0;
    let inFlight = false;
    return {
        available: () => env.CHATROOM_TRANSLATION_ENABLED === 'true',
        async translate(text, target) {
            if (!this.available() || !Object.hasOwn(LANGUAGES, target)) {
                throw new Error('translation_unavailable');
            }
            if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
                throw new Error('invalid_translation_input');
            }
            if (inFlight || now() < nextRequestAt || now() < cooldownUntil) {
                throw new Error('translation_rate_limited');
            }
            inFlight = true;
            nextRequestAt = now() + 1000;
            try {
                const result = await translateImpl(text, {
                    from: 'auto', to: target, host: 'translate.google.com',
                    fetchOptions: { signal: AbortSignal.timeout(8000), redirect: 'error' }
                });
                const translated = result?.text;
                if (typeof translated !== 'string' || !translated.trim() || translated.length > 3000) {
                    throw new Error('invalid_translation');
                }
                return translated;
            } catch (error) {
                if (error?.status === 429 || error?.statusCode === 429) {
                    cooldownUntil = now() + 60_000;
                    throw new Error('translation_rate_limited');
                }
                // Never propagate errors that can contain source text, IPs or URLs.
                throw new Error('translation_failed');
            } finally {
                inFlight = false;
            }
        }
    };
}

module.exports = { createTranslator, LANGUAGES };
