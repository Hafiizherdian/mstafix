import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare module 'express' {
  interface Request {
    user?: jwt.JwtPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  // Log request info (masked token)
  console.log(`Auth middleware - Path: ${req.path}, Method: ${req.method}, Token: ${token ? `${token.substring(0, 10)}...` : 'missing'}`);
  
  if (!token) {
    console.error('Auth middleware - No token provided');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    // Verifikasi token dengan JWT_SECRET
    console.log(`Auth middleware - Verifying token with JWT_SECRET: ${JWT_SECRET ? 'provided' : 'missing'}`);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as jwt.JwtPayload;
    
    // Log successful auth (masked user info)
    const userId = (req.user as any).userId || 'unknown';
    const email = (req.user as any).email || 'unknown';
    console.log(`Auth middleware - Authenticated user: ${email} (${userId.substring(0, 8)}...)`);
    
    // Pastikan token ada di header Authorization untuk diteruskan ke layanan berikutnya
    // Ini penting karena beberapa implementasi proxy middleware mungkin menghapus header
    req.headers.authorization = `Bearer ${token}`;
    console.log('Auth middleware - Re-applying authorization header for forwarding');
    
    // Add user ID to headers for downstream services
    req.headers['x-user-id'] = userId;
    console.log(`Auth middleware - Adding X-User-ID header: ${userId}`);
    
    // Cek apakah token hampir kedaluwarsa (kurang dari 1 jam)
    const exp = (req.user as any).exp;
    if (exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = exp - now;
      console.log(`Auth middleware - Token expires in ${timeLeft} seconds`);
      
      if (timeLeft < 3600) { // Kurang dari 1 jam
        console.log(`Auth middleware - Token will expire soon (${timeLeft} seconds left)`);
        // Kita bisa tambahkan logika refresh token di sini jika diperlukan
      }
    }
    
    next();
  } catch (error) {
    // Log detailed error
    if (error instanceof jwt.TokenExpiredError) {
      console.error(`Auth middleware - Token expired at: ${error.expiredAt}`);
      res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error(`Auth middleware - Invalid token: ${error.message}`);
      res.status(401).json({ error: 'Invalid token' });
    } else {
      console.error(`Auth middleware - Auth error:`, error);
      res.status(401).json({ error: 'Authentication failed' });
    }
    return;
  }
};