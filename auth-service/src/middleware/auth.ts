import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string;
}

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  console.log(`[AUTH] Verifying token - Path: ${req.path}, Method: ${req.method}, Token: ${token ? `${token.substring(0, 10)}...` : 'missing'}`);
  
  if (!token) {
    console.error('[AUTH] Token tidak ditemukan');
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH] JWT_SECRET not set in environment');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    
    // Log successful verification (masked user info)
    const userId = (decoded as any).userId || 'unknown';
    const email = (decoded as any).email || 'unknown';
    console.log(`[AUTH] Token valid for user: ${email} (${userId.substring(0, 8)}...)`);
    
    next();
  } catch (err) {
    // Log detailed error
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        console.error(`[AUTH] Token expired`);
        return res.status(401).json({ message: 'Token telah kadaluarsa' });
      } else if (err.name === 'JsonWebTokenError') {
        console.error(`[AUTH] Invalid token: ${err.message}`);
        return res.status(401).json({ message: 'Token tidak valid' });
      } else {
        console.error(`[AUTH] Token verification error: ${err}`);
        return res.status(401).json({ message: 'Token tidak valid' });
      }
    } else {
      console.error(`[AUTH] Unknown token verification error`);
      return res.status(401).json({ message: 'Token tidak valid' });
    }
  }
};

// Middleware untuk memverifikasi bahwa pengguna adalah admin
export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const user = req.user as jwt.JwtPayload;
  
  if (!user) {
    console.error('[AUTH] User data not found in request');
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  
  if (user.role !== 'ADMIN') {
    console.error(`[AUTH] User ${user.email} is not an admin (role: ${user.role})`);
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log(`[AUTH] Admin access verified for user: ${user.email}`);
  next();
};