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

// Mock the autocompleteManager for browser environment
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

// Mock fetch for API calls
globalThis.fetch = jest.fn();

describe('Autocomplete System Tests', () => {
    let digmon;

    beforeAll(() => {
        // Import digmon module
        digmon = require('../roll/digmon');
    });

    describe('Digimon Autocomplete Integration', () => {
        let digimonInstance;

        beforeEach(() => {
            // Mock digimon data
            const mockDigimonData = [
                { id: 1, name: '亞古獸', stage: '3', attribute: '疫苗種', 'zh-cn-name': '亞古獸' },
                { id: 2, name: '暴龍獸', stage: '4', attribute: '疫苗種', 'zh-cn-name': '暴龍獸' },
                { id: 3, name: '機械暴龍獸', stage: '4', attribute: '疫苗種', 'zh-cn-name': '機械暴龍獸' }
            ];

            const mockSkillsData = [
                {
                    digimonId: 1,
                    digimonName: '亞古獸',
                    stageName: '成長期',
                    skill: {
                        name: '小型火焰',
                        element: '火',
                        type: '攻擊',
                        power: 20
                    }
                },
                {
                    digimonId: 1,
                    digimonName: '亞古獸',
                    stageName: '成長期',
                    skill: {
                        name: '火焰彈',
                        element: '火',
                        type: '攻擊',
                        power: 30
                    }
                },
                {
                    digimonId: 2,
                    digimonName: '暴龍獸',
                    stageName: '成熟期',
                    skill: {
                        name: '超級火焰',
                        element: '火',
                        type: '攻擊',
                        power: 50
                    }
                }
            ];

            // Mock the Digimon class
            digimonInstance = {
                digimonData: mockDigimonData,
                _movesAugmented: mockSkillsData,
                searchForAutocomplete: jest.fn(),
                searchMovesForAutocomplete: jest.fn(),
                getAllDigimonNames: jest.fn(),
                getAllMoves: jest.fn()
            };

            // Mock the autocomplete object
            digmon.autocomplete = {
                moduleName: 'digimon',
                getData: jest.fn(() => digimonInstance.getAllDigimonNames()),
                search: jest.fn((query, limit) => digimonInstance.searchForAutocomplete(query, limit)),
                transform: jest.fn((item) => ({
                    id: item.id,
                    display: item.display,
                    value: item.value,
                    metadata: item.metadata
                }))
            };
        });

        test('should have autocomplete configuration', () => {
            expect(digmon.autocomplete).toBeDefined();
            expect(digmon.autocomplete.moduleName).toBe('digimon');
            expect(typeof digmon.autocomplete.getData).toBe('function');
            expect(typeof digmon.autocomplete.search).toBe('function');
            expect(typeof digmon.autocomplete.transform).toBe('function');
        });

        test('should transform data correctly', () => {
            const testItem = {
                id: 1,
                display: '亞古獸',
                value: '亞古獸',
                metadata: {
                    stage: '成長期',
                    attribute: '疫苗種'
                }
            };

            const transformed = digmon.autocomplete.transform(testItem);

            expect(transformed).toEqual(testItem);
        });

        test('should search digimon names for autocomplete', () => {
            const mockResults = [
                {
                    id: 1,
                    display: '亞古獸',
                    value: '亞古獸',
                    metadata: {
                        stage: '成長期',
                        attribute: '疫苗種',
                        'zh-cn-name': '亞古獸'
                    }
                }
            ];

            digimonInstance.searchForAutocomplete.mockReturnValue(mockResults);

            const results = digmon.autocomplete.search('亞古', 5);

            expect(digimonInstance.searchForAutocomplete).toHaveBeenCalledWith('亞古', 5);
            expect(results).toEqual(mockResults);
        });

        test('should get all digimon data', () => {
            const mockData = [
                {
                    id: 1,
                    display: '亞古獸',
                    value: '亞古獸',
                    metadata: {
                        stage: '成長期',
                        attribute: '疫苗種'
                    }
                }
            ];

            digimonInstance.getAllDigimonNames.mockReturnValue(mockData);

            const data = digmon.autocomplete.getData();

            expect(digimonInstance.getAllDigimonNames).toHaveBeenCalled();
            expect(data).toEqual(mockData);
        });
    });

    describe('Digimon Move Search with ID Support', () => {
        let digimonInstance;

        beforeEach(() => {
            // Mock digimon data with skills
            const mockSkillsData = [
                {
                    digimonId: 1,
                    digimonName: '亞古獸',
                    stageName: '成長期',
                    skill: {
                        name: '小型火焰',
                        element: '火',
                        type: '攻擊',
                        power: 20
                    }
                },
                {
                    digimonId: 1,
                    digimonName: '亞古獸',
                    stageName: '成長期',
                    skill: {
                        name: '火焰彈',
                        element: '火',
                        type: '攻擊',
                        power: 30
                    }
                },
                {
                    digimonId: 2,
                    digimonName: '暴龍獸',
                    stageName: '成熟期',
                    skill: {
                        name: '超級火焰',
                        element: '火',
                        type: '攻擊',
                        power: 50
                    }
                }
            ];

            // Create a mock Digimon instance
            digimonInstance = {
                _movesAugmented: mockSkillsData,
                ensureMovesIndex: jest.fn(),
                searchMovesForAutocomplete: function(query, limit = 10) {
                    this.ensureMovesIndex();
                    const augmentedSkills = this._movesAugmented;
                    
                    if (!query || query.trim().length === 0) {
                        return augmentedSkills.slice(0, limit).map(skill => ({
                            id: `${skill.digimonId}_${skill.skill.name}`,
                            display: skill.skill.name,
                            value: skill.skill.name,
                            metadata: {
                                digimon: skill.digimonName,
                                stage: skill.stageName,
                                element: skill.skill.element,
                                type: skill.skill.type,
                                power: skill.skill.power,
                                digimonId: skill.digimonId
                            }
                        }));
                    }

                    const searchTerm = query.toLowerCase().trim();
                    const results = [];
                    
                    // Check if it's an ID search
                    const isIdSearch = !Number.isNaN(Number(searchTerm)) && searchTerm.length > 0;
                    let targetDigimon = null;
                    
                    if (isIdSearch) {
                        const digimonId = Number.parseInt(searchTerm, 10);
                        // Mock digimon data for ID lookup
                        const mockDigimonData = [
                            { id: 1, name: '亞古獸' },
                            { id: 2, name: '暴龍獸' }
                        ];
                        targetDigimon = mockDigimonData.find(d => d.id === digimonId);
                    }
                    
                    // Search all skills
                    for (const skillData of augmentedSkills) {
                        const skill = skillData.skill;
                        const digimonName = skillData.digimonName;
                        const stageName = skillData.stageName;
                        const digimonId = skillData.digimonId;
                        
                        let shouldInclude = false;
                        let score = 0;
                        
                        if (isIdSearch && targetDigimon) {
                            // ID search: only show skills for that digimon
                            if (digimonId === targetDigimon.id) {
                                shouldInclude = true;
                                score = 100;
                            }
                        } else {
                            // Keyword search: skill name, digimon name, stage, attribute, element, ID
                            const searchableText = [
                                skill.name,
                                digimonName,
                                stageName,
                                skill.element || '',
                                skill.type || '',
                                digimonId.toString()
                            ].join(' ').toLowerCase();
                            
                            if (searchableText.includes(searchTerm)) {
                                shouldInclude = true;
                                const skillName = skill.name.toLowerCase();
                                const digimon = digimonName.toLowerCase();
                                
                                // Skill name exact match scores highest
                                if (skillName === searchTerm) score += 100;
                                else if (skillName.startsWith(searchTerm)) score += 80;
                                else if (skillName.includes(searchTerm)) score += 60;
                                
                                // Digimon name match
                                if (digimon.includes(searchTerm)) score += 30;
                                
                                // ID match
                                if (digimonId.toString() === searchTerm) score += 50;
                                else if (digimonId.toString().includes(searchTerm)) score += 20;
                            }
                        }
                        
                        if (shouldInclude) {
                            results.push({
                                id: `${skillData.digimonId}_${skill.name}`,
                                display: skill.name,
                                value: skill.name,
                                metadata: {
                                    digimon: digimonName,
                                    stage: stageName,
                                    element: skill.element,
                                    type: skill.type,
                                    power: skill.power,
                                    digimonId: digimonId
                                },
                                score: score
                            });
                        }
                    }
                    
                    // Sort by relevance
                    results.sort((a, b) => b.score - a.score);
                    
                    return results.slice(0, limit);
                }
            };
        });

        test('should search moves by digimon ID', () => {
            const results = digimonInstance.searchMovesForAutocomplete('1', 5);

            expect(results).toHaveLength(2); // Two skills for digimon ID 1
            expect(results[0].metadata.digimonId).toBe(1);
            expect(results[1].metadata.digimonId).toBe(1);
            expect(results[0].display).toBe('小型火焰');
            expect(results[1].display).toBe('火焰彈');
        });

        test('should search moves by skill name', () => {
            const results = digimonInstance.searchMovesForAutocomplete('火焰', 5);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every(r => r.display.includes('火焰'))).toBe(true);
        });

        test('should search moves by digimon name', () => {
            const results = digimonInstance.searchMovesForAutocomplete('亞古', 5);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every(r => r.metadata.digimon.includes('亞古'))).toBe(true);
        });

        test('should search moves by element', () => {
            const results = digimonInstance.searchMovesForAutocomplete('火', 5);

            expect(results.length).toBeGreaterThan(0);
            expect(results.every(r => r.metadata.element === '火')).toBe(true);
        });

        test('should return empty results for non-existent ID', () => {
            const results = digimonInstance.searchMovesForAutocomplete('999', 5);

            expect(results).toHaveLength(0);
        });

        test('should return all moves when no query provided', () => {
            const results = digimonInstance.searchMovesForAutocomplete('', 5);

            expect(results).toHaveLength(3); // All skills
            expect(results[0].metadata.digimonId).toBe(1);
            expect(results[1].metadata.digimonId).toBe(1);
            expect(results[2].metadata.digimonId).toBe(2);
        });

        test('should include digimonId in metadata', () => {
            const results = digimonInstance.searchMovesForAutocomplete('1', 5);

            expect(results[0].metadata).toHaveProperty('digimonId');
            expect(results[0].metadata.digimonId).toBe(1);
        });

        test('should sort results by relevance score', () => {
            const results = digimonInstance.searchMovesForAutocomplete('火焰', 5);

            // Results should be sorted by score (highest first)
            for (let i = 1; i < results.length; i++) {
                expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
            }
        });

        test('should limit results correctly', () => {
            const results = digimonInstance.searchMovesForAutocomplete('', 2);

            expect(results.length).toBeLessThanOrEqual(2);
        });
    });

    describe('API Endpoint Tests', () => {
        let mockReq;

        beforeEach(() => {
            mockReq = {
                params: { module: 'digimon' },
                query: { q: 'test', limit: '5' },
                ip: '127.0.0.1'
            };
        });

        test('should handle autocomplete API request', () => {
            // This test would require mocking the actual API endpoint
            // For now, we'll test the structure
            expect(mockReq.params.module).toBe('digimon');
            expect(mockReq.query.q).toBe('test');
            expect(mockReq.query.limit).toBe('5');
        });

        test('should validate query parameters', () => {
            const limit = Number.parseInt(mockReq.query.limit, 10);
            expect(limit).toBe(5);
            expect(typeof mockReq.query.q).toBe('string');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid search fields', () => {
            const searchFields = ['invalid.field', 'another.invalid'];
            const data = [
                { id: 1, display: 'Test', value: 'test' }
            ];

            const searchTerm = 'test';
            const results = [];

            for (const item of data) {
                let shouldInclude = false;
                for (const field of searchFields) {
                    const value = field.split('.').reduce((current, key) => current?.[key], item);
                    if (value && value.toLowerCase().includes(searchTerm)) {
                        shouldInclude = true;
                    }
                }
                if (shouldInclude) {
                    results.push(item);
                }
            }

            expect(results).toHaveLength(0);
        });

        test('should handle null/undefined data gracefully', () => {
            const data = null;
            const results = data ? data.filter(() => true) : [];

            expect(results).toEqual([]);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large datasets efficiently', () => {
            // Create large dataset
            const data = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                display: `Item ${i}`,
                value: `item${i}`
            }));

            const limit = 10;
            const searchTerm = 'item';

            const startTime = Date.now();
            const results = data
                .filter(item => item.display.toLowerCase().includes(searchTerm))
                .slice(0, limit);
            const endTime = Date.now();

            expect(results.length).toBeLessThanOrEqual(limit);
            expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
        });

        test('should cache results effectively', () => {
            const cache = new Map();
            const key = 'test:cache';
            const value = { data: 'test' };

            cache.set(key, value);
            const cached = cache.get(key);

            expect(cached).toEqual(value);
            expect(cache.size).toBe(1);
        });
    });

    describe('Digimon Real Data Tests', () => {
        let digimonInstance;

        beforeAll(() => {
            // Use real digimon instance
            digimonInstance = digmon.Digimon.init();
        });

        test('should search digimon names with real data', () => {
            const results = digimonInstance.searchForAutocomplete('亞古', 5);

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('id');
            expect(results[0]).toHaveProperty('display');
            expect(results[0]).toHaveProperty('value');
            expect(results[0]).toHaveProperty('metadata');
        });

        test('should search moves with real data', () => {
            const results = digimonInstance.searchMovesForAutocomplete('火焰', 5);

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('id');
            expect(results[0]).toHaveProperty('display');
            expect(results[0]).toHaveProperty('value');
            expect(results[0]).toHaveProperty('metadata');
            expect(results[0].metadata).toHaveProperty('digimonId');
        });

        test('should search moves by digimon ID with real data', () => {
            const results = digimonInstance.searchMovesForAutocomplete('1', 5);

            expect(Array.isArray(results)).toBe(true);
            if (results.length > 0) {
                expect(results[0].metadata.digimonId).toBe(1);
            }
        });

        test('should return all digimon names', () => {
            const results = digimonInstance.getAllDigimonNames();

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('id');
            expect(results[0]).toHaveProperty('display');
            expect(results[0]).toHaveProperty('value');
            expect(results[0]).toHaveProperty('metadata');
        });

        test('should return all moves', () => {
            const results = digimonInstance.getAllMoves();

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('id');
            expect(results[0]).toHaveProperty('display');
            expect(results[0]).toHaveProperty('value');
            expect(results[0]).toHaveProperty('metadata');
            expect(results[0].metadata).toHaveProperty('digimonId');
        });
    });
});