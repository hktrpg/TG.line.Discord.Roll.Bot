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
const LANGUAGES = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

class TranslationManager {
  constructor() {
    this.initialized = false;
    this.supportedLanguages = LANGUAGES;
    this.defaultLanguage = DEFAULT_LANGUAGE;
    this.missingKeys = new Map();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load i18next with the backend plugin
      await i18next
        .use(Backend)
        .init({
          // Core settings
          lng: DEFAULT_LANGUAGE,
          fallbackLng: DEFAULT_LANGUAGE,
          supportedLngs: LANGUAGES,
          
          // Simpler backend with one file per language
          backend: {
            loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
          },
          
          // Performance settings
          load: 'languageOnly',
          preload: [DEFAULT_LANGUAGE], // Only preload default language
          
          // Debug options (disable in production)
          debug: process.env.DEBUG === 'true',
          
          // Interpolation settings
          interpolation: {
            escapeValue: false
          },
          
          // Missing key handling
          saveMissing: process.env.NODE_ENV === 'development',
          missingKeyHandler: (lngs, ns, key) => {
            this.trackMissingKey(lngs[0], key);
          }
        });

      // Add custom caching layer
      const originalBackendGet = i18next.services.backendConnector.backend.read;
      i18next.services.backendConnector.backend.read = (language, namespace, callback) => {
        const cacheKey = `translations:${language}`;
        const cachedData = translationCache.get(cacheKey);
        
        if (cachedData) {
          return callback(null, cachedData);
        }
        
        originalBackendGet(language, namespace, (err, data) => {
          if (!err && data) {
            translationCache.set(cacheKey, data);
          }
          callback(err, data);
        });
      };
      
      // Mark as initialized
      this.initialized = true;
      this.loadedLanguages = new Set([DEFAULT_LANGUAGE]);
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
    
    // If explicit language provided, use it
    if (language) {
      console.log('[DEBUG] Using explicit language:', language);
      return this._translateWithLanguage(key, language, values);
    }
    
    // If userid is provided but no language, try to get from cache first
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
    
    // Default fallback
    console.log('[DEBUG] Using default language:', this.defaultLanguage);
    return this._translateWithLanguage(key, this.defaultLanguage, values);
  }
  
  /**
   * Internal method to perform translation with a specific language
   * @private
   */
  _translateWithLanguage(key, language, values) {
    // Special case direct handling for language.help to fix issues
    if (key === 'language.help') {
      console.log('[DEBUG] Direct handling of language.help for language:', language);
      
      // Direct hardcoded translations for common languages
      if (language.toLowerCase() === 'zh-tw') {
        const helpZhTW = "【🌐語言設定】\n╭────── ℹ️說明 ──────\n│ 查看可用語言:\n│ .lang list\n│ \n│ 設置語言:\n│ .lang [語言代碼]\n│ 或\n│ .language set [語言代碼]\n│ 例如: .lang zh-TW\n│ 例如: .language set zh-tw\n│ \n│ 目前支持的語言:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";
        return this._handlePlaceholders(helpZhTW, values);
      }
      
      // Default English version as fallback
      const helpEN = "【🌐Language Settings】\n╭────── ℹ️Instructions ──────\n│ View available languages:\n│ .lang list\n│ \n│ Set language:\n│ .lang [language code]\n│ or\n│ .language set [language code]\n│ Example: .lang en\n│ Example: .language set zh-tw\n│ \n│ Currently supported languages:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";
      
      if (language === 'en' || !language) {
        return this._handlePlaceholders(helpEN, values);
      }
      
      // If we've gotten this far, try the normal translation path
    }
    
    // Check if initialized, if not return the key
    if (!this.initialized) {
      return this._handlePlaceholders(key, values);
    }
    
    // Ensure we have a valid language with proper case
    const validLanguage = this.isSupported(language) ? 
                          this.getNormalizedLanguage(language) : 
                          this.defaultLanguage;
    
    // Get from cache first
    const cacheKey = `t:${validLanguage}:${key}`;
    const cachedTranslation = translationCache.get(cacheKey);
    
    if (cachedTranslation) {
      return this._handlePlaceholders(cachedTranslation, values);
    }
    
    // Load language if not loaded
    if (!this.loadedLanguages.has(validLanguage)) {
      this.loadLanguage(validLanguage); // Start loading asynchronously
      // Fall back to default language for now
      return i18next.t(key, {
        lng: this.defaultLanguage,
        ...values
      });
    }
    
    // Get from i18next
    const translation = i18next.t(key, {
      lng: validLanguage,
      ...values
    });
    
    // Cache the translation if it's not the key itself (fallback)
    if (translation && translation !== key) {
      translationCache.set(cacheKey, translation);
    }
    
    return this._handlePlaceholders(translation, values);
  }
  
  /**
   * Handle placeholders in translated text
   * @private
   */
  _handlePlaceholders(text, values) {
    if (!values || Object.keys(values).length === 0) return text;
    
    // Replace placeholders with values
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] !== undefined ? values[key] : `{{${key}}}`;
    });
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
      
      // Check cache first
      const cacheKey = `userLang:${userData.userid}`;
      const cachedLang = translationCache.get(cacheKey);
      if (cachedLang) {
        console.log(`[DEBUG] Got cached language for user ${userData.userid}: ${cachedLang}`);
        return cachedLang;
      }
      
      // Get from database through records module
      const records = require('./records');
      console.log(`[DEBUG] Fetching language from database for user ${userData.userid}`);
      const userLang = await records.getUserLanguage(userData.userid, this.defaultLanguage);
      
      console.log(`[DEBUG] Database returned language for user ${userData.userid}: ${userLang || this.defaultLanguage}`);
      
      // Cache the result
      if (userLang) {
        translationCache.set(cacheKey, userLang, 3600); // 1 hour cache
        console.log(`[DEBUG] Cached language for user ${userData.userid}: ${userLang}`);
      }
      
      return userLang || this.defaultLanguage;
    } catch (error) {
      console.error('[ERROR] Error getting user language:', error);
      return this.defaultLanguage;
    }
  }
  
  /**
   * Load language data
   * @param {string} lang - Language code to load
   */
  async loadLanguage(lang) {
    if (!this.isSupported(lang) || this.loadedLanguages.has(lang)) return;
    
    try {
      await i18next.loadLanguages(lang);
      this.loadedLanguages.add(lang);
      console.log(`Loaded language: ${lang}`);
    } catch (error) {
      console.error(`Failed to load language ${lang}:`, error);
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
    // Clear specific language or all languages from cache
    if (lng) {
      const keysToDelete = translationCache.keys().filter(key => 
        key.startsWith(`t:${lng}:`) || key === `translations:${lng}`
      );
      keysToDelete.forEach(key => translationCache.del(key));
    } else {
      translationCache.flushAll();
    }
    
    // Reload from files
    await i18next.reloadResources(lng);
    console.log(`Reloaded translations: ${lng || 'all languages'}`);
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
   * Clear user language cache for a specific user or all users
   * @param {string} [userid] - User ID (or null to clear all user caches)
   */
  clearUserCache(userid = null) {
    if (userid) {
      // Clear specific user's cache
      const cacheKey = `userLang:${userid}`;
      translationCache.del(cacheKey);
      console.log(`[i18n] Cleared language cache for user: ${userid}`);
    } else {
      // Clear all user language caches
      const userCacheKeys = translationCache.keys().filter(key => key.startsWith('userLang:'));
      userCacheKeys.forEach(key => translationCache.del(key));
      console.log(`[i18n] Cleared language cache for all users (${userCacheKeys.length} entries)`);
    }
  }
}

// Singleton instance
let instance;

module.exports = (function() {
  if (!instance) {
    instance = new TranslationManager();
    // Initialize in the background
    instance.initialize().catch(err => 
      console.error('Failed to initialize translation system:', err)
    );
  }
  return instance;
})(); 