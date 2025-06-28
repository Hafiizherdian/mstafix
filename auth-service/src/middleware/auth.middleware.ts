import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    name?: string;
    isAdmin?: boolean;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
}

// Enhanced token authentication middleware
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Response | void => {
  try {
    // Extract token from multiple sources
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const cookieToken = req.cookies?.token || req.cookies?.authToken;
    const token = bearerToken || cookieToken;

    console.log(
      `[AUTH] Authenticating - Path: ${req.path}, Method: ${req.method}, Token: ${token ? "present" : "missing"}`,
    );

    if (!token) {
      console.warn("[AUTH] No authentication token provided");
      return res.status(401).json({
        error: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    // Verify JWT secret is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[AUTH] JWT_SECRET not configured");
      return res.status(500).json({
        error: "Server configuration error",
        code: "JWT_SECRET_MISSING",
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Validate decoded payload
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.error("[AUTH] Invalid token payload structure");
      return res.status(401).json({
        error: "Invalid token payload",
        code: "INVALID_PAYLOAD",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    console.log(
      `[AUTH] Token verified - User: ${decoded.email}, Role: ${decoded.role}, ID: ${decoded.userId.substring(0, 8)}...`,
    );
    next();
  } catch (error) {
    console.error("[AUTH] Token verification failed:", error);

    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token has expired",
          code: "TOKEN_EXPIRED",
          message: error.message,
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token format",
          code: "TOKEN_INVALID",
          message: error.message,
        });
      }

      if (error.name === "NotBeforeError") {
        return res.status(401).json({
          error: "Token not yet active",
          code: "TOKEN_NOT_ACTIVE",
          message: error.message,
        });
      }
    }

    // Generic token verification error
    return res.status(401).json({
      error: "Token verification failed",
      code: "TOKEN_VERIFICATION_FAILED",
    });
  }
};

// Admin role requirement middleware
export const requireAdminRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Response | void => {
  try {
    const user = req.user;

    if (!user) {
      console.error("[AUTH] User data missing from authenticated request");
      return res.status(401).json({
        error: "Authentication data missing",
        code: "AUTH_DATA_MISSING",
      });
    }

    if (user.role !== "ADMIN") {
      console.warn(
        `[AUTH] Access denied - User ${user.email} attempted admin action with role: ${user.role}`,
      );
      return res.status(403).json({
        error: "Admin privileges required",
        code: "INSUFFICIENT_PRIVILEGES",
        userRole: user.role,
        requiredRole: "ADMIN",
      });
    }

    console.log(
      `[AUTH] Admin access granted - User: ${user.email}, ID: ${user.userId.substring(0, 8)}...`,
    );
    next();
  } catch (error) {
    console.error("[AUTH] Error in admin role verification:", error);
    return res.status(500).json({
      error: "Authorization check failed",
      code: "AUTH_CHECK_ERROR",
    });
  }
};

// Optional admin middleware (doesn't fail if not admin)
export const optionalAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  // This middleware just marks if user is admin, doesn't restrict access
  if (req.user) {
    req.user.isAdmin = req.user.role === "ADMIN";
  }
  next();
};

// User role requirement middleware (more flexible)
export const requireRole = (allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        console.warn(
          `[AUTH] Access denied - User ${user.email} has role ${user.role}, required: ${allowedRoles.join(", ")}`,
        );
        return res.status(403).json({
          error: "Insufficient privileges",
          code: "INSUFFICIENT_PRIVILEGES",
          userRole: user.role,
          allowedRoles,
        });
      }

      console.log(
        `[AUTH] Role access granted - User: ${user.email}, Role: ${user.role}`,
      );
      next();
    } catch (error) {
      console.error("[AUTH] Error in role verification:", error);
      return res.status(500).json({
        error: "Authorization check failed",
        code: "AUTH_CHECK_ERROR",
      });
    }
  };
};

// Self-or-admin middleware (user can access their own data or admin can access any)
export const requireSelfOrAdmin = (userIdParam: string = "userId") => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    try {
      const user = req.user;
      const targetUserId = req.params[userIdParam];

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      if (!targetUserId) {
        return res.status(400).json({
          error: "User ID parameter missing",
          code: "MISSING_USER_ID",
        });
      }

      const isAdmin = user.role === "ADMIN";
      const isSelf = user.userId === targetUserId;

      if (!isAdmin && !isSelf) {
        console.warn(
          `[AUTH] Access denied - User ${user.email} attempted to access data for user ${targetUserId}`,
        );
        return res.status(403).json({
          error: "Can only access your own data or admin access required",
          code: "INSUFFICIENT_PRIVILEGES",
        });
      }

      console.log(
        `[AUTH] Self-or-admin access granted - User: ${user.email}, Target: ${targetUserId}, IsAdmin: ${isAdmin}, IsSelf: ${isSelf}`,
      );
      next();
    } catch (error) {
      console.error("[AUTH] Error in self-or-admin verification:", error);
      return res.status(500).json({
        error: "Authorization check failed",
        code: "AUTH_CHECK_ERROR",
      });
    }
  };
};

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000,
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    try {
      const identifier = req.user?.userId || req.ip || "unknown";
      const now = Date.now();
      const userLimit = requestCounts.get(identifier);

      if (!userLimit || now > userLimit.resetTime) {
        // Reset or initialize counter
        requestCounts.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
        return;
      }

      if (userLimit.count >= maxRequests) {
        console.warn(`[AUTH] Rate limit exceeded for ${identifier}`);
        return res.status(429).json({
          error: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
        });
      }

      userLimit.count++;
      next();
    } catch (error) {
      console.error("[AUTH] Error in rate limiting:", error);
      // Don't block on rate limiting errors
      next();
    }
  };
};

// Clean up rate limiting data periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Clean up every 5 minutes

// Legacy middleware aliases for backward compatibility
export const requireAdmin = requireAdminRole;

// Export types
export type { AuthenticatedRequest, JWTPayload };
