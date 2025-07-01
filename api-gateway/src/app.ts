import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import health from './health';
import circuitBreaker from './middleware/circuitBreaker';
import * as http from 'http';

// Interface untuk response analytics
interface AnalyticsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserAnalyticsData {
  overview?: {
    total: number;
    active: number;
    new: number;
    growth: {
      percentage: number;
    };
  };
  distribution?: {
    byRole: Array<{ name: string; value: number; percentage: number }>;
  };
  trends?: {
    registrations: Array<{ date: string; count: number }>;
  };
  recentActivity?: any[];
  period?: string;
}

interface QuestionAnalyticsData {
  total: number;
  byCategory: Array<{ category: string; count: number }>;
  byDifficulty: Array<{ difficulty: string; count: number }>;
  recent: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
    type: string;
    createdAt: string;
  }>;
}

// Tipe eksplisit untuk parameter proxy middleware
type OnProxyReqCallback = (proxyReq: http.ClientRequest, req: Request, res: Response) => void;
type OnProxyResCallback = (proxyRes: http.IncomingMessage, req: Request, res: Response) => void;
type OnErrorCallback = (err: Error, req: Request, res: Response, target?: string | Partial<URL>) => void;

interface ExtendedProxyOptions extends Options {
  onProxyReq?: OnProxyReqCallback;
  onProxyRes?: OnProxyResCallback;
  onError?: OnErrorCallback;
}

const app: Express = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Register health check
health(app);

// Auth service routes (no auth required)
// Auth service routes (no auth required)
app.use('/api/v1/auth', 
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/auth': '', // Hapus prefix sebelum meneruskan
    },
    onProxyReq: (proxyReq, req, res) => {
      const targetPath = `${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to auth-service: ${req.method} ${req.originalUrl} -> ${targetPath}`);
      
      // Tulis ulang body jika sudah dibaca oleh express.json()
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type','application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy Error to auth-service:', err);
      res.status(502).send('Proxy Error: Could not connect to auth service');
    }
  } as ExtendedProxyOptions)
);

// Generate soal service routes (protected)
app.use('/api/v1/generate-soal', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/generate-soal': ''
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      const targetPath = `${process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to generate-soal-service: ${req.method} ${req.originalUrl} -> ${targetPath}`);
      
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type','application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy Error to generate-soal-service:', err);
      res.status(502).send('Proxy Error: Could not connect to generate soal service');
    }
  } as ExtendedProxyOptions)
);

// Manage soal service routes (protected)
app.use('/api/v1/manage-soal',
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/manage-soal': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      const targetPath = `${process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to manage-soal-service: ${req.method} ${req.originalUrl} -> ${targetPath}`);
      // Tulis ulang body jika sudah dibaca oleh express.json()
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type','application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy Error to manage-soal-service:', err);
      res.status(502).send('Proxy Error: Could not connect to manage soal service');
    }
  } as ExtendedProxyOptions)
);

// Update role endpoint (protected)
app.post('/api/auth/update-role',
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth/update-role': '/admin/update-role'
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      const target = `${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to auth-service (update-role): ${req.method} ${req.originalUrl} -> ${target}`);
      console.log('Request Body:', JSON.stringify(req.body, null, 2));
      console.log('Request Headers:', req.headers);
      proxyReq.setHeader('x-forwarded-proto', 'http');
      proxyReq.setHeader('x-forwarded-host', req.headers.host || '');
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      console.log(`[DEBUG] Response from auth-service (update-role): ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
    }
  } as ExtendedProxyOptions)
);

// Admin routes for users (protected)
app.use('/api/admin/users', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin/users': '/admin/users'  // Path di auth-service
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      const target = `${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to auth-service (users): ${req.method} ${req.originalUrl} -> ${target}`);
      console.log('Users Query Params:', req.query);
      console.log('Request Headers:', req.headers);
      // Tambahkan header yang diperlukan
      proxyReq.setHeader('x-forwarded-proto', 'http');
      proxyReq.setHeader('x-forwarded-host', req.headers.host || '');
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      console.log(`[DEBUG] Response from auth-service (users): ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      // Log response headers untuk debugging
      console.log('Response Headers:', proxyRes.headers);
    },
    onError: (err: Error, req: Request, res: Response, target?: string | Partial<URL>) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error connecting to auth service',
        error: err.message 
      });
    }
  } as ExtendedProxyOptions)
);



// Combined analytics endpoint
app.get('/api/admin/analytics/combined', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      console.log('Fetching combined analytics...');
      
      // Dapatkan token dari header Authorization
      const authHeader = req.headers.authorization;
      
      // Log token untuk debugging
      console.log('Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'missing');
      
      // Persiapkan headers untuk request ke service backend
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': authHeader || ''
      };
      
      // Tambahkan x-user-id jika tersedia
      if (req.headers['x-user-id']) {
        headers['x-user-id'] = req.headers['x-user-id'] as string;
      }
      
      // Log headers untuk debugging
      console.log('Request headers to backend services:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers['Authorization'] ? 'Bearer [token]' : 'missing',
        'x-user-id': headers['x-user-id'] || 'missing'
      });
      
      // Get all analytics in parallel
      const [userAnalytics, questionAnalytics] = await Promise.all([
        // Get user analytics from auth-service
        (async (): Promise<AnalyticsResponse<UserAnalyticsData>> => {
          try {
            const res = await fetch(`http://auth-service:3001/api/v1/admin/analytics/users`, {
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!res.ok) {
              const error = await res.text();
              console.error('Error from auth-service:', error);
              return { success: false, error: `Auth service error: ${res.status} ${res.statusText}` };
            }
            
            const data = await res.json() as UserAnalyticsData;
            return { success: true, data };
          } catch (error) {
            console.error('Error fetching user analytics:', error);
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to connect to auth service' 
            };
          }
        })(),
        
        // Get question analytics from manage-soal-service
        (async (): Promise<AnalyticsResponse<QuestionAnalyticsData>> => {
          try {
            const res = await fetch(`http://manage-soal-service:3003/api/v1/admin/analytics`, {
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!res.ok) {
              const error = await res.text();
              console.error('Error from manage-soal-service:', error);
              return { success: false, error: `Manage soal service error: ${res.status} ${res.statusText}` };
            }
            
            const data = await res.json() as QuestionAnalyticsData;
            return { success: true, data };
          } catch (error) {
            console.error('Error fetching question analytics:', error);
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to connect to manage soal service' 
            };
          }
        })()
      ]);

      // Log responses for debugging
      console.log('User analytics response:', JSON.stringify(userAnalytics, null, 2).substring(0, 500) + '...');
      console.log('Question analytics response:', JSON.stringify(questionAnalytics, null, 2).substring(0, 500) + '...');

      // Check for errors in responses
      if (!userAnalytics.success) {
        console.error('Error in user analytics:', userAnalytics.error);
      }
      
      if (!questionAnalytics.success) {
        console.error('Error in question analytics:', questionAnalytics.error);
      }

      // Type guard untuk memeriksa apakah response memiliki data yang valid
      const hasUserData = (data: any): data is { data: UserAnalyticsData } => {
        return data && data.success === true && data.data !== undefined;
      };

      const hasQuestionData = (data: any): data is { data: QuestionAnalyticsData } => {
        return data && data.success === true && data.data !== undefined;
      };

      // Helper untuk mengambil data user dengan type safety
      const getUserData = (data: any, path: string, defaultValue: any = 0) => {
        if (!hasUserData(data)) return defaultValue;
        
        const pathParts = path.split('.');
        let result: any = data.data;
        
        for (const part of pathParts) {
          result = result?.[part];
          if (result === undefined) return defaultValue;
        }
        
        return result !== undefined ? result : defaultValue;
      };

      // Helper untuk mengambil data question dengan type safety
      const getQuestionData = (data: any, path: string, defaultValue: any = []) => {
        if (!hasQuestionData(data)) return defaultValue;
        
        const pathParts = path.split('.');
        let result: any = data.data;
        
        for (const part of pathParts) {
          result = result?.[part];
          if (result === undefined) return defaultValue;
        }
        
        return result !== undefined ? result : defaultValue;
      };

      // Combine the responses with fallbacks
      const combinedResponse = {
        success: userAnalytics.success && questionAnalytics.success,
        data: {
          userStats: {
            total: getUserData(userAnalytics, 'overview.total', 0),
            active: getUserData(userAnalytics, 'overview.active', 0),
            new: getUserData(userAnalytics, 'overview.new', 0),
            growth: getUserData(userAnalytics, 'overview.growth.percentage', 0),
            distribution: {
              byRole: getUserData(userAnalytics, 'distribution.byRole', [])
            },
            trends: getUserData(userAnalytics, 'trends.registrations', []),
            recentActivity: getUserData(userAnalytics, 'recentActivity', []),
            period: getUserData(userAnalytics, 'period', '30d')
          },
          questionStats: {
            total: getQuestionData(questionAnalytics, 'total', 0),
            byCategory: getQuestionData(questionAnalytics, 'byCategory', []),
            byDifficulty: getQuestionData(questionAnalytics, 'byDifficulty', []),
            recent: getQuestionData(questionAnalytics, 'recent', [])
          },
          generationStats: {
            total: 0,
            successRate: 0,
            byType: [],
            recent: []
          }
        },
        errors: {
          userStats: userAnalytics.error,
          questionStats: questionAnalytics.error
        }
      };

      res.json(combinedResponse);
    } catch (error) {
      console.error('Error combining analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch combined analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Admin routes for analytics (protected)
app.use('/api/admin/analytics', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin/analytics/users/count': '/users/count',
      '^/api/admin/analytics/users/activity': '/users/activity',
      '^/api/admin/analytics/': '/'
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      console.log(`[DEBUG] Proxying to auth-service (analytics): ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    }
  } as ExtendedProxyOptions)
);

// Admin routes for generated questions (protected)
app.use('/api/admin/generated-questions', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin/generated-questions': '/api/v1/admin/generated-questions' // Path di generate-soal-service
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      const target = `${process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to generate-soal: ${req.method} ${req.originalUrl} -> ${target}`);
      console.log('Generated Questions Query Params:', req.query);
      console.log('Request Headers:', req.headers);
      // Tambahkan header yang diperlukan
      proxyReq.setHeader('x-forwarded-proto', 'http');
      proxyReq.setHeader('x-forwarded-host', req.headers.host || '');
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      console.log(`[DEBUG] Response from generate-soal: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      console.log('Response Headers:', proxyRes.headers);
    },
    onError: (err: Error, req: Request, res: Response, target?: string | Partial<URL>) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error connecting to generate-soal service',
        error: err.message 
      });
    }
  } as ExtendedProxyOptions)
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

// Admin routes for questions (protected)
app.use('/api/admin/questions', 
  authMiddleware,
  circuitBreaker(),
  createProxyMiddleware({
    target: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin/questions': '/api/v1/admin/questions' // Path di manage-soal-service
    },
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      const target = `${process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003'}${proxyReq.path}`;
      console.log(`[DEBUG] Proxying to manage-soal (questions): ${req.method} ${req.originalUrl} -> ${target}`);
      
      // Tambahkan log untuk debugging query parameters
      console.log('Query params:', req.query);
      console.log('Request Headers:', req.headers);
      
      // Handle body untuk request POST/PUT
      if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
        const bodyData = JSON.stringify(req.body);
        if (!proxyReq.getHeader('Content-Type')) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      

    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      // Log response dari service
      console.log(`[DEBUG] Response from manage-soal: ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
    }
  } as ExtendedProxyOptions)
);

// Admin routes for notifications (protected)
// Admin routes for notifications (protected)
const notificationProxyOptions = {
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
  changeOrigin: true,
  ws: true,
  pathRewrite: (path, req) => {
    const newPath = path
      .replace(/^\/api\/admin\/notifications/, '')
      .replace(/^\/api\/v1\/notifications/, '');
    console.log(`[SUCCESS DEBUG] Path rewrite for notifications: ${path} -> ${newPath || '/'}`);
    return newPath || '/';
  },
  onProxyReq: (proxyReq, req: Request, res: Response) => {
    console.log(`[DEBUG] Proxying to notification-service: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  }
} as ExtendedProxyOptions;

app.use('/api/v1/notifications*', authMiddleware, circuitBreaker(), createProxyMiddleware(notificationProxyOptions));
app.use('/api/admin/notifications*', authMiddleware, circuitBreaker(), createProxyMiddleware(notificationProxyOptions));

export default app;