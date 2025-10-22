/**
 * Security Utilities for HKTRPG
 * 安全工具函式集
 */

const crypto = require('crypto');

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
        // Fallback（僅用於開發，不安全）
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
        if (bcrypt) {
            return await bcrypt.compare(password, hash);
        } else {
            // Fallback
            const testHash = crypto.createHash('sha256').update(password).digest('hex');
            return testHash === hash;
        }
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
        throw new Error('Invalid input type - expected string');
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

    // 驗證名稱
    const name = String(msg.name || '').trim();
    if (!name || name.length < 1 || name.length > 50) {
        return { valid: false, error: 'Invalid name length (1-50 characters)' };
    }

    // 驗證訊息內容
    const text = String(msg.msg || '').trim();
    if (!text || text.length < 1 || text.length > 2000) {
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
            text: text.slice(0, 2000),
            room: room.slice(0, 50)
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
            password: password.slice(0, 100)
        }
    };
}

// ============================================
// JWT 認證（可選）
// ============================================
// 注意：需要先安裝 jsonwebtoken
// npm install jsonwebtoken

let jwt;
try {
    jwt = require('jsonwebtoken');
} catch {
    console.warn('⚠️ jsonwebtoken not installed');
}

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '24h';

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

    // JWT（如果已安裝）
    generateToken: jwt ? generateToken : null,
    verifyToken: jwt ? verifyToken : null,
    socketAuthMiddleware: jwt ? socketAuthMiddleware : null,

    // Origin 驗證
    validateOrigin,
    socketOriginMiddleware,

    // 日誌
    sanitizeLogData
};

