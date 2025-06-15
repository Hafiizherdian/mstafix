"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';
const generateTokens = async (user) => {
    try {
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: refreshTokenExpiry
            }
        });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error('Error generating tokens:', error);
        throw new Error('Failed to generate authentication tokens');
    }
};
const register = async (userData) => {
    const { email, password, name } = userData;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('Email sudah terdaftar');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER'
            }
        });
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
        throw new Error('Registration failed');
    }
};
exports.register = register;
const login = async ({ email, password }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new Error('Email atau password salah');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Email atau password salah');
        }
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
        throw new Error('Authentication failed');
    }
};
exports.login = login;
const refreshAccessToken = async (refreshToken) => {
    try {
        const existingToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });
        if (!existingToken) {
            throw new Error('Invalid refresh token');
        }
        if (existingToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({
                where: { id: existingToken.id }
            });
            throw new Error('Refresh token expired');
        }
        await prisma.refreshToken.delete({
            where: { id: existingToken.id }
        });
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
            id: existingToken.user.id,
            email: existingToken.user.email,
            name: existingToken.user.name,
            role: existingToken.user.role
        });
        return { accessToken, refreshToken: newRefreshToken };
    }
    catch (error) {
        console.error('Token refresh error:', error);
        if (error instanceof Error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
        throw new Error('Token refresh failed');
    }
};
exports.refreshAccessToken = refreshAccessToken;
const logout = async (refreshToken) => {
    try {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
        return { success: true };
    }
    catch (error) {
        console.error('Logout error:', error);
        if (error instanceof Error) {
            throw new Error(`Logout failed: ${error.message}`);
        }
        throw new Error('Logout failed');
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map