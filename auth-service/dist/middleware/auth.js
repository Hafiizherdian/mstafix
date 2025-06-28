"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1];
    console.log(`[AUTH] Verifying token - Path: ${req.path}, Method: ${req.method}, Token: ${token ? `${token.substring(0, 10)}...` : 'missing'}`);
    if (!token) {
        console.error('[AUTH] Token tidak ditemukan');
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('[AUTH] JWT_SECRET not set in environment');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        const userId = decoded.userId || 'unknown';
        const email = decoded.email || 'unknown';
        console.log(`[AUTH] Token valid for user: ${email} (${userId.substring(0, 8)}...)`);
        next();
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.name === 'TokenExpiredError') {
                console.error(`[AUTH] Token expired`);
                return res.status(401).json({ message: 'Token telah kadaluarsa' });
            }
            else if (err.name === 'JsonWebTokenError') {
                console.error(`[AUTH] Invalid token: ${err.message}`);
                return res.status(401).json({ message: 'Token tidak valid' });
            }
            else {
                console.error(`[AUTH] Token verification error: ${err}`);
                return res.status(401).json({ message: 'Token tidak valid' });
            }
        }
        else {
            console.error(`[AUTH] Unknown token verification error`);
            return res.status(401).json({ message: 'Token tidak valid' });
        }
    }
};
exports.verifyToken = verifyToken;
const verifyAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        console.error('[AUTH] User data not found in request');
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    if (user.role !== 'ADMIN') {
        console.error(`[AUTH] User ${user.email} is not an admin (role: ${user.role})`);
        return res.status(403).json({ message: 'Admin access required' });
    }
    console.log(`[AUTH] Admin access verified for user: ${user.email}`);
    next();
};
exports.verifyAdmin = verifyAdmin;
//# sourceMappingURL=auth.js.map