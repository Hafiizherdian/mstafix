"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const health_1 = __importDefault(require("./health"));
const proxy_1 = __importDefault(require("./middleware/proxy"));
const app = (0, express_1.default)();
// Route ke service yang sesuai via helper proxy()
app.use('/api/v1/auth', (0, proxy_1.default)('/api/v1/auth', 'http://auth-service:3001'));
app.use('/api/v1/generate-soal', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: 'http://generate-soal-service:3002',
    changeOrigin: true
}));
app.use('/api/v1/manage-soal', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: 'http://manage-soal-service:3003',
    changeOrigin: true
}));
(0, health_1.default)(app);
exports.default = app;
