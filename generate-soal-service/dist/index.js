"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const PORT = parseInt(process.env.PORT || '3002', 10);
async function startServer() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
        app_1.default.listen(PORT, () => {
            console.log(`🚀 generate-soal-service listening on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map