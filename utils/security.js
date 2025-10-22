/**
 * Security Utilities for HKTRPG
 * 安全工具函数集
 */

const crypto = require('crypto');

// ============================================
// 密码哈希（使用 bcrypt）
// ============================================
// 注意：需要先安装 bcrypt
// npm install bcrypt

let bcrypt;
try {
    bcrypt = require('bcrypt');
} catch {
    console.warn('⚠️ bcrypt not installed. Using fallback (NOT SECURE for production)');
}

const SALT_ROUNDS = 12;

/**
 * 哈希密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 哈希后的密码
 */
async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Invalid password');
    }
    
    if (bcrypt) {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } else {
        // Fallback（仅用于开发，不安全）
        console.warn('⚠️ Using insecure password hash fallback!');
        return crypto.createHash('sha256').update(password).digest('hex');
    }
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希值
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
// 输入验证
// ============================================

/**
 * 清理输入（防止 NoSQL 注入）
 * @param {any} input - 用户输入
 * @param {number} maxLength - 最大长度
 * @returns {string} 清理后的字符串
 */
function sanitizeInput(input, maxLength = 100) {
    if (typeof input !== 'string') {
        throw new Error('Invalid input type - expected string');
    }
    
    return input.trim().slice(0, maxLength);
}

/**
 * 验证聊天消息
 * @param {object} msg - 消息对象
 * @returns {object} { valid: boolean, error?: string, data?: object }
 */
function validateChatMessage(msg) {
    // 类型检查
    if (!msg || typeof msg !== 'object') {
        return { valid: false, error: 'Invalid message format' };
    }
    
    // 验证名称
    const name = String(msg.name || '').trim();
    if (!name || name.length < 1 || name.length > 50) {
        return { valid: false, error: 'Invalid name length (1-50 characters)' };
    }
    
    // 验证消息内容
    const text = String(msg.msg || '').trim();
    if (!text || text.length < 1 || text.length > 2000) {
        return { valid: false, error: 'Invalid message length (1-2000 characters)' };
    }
    
    // XSS 防护 - 检查可疑模式
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
    
    // 验证房间号
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
 * 验证用户名和密码
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
// JWT 认证（可选）
// ============================================
// 注意：需要先安装 jsonwebtoken
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
 * 生成 JWT Token
 * @param {object} user - 用户对象 { id, userName }
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
 * 验证 JWT Token
 * @param {string} token - JWT token
 * @returns {object|null} 解码后的用户信息，或 null
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
 * Socket.IO 认证中间件
 * @param {object} socket - Socket 对象
 * @param {function} next - 下一个中间件
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
    
    // 将用户信息附加到 socket
    socket.userId = decoded.userId;
    socket.userName = decoded.userName;
    
    next();
}

// ============================================
// Origin 验证
// ============================================

const ALLOWED_ORIGINS = [
    'https://hktrpg.com',
    'https://www.hktrpg.com',
    'http://localhost:20721'  // 开发环境
];

/**
 * 验证请求来源
 * @param {string} origin - 请求来源
 * @returns {boolean} 是否允许
 */
function validateOrigin(origin) {
    if (!origin) {
        return false;
    }
    
    return ALLOWED_ORIGINS.includes(origin) || 
           origin.match(/^https:\/\/.*\.hktrpg\.com$/);
}

/**
 * Socket.IO Origin 验证中间件
 * @param {object} socket - Socket 对象
 * @param {function} next - 下一个中间件
 */
function socketOriginMiddleware(socket, next) {
    const origin = socket.handshake.headers.origin;
    
    if (!origin) {
        console.warn('No origin header in socket connection');
        return next();  // 允许无 origin（可能是移动端）
    }
    
    if (!validateOrigin(origin)) {
        console.warn('Rejected connection from invalid origin:', origin);
        return next(new Error('Invalid origin'));
    }
    
    next();
}

// ============================================
// 日志清理
// ============================================

/**
 * 清理日志中的敏感信息
 * @param {any} data - 要记录的数据
 * @returns {any} 清理后的数据
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
        
        // 移除敏感字段
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
// 导出
// ============================================

module.exports = {
    // 密码
    hashPassword,
    verifyPassword,
    
    // 输入验证
    sanitizeInput,
    validateChatMessage,
    validateCredentials,
    
    // JWT（如果已安装）
    generateToken: jwt ? generateToken : null,
    verifyToken: jwt ? verifyToken : null,
    socketAuthMiddleware: jwt ? socketAuthMiddleware : null,
    
    // Origin 验证
    validateOrigin,
    socketOriginMiddleware,
    
    // 日志
    sanitizeLogData
};

