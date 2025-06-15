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

// Add logging middleware untuk debugging
app.use('/api/v1/manage-soal', (req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Request to manage-soal-service: ${req.method} ${req.path}`);
  console.log(`[DEBUG] Auth header present: ${req.headers.authorization ? 'Yes' : 'No'}`);
  console.log(`[DEBUG] Request params:`, req.params);
  console.log(`[DEBUG] Request query:`, req.query);
  next();
});

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

// Khusus untuk rute questions di manage-soal untuk memastikan redirect yang benar
app.use('/api/v1/manage-soal/questions', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/manage-soal': ''
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      console.log(`[DEBUG] Proxying to questions route: ${req.method} ${req.url} -> ${proxyReq.path}`);
      // Forward request body when bodyParser has parsed it
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  } as ExtendedProxyOptions)
);

// Main manage-soal route handling
app.use('/api/v1/manage-soal', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/manage-soal': ''
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      // Special handling for question ID URLs without /questions/ in path
      const idPattern = /^\/[a-zA-Z0-9_-]+$/;
      if (req.path && idPattern.test(req.path)) {
        const questionId = req.path.substring(1);
        const originalPath = proxyReq.path;
        const urlQuery = req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        console.log(`[DEBUG] Detecting question ID pattern for path: ${req.path}`);
        proxyReq.path = `/questions/${questionId}${urlQuery}`;
        console.log(`[DEBUG] Rewriting path from ${originalPath} to ${proxyReq.path} for ${req.method}`);
        proxyReq.setHeader('X-Original-URL', originalPath);
        proxyReq.setHeader('X-Rewritten-URL', proxyReq.path);
        proxyReq.setHeader('X-Request-Method', req.method);
      }
      // Forward request body after headers rewritten (POST, PUT, PATCH)
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      // Log proxy forwarding
      console.log(`[DEBUG] Proxying: ${req.method} ${req.url || ''} -> ${proxyReq.path}`);
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