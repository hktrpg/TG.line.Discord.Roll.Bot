"use strict";

const CHARACTER_BASE = "https://character-service.dndbeyond.com/character/v5/character";
const USER_AGENT = "HKTRPG/1.0 (character import; +https://github.com/hktrpg)";
const FETCH_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 900_000;
const USER_COOLDOWN_MS = process.env.DEBUG ? 5000 : 60_000;

/** @type {Map<string, { expires: number, data: object }>} */
const characterCache = new Map();
/** @type {Map<string, number>} */
const userLastFetch = new Map();

/**
 * @typedef {'invalid_id'|'not_public'|'not_found'|'rate_limit'|'network'|'parse_error'} DdbErrorCode
 */

/**
 * @param {string} input
 * @returns {string|null}
 */
function parseCharacterId(input) {
    if (!input || typeof input !== "string") {
        return null;
    }
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/dndbeyond\.com\/characters\/(\d+)/i);
    if (urlMatch) {
        return urlMatch[1];
    }
    const digits = trimmed.replaceAll(/\D/g, "");
    if (/^[1-9]\d{0,11}$/.test(digits)) {
        return digits;
    }
    return null;
}

/**
 * @param {string} userid
 * @returns {{ ok: true } | { ok: false, code: 'rate_limit', retryMs: number }}
 */
function checkUserCooldown(userid) {
    const last = userLastFetch.get(userid);
    if (last && Date.now() - last < USER_COOLDOWN_MS) {
        return { ok: false, code: "rate_limit", retryMs: USER_COOLDOWN_MS - (Date.now() - last) };
    }
    return { ok: true };
}

/**
 * @param {string} userid
 */
function markUserFetch(userid) {
    userLastFetch.set(userid, Date.now());
}

/**
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {boolean} [options.skipCooldown]
 * @param {boolean} [options.skipCache]
 */
async function fetchCharacterData(characterId, userid, options = {}) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (!fetchImpl) {
        throw new Error("fetch is not available");
    }

    const id = parseCharacterId(characterId);
    if (!id) {
        return { ok: false, code: "invalid_id" };
    }

    if (!options.skipCache) {
        const cached = characterCache.get(id);
        if (cached && cached.expires > Date.now()) {
            return { ok: true, data: cached.data, characterId: id, fromCache: true };
        }
    }

    if (userid && !options.skipCooldown) {
        const cooldown = checkUserCooldown(userid);
        if (!cooldown.ok) {
            return cooldown;
        }
    }

    const url = `${CHARACTER_BASE}/${id}?includeCustomItems=true`;
    if (userid && !options.skipCooldown) {
        markUserFetch(userid);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    let payload;
    try {
        response = await fetchImpl(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "User-Agent": USER_AGENT,
            },
            signal: controller.signal,
        });

        if (response.status === 429) {
            return { ok: false, code: "rate_limit", retryMs: USER_COOLDOWN_MS };
        }

        const statusError = { 403: "not_public", 404: "not_found" }[response.status];
        if (statusError) {
            return { ok: false, code: statusError };
        }
        if (!response.ok) {
            return { ok: false, code: "network", message: `HTTP ${response.status}` };
        }

        payload = await response.json();
    } catch (error) {
        const aborted = error?.name === "AbortError";
        console.error("[DDB] fetch error:", error.message);
        return {
            ok: false,
            code: aborted ? "network" : (response ? "parse_error" : "network"),
            message: error.message,
        };
    } finally {
        clearTimeout(timer);
    }

    const data = payload?.data ?? payload;
    if (!data || typeof data !== "object") {
        return { ok: false, code: "parse_error" };
    }

    characterCache.set(id, { expires: Date.now() + CACHE_TTL_MS, data });

    return { ok: true, data, characterId: id, fromCache: false };
}

function clearCachesForTests() {
    characterCache.clear();
    userLastFetch.clear();
}

module.exports = {
    CHARACTER_BASE,
    USER_COOLDOWN_MS,
    parseCharacterId,
    checkUserCooldown,
    fetchCharacterData,
    clearCachesForTests,
};
