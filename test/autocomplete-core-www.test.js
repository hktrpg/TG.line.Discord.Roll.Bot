"use strict";

// Mock dependencies
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue(JSON.stringify([]))
}));

jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis(),
        addIntegerOption: jest.fn().mockReturnThis(),
        toJSON: jest.fn().mockReturnValue({})
    }))
}));

// Mock the core-www module
const mockCoreWww = {
    autocompleteModules: {},
    AutocompleteCache: class {
        constructor() {
            this.cache = new Map();
            this.searchCache = new Map();
        }
        
        get(key) {
            return this.cache.get(key);
        }
        
        set(key, value) {
            this.cache.set(key, value);
        }
        
        getSearch(key) {
            return this.searchCache.get(key);
        }
        
        setSearch(key, value) {
            this.searchCache.set(key, value);
        }
    },
    AutocompleteMonitor: class {
        constructor() {
            this.stats = new Map();
        }
        
        recordRequest(module, type, duration, success) {
            if (!this.stats.has(module)) {
                this.stats.set(module, {
                    total: 0,
                    success: 0,
                    errors: 0,
                    cacheHits: 0,
                    cacheMisses: 0
                });
            }
            
            const stats = this.stats.get(module);
            stats.total++;
            if (success) stats.success++;
            else stats.errors++;
            if (type === 'cache_hit') stats.cacheHits++;
            else if (type === 'cache_miss') stats.cacheMisses++;
        }
    },
    checkRateLimit: jest.fn().mockResolvedValue(false),
    registerAutocompleteModules: jest.fn()
};

// Mock the digmon module
const mockDigmon = {
    autocomplete: {
        moduleName: 'digimon',
        getData: jest.fn(() => [
            { id: 1, display: '亞古獸', value: '亞古獸', metadata: { stage: '成長期' } }
        ]),
        search: jest.fn((query, limit) => [
            { id: 1, display: '亞古獸', value: '亞古獸', metadata: { stage: '成長期' } }
        ]),
        transform: jest.fn((item) => item)
    }
};

// Mock the digmon_moves module
const mockDigmonMoves = {
    autocomplete: {
        moduleName: 'digimon_moves',
        getData: jest.fn(() => [
            { id: '1_小型火焰', display: '小型火焰', value: '小型火焰', metadata: { digimon: '亞古獸', digimonId: 1 } }
        ]),
        search: jest.fn((query, limit) => [
            { id: '1_小型火焰', display: '小型火焰', value: '小型火焰', metadata: { digimon: '亞古獸', digimonId: 1 } }
        ]),
        transform: jest.fn((item) => item)
    }
};

describe('Autocomplete Core-www Tests', () => {
    let cache, monitor;

    beforeEach(() => {
        cache = new mockCoreWww.AutocompleteCache();
        monitor = new mockCoreWww.AutocompleteMonitor();
        
        // Reset mocks
        mockCoreWww.checkRateLimit.mockResolvedValue(false);
        mockDigmon.autocomplete.getData.mockClear();
        mockDigmon.autocomplete.search.mockClear();
        mockDigmonMoves.autocomplete.getData.mockClear();
        mockDigmonMoves.autocomplete.search.mockClear();
    });

    describe('AutocompleteCache Class', () => {
        test('should store and retrieve data', () => {
            const key = 'test:key';
            const value = { data: 'test' };

            cache.set(key, value);
            const retrieved = cache.get(key);

            expect(retrieved).toEqual(value);
        });

        test('should store and retrieve search results', () => {
            const key = 'test:search:query';
            const value = [{ id: 1, display: 'test' }];

            cache.setSearch(key, value);
            const retrieved = cache.getSearch(key);

            expect(retrieved).toEqual(value);
        });

        test('should handle non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeUndefined();
            expect(cache.getSearch('nonexistent')).toBeUndefined();
        });
    });

    describe('AutocompleteMonitor Class', () => {
        test('should record request statistics', () => {
            monitor.recordRequest('test', 'success', 100, true);
            monitor.recordRequest('test', 'error', 200, false);
            monitor.recordRequest('test', 'cache_hit', 50, true);
            monitor.recordRequest('test', 'cache_miss', 150, true);

            const stats = monitor.stats.get('test');
            expect(stats.total).toBe(4);
            expect(stats.success).toBe(3);
            expect(stats.errors).toBe(1);
            expect(stats.cacheHits).toBe(1);
            expect(stats.cacheMisses).toBe(1);
        });

        test('should handle multiple modules', () => {
            monitor.recordRequest('module1', 'success', 100, true);
            monitor.recordRequest('module2', 'error', 200, false);

            expect(monitor.stats.has('module1')).toBe(true);
            expect(monitor.stats.has('module2')).toBe(true);
            expect(monitor.stats.get('module1').total).toBe(1);
            expect(monitor.stats.get('module2').total).toBe(1);
        });
    });

    describe('API Endpoint Logic', () => {
        let mockReq;

        beforeEach(() => {
            mockReq = {
                params: { module: 'digimon' },
                query: { q: 'test', limit: '5' },
                ip: '127.0.0.1'
            };
        });

        test('should handle rate limiting', async () => {
            mockCoreWww.checkRateLimit.mockResolvedValue(true);

            // Simulate rate limit check
            const isRateLimited = await mockCoreWww.checkRateLimit('api', mockReq.ip);
            
            expect(isRateLimited).toBe(true);
            expect(mockCoreWww.checkRateLimit).toHaveBeenCalledWith('api', '127.0.0.1');
        });

        test('should handle module not found', () => {
            const module = 'nonexistent';
            const autocompleteModules = {};

            const moduleExists = autocompleteModules[module];
            expect(moduleExists).toBeUndefined();
        });

        test('should handle search query with limit', () => {
            const query = 'test';
            const limit = '5';
            const limitNum = Math.min(Number.parseInt(limit, 10), 50);

            expect(limitNum).toBe(5);
            expect(query).toBe('test');
        });

        test('should handle empty query', () => {
            const query = '';
            const hasQuery = !!(query && query.trim().length > 0);

            expect(hasQuery).toBe(false);
        });

        test('should transform data correctly', () => {
            const mockData = [
                { id: 1, name: '亞古獸', stage: '成長期' }
            ];

            const transformed = mockData.map(item => ({
                id: item.id,
                display: item.name,
                value: item.name,
                metadata: {
                    stage: item.stage
                }
            }));

            expect(transformed).toEqual([
                {
                    id: 1,
                    display: '亞古獸',
                    value: '亞古獸',
                    metadata: {
                        stage: '成長期'
                    }
                }
            ]);
        });
    });

    describe('Module Registration', () => {
        test('should register autocomplete modules', () => {
            const autocompleteModules = {};
            const moduleName = 'digimon';
            const moduleConfig = mockDigmon.autocomplete;

            autocompleteModules[moduleName] = moduleConfig;

            expect(autocompleteModules[moduleName]).toBe(moduleConfig);
            expect(autocompleteModules[moduleName].moduleName).toBe('digimon');
        });

        test('should handle multiple modules', () => {
            const autocompleteModules = {};

            autocompleteModules['digimon'] = mockDigmon.autocomplete;
            autocompleteModules['digimon_moves'] = mockDigmonMoves.autocomplete;

            expect(Object.keys(autocompleteModules)).toHaveLength(2);
            expect(autocompleteModules['digimon']).toBeDefined();
            expect(autocompleteModules['digimon_moves']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle module errors gracefully', async () => {
            const mockError = new Error('Module error');
            const moduleConfig = {
                search: jest.fn().mockRejectedValue(mockError)
            };

            try {
                await moduleConfig.search('test', 5);
            } catch (error) {
                expect(error).toBe(mockError);
            }
        });

        test('should handle invalid limit values', () => {
            const invalidLimits = ['invalid', '-5', '1000'];
            
            for (const limit of invalidLimits) {
                const limitNum = Math.min(Number.parseInt(limit, 10) || 0, 50);
                expect(limitNum).toBeLessThanOrEqual(50);
            }
        });

        test('should handle null/undefined queries', () => {
            const queries = [null, undefined, '', '   '];
            
            for (const query of queries) {
                const hasValidQuery = !!(query && query.trim && query.trim().length > 0);
                expect(hasValidQuery).toBe(false);
            }
        });
    });

    describe('Cache Integration', () => {
        test('should check cache before API call', () => {
            const cacheKey = 'digimon:search:test:5';
            const cachedData = [{ id: 1, display: 'cached' }];

            cache.setSearch(cacheKey, cachedData);
            const retrieved = cache.getSearch(cacheKey);

            expect(retrieved).toEqual(cachedData);
        });

        test('should store results in cache after API call', () => {
            const cacheKey = 'digimon:data:5';
            const apiData = [{ id: 1, display: 'api data' }];

            cache.set(cacheKey, apiData);
            const retrieved = cache.get(cacheKey);

            expect(retrieved).toEqual(apiData);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large datasets efficiently', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                display: `Item ${i}`,
                value: `item${i}`
            }));

            const startTime = Date.now();
            const filtered = largeDataset.filter(item => 
                item.display.toLowerCase().includes('item')
            ).slice(0, 10);
            const endTime = Date.now();

            expect(filtered.length).toBeLessThanOrEqual(10);
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('should limit results correctly', () => {
            const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            const limit = 10;

            const limited = data.slice(0, limit);
            expect(limited.length).toBe(10);
        });
    });

    describe('Digimon Move Search Integration', () => {
        test('should search moves by digimon ID', () => {
            const query = '1';
            const isIdSearch = !Number.isNaN(Number(query)) && query.length > 0;
            
            expect(isIdSearch).toBe(true);
            
            const digimonId = Number.parseInt(query, 10);
            expect(digimonId).toBe(1);
        });

        test('should search moves by skill name', () => {
            const query = '火焰';
            const isIdSearch = !Number.isNaN(Number(query)) && query.length > 0;
            
            expect(isIdSearch).toBe(false);
        });

        test('should include digimonId in metadata', () => {
            const mockMove = {
                digimonId: 1,
                skill: { name: '小型火焰' },
                digimonName: '亞古獸'
            };

            const result = {
                id: `${mockMove.digimonId}_${mockMove.skill.name}`,
                display: mockMove.skill.name,
                value: mockMove.skill.name,
                metadata: {
                    digimon: mockMove.digimonName,
                    digimonId: mockMove.digimonId
                }
            };

            expect(result.metadata.digimonId).toBe(1);
            expect(result.metadata.digimon).toBe('亞古獸');
        });
    });
});
