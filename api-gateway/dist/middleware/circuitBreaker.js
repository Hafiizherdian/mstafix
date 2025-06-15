"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = circuitBreaker;
/**
 * Stub circuit‐breaker middleware
 * (langsung next; jika butuh opossum, Anda bisa import dan wrap di sini)
 */
function circuitBreaker() {
    return (req, res, next) => {
        next();
    };
}
