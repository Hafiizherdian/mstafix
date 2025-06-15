"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController = __importStar(require("../controllers/auth.controller"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/health', (req, res) => {
    return res.status(200).json({ status: 'ok', service: 'auth-service' });
});
router.post('/register', async (req, res) => {
    try {
        const userData = req.body;
        const result = await authController.register(userData);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authController.login({ email, password });
        return res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(401).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
});
router.get('/verify', auth_1.verifyToken, (req, res) => {
    const user = req.user;
    console.log('[AUTH] Token verified successfully for user:', user);
    if (!user) {
        console.error('[AUTH] User data not found in token');
        return res.status(401).json({
            authenticated: false,
            error: 'User data not found in token'
        });
    }
    return res.status(200).json({
        authenticated: true,
        user: {
            userId: user.userId,
            email: user.email,
            role: user.role
        },
        message: 'Token valid'
    });
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        const tokens = await authController.refreshAccessToken(refreshToken);
        return res.status(200).json(tokens);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(401).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
});
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        await authController.logout(refreshToken);
        return res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        }
        else {
            return res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map