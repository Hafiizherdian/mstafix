import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import health from './health';
import circuitBreaker from './middleware/circuitBreaker';
import * as http from 'http';

// Tipe eksplisit untuk parameter onProxyReq dengan Request dari Express
interface ExtendedProxyOptions extends Options {
  onProxyReq?: (proxyReq: http.ClientRequest, req: Request, res: Response) => void;
}

const app: Express = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Register health check
health(app);



// Auth service routes (no auth required)
app.use('/api/v1/auth', 
  circuitBreaker(),
  createProxyMiddleware({ 
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true
  })
);

// Protected routes with auth middleware
app.use('/api/v1/generate-soal', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/generate-soal': ''
    }
  })
);

// Manage Soal Service
app.use('/api/v1/manage-soal',
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/manage-soal/questions': '/questions',
      '^/api/v1/manage-soal/([^/]+)$': '/questions/$1'
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      console.log(`[DEBUG] Proxying to manage-soal: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
      if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
        const bodyData = JSON.stringify(req.body);
        // Ensure content-type is set for the proxy request
        if (!proxyReq.getHeader('Content-Type')) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  } as ExtendedProxyOptions)
);

app.use('/api/v1/notifications', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({ 
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
    changeOrigin: true,
    ws: true
  })
);

export default app;