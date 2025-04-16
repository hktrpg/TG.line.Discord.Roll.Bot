"use strict";
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');
const schema = require('./schema.js');

class I18nManager {
    constructor() {
        this.cache = new Map();
        this.defaultLanguage = 'zh-TW';
        this.supportedLanguages = ['zh-TW', 'en'];
        this.initialized = false;
        this.namespaces = ['coc', 'common'];
    }

    async initialize() {
        await i18next
            .use(Backend)
            .init({
                backend: {
                    loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
                },
                fallbackLng: this.defaultLanguage,
                supportedLngs: this.supportedLanguages,
                ns: this.namespaces,
                defaultNS: 'common',
                preload: this.supportedLanguages,
                load: 'all',
                cache: {
                    enabled: true,
                    ttl: 24 * 60 * 60 * 1000, // 24小時
                    prefix: 'i18next_res_'
                },
                interpolation: {
                    escapeValue: false
                }
            });

        this.initialized = true;
        console.log('I18n system initialized');
    }

    async setUserLanguage(userId, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error('Unsupported language');
        }

        await schema.userPreference.findOneAndUpdate(
            { userId },
            { language },
            { upsert: true }
        ).catch(error => console.error('i18n setUserLanguage error:', error));

        this.cache.set(`user_lang_${userId}`, language);
    }

    async getUserLanguage(userId) {
        const cachedLang = this.cache.get(`user_lang_${userId}`);
        if (cachedLang) return cachedLang;

        const userPref = await schema.userPreference.findOne({ userId })
            .catch(error => console.error('i18n getUserLanguage error:', error));
        const language = userPref?.language || this.defaultLanguage;
        
        this.cache.set(`user_lang_${userId}`, language);
        return language;
    }

    async translate(key, options = {}, userId = null) {
        if (!this.initialized) {
            await this.initialize();
        }

        const language = userId ? 
            await this.getUserLanguage(userId) : 
            this.defaultLanguage;

        return i18next.t(key, { lng: language, ...options });
    }

    async translateMultiple(keys, options = {}, userId = null) {
        const language = userId ? 
            await this.getUserLanguage(userId) : 
            this.defaultLanguage;

        return Promise.all(
            keys.map(key => this.translate(key, options, language))
        );
    }

    clearCache() {
        this.cache.clear();
    }

    // 用於定期清理過期的快取
    startCacheCleanup(interval = 3600000) { // 預設1小時清理一次
        setInterval(() => {
            this.clearCache();
        }, interval);
    }
}

// 建立單例
const i18nManager = new I18nManager();

// 啟動快取清理
i18nManager.startCacheCleanup();

module.exports = i18nManager; 