"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = health;
/**
 * Daftarkan endpoint health check
 */
function health(app) {
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            service: 'api-gateway',
            timestamp: new Date().toISOString()
        });
    });
}
