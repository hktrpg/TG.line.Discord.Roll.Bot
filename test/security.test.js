/**
 * Security Utilities Tests
 * 安全工具函式測試
 * 
 * 執行方式：
 * node test/security.test.js
 */

const security = require('../utils/security');

// 顏色輸出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(status, message) {
    const symbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

// 測試計數器
let passed = 0;
let failed = 0;

// ============================================
// 測試：密碼雜湊
// ============================================
async function testPasswordHashing() {
    console.log('\n📝 Testing Password Hashing...\n');

    try {
        // 測試 1: 雜湊密碼
        const password = 'testPassword123';
        const hash = await security.hashPassword(password);

        if (hash && hash.length > 20) {
            log('pass', 'Password hashing works');
            passed++;
        } else {
            log('fail', 'Password hash too short');
            failed++;
        }

        // 測試 2: 驗證正確密碼
        const valid = await security.verifyPassword(password, hash);
        if (valid === true) {
            log('pass', 'Correct password verified');
            passed++;
        } else {
            log('fail', 'Failed to verify correct password');
            failed++;
        }

        // 測試 3: 拒絕錯誤密碼
        const invalid = await security.verifyPassword('wrongPassword', hash);
        if (invalid === false) {
            log('pass', 'Incorrect password rejected');
            passed++;
        } else {
            log('fail', 'Accepted incorrect password');
            failed++;
        }

        // 測試 4: 處理空密碼
        try {
            await security.hashPassword('');
            log('fail', 'Accepted empty password');
            failed++;
        } catch {
            log('pass', 'Empty password rejected');
            passed++;
        }

    } catch (error) {
        log('fail', `Password hashing error: ${error.message}`);
        failed++;
    }
}

// ============================================
// 測試：輸入驗證
// ============================================
function testInputValidation() {
    console.log('\n📝 Testing Input Validation...\n');

    // 測試 1: 正常聊天訊息
    const validMsg = security.validateChatMessage({
        name: 'Player1',
        msg: 'Hello World',
        roomNumber: '公共房間'
    });

    if (validMsg.valid === true) {
        log('pass', 'Valid chat message accepted');
        passed++;
    } else {
        log('fail', `Valid message rejected: ${validMsg.error}`);
        failed++;
    }

    // 測試 2: XSS 攻擊
    const xssMsg = security.validateChatMessage({
        name: 'Hacker',
        msg: '<script>alert("XSS")</script>',
        roomNumber: '公共房間'
    });

    if (xssMsg.valid === false) {
        log('pass', 'XSS attack blocked');
        passed++;
    } else {
        log('fail', 'XSS attack not detected');
        failed++;
    }

    // 測試 3: JavaScript URI
    const jsUri = security.validateChatMessage({
        name: 'Hacker',
        msg: 'Click here: javascript:alert(1)',
        roomNumber: '公共房間'
    });

    if (jsUri.valid === false) {
        log('pass', 'JavaScript URI blocked');
        passed++;
    } else {
        log('fail', 'JavaScript URI not detected');
        failed++;
    }

    // 測試 4: 內聯事件處理器
    const inlineEvent = security.validateChatMessage({
        name: 'Hacker',
        msg: '<img src=x onerror=alert(1)>',
        roomNumber: '公共房間'
    });

    if (inlineEvent.valid === false) {
        log('pass', 'Inline event handler blocked');
        passed++;
    } else {
        log('fail', 'Inline event handler not detected');
        failed++;
    }

    // 測試 5: 空訊息
    const emptyMsg = security.validateChatMessage({
        name: 'Player1',
        msg: '',
        roomNumber: '公共房間'
    });

    if (emptyMsg.valid === false) {
        log('pass', 'Empty message rejected');
        passed++;
    } else {
        log('fail', 'Empty message accepted');
        failed++;
    }

    // 測試 6: 過長訊息
    const longMsg = security.validateChatMessage({
        name: 'Player1',
        msg: 'A'.repeat(2001),
        roomNumber: '公共房間'
    });

    if (longMsg.valid === false) {
        log('pass', 'Oversized message rejected');
        passed++;
    } else {
        log('fail', 'Oversized message accepted');
        failed++;
    }

    // 測試 7: 過長名稱
    const longName = security.validateChatMessage({
        name: 'A'.repeat(51),
        msg: 'Hello',
        roomNumber: '公共房間'
    });

    if (longName.valid === false) {
        log('pass', 'Oversized name rejected');
        passed++;
    } else {
        log('fail', 'Oversized name accepted');
        failed++;
    }
}

// ============================================
// 測試：NoSQL 注入防護
// ============================================
function testNoSQLInjection() {
    console.log('\n📝 Testing NoSQL Injection Protection...\n');

    // 測試 1: 對像注入
    try {
        security.sanitizeInput({ $ne: null });
        log('fail', 'Object injection not detected');
        failed++;
    } catch (error) {
        log('pass', 'Object injection blocked');
        passed++;
    }

    // 測試 2: 陣列注入
    try {
        security.sanitizeInput(['admin', 'user']);
        log('fail', 'Array injection not detected');
        failed++;
    } catch (error) {
        log('pass', 'Array injection blocked');
        passed++;
    }

    // 測試 3: 正常字串
    try {
        const result = security.sanitizeInput('normalInput');
        if (result === 'normalInput') {
            log('pass', 'Normal string accepted');
            passed++;
        } else {
            log('fail', 'Normal string modified incorrectly');
            failed++;
        }
    } catch (error) {
        log('fail', `Normal string rejected: ${error.message}`);
        failed++;
    }

    // 測試 4: 長度限制
    try {
        const long = 'A'.repeat(200);
        const result = security.sanitizeInput(long, 100);
        if (result.length === 100) {
            log('pass', 'Length limit enforced');
            passed++;
        } else {
            log('fail', `Length limit failed: ${result.length}`);
            failed++;
        }
    } catch (error) {
        log('fail', `Length limit error: ${error.message}`);
        failed++;
    }
}

// ============================================
// 測試：憑證驗證
// ============================================
function testCredentials() {
    console.log('\n📝 Testing Credentials Validation...\n');

    // 測試 1: 有效憑證
    const valid = security.validateCredentials({
        userName: 'player123',
        userPassword: 'password123'
    });

    if (valid.valid === true) {
        log('pass', 'Valid credentials accepted');
        passed++;
    } else {
        log('fail', `Valid credentials rejected: ${valid.error}`);
        failed++;
    }

    // 測試 2: 短使用者名稱
    const shortName = security.validateCredentials({
        userName: 'ab',
        userPassword: 'password123'
    });

    if (shortName.valid === false) {
        log('pass', 'Short username rejected');
        passed++;
    } else {
        log('fail', 'Short username accepted');
        failed++;
    }

    // 測試 3: 短密碼
    const shortPass = security.validateCredentials({
        userName: 'player123',
        userPassword: '12345'
    });

    if (shortPass.valid === false) {
        log('pass', 'Short password rejected');
        passed++;
    } else {
        log('fail', 'Short password accepted');
        failed++;
    }
}

// ============================================
// 測試：日誌清理
// ============================================
function testLogSanitization() {
    console.log('\n📝 Testing Log Sanitization...\n');

    // 測試 1: 清理密碼
    const sensitive = {
        userName: 'player',
        password: 'secret123',
        message: 'Hello'
    };

    const cleaned = security.sanitizeLogData(sensitive);

    if (cleaned.password === '[REDACTED]') {
        log('pass', 'Password redacted in logs');
        passed++;
    } else {
        log('fail', 'Password not redacted');
        failed++;
    }

    if (cleaned.userName === 'player' && cleaned.message === 'Hello') {
        log('pass', 'Non-sensitive data preserved');
        passed++;
    } else {
        log('fail', 'Non-sensitive data lost');
        failed++;
    }

    // 測試 2: 清理 token
    const withToken = {
        userId: '123',
        token: 'jwt.token.here'
    };

    const cleanedToken = security.sanitizeLogData(withToken);

    if (cleanedToken.token === '[REDACTED]') {
        log('pass', 'Token redacted in logs');
        passed++;
    } else {
        log('fail', 'Token not redacted');
        failed++;
    }
}

// ============================================
// 測試：Origin 驗證
// ============================================
function testOriginValidation() {
    console.log('\n📝 Testing Origin Validation...\n');

    // 測試 1: 有效域名
    const valid = security.validateOrigin('https://hktrpg.com');
    if (valid === true) {
        log('pass', 'Valid origin accepted');
        passed++;
    } else {
        log('fail', 'Valid origin rejected');
        failed++;
    }

    // 測試 2: 有效子域名
    const subdomain = security.validateOrigin('https://api.hktrpg.com');
    if (subdomain === true) {
        log('pass', 'Valid subdomain accepted');
        passed++;
    } else {
        log('fail', 'Valid subdomain rejected');
        failed++;
    }

    // 測試 3: 無效域名
    const invalid = security.validateOrigin('https://evil.com');
    if (invalid === false) {
        log('pass', 'Invalid origin rejected');
        passed++;
    } else {
        log('fail', 'Invalid origin accepted');
        failed++;
    }

    // 測試 4: localhost（開發環境）
    const localhost = security.validateOrigin('http://localhost:20721');
    if (localhost === true) {
        log('pass', 'Localhost accepted (dev mode)');
        passed++;
    } else {
        log('fail', 'Localhost rejected');
        failed++;
    }
}

// ============================================
// 執行所有測試
// ============================================
async function runAllTests() {
    console.log('🧪 Starting Security Tests...');
    console.log('═'.repeat(50));

    await testPasswordHashing();
    testInputValidation();
    testNoSQLInjection();
    testCredentials();
    testLogSanitization();
    testOriginValidation();

    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 Test Results:`);
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`📈 Total: ${passed + failed}`);
    console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
    } else {
        console.log(`\n${colors.red}⚠️  Some tests failed. Please review the security implementation.${colors.reset}\n`);
        process.exit(1);
    }
}

// 執行測試
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Test execution error:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };

