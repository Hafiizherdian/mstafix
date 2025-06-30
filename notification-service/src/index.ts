import * as express from 'express';
import * as cors from 'cors';
import { setupWebSocket, setupMessageQueue } from './messageQueue';
import { getRecentActivities } from './activityStore';

const app = express.default();

// Konfigurasi CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors.default(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors.default(corsOptions));

const PORT = process.env.PORT || 3004;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Get recent activities
app.get('/activities/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = getRecentActivities(limit);
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent activities'
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`- GET /health`);
  console.log(`- GET /activities/recent?limit=10`);
});

// Setup WebSocket server
setupWebSocket(server);

// Setup RabbitMQ connection
setupMessageQueue().catch(error => {
  console.error('Failed to setup message queue:', error);
  process.exit(1);
});