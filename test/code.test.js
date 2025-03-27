"use strict";

const codeModule = require('../roll/code.js');
const axios = require('axios');

// Mock axios to avoid real API calls
jest.mock('axios');

describe('Code Execution Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation for axios
        axios.post.mockResolvedValue({
            data: {
                run: {
                    output: 'Default mock output'
                }
            }
        });
    });

    test('Test gameName returns correct name', () => {
        const name = codeModule.gameName();
        expect(name).toBeTruthy();
        expect(name).toBe('【.code [語言] [指令]】');
    });

    test('Test gameType returns correct type', () => {
        expect(codeModule.gameType()).toBe('funny:code:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = codeModule.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.toString()).toContain('.code');
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = codeModule.getHelpMessage();
        expect(helpText).toContain('程式碼執行系統');
        expect(helpText).toContain('.code [程式語言]');
        expect(helpText).toContain('JavaScript (js)');
        expect(helpText).toContain('Java (java)');
    });

    test('Test initialize returns empty variables object', () => {
        const init = codeModule.initialize();
        expect(init).toEqual({});
    });

    test('Test rollDiceCommand with help', async () => {
        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code', 'help'],
            inputStr: '.code help'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('程式碼執行系統');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with empty command returns help', async () => {
        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code'],
            inputStr: '.code'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('程式碼執行系統');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with JS code', async () => {
        // Mock the axios response for JS code
        axios.post.mockResolvedValueOnce({
            data: {
                run: {
                    output: 'Hello World!'
                }
            }
        });

        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code', 'js'],
            inputStr: '.code js console.log("Hello World!");'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('Hello World!');
        
        // Verify axios was called with correct parameters
        expect(axios.post).toHaveBeenCalledTimes(1);
        const axiosCall = axios.post.mock.calls[0];
        expect(axiosCall[0]).toBe('https://emkc.org/api/v2/piston/execute');
        expect(axiosCall[1].language).toBe('javascript');
        expect(axiosCall[1].files[0].content).toBe('console.log("Hello World!");');
    });

    test('Test rollDiceCommand with Java code without class definition', async () => {
        // Mock the axios response for Java code
        axios.post.mockResolvedValueOnce({
            data: {
                run: {
                    output: 'Hello Java World!'
                }
            }
        });

        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code', 'java'],
            inputStr: '.code java System.out.println("Hello Java World!");'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('Hello Java World!');
        
        // Verify axios was called with correct parameters
        expect(axios.post).toHaveBeenCalledTimes(1);
        const axiosCall = axios.post.mock.calls[0];
        expect(axiosCall[0]).toBe('https://emkc.org/api/v2/piston/execute');
        expect(axiosCall[1].language).toBe('java');
        // Should include auto-generated class wrapper
        expect(axiosCall[1].files[0].content).toContain('public class main');
        expect(axiosCall[1].files[0].content).toContain('System.out.println("Hello Java World!");');
    });

    test('Test rollDiceCommand with Java code with class definition', async () => {
        // Mock the axios response for Java code
        axios.post.mockResolvedValueOnce({
            data: {
                run: {
                    output: 'Custom Class Output'
                }
            }
        });

        const javaCode = `
public class Test {
    public static void main(String[] args) {
        System.out.println("Custom Class Output");
    }
}`;

        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code', 'java'],
            inputStr: `.code java ${javaCode}`
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('Custom Class Output');
        
        // Verify axios was called with correct parameters
        expect(axios.post).toHaveBeenCalledTimes(1);
        const axiosCall = axios.post.mock.calls[0];
        expect(axiosCall[1].language).toBe('java');
        // Should use the provided class
        expect(axiosCall[1].files[0].content).toBe(javaCode);
    });

    test('Test rollDiceCommand with unknown language', async () => {
        // When calling with .code but unknown language, it should just return help
        const result = await codeModule.rollDiceCommand({
            mainMsg: ['.code', 'unknown'],
            inputStr: '.code unknown console.log("test")'
        });
        
        // For a first parameter of .code but unknown second parameter, 
        // it falls through to the default which doesn't return anything
        expect(result).toBeUndefined();
    });

    test('Test rollDiceCommand with non-.code command', async () => {
        // Testing with a completely different command
        const result = await codeModule.rollDiceCommand({
            mainMsg: ['notcode'],
            inputStr: 'notcode test'
        });
        
        // The actual behavior is that for any command it returns the help message
        expect(result).toBeDefined();
        expect(result.type).toBe('text');
        expect(result.quotes).toBe(true);
        // Since we should test behavior not implementation details,
        // just check that it contains some expected content
        expect(result.text).toContain('程式碼執行系統');
    });

    test('Test Discord commands array exists', () => {
        expect(codeModule.discordCommand).toBeDefined();
        expect(Array.isArray(codeModule.discordCommand)).toBe(true);
    });
}); 