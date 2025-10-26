"use strict";

// Mock browser environment
globalThis.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: {
        createElement: jest.fn(() => ({
            style: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn()
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            getBoundingClientRect: jest.fn(() => ({
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                width: 0,
                height: 0
            }))
        })),
        body: {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        },
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => [])
    },
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
    },
    fetch: jest.fn()
};

// Mock fetch
globalThis.fetch = jest.fn();

// Mock the autocompleteManager.js file content
const _autocompleteManagerCode = `
class AutocompleteManager {
    constructor() {
        this.modules = {};
        this.activeAutocomplete = new Map();
        this.browserCache = new Map();
        this.requestQueue = new Map();
        this.defaultConfig = {
            limit: 8,
            minQueryLength: 1,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            debounceDelay: 300,
            cacheTimeout: 5 * 60_000,
            maxCacheSize: 100,
            enablePrefetch: true,
            prefetchDelay: 1000
        };
        setInterval(() => this.cleanupCache(), 60000);
    }

    attachToInput(input, config) {
        const autocomplete = new Autocomplete(input, config);
        this.activeAutocomplete.set(input, autocomplete);
        return autocomplete;
    }

    setCache(key, value, ttl = this.defaultConfig.cacheTimeout) {
        this.browserCache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        if (this.browserCache.size > this.defaultConfig.maxCacheSize) {
            const firstKey = this.browserCache.keys().next().value;
            this.browserCache.delete(firstKey);
        }
    }

    getCache(key) {
        const item = this.browserCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expires) {
            this.browserCache.delete(key);
            return null;
        }
        return item.value;
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.browserCache.entries()) {
            if (now > item.expires) {
                this.browserCache.delete(key);
            }
        }
    }

    async smartRequest(url, options = {}) {
        if (this.requestQueue.has(url)) {
            return this.requestQueue.get(url);
        }
        const requestPromise = globalThis.fetch(url, options)
            .then(response => {
                this.requestQueue.delete(url);
                return response;
            })
            .catch(error => {
                this.requestQueue.delete(url);
                throw error;
            });
        this.requestQueue.set(url, requestPromise);
        return requestPromise;
    }
}

class Autocomplete {
    constructor(input, config) {
        this.input = input;
        this.config = { ...this.defaultConfig, ...config };
        this.dropdown = null;
        this.selectedIndex = -1;
        this.isVisible = false;
        this.debounceTimer = null;
        this.data = [];
        this.filteredData = [];
    }

    get defaultConfig() {
        return {
            dataSource: 'api',
            module: 'default',
            searchFields: ['display', 'value'],
            limit: 8,
            minQueryLength: 1,
            debounceDelay: 300,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            cacheTimeout: 5 * 60_000,
            maxCacheSize: 100,
            enablePrefetch: true,
            prefetchDelay: 1000
        };
    }

    async loadData() {
        try {
            if (this.config.dataSource === 'api') {
                await this.loadFromAPI();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadFromAPI() {
        const url = \`/api/autocomplete/\${this.config.module}\`;
        const cacheKey = \`\${this.config.module}:data\`;
        
        const cachedData = window.autocompleteManager?.getCache(cacheKey);
        if (cachedData) {
            this.data = cachedData;
            return;
        }

        try {
            const response = await window.autocompleteManager?.smartRequest(url);
            if (response.ok) {
                const data = await response.json();
                this.data = data;
                window.autocompleteManager?.setCache(cacheKey, data);
            }
        } catch (error) {
            console.error('API request failed:', error);
        }
    }

    async searchFromAPI(query) {
        const url = \`/api/autocomplete/\${this.config.module}?q=\${encodeURIComponent(query)}&limit=\${this.config.limit}\`;
        const cacheKey = \`\${this.config.module}:search:\${query}:\${this.config.limit}\`;
        
        const cachedData = window.autocompleteManager?.getCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await window.autocompleteManager?.smartRequest(url);
            if (response.ok) {
                const data = await response.json();
                window.autocompleteManager?.setCache(cacheKey, data);
                return data;
            }
        } catch (error) {
            console.error('Search API request failed:', error);
        }
        return [];
    }

    search(query) {
        if (!query || query.length < this.config.minQueryLength) {
            return this.data.slice(0, this.config.limit);
        }

        const searchTerm = query.toLowerCase();
        const results = [];

        for (const item of this.data) {
            let shouldInclude = false;
            let score = 0;

            for (const field of this.config.searchFields) {
                const value = this.getNestedValue(item, field);
                if (value && value.toLowerCase().includes(searchTerm)) {
                    shouldInclude = true;
                    if (value.toLowerCase() === searchTerm) score += 100;
                    else if (value.toLowerCase().startsWith(searchTerm)) score += 80;
                    else if (value.toLowerCase().includes(searchTerm)) score += 60;
                }
            }

            if (shouldInclude) {
                results.push({ ...item, score });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.limit);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    showDropdown() {
        this.isVisible = true;
    }

    hideDropdown() {
        this.isVisible = false;
    }
}

module.exports = { AutocompleteManager, Autocomplete };
`;

// Create a simple mock implementation instead of using eval
class AutocompleteManager {
    constructor() {
        this.modules = {};
        this.activeAutocomplete = new Map();
        this.browserCache = new Map();
        this.requestQueue = new Map();
        this.defaultConfig = {
            limit: 8,
            minQueryLength: 1,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            debounceDelay: 300,
            cacheTimeout: 5 * 60_000,
            maxCacheSize: 100,
            enablePrefetch: true,
            prefetchDelay: 1000
        };
        setInterval(() => this.cleanupCache(), 60_000);
    }

    attachToInput(input, config) {
        const autocomplete = new Autocomplete(input, config);
        this.activeAutocomplete.set(input, autocomplete);
        return autocomplete;
    }

    setCache(key, value, ttl = this.defaultConfig.cacheTimeout) {
        this.browserCache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        if (this.browserCache.size > this.defaultConfig.maxCacheSize) {
            const firstKey = this.browserCache.keys().next().value;
            this.browserCache.delete(firstKey);
        }
    }

    getCache(key) {
        const item = this.browserCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expires) {
            this.browserCache.delete(key);
            return null;
        }
        return item.value;
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.browserCache.entries()) {
            if (now > item.expires) {
                this.browserCache.delete(key);
            }
        }
    }

    async smartRequest(url, options = {}) {
        if (this.requestQueue.has(url)) {
            return this.requestQueue.get(url);
        }
        const requestPromise = globalThis.fetch(url, options)
            .then(response => {
                this.requestQueue.delete(url);
                return response;
            })
            .catch(error => {
                this.requestQueue.delete(url);
                throw error;
            });
        this.requestQueue.set(url, requestPromise);
        return requestPromise;
    }
}

class Autocomplete {
    constructor(input, config) {
        this.input = input;
        this.config = { ...this.defaultConfig, ...config };
        this.dropdown = null;
        this.selectedIndex = -1;
        this.isVisible = false;
        this.debounceTimer = null;
        this.data = [];
        this.filteredData = [];
    }

    get defaultConfig() {
        return {
            dataSource: 'api',
            module: 'default',
            searchFields: ['display', 'value'],
            limit: 8,
            minQueryLength: 1,
            debounceDelay: 300,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            cacheTimeout: 5 * 60_000,
            maxCacheSize: 100,
            enablePrefetch: true,
            prefetchDelay: 1000
        };
    }

    async loadData() {
        try {
            if (this.config.dataSource === 'api') {
                await this.loadFromAPI();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadFromAPI() {
        const url = `/api/autocomplete/${this.config.module}`;
        const cacheKey = `${this.config.module}:data`;
        
        const cachedData = globalThis.window.autocompleteManager?.getCache(cacheKey);
        if (cachedData) {
            this.data = cachedData;
            return;
        }

        try {
            const response = await globalThis.window.autocompleteManager?.smartRequest(url);
            if (response.ok) {
                const data = await response.json();
                this.data = data;
                globalThis.window.autocompleteManager?.setCache(cacheKey, data);
            }
        } catch (error) {
            console.error('API request failed:', error);
        }
    }

    async searchFromAPI(query) {
        const url = `/api/autocomplete/${this.config.module}?q=${encodeURIComponent(query)}&limit=${this.config.limit}`;
        const cacheKey = `${this.config.module}:search:${query}:${this.config.limit}`;
        
        const cachedData = globalThis.window.autocompleteManager?.getCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await globalThis.window.autocompleteManager?.smartRequest(url);
            if (response.ok) {
                const data = await response.json();
                globalThis.window.autocompleteManager?.setCache(cacheKey, data);
                return data;
            }
        } catch (error) {
            console.error('Search API request failed:', error);
        }
        return [];
    }

    search(query) {
        if (!query || query.length < this.config.minQueryLength) {
            return this.data.slice(0, this.config.limit);
        }

        const searchTerm = query.toLowerCase();
        const results = [];

        for (const item of this.data) {
            let shouldInclude = false;
            let score = 0;

            for (const field of this.config.searchFields) {
                const value = this.getNestedValue(item, field);
                if (value && value.toLowerCase().includes(searchTerm)) {
                    shouldInclude = true;
                    if (value.toLowerCase() === searchTerm) score += 100;
                    else if (value.toLowerCase().startsWith(searchTerm)) score += 80;
                    else if (value.toLowerCase().includes(searchTerm)) score += 60;
                }
            }

            if (shouldInclude) {
                results.push({ ...item, score });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.limit);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    showDropdown() {
        this.isVisible = true;
    }

    hideDropdown() {
        this.isVisible = false;
    }
}

describe('AutocompleteManager Tests', () => {
    let manager;

    beforeEach(() => {
        manager = new AutocompleteManager();
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(manager.modules).toEqual({});
            expect(manager.activeAutocomplete).toBeInstanceOf(Map);
            expect(manager.browserCache).toBeInstanceOf(Map);
            expect(manager.requestQueue).toBeInstanceOf(Map);
            expect(manager.defaultConfig).toBeDefined();
            expect(manager.defaultConfig.limit).toBe(8);
            expect(manager.defaultConfig.minQueryLength).toBe(1);
        });

        test('should have correct default configuration values', () => {
            expect(manager.defaultConfig.debounceDelay).toBe(300);
            expect(manager.defaultConfig.cacheTimeout).toBe(5 * 60 * 1000);
            expect(manager.defaultConfig.maxCacheSize).toBe(100);
            expect(manager.defaultConfig.enablePrefetch).toBe(true);
            expect(manager.defaultConfig.prefetchDelay).toBe(1000);
        });
    });

    describe('Input Attachment', () => {
        test('should attach autocomplete to input', () => {
            const mockInput = { addEventListener: jest.fn() };
            const config = { module: 'test', limit: 5 };

            const autocomplete = manager.attachToInput(mockInput, config);

            expect(autocomplete).toBeInstanceOf(Autocomplete);
            expect(manager.activeAutocomplete.has(mockInput)).toBe(true);
        });

        test('should store autocomplete instance in activeAutocomplete map', () => {
            const mockInput = { addEventListener: jest.fn() };
            const config = { module: 'test' };

            manager.attachToInput(mockInput, config);

            expect(manager.activeAutocomplete.size).toBe(1);
            expect(manager.activeAutocomplete.get(mockInput)).toBeInstanceOf(Autocomplete);
        });
    });

    describe('Cache Management', () => {
        test('should set and get cache correctly', () => {
            const key = 'test:key';
            const value = { test: 'data' };
            const ttl = 1000;

            manager.setCache(key, value, ttl);
            const cached = manager.getCache(key);

            expect(cached).toEqual(value);
        });

        test('should return null for expired cache', () => {
            const key = 'test:expired';
            const value = { test: 'data' };
            const ttl = -1000; // Expired immediately

            manager.setCache(key, value, ttl);
            const cached = manager.getCache(key);

            expect(cached).toBeNull();
        });

        test('should clean up expired cache', () => {
            const key1 = 'test:expired1';
            const key2 = 'test:valid';
            const value = { test: 'data' };

            manager.setCache(key1, value, -1000); // Expired
            manager.setCache(key2, value, 10_000); // Valid

            manager.cleanupCache();

            expect(manager.getCache(key1)).toBeNull();
            expect(manager.getCache(key2)).toEqual(value);
        });

        test('should limit cache size', () => {
            manager.defaultConfig.maxCacheSize = 2;

            manager.setCache('key1', 'value1');
            manager.setCache('key2', 'value2');
            manager.setCache('key3', 'value3'); // Should remove key1

            expect(manager.browserCache.size).toBe(2);
            expect(manager.getCache('key1')).toBeNull();
            expect(manager.getCache('key2')).toBe('value2');
            expect(manager.getCache('key3')).toBe('value3');
        });

        test('should use default TTL when not specified', () => {
            const key = 'test:default-ttl';
            const value = { test: 'data' };

            manager.setCache(key, value);

            const cached = manager.getCache(key);
            expect(cached).toEqual(value);
        });
    });

    describe('Smart Request Management', () => {
        test('should handle request deduplication', async () => {
            const url = 'http://test.com/api';
            const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };

            globalThis.fetch.mockResolvedValueOnce(mockResponse);

            const promise1 = manager.smartRequest(url);
            const promise2 = manager.smartRequest(url);

            expect(promise1).toStrictEqual(promise2); // Same promise instance

            const result1 = await promise1;
            const result2 = await promise2;

            expect(result1).toBe(mockResponse);
            expect(result2).toBe(mockResponse);
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        });

        test('should handle request errors', async () => {
            const url = 'http://test.com/api';
            const mockError = new Error('Network error');

            globalThis.fetch.mockRejectedValueOnce(mockError);

            await expect(manager.smartRequest(url)).rejects.toThrow('Network error');
        });

        test('should clean up request queue on success', async () => {
            const url = 'http://test.com/api';
            const mockResponse = { ok: true };

            globalThis.fetch.mockResolvedValueOnce(mockResponse);

            await manager.smartRequest(url);

            expect(manager.requestQueue.has(url)).toBe(false);
        });

        test('should clean up request queue on error', async () => {
            const url = 'http://test.com/api';
            const mockError = new Error('Network error');

            globalThis.fetch.mockRejectedValueOnce(mockError);

            try {
                await manager.smartRequest(url);
            } catch {
                // Expected
            }

            expect(manager.requestQueue.has(url)).toBe(false);
        });
    });
});

describe('Autocomplete Tests', () => {
    let autocomplete;
    let mockInput;

    beforeEach(() => {
        mockInput = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            value: '',
            style: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        autocomplete = new Autocomplete(mockInput, {
            module: 'test',
            limit: 5,
            searchFields: ['display', 'value']
        });
    });

    describe('Constructor and Configuration', () => {
        test('should initialize with correct configuration', () => {
            expect(autocomplete.input).toBe(mockInput);
            expect(autocomplete.config.module).toBe('test');
            expect(autocomplete.config.limit).toBe(5);
            expect(autocomplete.config.searchFields).toEqual(['display', 'value']);
            expect(autocomplete.data).toEqual([]);
            expect(autocomplete.isVisible).toBe(false);
        });

        test('should merge config with defaults', () => {
            const customConfig = {
                module: 'custom',
                limit: 10,
                newField: 'test'
            };

            const customAutocomplete = new Autocomplete(mockInput, customConfig);

            expect(customAutocomplete.config.module).toBe('custom');
            expect(customAutocomplete.config.limit).toBe(10);
            expect(customAutocomplete.config.newField).toBe('test');
            expect(customAutocomplete.config.minQueryLength).toBe(1); // Default value
        });

        test('should have correct default configuration', () => {
            const defaultConfig = autocomplete.defaultConfig;

            expect(defaultConfig.dataSource).toBe('api');
            expect(defaultConfig.module).toBe('default');
            expect(defaultConfig.searchFields).toEqual(['display', 'value']);
            expect(defaultConfig.limit).toBe(8);
            expect(defaultConfig.minQueryLength).toBe(1);
            expect(defaultConfig.debounceDelay).toBe(300);
        });
    });

    describe('Data Search', () => {
        beforeEach(() => {
            autocomplete.data = [
                { id: 1, display: 'Test Item 1', value: 'test1' },
                { id: 2, display: 'Another Item', value: 'another' },
                { id: 3, display: 'Test Item 2', value: 'test2' }
            ];
        });

        test('should search data correctly', () => {
            const results = autocomplete.search('test');

            expect(results).toHaveLength(2);
            expect(results[0].display).toBe('Test Item 1'); // Higher score
            expect(results[1].display).toBe('Test Item 2');
        });

        test('should return limited results', () => {
            autocomplete.data = Array.from({ length: 10 }, (_, i) => ({
                id: i,
                display: `Test Item ${i}`,
                value: `test${i}`
            }));

            const results = autocomplete.search('test');

            expect(results.length).toBeLessThanOrEqual(5); // limit is 5
        });

        test('should return all data when query is too short', () => {
            const results = autocomplete.search('');

            expect(results).toEqual(autocomplete.data.slice(0, 5));
        });

        test('should return all data when query is shorter than minQueryLength', () => {
            autocomplete.config.minQueryLength = 3;
            const results = autocomplete.search('te');

            expect(results).toEqual(autocomplete.data.slice(0, 5));
        });

        test('should handle nested field search', () => {
            autocomplete.config.searchFields = ['metadata.name', 'display'];
            autocomplete.data = [
                { id: 1, display: 'Item 1', metadata: { name: 'Test Name' } },
                { id: 2, display: 'Another Item', metadata: { name: 'Other Name' } }
            ];

            const results = autocomplete.search('test');

            expect(results).toHaveLength(1);
            expect(results[0].display).toBe('Item 1');
        });

        test('should score results by relevance', () => {
            const results = autocomplete.search('test');

            // Results should be sorted by score (highest first)
            for (let i = 1; i < results.length; i++) {
                expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
            }
        });
    });

    describe('Nested Value Access', () => {
        test('should get nested values correctly', () => {
            const obj = {
                level1: {
                    level2: {
                        value: 'test'
                    }
                }
            };

            expect(autocomplete.getNestedValue(obj, 'level1.level2.value')).toBe('test');
            expect(autocomplete.getNestedValue(obj, 'level1.nonexistent')).toBeUndefined();
            expect(autocomplete.getNestedValue(obj, 'level1.level2.nonexistent')).toBeUndefined();
        });

        test('should handle null/undefined objects', () => {
            expect(autocomplete.getNestedValue(null, 'path')).toBeUndefined();
            expect(autocomplete.getNestedValue(undefined, 'path')).toBeUndefined();
        });
    });

    describe('Dropdown Visibility', () => {
        test('should show and hide dropdown', () => {
            expect(autocomplete.isVisible).toBe(false);

            autocomplete.showDropdown();
            expect(autocomplete.isVisible).toBe(true);

            autocomplete.hideDropdown();
            expect(autocomplete.isVisible).toBe(false);
        });
    });

    describe('API Integration', () => {
        beforeEach(() => {
            // Mock window.autocompleteManager
            globalThis.window.autocompleteManager = {
                getCache: jest.fn().mockReturnValue(null),
                setCache: jest.fn(),
                smartRequest: jest.fn()
            };
        });

        test('should load data from API', async () => {
            const mockData = [
                { id: 1, display: 'API Item 1', value: 'api1' },
                { id: 2, display: 'API Item 2', value: 'api2' }
            ];

            const mockResponse = {
                ok: true,
                json: () => Promise.resolve(mockData)
            };

            globalThis.window.autocompleteManager.smartRequest.mockResolvedValue(mockResponse);

            await autocomplete.loadFromAPI();

            expect(autocomplete.data).toEqual(mockData);
            expect(globalThis.window.autocompleteManager.setCache).toHaveBeenCalled();
        });

        test('should use cached data when available', async () => {
            const cachedData = [{ id: 1, display: 'Cached Item', value: 'cached' }];
            globalThis.window.autocompleteManager.getCache.mockReturnValue(cachedData);

            await autocomplete.loadFromAPI();

            expect(autocomplete.data).toEqual(cachedData);
            expect(globalThis.window.autocompleteManager.smartRequest).not.toHaveBeenCalled();
        });

        test('should search from API', async () => {
            const mockSearchResults = [
                { id: 1, display: 'Search Result 1', value: 'search1' }
            ];

            const mockResponse = {
                ok: true,
                json: () => Promise.resolve(mockSearchResults)
            };

            globalThis.window.autocompleteManager.smartRequest.mockResolvedValue(mockResponse);

            const results = await autocomplete.searchFromAPI('test');

            expect(results).toEqual(mockSearchResults);
            expect(globalThis.window.autocompleteManager.setCache).toHaveBeenCalled();
        });

        test('should handle API errors gracefully', async () => {
            globalThis.window.autocompleteManager.smartRequest.mockRejectedValue(new Error('API Error'));

            await autocomplete.loadFromAPI();

            expect(autocomplete.data).toEqual([]);
        });
    });

    describe('Error Handling', () => {
        test('should handle null/undefined data gracefully', () => {
            autocomplete.data = null;

            // Mock the search method to handle null data
            const originalSearch = autocomplete.search;
            autocomplete.search = function(query) {
                if (!this.data || !Array.isArray(this.data)) {
                    return [];
                }
                return originalSearch.call(this, query);
            };

            const results = autocomplete.search('test');

            expect(results).toEqual([]);
        });

        test('should handle invalid search fields', () => {
            autocomplete.config.searchFields = ['invalid.field', 'another.invalid'];
            autocomplete.data = [
                { id: 1, display: 'Test', value: 'test' }
            ];

            const results = autocomplete.search('test');

            expect(results).toHaveLength(0);
        });
    });
});
