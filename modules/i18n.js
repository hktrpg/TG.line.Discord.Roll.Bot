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

const DEFAULT_LOCALE = 'zh-tw';
const SUPPORTED_LOCALES = ['zh-tw', 'en'];
const I18NEXT_LOCALE_MAP = {
    'zh-tw': 'zh-TW',
    en: 'en'
};
const LANG_DIR = path.join(__dirname, '..', 'lang');
const CACHE_TTL_SECONDS = 300;
const CACHE_MAX_KEYS = 100_000;

const DISCORD_LOCALE_MAP = {
    'zh-tw': 'zh-TW',
    en: 'en-US'
};

let initialized = false;
let initPromise = null;

const localeCache = new NodeCache({
    stdTTL: CACHE_TTL_SECONDS,
    maxKeys: CACHE_MAX_KEYS,
    useClones: false
});

function normalizeLocale(input) {
    if (!input || typeof input !== 'string') {
        return DEFAULT_LOCALE;
    }
    const value = input.trim().toLowerCase();
    if (value === 'zh-tw' || value === 'zh-hant' || value === 'zh_hant' || value.startsWith('zh-tw')) {
        return 'zh-tw';
    }
    if (value === 'en' || value === 'en-us' || value === 'en-gb' || value.startsWith('en')) {
        return 'en';
    }
    return SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

function toDiscordLocale(locale) {
    const normalized = normalizeLocale(locale);
    return DISCORD_LOCALE_MAP[normalized] || DISCORD_LOCALE_MAP[DEFAULT_LOCALE];
}

function toI18nextLng(locale) {
    const normalized = normalizeLocale(locale);
    return I18NEXT_LOCALE_MAP[normalized] || I18NEXT_LOCALE_MAP[DEFAULT_LOCALE];
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
    return i18next.getFixedT(toI18nextLng(locale));
}

function t(key, options = {}) {
    const lng = toI18nextLng(options.lng || DEFAULT_LOCALE);
    return i18next.t(key, { ...options, lng });
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
            fallbackLng: 'zh-TW',
            supportedLngs: ['zh-TW', 'en'],
            preload: ['zh-TW', 'en'],
            ns: ['translation'],
            defaultNS: 'translation',
            backend: {
                loadPath: (lng) => path.join(LANG_DIR, toLocaleFileName(lng === 'zh-TW' ? 'zh-tw' : lng))
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

    const normalized = normalizeLocale(locale);
    if (!SUPPORTED_LOCALES.includes(normalized)) {
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
 * Merge Discord slash command localizations from lang JSON onto command payload.
 */
function enrichSlashCommandLocalizations(commandData) {
    if (!commandData?.name || !initialized) {
        return commandData;
    }

    const slashConfig = i18next.getResource('zh-TW', 'translation', `slash.${commandData.name}`);
    if (!slashConfig || typeof slashConfig !== 'object') {
        return commandData;
    }

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
            enrichOptionLocalizations(commandData.name, option);
        }
    }

    return commandData;
}

function enrichOptionLocalizations(commandName, option) {
    const optionConfig = i18next.getResource('zh-TW', 'translation', `slash.${commandName}.options.${option.name}`);
    if (!optionConfig) {
        return;
    }

    if (optionConfig.description) {
        const localizations = buildDescriptionLocalizations(`slash.${commandName}.options.${option.name}.description`);
        if (Object.keys(localizations).length > 0) {
            option.description_localizations = {
                ...option.description_localizations,
                ...localizations
            };
        }
    }

    if (Array.isArray(option.options)) {
        for (const sub of option.options) {
            enrichOptionLocalizations(commandName, sub);
        }
    }

    if (Array.isArray(option.choices) && optionConfig.choices) {
        for (const choice of option.choices) {
            const choiceKey = `slash.${commandName}.options.${option.name}.choices.${choice.value}`;
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

function getGlossaryTerm(termKey, locale = DEFAULT_LOCALE) {
    try {
        const glossary = require('../lang/glossary.json');
        const term = glossary.terms?.[termKey];
        if (!term) {
            return null;
        }
        const normalized = normalizeLocale(locale);
        return term[normalized] || term[DEFAULT_LOCALE] || null;
    } catch {
        return null;
    }
}

module.exports = {
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    normalizeLocale,
    toDiscordLocale,
    createTranslator,
    t,
    init,
    resolveLocale,
    setLocale,
    getLocaleRecord,
    buildDescriptionLocalizations,
    enrichSlashCommandLocalizations,
    clearLocaleCache,
    getGlossaryTerm,
    loadLocaleBundle: require('./i18n-overlays.js').loadLocaleBundle
};
