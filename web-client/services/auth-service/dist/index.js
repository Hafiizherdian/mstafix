"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.get('/', (_, res) => {
    return res.json({
        service: 'auth-service',
        status: 'ok',
        endpoints: [
            '/health',
            '/api/v1/auth/register',
            '/api/v1/auth/login',
            '/api/v1/auth/refresh',
            '/api/v1/auth/logout',
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/refresh',
            '/api/auth/logout'
        ]
    });
});
app.get('/health', (_, res) => {
    return res.json({ status: 'ok', service: 'auth-service' });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    return res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});
app.listen(port, () => {
    console.log(`Auth service running at http://localhost:${port}`);
    console.log(`Database URL: ${process.env.DATABASE_URL || 'Not set'}`);
});
//# sourceMappingURL=index.js.map