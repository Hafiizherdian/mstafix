import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  console.log(`[GENERATE-SOAL-AUTH] Verifying token - Path: ${req.path}, Method: ${req.method}, Token: ${token ? `${token.substring(0, 10)}...` : 'missing'}`);

  if (!token) {
    console.error('[GENERATE-SOAL-AUTH] Token not found');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[GENERATE-SOAL-AUTH] JWT_SECRET not set in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    console.log(`[GENERATE-SOAL-AUTH] Token valid for user: ${decoded.email} (${decoded.userId.substring(0, 8)}...)`);

    next();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        console.error(`[GENERATE-SOAL-AUTH] Token expired`);
        return res.status(401).json({ error: 'Token has expired' });
      } else if (err.name === 'JsonWebTokenError') {
        console.error(`[GENERATE-SOAL-AUTH] Invalid token: ${err.message}`);
        return res.status(401).json({ error: 'Invalid token' });
      } else {
        console.error(`[GENERATE-SOAL-AUTH] Token verification error: ${err}`);
        return res.status(401).json({ error: 'Token verification failed' });
      }
    } else {
      console.error(`[GENERATE-SOAL-AUTH] Unknown token verification error`);
      return res.status(401).json({ error: 'Token verification failed' });
    }
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const user = req.user;

  if (!user) {
    console.error('[GENERATE-SOAL-AUTH] User data not found in request');
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.role !== 'ADMIN') {
    console.error(`[GENERATE-SOAL-AUTH] User ${user.email} is not an admin (role: ${user.role})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  console.log(`[GENERATE-SOAL-AUTH] Admin access verified for user: ${user.email}`);
  next();
};

export { AuthenticatedRequest };
