/**
 * Security Utilities for HKTRPG
 * 安全工具函式集
 */

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// ============================================
// 自動環境變數密鑰產生
// ============================================

/**
 * 產生安全的隨機密鑰
 * @param {number} length - 密鑰長度（位元組）
 * @param {string} encoding - 編碼格式 ('hex', 'base64', 'base64url')
 * @returns {string} 隨機密鑰
 */
function generateSecureKey(length = 32, encoding = 'hex') {
    const randomBytes = crypto.randomBytes(length);
    
    switch (encoding) {
        case 'hex':
            return randomBytes.toString('hex');
        case 'base64':
            return randomBytes.toString('base64');
        case 'base64url':
            return randomBytes.toString('base64url');
        default:
            return randomBytes.toString('hex');
    }
}

/**
 * 讀取或建立 .env 檔案
 * @returns {string} .env 檔案路徑
 */
function getEnvFilePath() {
    const projectRoot = path.resolve(__dirname, '..');
    return path.join(projectRoot, '.env');
}

/**
 * 讀取現有的 .env 檔案內容
 * @returns {object} 環境變數物件
 */
function readEnvFile() {
    const envPath = getEnvFilePath();
    const envVars = {};
    
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
    }
    
    return envVars;
}

/**
 * 寫入 .env 檔案
 * @param {object} envVars - 環境變數物件
 */
function writeEnvFile(envVars) {
    const envPath = getEnvFilePath();
    let content = '# HKTRPG Environment Variables\n';
    content += '# Generated automatically by security.js\n\n';
    
    // 按字母順序排列
    const sortedKeys = Object.keys(envVars).sort();
    
    for (const key of sortedKeys) {
        content += `${key}=${envVars[key]}\n`;
    }
    
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`✅ Environment variables written to: ${envPath}`);
}

/**
 * 確保必要的環境變數存在，如果不存在則自動產生
 */
function ensureEnvironmentKeys() {
    const envVars = readEnvFile();
    let needsUpdate = false;
    
    // 定義需要檢查的環境變數及其產生規則
    const requiredKeys = {
        'JWT_SECRET': { length: 32, encoding: 'hex', description: 'JWT signing secret' },
        'SALT': { length: 16, encoding: 'hex', description: 'Password hashing salt' },
        'SESSION_SECRET': { length: 32, encoding: 'hex', description: 'Session secret' },
        'ENCRYPTION_KEY': { length: 32, encoding: 'base64', description: 'Data encryption key' },
        'API_SECRET': { length: 24, encoding: 'hex', description: 'API authentication secret' }
    };
    
    for (const [key, config] of Object.entries(requiredKeys)) {
        if (!envVars[key] || envVars[key].length < 16) {
            const newKey = generateSecureKey(config.length, config.encoding);
            envVars[key] = newKey;
            needsUpdate = true;
            console.log(`🔑 Generated new ${key}: ${config.description}`);
        }
    }
    
    if (needsUpdate) {
        writeEnvFile(envVars);
        
        // 重新載入環境變數
        for (const [key, value] of Object.entries(envVars)) {
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    }
}

// 在模組載入時自動確保環境變數
ensureEnvironmentKeys();

// 載入 .env 檔案到 process.env
function loadEnvFile() {
    const envVars = readEnvFile();
    for (const [key, value] of Object.entries(envVars)) {
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

// ============================================
// 密碼雜湊（使用 bcrypt）
// ============================================
// 注意：需要先安裝 bcrypt
// npm install bcrypt

let bcrypt;
try {
    bcrypt = require('bcryptjs');
} catch {
    console.warn('⚠️ bcrypt not installed. Using fallback (NOT SECURE for production)');
}

const SALT_ROUNDS = 12;

/**
 * 雜湊密碼
 * @param {string} password - 明文密碼
 * @returns {Promise<string>} 雜湊后的密碼
 */
async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Invalid password');
    }

    if (bcrypt) {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } else {
        // Fallback: Use legacy SHA256 with SALT for backward compatibility
        const salt = process.env.SALT;
        if (salt) {
            try {
                console.warn('⚠️ Using legacy password hash with SALT for backward compatibility');
                return crypto.createHmac('sha256', password)
                    .update(salt)
                    .digest('hex');
            } catch (error) {
                console.error('🔒 Legacy hash creation failed:', error.message);
                // Fall through to last resort
            }
        }
        
        // Last resort fallback（僅用於開發，不安全）
        console.warn('⚠️ Using insecure password hash fallback!');
        return crypto.createHash('sha256').update(password).digest('hex');
    }
}

/**
 * 驗證密碼
 * @param {string} password - 明文密碼
 * @param {string} hash - 雜湊值
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, hash) {
    if (!password || !hash) return false;

    try {
        // First try bcrypt verification (for new passwords)
        if (bcrypt) {
            const bcryptValid = await bcrypt.compare(password, hash);
            if (bcryptValid) return true;
        }
        
        // Fallback: check if it matches legacy SHA256 hash with SALT
        const salt = process.env.SALT;
        if (salt) {
            try {
                const legacyHash = crypto.createHmac('sha256', password)
                    .update(salt)
                    .digest('hex');
                if (legacyHash === hash) {
                    console.warn('⚠️ User authenticated with legacy hash. Consider migrating to bcrypt.');
                    return true;
                }
            } catch (error) {
                console.error('🔒 Legacy hash verification failed:', error.message);
            }
        } else {
            console.warn('⚠️ SALT environment variable not set, cannot verify legacy passwords');
        }
        
        return false;
    } catch (error) {
        console.error('Password verification error:', error.message);
        return false;
    }
}

// ============================================
// 輸入驗證
// ============================================

/**
 * 清理輸入（防止 NoSQL 注入）
 * @param {any} input - 使用者輸入
 * @param {number} maxLength - 最大長度
 * @returns {string} 清理后的字串
 */
function sanitizeInput(input, maxLength = 100) {
    if (typeof input !== 'string') {
        throw new TypeError('Invalid input type - expected string');
    }

    return input.trim().slice(0, maxLength);
}

/**
 * 驗證聊天訊息
 * @param {object} msg - 訊息對像
 * @returns {object} { valid: boolean, error?: string, data?: object }
 */
function validateChatMessage(msg) {
    // 型別檢查
    if (!msg || typeof msg !== 'object') {
        return { valid: false, error: 'Invalid message format' };
    }

    // 🔒 NoSQL 注入防護 - 檢查字段類型
    if (typeof msg.name !== 'string') {
        return { valid: false, error: 'Invalid name type' };
    }
    if (typeof msg.msg !== 'string' && !Array.isArray(msg.msg)) {
        return { valid: false, error: 'Invalid message type' };
    }
    if (Array.isArray(msg.msg)) {
        return { valid: false, error: 'Invalid message type' };
    }
    if (typeof msg.roomNumber !== 'string') {
        return { valid: false, error: 'Invalid room number type' };
    }

    // 驗證名稱
    const name = String(msg.name || '').trim();
    if (name.length === 0 || name.length > 50) {
        return { valid: false, error: 'Invalid name length (1-50 characters)' };
    }

    // 驗證訊息內容
    const text = String(msg.msg || '').trim();
    if (text.length === 0 || text.length > 2000) {
        return { valid: false, error: 'Invalid message length (1-2000 characters)' };
    }

    // XSS 防護 - 檢查可疑模式
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) {
            return { valid: false, error: 'Suspicious content detected' };
        }
    }

    // 驗證房間號
    const room = String(msg.roomNumber || '').trim();
    if (!room || room.length > 50) {
        return { valid: false, error: 'Invalid room number' };
    }

    return {
        valid: true,
        data: {
            name: name.slice(0, 50),
            msg: text.slice(0, 2000),        // 使用 msg 而不是 text
            roomNumber: room.slice(0, 50)    // 使用 roomNumber 而不是 room
        }
    };
}

/**
 * 驗證使用者名稱和密碼
 * @param {object} credentials - { userName, userPassword }
 * @returns {object} { valid: boolean, error?: string, data?: object }
 */
function validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
        return { valid: false, error: 'Invalid credentials format' };
    }

    const userName = String(credentials.userName || '').trim();
    if (!userName || userName.length < 3 || userName.length > 50) {
        return { valid: false, error: 'Invalid username length (3-50 characters)' };
    }

    const password = String(credentials.userPassword || '');
    if (!password || password.length < 6 || password.length > 100) {
        return { valid: false, error: 'Invalid password length (6-100 characters)' };
    }

    return {
        valid: true,
        data: {
            userName: userName.slice(0, 50),
            userPassword: password.slice(0, 100)
        }
    };
}

/**
 * 驗證JWT Token認證
 * @param {object} authData - { token, userName? }
 * @returns {object} { valid: boolean, error?: string, data?: object }
 */
function validateJWTAuth(authData) {
    if (!authData || typeof authData !== 'object') {
        return { valid: false, error: 'Invalid auth data format' };
    }

    const token = String(authData.token || '').trim();
    if (!token) {
        return { valid: false, error: 'JWT token is required' };
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return { valid: false, error: 'Invalid or expired JWT token' };
        }

        // 如果提供了userName，驗證是否匹配
        if (authData.userName && decoded.userName !== authData.userName) {
            return { valid: false, error: 'Token user does not match provided username' };
        }

        return {
            valid: true,
            data: {
                userId: decoded.userId,
                userName: decoded.userName,
                token: token
            }
        };
    } catch (error) {
        return { valid: false, error: `Token validation failed: ${error.message}` };
    }
}

// ============================================
// JWT 認證（可選）
// ============================================
// 注意：需要先安裝 jsonwebtoken
// npm install jsonwebtoken

let jwt;
try {
    // eslint-disable-next-line n/no-missing-require
    jwt = require('jsonwebtoken');
} catch {
    console.warn('⚠️ jsonwebtoken not installed');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

// 驗證 JWT_SECRET 是否存在
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not found in environment variables. Please check .env file.');
}

/**
 * 產生 JWT Token
 * @param {object} user - 使用者對像 { id, userName }
 * @returns {string} JWT token
 */
function generateToken(user) {
    if (!jwt) {
        throw new Error('jsonwebtoken not installed');
    }

    if (!user || !user.id) {
        throw new Error('Invalid user object');
    }

    return jwt.sign(
        {
            userId: user.id,
            userName: user.userName
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * 驗證 JWT Token
 * @param {string} token - JWT token
 * @returns {object|null} 解碼后的使用者資訊，或 null
 */
function verifyToken(token) {
    if (!jwt) {
        console.error('jsonwebtoken not installed');
        return null;
    }

    if (!token || typeof token !== 'string') {
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

/**
 * Socket.IO 認證中介軟體
 * @param {object} socket - Socket 對像
 * @param {function} next - 下一個中介軟體
 */
function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return next(new Error('Invalid or expired token'));
    }

    // 將使用者資訊附加到 socket
    socket.userId = decoded.userId;
    socket.userName = decoded.userName;

    next();
}

// ============================================
// Origin 驗證
// ============================================

const ALLOWED_ORIGINS = [
    'https://hktrpg.com',
    'https://www.hktrpg.com',
    'http://localhost:20721'  // 開發環境
];

/**
 * 驗證請求來源
 * @param {string} origin - 請求來源
 * @returns {boolean} 是否允許
 */
function validateOrigin(origin) {
    if (!origin) {
        return false;
    }

    // 檢查是否在白名單中
    if (ALLOWED_ORIGINS.includes(origin)) {
        return true;
    }

    // 檢查是否為 hktrpg.com 的子域名（支持 http 和 https）
    return /^https?:\/\/.*\.hktrpg\.com$/.test(origin);
}

/**
 * Socket.IO Origin 驗證中介軟體
 * @param {object} socket - Socket 對像
 * @param {function} next - 下一個中介軟體
 */
function socketOriginMiddleware(socket, next) {
    const origin = socket.handshake.headers.origin;

    if (!origin) {
        console.warn('No origin header in socket connection');
        return next();  // 允許無 origin（可能是移動端）
    }

    if (!validateOrigin(origin)) {
        console.warn('Rejected connection from invalid origin:', origin);
        return next(new Error('Invalid origin'));
    }

    next();
}

// ============================================
// 日誌清理
// ============================================

/**
 * 清理日誌中的敏感資訊
 * @param {any} data - 要記錄的數據
 * @returns {any} 清理后的數據
 */
function sanitizeLogData(data) {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return data;
        }
    }

    if (typeof data === 'object' && data !== null) {
        const cleaned = { ...data };

        // 移除敏感欄位
        const sensitiveFields = ['password', 'userPassword', 'token', 'secret'];
        for (const field of sensitiveFields) {
            if (cleaned[field]) {
                cleaned[field] = '[REDACTED]';
            }
        }

        return cleaned;
    }

    return data;
}

// ============================================
// 自動密碼升級
// ============================================

/**
 * 自動升級密碼（如果使用舊密碼登入）
 * @param {string} userName - 用戶名
 * @param {string} password - 明文密碼
 * @param {string} currentHash - 當前密碼雜湊
 * @returns {Promise<boolean>} 是否成功升級
 */
async function upgradePasswordIfLegacy(userName, password, currentHash) {
    try {
        // 檢查是否為 legacy 密碼
        if (currentHash.startsWith('$2b$')) {
            // 已經是 bcrypt，無需升級
            return false;
        }
        
        // 檢查是否為 legacy SHA256 密碼
        const salt = process.env.SALT;
        if (!salt) {
            console.warn('⚠️ SALT not set, cannot verify legacy password');
            return false;
        }
        
        const legacyHash = crypto.createHmac('sha256', password)
            .update(salt)
            .digest('hex');
        
        if (legacyHash !== currentHash) {
            // 不是 legacy 密碼，無需升級
            return false;
        }
        
        console.log(`🔄 Upgrading password for user: ${userName}`);
        
        // 生成新的 bcrypt 密碼
        const newHash = await hashPassword(password);
        
        // 更新數據庫
        const schema = require('../modules/schema.js');
        const result = await schema.accountPW.findOneAndUpdate(
            { userName: userName },
            { 
                $set: { 
                    password: newHash,
                    legacyPassword: currentHash // 備份舊密碼
                }
            },
            { new: true }
        );
        
        if (result) {
            console.log(`✅ Password upgraded for user: ${userName}`);
            console.log(`   Old hash backed up to legacyPassword field`);
            return true;
        } else {
            console.error(`❌ Failed to upgrade password for user: ${userName}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Password upgrade failed:', error.message);
        return false;
    }
}

// ============================================
// 資料加密/解密（使用 crypto-js）
// ============================================

/**
 * 加密資料
 * @param {string} data - 要加密的資料
 * @param {string} key - 加密金鑰（可選，預設使用 ENCRYPTION_KEY）
 * @returns {string} 加密後的資料
 */
function encryptData(data, key = null) {
    const encryptionKey = key || process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment variables');
    }
    
    if (!data || typeof data !== 'string') {
        throw new Error('Invalid data for encryption');
    }
    
    try {
        const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption failed:', error.message);
        throw new Error('Encryption failed');
    }
}

/**
 * 解密資料
 * @param {string} encryptedData - 加密的資料
 * @param {string} key - 解密金鑰（可選，預設使用 ENCRYPTION_KEY）
 * @returns {string} 解密後的資料
 */
function decryptData(encryptedData, key = null) {
    const encryptionKey = key || process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment variables');
    }
    
    if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
    }
    
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decrypted) {
            throw new Error('Decryption failed - invalid key or corrupted data');
        }
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        throw new Error('Decryption failed');
    }
}

/**
 * 產生資料摘要（HMAC）
 * @param {string} data - 要產生摘要的資料
 * @param {string} key - HMAC 金鑰（可選，預設使用 API_SECRET）
 * @returns {string} 資料摘要
 */
function generateHMAC(data, key = null) {
    const hmacKey = key || process.env.API_SECRET;
    
    if (!hmacKey) {
        throw new Error('API_SECRET not found in environment variables');
    }
    
    if (!data || typeof data !== 'string') {
        throw new Error('Invalid data for HMAC generation');
    }
    
    try {
        const hmac = CryptoJS.HmacSHA256(data, hmacKey);
        return hmac.toString(CryptoJS.enc.Hex);
    } catch (error) {
        console.error('HMAC generation failed:', error.message);
        throw new Error('HMAC generation failed');
    }
}

/**
 * 驗證資料完整性
 * @param {string} data - 原始資料
 * @param {string} signature - 預期的簽名
 * @param {string} key - 驗證金鑰（可選，預設使用 API_SECRET）
 * @returns {boolean} 是否驗證通過
 */
function verifyHMAC(data, signature, key = null) {
    try {
        const expectedSignature = generateHMAC(data, key);
        return expectedSignature === signature;
    } catch (error) {
        console.error('HMAC verification failed:', error.message);
        return false;
    }
}

// ============================================
// 導出
// ============================================

module.exports = {
    // 密碼
    hashPassword,
    verifyPassword,

    // 輸入驗證
    sanitizeInput,
    validateChatMessage,
    validateCredentials,
    validateJWTAuth,

    // JWT（如果已安裝）
    generateToken: jwt ? generateToken : null,
    verifyToken: jwt ? verifyToken : null,
    socketAuthMiddleware: jwt ? socketAuthMiddleware : null,

    // Origin 驗證
    validateOrigin,
    socketOriginMiddleware,

    // 日誌
    sanitizeLogData,
    
    // 🔄 自動密碼升級
    upgradePasswordIfLegacy,
    
    // 🔐 資料加密/解密
    encryptData,
    decryptData,
    generateHMAC,
    verifyHMAC,
    
    // 🔑 密鑰管理
    generateSecureKey,
    ensureEnvironmentKeys
};

