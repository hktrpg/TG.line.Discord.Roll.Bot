/**
 * Security Utilities Tests
 * 安全工具函式測試（Jest 格式）
 */

const security = require('../utils/security');

describe('Security Utilities', () => {
    // ============================================
    // 測試：密碼雜湊
    // ============================================
    describe('Password Hashing', () => {
        test('should hash password successfully', async () => {
            const password = 'testPassword123';
            const hash = await security.hashPassword(password);
            expect(hash).toBeTruthy();
            expect(hash.length).toBeGreaterThan(20);
        });

        test('should verify correct password', async () => {
            const password = 'testPassword123';
            const hash = await security.hashPassword(password);
            const valid = await security.verifyPassword(password, hash);
            expect(valid).toBe(true);
        });

        test('should reject incorrect password', async () => {
            const password = 'testPassword123';
            const hash = await security.hashPassword(password);
            const valid = await security.verifyPassword('wrongPassword', hash);
            expect(valid).toBe(false);
        });

        test('should reject empty password', async () => {
            const hash = await security.hashPassword('test');
            const valid = await security.verifyPassword('', hash);
            expect(valid).toBe(false);
        });
    });

    // ============================================
    // 測試：輸入驗證
    // ============================================
    describe('Input Validation', () => {
        test('should accept valid chat message', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: 'Hello World',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.name).toBe('TestUser');
            expect(result.data.msg).toBe('Hello World');
            expect(result.data.roomNumber).toBe('room1');
        });

        test('should block XSS attack', () => {
            const result = security.validateChatMessage({
                name: 'Hacker',
                msg: '<script>alert("XSS")</script>',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Suspicious content');
        });

        test('should block JavaScript URI', () => {
            const result = security.validateChatMessage({
                name: 'Hacker',
                msg: '<a href="javascript:alert(1)">Click</a>',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Suspicious content');
        });

        test('should block inline event handler', () => {
            const result = security.validateChatMessage({
                name: 'Hacker',
                msg: '<div onclick="alert(1)">Click me</div>',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Suspicious content');
        });

        test('should reject empty message', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: '',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });

        test('should reject oversized message', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: 'x'.repeat(2001),
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });

        test('should reject oversized name', () => {
            const result = security.validateChatMessage({
                name: 'x'.repeat(51),
                msg: 'Hello',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });
    });

    // ============================================
    // 測試：NoSQL 注入防護
    // ============================================
    describe('NoSQL Injection Protection', () => {
        test('should block object injection', () => {
            const result = security.validateChatMessage({
                name: { $ne: null },
                msg: 'test',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });

        test('should block array injection', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: ['test'],
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });

        test('should accept normal string', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: 'Normal message',
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(true);
        });

        test('should enforce length limit', () => {
            const result = security.validateChatMessage({
                name: 'TestUser',
                msg: 'x'.repeat(2001),
                roomNumber: 'room1'
            });
            expect(result.valid).toBe(false);
        });
    });

    // ============================================
    // 測試：憑證驗證
    // ============================================
    describe('Credentials Validation', () => {
        test('should accept valid credentials', () => {
            const result = security.validateCredentials({
                userName: 'testUser',
                userPassword: 'testPassword123'
            });
            expect(result.valid).toBe(true);
            expect(result.data.userName).toBe('testUser');
            expect(result.data.userPassword).toBe('testPassword123');
        });

        test('should reject short username', () => {
            const result = security.validateCredentials({
                userName: 'ab',
                userPassword: 'testPassword123'
            });
            expect(result.valid).toBe(false);
        });

        test('should reject short password', () => {
            const result = security.validateCredentials({
                userName: 'testUser',
                userPassword: '123'
            });
            expect(result.valid).toBe(false);
        });
    });

    // ============================================
    // 測試：日誌清理
    // ============================================
    describe('Log Sanitization', () => {
        test('should redact password in logs', () => {
            const data = {
                userName: 'testUser',
                userPassword: 'secretPassword123'
            };
            const sanitized = security.sanitizeLogData(data);
            expect(sanitized.userPassword).toBe('[REDACTED]');
            expect(sanitized.userName).toBe('testUser');
        });

        test('should preserve non-sensitive data', () => {
            const data = {
                userName: 'testUser',
                roomNumber: 'room1',
                message: 'Hello'
            };
            const sanitized = security.sanitizeLogData(data);
            expect(sanitized.userName).toBe('testUser');
            expect(sanitized.roomNumber).toBe('room1');
            expect(sanitized.message).toBe('Hello');
        });

        test('should redact token in logs', () => {
            const data = {
                token: 'secret-token-123',
                userName: 'testUser'
            };
            const sanitized = security.sanitizeLogData(data);
            expect(sanitized.token).toBe('[REDACTED]');
            expect(sanitized.userName).toBe('testUser');
        });
    });

    // ============================================
    // 測試：Origin 驗證
    // ============================================
    describe('Origin Validation', () => {
        test('should accept valid origin', () => {
            const result = security.validateOrigin('https://hktrpg.com');
            expect(result).toBe(true);
        });

        test('should accept valid subdomain', () => {
            const result = security.validateOrigin('https://test.hktrpg.com');
            expect(result).toBe(true);
        });

        test('should reject invalid origin', () => {
            const result = security.validateOrigin('https://evil.com');
            expect(result).toBe(false);
        });

        test('should accept localhost (dev mode)', () => {
            const result = security.validateOrigin('http://localhost:20721');
            expect(result).toBe(true);
        });
    });
});
