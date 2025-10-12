"use strict";

// Mock dependencies
jest.mock('fuse.js', () => {
    return class MockFuse {
        constructor() {
            this.search = jest.fn().mockReturnValue([]);
        }
    }
});

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

// Mock the Digimon data with a simple, well-connected evolution chain
const mockDigimonData = [
    // Stage 1 (幼年期1)
    { id: 1, name: "水母獸", stage: "1", personality: "壞點子", devolutions: [], evolutions: ["柏古獸"] },
    
    // Stage 2 (幼年期2)  
    { id: 2, name: "柏古獸", stage: "2", personality: "壞點子", devolutions: ["水母獸"], evolutions: ["小惡魔獸"] },
    
    // Stage 3 (成長期)
    { id: 3, name: "小惡魔獸", stage: "3", personality: "壞點子", devolutions: ["柏古獸"], evolutions: ["惡魔獸"] },
    
    // Stage 4 (成熟期)
    { id: 4, name: "惡魔獸", stage: "4", personality: "壞點子", devolutions: ["小惡魔獸"], evolutions: ["吸血魔獸"] },
    
    // Stage 5 (完全體)
    { id: 5, name: "吸血魔獸", stage: "5", personality: "壞點子", devolutions: ["惡魔獸"], evolutions: ["究極吸血魔獸"] },
    
    // Stage 6 (究極體)
    { id: 6, name: "究極吸血魔獸", stage: "6", personality: "壞點子", devolutions: ["吸血魔獸"], evolutions: ["究極吸血魔獸X"] },
    
    // Stage 7 (超究極體)
    { id: 7, name: "究極吸血魔獸X", stage: "7", personality: "壞點子", devolutions: ["究極吸血魔獸"], evolutions: [] }
];

// Mock fs.readFileSync to return our test data
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue(JSON.stringify(mockDigimonData))
}));

// Import the module after mocking
const digmon = require('../roll/digmon');

describe('Digimon Evolution Path Finding - Simple Tests', () => {
    let digimonInstance;

    beforeEach(() => {
        digimonInstance = new digmon.Digimon(mockDigimonData);
        
        // Set up mock behavior for Fuse search
        digimonInstance.fuse.search.mockImplementation((query) => {
            // Find matching Digimon in our mock data
            const found = mockDigimonData.find(d => 
                d.name === query || d.id.toString() === query
            );
            return found ? [{ item: found }] : [];
        });
    });

    describe('Direct Evolution Tests', () => {
        test('Should find direct evolution path: 水母獸 -> 柏古獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('水母獸');
            const toDigimon = digimonInstance.findByNameOrId('柏古獸');
            
            expect(fromDigimon).toBeDefined();
            expect(toDigimon).toBeDefined();
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(2);
            expect(paths[0][0].name).toBe('水母獸');
            expect(paths[0][1].name).toBe('柏古獸');
        });

        test('Should find direct evolution path: 柏古獸 -> 小惡魔獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('柏古獸');
            const toDigimon = digimonInstance.findByNameOrId('小惡魔獸');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(2);
            expect(paths[0][0].name).toBe('柏古獸');
            expect(paths[0][1].name).toBe('小惡魔獸');
        });
    });

    describe('Multi-step Evolution Tests', () => {
        test('Should find evolution path: 水母獸 -> 小惡魔獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('水母獸');
            const toDigimon = digimonInstance.findByNameOrId('小惡魔獸');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(3);
            expect(paths[0][0].name).toBe('水母獸');
            expect(paths[0][1].name).toBe('柏古獸');
            expect(paths[0][2].name).toBe('小惡魔獸');
        });

        test('Should find evolution path: 水母獸 -> 究極吸血魔獸X', () => {
            const fromDigimon = digimonInstance.findByNameOrId('水母獸');
            const toDigimon = digimonInstance.findByNameOrId('究極吸血魔獸X');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(7);
            expect(paths[0][0].name).toBe('水母獸');
            expect(paths[0][1].name).toBe('柏古獸');
            expect(paths[0][2].name).toBe('小惡魔獸');
            expect(paths[0][3].name).toBe('惡魔獸');
            expect(paths[0][4].name).toBe('吸血魔獸');
            expect(paths[0][5].name).toBe('究極吸血魔獸');
            expect(paths[0][6].name).toBe('究極吸血魔獸X');
        });
    });

    describe('Devolution Tests', () => {
        test('Should find devolution path: 究極吸血魔獸X -> 水母獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('究極吸血魔獸X');
            const toDigimon = digimonInstance.findByNameOrId('水母獸');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(7);
            expect(paths[0][0].name).toBe('究極吸血魔獸X');
            expect(paths[0][6].name).toBe('水母獸');
        });

        test('Should find devolution path: 惡魔獸 -> 水母獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('惡魔獸');
            const toDigimon = digimonInstance.findByNameOrId('水母獸');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBeGreaterThan(0);
            expect(paths[0]).toHaveLength(4);
            expect(paths[0][0].name).toBe('惡魔獸');
            expect(paths[0][3].name).toBe('水母獸');
        });
    });

    describe('Same Digimon Tests', () => {
        test('Should handle same Digimon: 水母獸 -> 水母獸', () => {
            const fromDigimon = digimonInstance.findByNameOrId('水母獸');
            const toDigimon = digimonInstance.findByNameOrId('水母獸');
            
            const paths = digimonInstance.findEvolutionPaths(fromDigimon, toDigimon);
            
            expect(paths).toBeDefined();
            expect(Array.isArray(paths)).toBe(true);
            expect(paths.length).toBe(1);
            expect(paths[0]).toHaveLength(1);
            expect(paths[0][0].name).toBe('水母獸');
        });
    });

    describe('Edge Cases', () => {
        test('Should handle non-existent Digimon', () => {
            const result = digimonInstance.findByNameOrId('NonExistentDigimon');
            expect(result).toBeNull();
        });

        test('Should handle invalid ID', () => {
            const result = digimonInstance.findByNameOrId('99999');
            expect(result).toBeNull();
        });

        test('Should handle empty search query', () => {
            const result = digimonInstance.findByNameOrId('');
            expect(result).toBeNull();
        });
    });
});