"use strict";
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');
const NodeCache = require('node-cache');
const fs = require('fs');

// Cache configuration with 1 hour TTL
const CACHE_TTL = 60 * 60;
const translationCache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: 120,
    useClones: false
});

// Available languages
const LANGUAGES = ['en', 'zh-TW', 'zh-CN'];
const DEFAULT_LANGUAGE = 'zh-TW';

// Language code mapping for common variants
const LANGUAGE_MAPPING = {
  'zh': 'zh-TW',  // Map generic Chinese to Traditional Chinese
  'zh-tw': 'zh-TW', // Explicitly map lowercase variant
  'zh-cn': 'zh-CN'  // Explicitly map lowercase variant
};

class TranslationManager {
    constructor() {
        this.initialized = false;
        this.supportedLanguages = LANGUAGES;
        this.defaultLanguage = DEFAULT_LANGUAGE;
        this.missingKeys = new Map();
        this.languageMapping = LANGUAGE_MAPPING;
        
        // Force reload all language resources after initialization
        setTimeout(() => {
            if (this.initialized) {
                console.log('[DEBUG] Post-init: Reloading all language resources');
                
                // Instead of using i18next.reloadResources, load the translations directly
                // This is more reliable, as it doesn't depend on i18next's initialization state
                try {
                    for (const lang of this.supportedLanguages) {
                        const filePath = path.join(__dirname, '../locales', `${lang}.json`);
                        if (fs.existsSync(filePath)) {
                            const fileContent = fs.readFileSync(filePath, 'utf8');
                            try {
                                const translations = JSON.parse(fileContent);
                                console.log(`[DEBUG] Post-init: Successfully loaded ${lang}.json with ${Object.keys(translations).length} keys`);
                                
                                // Cache the entire translation file for each language
                                const cacheKey = `translations:${lang}`;
                                translationCache.set(cacheKey, translations, 3600);
                                
                                // Also cache common keys individually
                                for (const key of Object.keys(translations)) {
                                    const individualCacheKey = `t:${lang}:${key}`;
                                    translationCache.set(individualCacheKey, translations[key], 3600);
                                }
                            } catch (parseError) {
                                console.error(`[ERROR] Post-init: Failed to parse ${lang}.json:`, parseError);
                            }
                        } else {
                            console.warn(`[WARN] Post-init: Language file not found: ${filePath}`);
                        }
                    }
                    console.log('[DEBUG] Post-init: Successfully reloaded all language resources');
                } catch (err) {
                    console.error('[ERROR] Post-init: Failed to reload resources:', err);
                }
            }
        }, 5000); // Wait 5 seconds after startup
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[DEBUG] Initializing translation system...');
            
            // Pre-load all language files to ensure they're available for detection
            const loadedTranslations = {};
            for (const lang of LANGUAGES) {
                try {
                    const filePath = path.join(__dirname, '../locales', `${lang}.json`);
                    if (fs.existsSync(filePath)) {
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        const parsed = JSON.parse(fileContent);
                        loadedTranslations[lang] = parsed;
                        console.log(`[DEBUG] Pre-loaded ${lang}.json with ${Object.keys(parsed).length} keys`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Failed to pre-load ${lang}:`, error);
                }
            }
            
            // Load i18next with the backend plugin
            await i18next
                .use(Backend)
                .init({
                    // Core settings
                    lng: DEFAULT_LANGUAGE,
                    fallbackLng: DEFAULT_LANGUAGE,
                    supportedLngs: [...LANGUAGES, ...LANGUAGES.map(l => l.toLowerCase())],  // Add both cases
                    load: 'currentOnly',  // Only load current language
                    
                    // Language detection and handling
                    nonExplicitWhitelist: true,  // Allow similar languages
                    lowerCaseLng: true,          // Force lowercase language codes
                    
                    // Namespace configuration - crucial for proper loading
                    ns: ['translation'],
                    defaultNS: 'translation',
                    
                    // Resources preloading to avoid rejection issues
                    resources: loadedTranslations,
                    
                    // Backend setup with proper fallbacks
                    backend: {
                        loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
                        addPath: path.join(__dirname, '../locales/{{lng}}.missing.json')
                    },
                    
                    // Debug options (enable for development)
                    debug: true,
                    
                    // Interpolation settings
                    interpolation: {
                        escapeValue: false
                    },
                    
                    // Missing key handling
                    saveMissing: process.env.NODE_ENV === 'development',
                    missingKeyHandler: (lngs, ns, key) => {
                        this.trackMissingKey(lngs[0], key);
                    },
                    
                    // Ensure initialization is completed before returning
                    initImmediate: false
                })
                .then(() => {
                    console.log('[DEBUG] i18next initialized successfully with languages:', i18next.languages);
                    console.log('[DEBUG] Default language is:', i18next.language);
                });

            // Register language-specific options explicitly
            for (const lang of LANGUAGES) {
                // Register both original case and lowercase version to handle all formats
                i18next.services.languageUtils.options.supportedLngs[lang] = true;
                i18next.services.languageUtils.options.supportedLngs[lang.toLowerCase()] = true;
                
                // Also register mappings if they exist
                if (this.languageMapping[lang.toLowerCase()]) {
                    const mappedLang = this.languageMapping[lang.toLowerCase()];
                    i18next.services.languageUtils.options.supportedLngs[mappedLang] = true;
                    i18next.services.languageUtils.options.supportedLngs[mappedLang.toLowerCase()] = true;
                }
            }

            // Also make sure the supportedLngs is always populated as an array too
            // This addresses an internal implementation detail of i18next
            if (!Array.isArray(i18next.services.languageUtils.options.supportedLngs)) {
                const supportedLngsArray = Object.keys(i18next.services.languageUtils.options.supportedLngs);
                i18next.services.languageUtils.options.supportedLngs = supportedLngsArray;
            }

            // Apply custom language detection logic with direct access to options
            const originalLookup = i18next.services.languageUtils.lookup;
            i18next.services.languageUtils.lookup = function(code) {
                if (!code) return DEFAULT_LANGUAGE;
                
                // Normalize code to lowercase for consistent handling
                const normalizedCode = code.toLowerCase();
                
                // Add this language code to supported list to prevent rejection warnings
                // Add both original and lowercase variants
                this.options.supportedLngs[code] = true;
                this.options.supportedLngs[normalizedCode] = true;
                
                // Check if this code has a mapping
                const mappedCode = LANGUAGE_MAPPING[normalizedCode];
                if (mappedCode) {
                    console.log(`[DEBUG] Language mapping applied: ${code} -> ${mappedCode}`);
                    // Ensure mapped code is also in supported list (both cases)
                    this.options.supportedLngs[mappedCode] = true;
                    this.options.supportedLngs[mappedCode.toLowerCase()] = true;
                    return mappedCode;
                }
                
                // Try original lookup
                try {
                    return originalLookup.call(this, code);
                } catch (error) {
                    console.warn(`[WARN] Language lookup failed for ${code}:`, error);
                    // Default to our default language
                    return DEFAULT_LANGUAGE;
                }
            };

            // Verify language files were loaded properly
            for (const lang of LANGUAGES) {
                try {
                    const filePath = path.join(__dirname, '../locales', `${lang}.json`);
                    if (fs.existsSync(filePath)) {
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        const parsed = JSON.parse(fileContent);
                        console.log(`[DEBUG] Successfully loaded ${lang}.json with ${Object.keys(parsed).length} keys`);

                        // Check if language.help exists
                        if (parsed['language.help']) {
                            console.log(`[DEBUG] language.help found in ${lang}.json: ${parsed['language.help'].substring(0, 20)}...`);
                        } else {
                            console.warn(`[WARN] language.help not found in ${lang}.json`);
                        }
                    } else {
                        console.warn(`[WARN] Language file not found: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Error checking language file for ${lang}:`, error);
                }
            }

            // Add custom caching layer with error handling
            const originalBackendGet = i18next.services.backendConnector.backend.read;
            i18next.services.backendConnector.backend.read = (language, namespace, callback) => {
                try {
                    const cacheKey = `translations:${language}`;
                    const cachedData = translationCache.get(cacheKey);
                    
                    if (cachedData) {
                        console.log(`[DEBUG] Using cached translation data for ${language}`);
                        return callback(null, cachedData);
                    }
                    
                    console.log(`[DEBUG] Reading translation file for ${language}`);
                    // Use a try-catch to handle any errors in the original backend read
                    try {
                        originalBackendGet(language, namespace, (err, data) => {
                            if (!err && data) {
                                console.log(`[DEBUG] Successfully read ${language} translation data with ${Object.keys(data).length} keys`);
                                translationCache.set(cacheKey, data);
                            } else {
                                console.error(`[ERROR] Failed to read ${language} translation data:`, err);
                                // Try to read the file directly as a fallback
                                try {
                                    const filePath = path.join(__dirname, '../locales', `${language}.json`);
                                    if (fs.existsSync(filePath)) {
                                        const fileContent = fs.readFileSync(filePath, 'utf8');
                                        const parsedData = JSON.parse(fileContent);
                                        console.log(`[DEBUG] Fallback: Successfully read ${language} translation data with ${Object.keys(parsedData).length} keys`);
                                        translationCache.set(cacheKey, parsedData);
                                        return callback(null, parsedData);
                                    }
                                } catch (fallbackErr) {
                                    console.error('[ERROR] Fallback loading also failed:', fallbackErr);
                                }
                            }
                            callback(err, data);
                        });
                    } catch (error) {
                        console.error(`[ERROR] Exception in backend connector for ${language}:`, error);
                        callback(error, null);
                    }
                } catch (outerError) {
                    console.error(`[ERROR] Outer exception in backend connector:`, outerError);
                    callback(outerError, null);
                }
            };
            
            // Mark as initialized
            this.initialized = true;
            this.loadedLanguages = new Set(LANGUAGES);
            console.log(`Translation system initialized with default language: ${DEFAULT_LANGUAGE}`);
        } catch (error) {
            console.error('Failed to initialize translation system:', error);
            throw error;
        }
    }

    /**
     * Get translation by key
     * @param {string} key - Translation key in dot notation format (e.g., "CoC7.title")
     * @param {Object} options - Options including language and interpolation values
     * @returns {string} Translated text
     */
    translate(key, options = {}) {
        console.log('[DEBUG] translate called for key:', key, 'options:', JSON.stringify(options));

        const {
            language = null,
            userid = null,
            groupid = null,
            ...values
        } = options;

        // Priority 1: If explicit language provided, use it
        if (language) {
            console.log('[DEBUG] Using explicit language:', language);
            return this._translateWithLanguage(key, language, values);
        }

        // Priority 2: If userid is provided, try to get from cache first
        if (userid) {
            // Check cache first for this user's language
            const cacheKey = `userLang:${userid}`;
            const cachedLang = translationCache.get(cacheKey);

            if (cachedLang) {
                console.log('[DEBUG] Using cached language for user', userid, ':', cachedLang);
                // Use the cached language
                return this._translateWithLanguage(key, cachedLang, values);
            }

            // If not in cache, use default for now and update cache async
            // This ensures we don't block on DB lookups during translation
            this.getUserLanguage({ userid, groupid })
                .then(userLang => {
                    if (userLang && userLang !== this.defaultLanguage) {
                        console.log('[DEBUG] Storing language in cache for user', userid, ':', userLang);
                        translationCache.set(cacheKey, userLang, 3600); // 1 hour cache
                    }
                })
                .catch(err => console.error('Error getting user language:', err));
        }

        // Priority 3: If groupid is provided but no user language, check group language
        if (groupid) {
            // Check cache first for this group's language
            const cacheKey = `groupLang:${groupid}`;
            const cachedLang = translationCache.get(cacheKey);

            if (cachedLang) {
                console.log('[DEBUG] Using cached language for group', groupid, ':', cachedLang);
                // Use the cached language
                return this._translateWithLanguage(key, cachedLang, values);
            }

            // If not in cache, use default for now and update cache async
            this.getGroupLanguage(groupid)
                .then(groupLang => {
                    if (groupLang) {
                        console.log('[DEBUG] Storing language in cache for group', groupid, ':', groupLang);
                        translationCache.set(cacheKey, groupLang, 3600); // 1 hour cache
                    }
                })
                .catch(err => console.error('Error getting group language:', err));
        }

        // Priority 4: Default fallback
        console.log('[DEBUG] Using default language:', this.defaultLanguage);
        return this._translateWithLanguage(key, this.defaultLanguage, values);
    }

    /**
     * Internal method to perform translation with a specific language
     * @private
     */
    _translateWithLanguage(key, language, values) {
        try {
            // Check if initialized, if not return the key
            if (!this.initialized) {
                console.log(`[DEBUG] Not initialized yet, returning key: ${key}`);
                return this._handlePlaceholders(key, values);
            }
            
            // Ensure we have a valid language with proper case, handling language mappings
            let validLanguage;
            if (this.isSupported(language)) {
                validLanguage = this.getNormalizedLanguage(language);
            } else {
                validLanguage = this.defaultLanguage;
            }
            
            console.log(`[DEBUG] Translation requested for key "${key}" in language "${validLanguage}"`);
            
            // Get from cache first
            const cacheKey = `t:${validLanguage}:${key}`;
            const cachedTranslation = translationCache.get(cacheKey);
            
            if (cachedTranslation) {
                console.log(`[DEBUG] Using cached translation for ${key} in ${validLanguage}`);
                return this._handlePlaceholders(cachedTranslation, values);
            }
            
            let translation;
            
            try {
                // Try with i18next first
                translation = i18next.t(key, {
                    lng: validLanguage,
                    ns: 'translation',
                    ...values
                });
                
                // If i18next returns the key itself, it means it couldn't find the translation
                if (translation === key) {
                    throw new Error(`i18next returned key (${key}) as translation for ${validLanguage}`);
                }
                
                console.log(`[DEBUG] i18next provided translation for ${key} in ${validLanguage}`);
            } catch (i18nextError) {
                console.error(`[ERROR] i18next translation failed for ${key} in ${validLanguage}:`, i18nextError);
                
                // Fall back to direct file access
                try {
                    const directResult = this.directTranslateSync(key, validLanguage);
                    if (directResult) {
                        translation = directResult;
                        console.log(`[DEBUG] Using direct file translation for ${key} in ${validLanguage}`);
                    } else {
                        // If we couldn't find the translation in the requested language, try default
                        if (validLanguage !== this.defaultLanguage) {
                            const defaultResult = this.directTranslateSync(key, this.defaultLanguage);
                            if (defaultResult) {
                                translation = defaultResult;
                                console.log(`[DEBUG] Using default language translation for ${key}`);
                            } else {
                                translation = key; // Last fallback
                                console.warn(`[WARN] No translation found for ${key} in any language`);
                            }
                        } else {
                            translation = key; // Last fallback
                            console.warn(`[WARN] No translation found for ${key} in default language`);
                        }
                    }
                } catch (directError) {
                    console.error(`[ERROR] Direct translation also failed:`, directError);
                    translation = key; // Last fallback
                }
            }
            
            // Cache valid translations
            if (translation && translation !== key) {
                translationCache.set(cacheKey, translation, 3600);
            }
            
            return this._handlePlaceholders(translation, values);
        } catch (error) {
            console.error(`[ERROR] Translation failed for ${key}:`, error);
            return this._handlePlaceholders(key, values);
        }
    }

    /**
     * Handle placeholders in translated text
     * @private
     */
    _handlePlaceholders(text, values) {
        if (!text || !values || Object.keys(values).length === 0) return text;
        
        // Replace placeholders with values
        try {
            return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                return values[key] !== undefined ? values[key] : `{{${key}}}`;
            });
        } catch (error) {
            console.error(`[ERROR] Error handling placeholders:`, error);
            return text;
        }
    }

    /**
     * Get user preferred language
     * @param {Object} userData - User data with ID and potentially group ID
     * @returns {string} Language code
     */
    async getUserLanguage(userData) {
        try {
            console.log('[DEBUG] getUserLanguage called with:', JSON.stringify(userData));
            
            if (!userData || !userData.userid) {
                console.log('[DEBUG] No userid provided, returning default:', this.defaultLanguage);
                return this.defaultLanguage;
            }
            
            // Priority 1: Check user language from cache or database
            // Check cache first
            const userCacheKey = `userLang:${userData.userid}`;
            const cachedUserLang = translationCache.get(userCacheKey);
            if (cachedUserLang) {
                console.log(`[DEBUG] Got cached language for user ${userData.userid}: ${cachedUserLang}`);
                return cachedUserLang;
            }
            
            // Get from database through records module
            const records = require('./records');
            console.log(`[DEBUG] Fetching language from database for user ${userData.userid}`);
            const userLang = await records.getUserLanguage(userData.userid, null); // Pass null to detect if not found
            
            if (userLang) {
                console.log(`[DEBUG] Database returned language for user ${userData.userid}: ${userLang}`);
                
                // Cache the result
                translationCache.set(userCacheKey, userLang, 3600); // 1 hour cache
                console.log(`[DEBUG] Cached language for user ${userData.userid}: ${userLang}`);
                return userLang;
            }
            
            // Priority 2: If user has no language set, check group language
            if (userData.groupid) {
                const groupCacheKey = `groupLang:${userData.groupid}`;
                const cachedGroupLang = translationCache.get(groupCacheKey);
                
                if (cachedGroupLang) {
                    console.log(`[DEBUG] Using cached language for group ${userData.groupid}: ${cachedGroupLang}`);
                    return cachedGroupLang;
                }
                
                // Get from database
                const groupLang = await records.getGroupLanguage(userData.groupid);
                
                if (groupLang) {
                    console.log(`[DEBUG] Database returned language for group ${userData.groupid}: ${groupLang}`);
                    
                    // Cache the result
                    translationCache.set(groupCacheKey, groupLang, 3600); // 1 hour cache
                    console.log(`[DEBUG] Cached language for group ${userData.groupid}: ${groupLang}`);
                    return groupLang;
                }
            }
            
            // Priority 3: Fall back to default language
            console.log(`[DEBUG] No user or group language found, using default: ${this.defaultLanguage}`);
            return this.defaultLanguage;
        } catch (error) {
            console.error('[ERROR] Error getting user language:', error);
            return this.defaultLanguage;
        }
    }

    /**
     * Get group preferred language
     * @param {string} groupid - Group ID
     * @returns {string} Language code or null if not set
     */
    async getGroupLanguage(groupid) {
        try {
            if (!groupid) {
                console.log('[DEBUG] No groupid provided for getGroupLanguage');
                return null;
            }

            // Check cache first
            const cacheKey = `groupLang:${groupid}`;
            const cachedLang = translationCache.get(cacheKey);
            if (cachedLang) {
                console.log(`[DEBUG] Got cached language for group ${groupid}: ${cachedLang}`);
                return cachedLang;
            }

            // Get from database through records module
            const records = require('./records');
            console.log(`[DEBUG] Fetching language from database for group ${groupid}`);
            const groupLang = await records.getGroupLanguage(groupid);

            console.log(`[DEBUG] Database returned language for group ${groupid}: ${groupLang || 'null'}`);

            // Cache the result
            if (groupLang) {
                translationCache.set(cacheKey, groupLang, 3600); // 1 hour cache
                console.log(`[DEBUG] Cached language for group ${groupid}: ${groupLang}`);
            }

            return groupLang;
        } catch (error) {
            console.error('[ERROR] Error getting group language:', error);
            return null;
        }
    }

    /**
     * Check if language is supported
     * @param {string} lang - Language code
     * @returns {boolean}
     */
    isSupported(lang) {
        if (!lang) return false;
        
        // Make case-insensitive comparison
        const normalizedLang = lang.toLowerCase();
        
        // Check if this is a mapped language code (like 'zh' -> 'zh-TW') 
        if (this.languageMapping[normalizedLang]) {
            return true;
        }
        
        return this.supportedLanguages.some(supportedLang => 
            supportedLang.toLowerCase() === normalizedLang
        );
    }

    /**
     * Get all available languages
     * @returns {Array} Language codes
     */
    getLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * Get normalized language code (with correct case)
     * @param {string} lang - Language code (case insensitive)
     * @returns {string} Normalized language code or null if not supported
     */
    getNormalizedLanguage(lang) {
        if (!lang) return null;
        
        const normalizedLang = lang.toLowerCase();
        
        // Check if this is a mapped language code (like 'zh' -> 'zh-TW')
        if (this.languageMapping[normalizedLang]) {
            console.log(`[DEBUG] Mapping language code ${normalizedLang} to ${this.languageMapping[normalizedLang]}`);
            return this.languageMapping[normalizedLang];
        }
        
        const match = this.supportedLanguages.find(supportedLang => 
            supportedLang.toLowerCase() === normalizedLang
        );
        return match || null;
    }

    /**
     * Track missing translation keys for development
     * @param {string} lang - Language code
     * @param {string} key - Missing translation key
     */
    trackMissingKey(lang, key) {
        if (!this.missingKeys.has(lang)) {
            this.missingKeys.set(lang, new Set());
        }

        this.missingKeys.get(lang).add(key);

        // Log in development mode
        if (process.env.DEBUG === 'true') {
            console.warn(`[i18n] Missing translation key: ${key} for language: ${lang}`);
        }
    }

    /**
     * Force reload translations
     * @param {string} lng - Language to reload (optional)
     */
    async reloadResources(lng) {
        try {
            // Clear specific language or all languages from cache
            if (lng) {
                const keysToDelete = translationCache.keys().filter(key => 
                    key.startsWith(`t:${lng}:`) || key === `translations:${lng}`
                );
                keysToDelete.forEach(key => translationCache.del(key));
            } else {
                translationCache.flushAll();
            }
            
            // Reload from files - with error handling
            try {
                if (lng) {
                    // Load single language
                    await i18next.reloadResources(lng, ['translation']);
                    console.log(`Reloaded translation for language: ${lng}`);
                } else {
                    // Reload all languages
                    await Promise.all(LANGUAGES.map(language => 
                        i18next.reloadResources(language, ['translation'])
                            .catch(err => console.error(`[ERROR] Failed to reload ${language}:`, err))
                    ));
                    console.log(`Reloaded translations for all languages`);
                }
            } catch (reloadError) {
                console.error(`[ERROR] Error during reload:`, reloadError);
                // Continue despite error - we have direct file access as fallback
            }
        } catch (error) {
            console.error(`[ERROR] Failed to reload translations:`, error);
        }
    }

    /**
     * Translate with pluralization support
     * @param {string} key - Translation key
     * @param {number} count - Count for pluralization
     * @param {Object} options - Translation options
     * @returns {string} Translated text
     */
    translatePlural(key, count, options = {}) {
        const { language = this.defaultLanguage, ...values } = options;

        // Use i18next's built-in pluralization
        return i18next.t(key, {
            lng: language,
            count,
            ...values
        });
    }

    /**
     * Clear user or group language cache
     * @param {string} [userid] - User ID (or null to clear all user caches)
     * @param {string} [groupid] - Group ID (or null to clear specific group cache)
     */
    clearUserCache(userid = null, groupid = null) {
        if (userid) {
            // Clear specific user's cache
            const cacheKey = `userLang:${userid}`;
            translationCache.del(cacheKey);
            console.log(`[i18n] Cleared language cache for user: ${userid}`);
        } else if (groupid) {
            // Clear specific group's cache
            const cacheKey = `groupLang:${groupid}`;
            translationCache.del(cacheKey);
            console.log(`[i18n] Cleared language cache for group: ${groupid}`);
        } else {
            // Clear all user and group language caches
            const userCacheKeys = translationCache.keys().filter(
                key => key.startsWith('userLang:') || key.startsWith('groupLang:')
            );
            userCacheKeys.forEach(key => translationCache.del(key));
            console.log(`[i18n] Cleared language cache for all users and groups (${userCacheKeys.length} entries)`);
        }
    }

    /**
     * Synchronous direct translation from JSON files
     * This is for immediate use when i18next fails
     * @param {string} key - Translation key
     * @param {string} lang - Language code
     * @returns {string|null} Translation or null if not found
     */
    directTranslateSync(key, lang) {
        try {
            const normalizedLang = this.getNormalizedLanguage(lang) || this.defaultLanguage;
            const filePath = path.join(__dirname, '../locales', `${normalizedLang}.json`);
            
            console.log(`[DEBUG] Attempting direct file read for ${key} in ${normalizedLang}`);
            
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                let translations;
                
                try {
                    translations = JSON.parse(fileContent);
                    console.log(`[DEBUG] Successfully parsed ${normalizedLang}.json with ${Object.keys(translations).length} keys`);
                } catch (parseError) {
                    console.error(`[ERROR] Failed to parse ${normalizedLang}.json:`, parseError);
                    
                    // Try with default language
                    if (normalizedLang !== this.defaultLanguage) {
                        return this.directTranslateSync(key, this.defaultLanguage);
                    }
                    return null;
                }
                
                if (translations[key]) {
                    console.log(`[DEBUG] Found direct translation for ${key}: "${translations[key].substring(0, 30)}..."`);
                    
                    // Cache the translation
                    const cacheKey = `t:${normalizedLang}:${key}`;
                    translationCache.set(cacheKey, translations[key], 3600);
                    
                    return translations[key];
                } else {
                    console.warn(`[WARN] Key ${key} not found in ${normalizedLang}.json`);
                    
                    // Try with default language
                    if (normalizedLang !== this.defaultLanguage) {
                        return this.directTranslateSync(key, this.defaultLanguage);
                    }
                }
            } else {
                console.warn(`[WARN] Language file not found: ${filePath}`);
            }
            
            return null;
        } catch (error) {
            console.error(`[ERROR] Direct translation failed:`, error);
            return null;
        }
    }

    /**
     * Async version of directTranslateSync for backward compatibility
     * @param {string} key - Translation key
     * @param {string} lang - Language code
     * @returns {Promise<string|null>} Translation or null if not found
     */
    async directTranslate(key, lang) {
        return this.directTranslateSync(key, lang);
    }
}

// Singleton instance
let instance;

module.exports = (function () {
    if (!instance) {
        instance = new TranslationManager();
        // Initialize in the background
        instance.initialize().catch(err =>
            console.error('Failed to initialize translation system:', err)
        );
    }
    return instance;
})(); 