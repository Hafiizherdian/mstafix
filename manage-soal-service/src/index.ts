import app from './app';
import { PrismaClient } from '@prisma/client';
import { messageQueue } from './services/messageQueue';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    // Initialize message queue
    await messageQueue.connect();

    app.listen(PORT, () => {
      console.log(`Manage Soal Service running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      await messageQueue.disconnect();
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
