"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = proxy;
const http_proxy_middleware_1 = require("http-proxy-middleware");
/**
 * Buat proxy middleware
 * @param prefix  base path di gateway (misal '/api/v1/auth')
 * @param target  URL service tujuan
 */
function proxy(prefix, target) {
    return (0, http_proxy_middleware_1.createProxyMiddleware)({
        target,
        changeOrigin: true,
        pathRewrite: { [`^${prefix}`]: '' }
    });
}
