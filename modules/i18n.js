"use strict";

const path = require('node:path');
const NodeCache = require('node-cache');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const {
    listOverlayFiles,
    readOverlayFile,
    parseOverlayNamespace
} = require('./i18n-overlays.js');

/**
 * Single source of truth: lang/locales.json
 * Add a language there once — aliases, Discord/i18next/intl maps are derived.
 */
const LOCALE_DEFINITIONS = require('../lang/locales.json');

const SUPPORTED_LOCALES = Object.keys(LOCALE_DEFINITIONS);
const DEFAULT_LOCALE = SUPPORTED_LOCALES.find((code) => LOCALE_DEFINITIONS[code].default) || SUPPORTED_LOCALES[0];
const I18NEXT_LOCALE_MAP = Object.fromEntries(
    SUPPORTED_LOCALES.map((code) => [code, LOCALE_DEFINITIONS[code].i18next])
);
const DISCORD_LOCALE_MAP = Object.fromEntries(
    SUPPORTED_LOCALES.map((code) => [code, LOCALE_DEFINITIONS[code].discord])
);
const I18NEXT_TO_LOCALE = Object.fromEntries(
    SUPPORTED_LOCALES.map((code) => [LOCALE_DEFINITIONS[code].i18next, code])
);
const I18NEXT_LNGS = SUPPORTED_LOCALES.map((code) => LOCALE_DEFINITIONS[code].i18next);

const LANG_DIR = path.join(__dirname, '..', 'lang');
const CACHE_TTL_SECONDS = 300;
const CACHE_MAX_KEYS = 100_000;

let initialized = false;
let initPromise = null;

const localeCache = new NodeCache({
    stdTTL: CACHE_TTL_SECONDS,
    maxKeys: CACHE_MAX_KEYS,
    useClones: false
});

/**
 * Match input to a supported locale code, or null if unsupported.
 * Exact code / aliases win over prefix matches.
 */
function matchLocale(input) {
    if (!input || typeof input !== 'string') {
        return null;
    }
    const value = input.trim().toLowerCase();
    if (!value) {
        return null;
    }
    if (LOCALE_DEFINITIONS[value]) {
        return value;
    }
    for (const code of SUPPORTED_LOCALES) {
        const def = LOCALE_DEFINITIONS[code];
        if ((def.aliases || []).includes(value)) {
            return code;
        }
    }
    // Longer prefixes first so en-au beats en if both exist later
    const prefixHits = [];
    for (const code of SUPPORTED_LOCALES) {
        for (const prefix of LOCALE_DEFINITIONS[code].prefixes || []) {
            if (value === prefix || value.startsWith(prefix)) {
                prefixHits.push({ code, length: prefix.length });
            }
        }
    }
    if (prefixHits.length > 0) {
        prefixHits.sort((a, b) => b.length - a.length);
        return prefixHits[0].code;
    }
    return null;
}

function normalizeLocale(input) {
    return matchLocale(input) || DEFAULT_LOCALE;
}

function getLocaleName(locale) {
    const code = normalizeLocale(locale);
    return LOCALE_DEFINITIONS[code]?.name || code;
}

/** e.g. "zh-tw 正體中文\nen English" */
function formatLocaleList() {
    return SUPPORTED_LOCALES
        .map((code) => `${code} ${LOCALE_DEFINITIONS[code].name}`)
        .join('\n');
}

/** Discord slash choices for setting locale */
function getSlashLocaleChoices() {
    return SUPPORTED_LOCALES.map((code) => ({
        name: `${LOCALE_DEFINITIONS[code].name} (${code})`,
        value: code
    }));
}

const BOTHELP_ORIGIN = 'https://bothelp.hktrpg.com';

/**
 * Locale-specific bothelp guide URL.
 * zh-tw → /guide/zh-hant/  en → /guide/en/  zh-hans → /guide/zh-hans/
 * @param {string} [locale]
 * @param {string} [subPath] optional path under the guide (no leading slash required)
 */
function getBothelpUrl(locale, subPath = '') {
    const code = normalizeLocale(locale);
    const guide = LOCALE_DEFINITIONS[code]?.bothelpGuide
        || LOCALE_DEFINITIONS[DEFAULT_LOCALE]?.bothelpGuide
        || 'zh-hant';
    const base = `${BOTHELP_ORIGIN}/guide/${guide}/`;
    if (!subPath) {
        return base;
    }
    return `${base}${String(subPath).replace(/^\//, '')}`;
}

function toDiscordLocale(locale) {
    const normalized = normalizeLocale(locale);
    return DISCORD_LOCALE_MAP[normalized] || DISCORD_LOCALE_MAP[DEFAULT_LOCALE];
}

function toIntlLocale(locale) {
    const normalized = normalizeLocale(locale);
    return LOCALE_DEFINITIONS[normalized]?.intl
        || LOCALE_DEFINITIONS[DEFAULT_LOCALE]?.intl
        || 'zh-Hant-HK';
}

function toI18nextLng(locale) {
    const normalized = normalizeLocale(locale);
    return I18NEXT_LOCALE_MAP[normalized] || I18NEXT_LOCALE_MAP[DEFAULT_LOCALE];
}

function fromI18nextLng(lng) {
    return I18NEXT_TO_LOCALE[lng] || DEFAULT_LOCALE;
}

function toLocaleFileName(locale) {
    const normalized = normalizeLocale(locale);
    return `${normalized}.json`;
}

function loadOverlayResourceBundles(locale) {
    const lng = toI18nextLng(locale);
    for (const fileName of listOverlayFiles(locale)) {
        const parsed = parseOverlayNamespace(fileName);
        if (!parsed) {
            continue;
        }
        const overlayContent = readOverlayFile(locale, fileName);
        i18next.addResourceBundle(
            lng,
            'translation',
            { [parsed.namespace]: overlayContent },
            true,
            true
        );
    }
}

function loadAllOverlayResourceBundles() {
    for (const locale of SUPPORTED_LOCALES) {
        loadOverlayResourceBundles(locale);
    }
}

function createTranslator(locale) {
    const fixedT = i18next.getFixedT(toI18nextLng(locale));
    const bothelp = getBothelpUrl(locale);
    return (key, options = {}) => fixedT(key, { bothelp, ...options });
}

function t(key, options = {}) {
    const locale = options.lng || DEFAULT_LOCALE;
    const lng = toI18nextLng(locale);
    const bothelp = options.bothelp || getBothelpUrl(locale);
    return i18next.t(key, { bothelp, ...options, lng });
}

async function init() {
    if (initialized) {
        return;
    }
    if (initPromise) {
        return initPromise;
    }

    initPromise = i18next
        .use(Backend)
        .init({
            fallbackLng: toI18nextLng(DEFAULT_LOCALE),
            supportedLngs: I18NEXT_LNGS,
            preload: I18NEXT_LNGS,
            ns: ['translation'],
            defaultNS: 'translation',
            backend: {
                loadPath: (lng) => path.join(LANG_DIR, toLocaleFileName(fromI18nextLng(lng)))
            },
            interpolation: {
                escapeValue: false
            },
            returnNull: false,
            returnEmptyString: false
        })
        .then(() => {
            loadAllOverlayResourceBundles();
            initialized = true;
        })
        .catch((error) => {
            initPromise = null;
            throw error;
        });

    return initPromise;
}

function getCacheKey(scope, scopeId) {
    return `${scope}:${scopeId}`;
}

function isDmChannel(channelType) {
    return channelType === 1 || channelType === 'DM';
}

async function resolveLocale({
    groupid,
    userid,
    channelType
}) {
    await init();

    const isDm = isDmChannel(channelType) || !groupid;
    const scope = isDm ? 'user' : 'group';
    const scopeId = isDm ? userid : groupid;

    if (!scopeId || !process.env.mongoURL) {
        return DEFAULT_LOCALE;
    }

    const cacheKey = getCacheKey(scope, scopeId);
    if (localeCache.has(cacheKey)) {
        return localeCache.get(cacheKey);
    }

    try {
        const schema = require('./schema.js');
        if (!schema.botLocale) {
            localeCache.set(cacheKey, DEFAULT_LOCALE);
            return DEFAULT_LOCALE;
        }

        const record = await schema.botLocale.findOne({ scope, scopeId }).lean();
        const locale = record?.locale ? normalizeLocale(record.locale) : DEFAULT_LOCALE;
        localeCache.set(cacheKey, locale);
        return locale;
    } catch (error) {
        console.error('[i18n] resolveLocale error:', error.message);
        localeCache.set(cacheKey, DEFAULT_LOCALE);
        return DEFAULT_LOCALE;
    }
}

async function setLocale({ scope, scopeId, locale }) {
    await init();

    if (!process.env.mongoURL) {
        return { ok: false, reason: 'no_database' };
    }

    const normalized = matchLocale(locale);
    if (!normalized) {
        return { ok: false, reason: 'unsupported_locale' };
    }

    try {
        const schema = require('./schema.js');
        if (!schema.botLocale) {
            return { ok: false, reason: 'no_database' };
        }

        await schema.botLocale.findOneAndUpdate(
            { scope, scopeId },
            { $set: { locale: normalized } },
            { upsert: true, returnDocument: 'after' }
        );

        localeCache.del(getCacheKey(scope, scopeId));
        return { ok: true, locale: normalized };
    } catch (error) {
        console.error('[i18n] setLocale error:', error.message);
        return { ok: false, reason: 'database_error' };
    }
}

async function getLocaleRecord({ scope, scopeId }) {
    if (!process.env.mongoURL) {
        return DEFAULT_LOCALE;
    }

    try {
        const schema = require('./schema.js');
        if (!schema.botLocale) {
            return DEFAULT_LOCALE;
        }
        const record = await schema.botLocale.findOne({ scope, scopeId }).lean();
        return record?.locale ? normalizeLocale(record.locale) : DEFAULT_LOCALE;
    } catch {
        return DEFAULT_LOCALE;
    }
}

function buildDescriptionLocalizations(translationKey) {
    const localizations = {};
    for (const locale of SUPPORTED_LOCALES) {
        const discordLocale = toDiscordLocale(locale);
        const text = t(translationKey, { lng: locale });
        if (text && text !== translationKey) {
            localizations[discordLocale] = text;
        }
    }
    return localizations;
}

function buildChoiceNameLocalizations(translationKey) {
    return buildDescriptionLocalizations(translationKey);
}

/**
 * Build Discord name_localizations for non-default locales.
 * Default registered name stays Chinese; English clients get the en slug.
 * Discord requires lowercase a-z / 0-9 / - / _ for Latin names.
 */
function buildNameLocalizations(translationKey, defaultName) {
    const localizations = {};
    for (const locale of SUPPORTED_LOCALES) {
        if (locale === DEFAULT_LOCALE) {
            continue;
        }
        const lng = toI18nextLng(locale);
        if (!i18next.exists(translationKey, { lng })) {
            continue;
        }
        const discordLocale = toDiscordLocale(locale);
        const text = t(translationKey, { lng: locale });
        if (!text || text === translationKey || text === defaultName) {
            continue;
        }
        localizations[discordLocale] = text;
    }
    return localizations;
}

function applyNameLocalizations(target, translationKey) {
    if (!target?.name) {
        return;
    }
    const localizations = buildNameLocalizations(translationKey, target.name);
    if (Object.keys(localizations).length > 0) {
        target.name_localizations = {
            ...target.name_localizations,
            ...localizations
        };
    }
}

/**
 * Merge Discord slash command localizations from lang JSON onto command payload.
 */
function enrichSlashCommandLocalizations(commandData) {
    if (!commandData?.name || !initialized) {
        return commandData;
    }

    const slashConfig = i18next.getResource(toI18nextLng(DEFAULT_LOCALE), 'translation', `slash.${commandData.name}`);
    if (!slashConfig || typeof slashConfig !== 'object') {
        return commandData;
    }

    applyNameLocalizations(commandData, `slash.${commandData.name}.name`);

    if (slashConfig.description) {
        const descKey = `slash.${commandData.name}.description`;
        const localizations = buildDescriptionLocalizations(descKey);
        if (Object.keys(localizations).length > 0) {
            commandData.description_localizations = {
                ...commandData.description_localizations,
                ...localizations
            };
        }
    }

    if (Array.isArray(commandData.options)) {
        for (const option of commandData.options) {
            enrichOptionLocalizations(commandData.name, option, `slash.${commandData.name}.options`);
        }
    }

    return commandData;
}

function enrichOptionLocalizations(commandName, option, optionsPath) {
    const basePath = optionsPath || `slash.${commandName}.options`;
    const optionPath = `${basePath}.${option.name}`;
    const optionConfig = i18next.getResource(toI18nextLng(DEFAULT_LOCALE), 'translation', optionPath);
    if (!optionConfig) {
        return;
    }

    applyNameLocalizations(option, `${optionPath}.name`);

    if (optionConfig.description) {
        const localizations = buildDescriptionLocalizations(`${optionPath}.description`);
        if (Object.keys(localizations).length > 0) {
            option.description_localizations = {
                ...option.description_localizations,
                ...localizations
            };
        }
    }

    if (Array.isArray(option.options)) {
        for (const sub of option.options) {
            enrichOptionLocalizations(commandName, sub, `${optionPath}.options`);
        }
    }

    if (Array.isArray(option.choices) && optionConfig.choices) {
        for (const choice of option.choices) {
            const choiceKey = `${optionPath}.choices.${choice.value}`;
            const localizations = buildChoiceNameLocalizations(choiceKey);
            if (Object.keys(localizations).length > 0) {
                choice.name_localizations = {
                    ...choice.name_localizations,
                    ...localizations
                };
            }
        }
    }
}

function clearLocaleCache(scope, scopeId) {
    localeCache.del(getCacheKey(scope, scopeId));
}

module.exports = {
    LOCALE_DEFINITIONS,
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    matchLocale,
    normalizeLocale,
    getLocaleName,
    formatLocaleList,
    getSlashLocaleChoices,
    getBothelpUrl,
    toDiscordLocale,
    toIntlLocale,
    createTranslator,
    t,
    init,
    resolveLocale,
    setLocale,
    getLocaleRecord,
    buildDescriptionLocalizations,
    enrichSlashCommandLocalizations,
    clearLocaleCache,
    loadLocaleBundle: require('./i18n-overlays.js').loadLocaleBundle
};
