import * as express from 'express';
import * as cors from 'cors';
import { setupWebSocket, setupMessageQueue } from './messageQueue';

const app = express.default();
app.use(cors.default());
app.use(express.json());

const PORT = process.env.PORT || 3004;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

const server = app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

// Setup WebSocket server
setupWebSocket(server);

// Setup RabbitMQ connection
setupMessageQueue().catch(error => {
  console.error('Failed to setup message queue:', error);
  process.exit(1);
}); 