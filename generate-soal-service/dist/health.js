"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = health;
function health(app) {
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });
}
//# sourceMappingURL=health.js.map