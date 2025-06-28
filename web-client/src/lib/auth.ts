import jwt, { SignOptions } from "jsonwebtoken";

export interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  iat: number;
  exp: number;
}

export async function verifyAuth(token: string): Promise<DecodedToken> {
  // Try multiple JWT secrets for compatibility
  const secrets = [
    process.env.JWT_SECRET,
    "your-secret-key", // auth service fallback
    "fallback-secret", // web client fallback
    "msta-secret-key", // additional fallback
  ].filter(Boolean);

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret!) as DecodedToken;
      return decoded;
    } catch (error) {
      // Continue to next secret
      console.log(
        `JWT verification failed with secret: ${secret?.substring(0, 10)}...`,
      );
    }
  }

  throw new Error("Invalid or expired token - all secrets failed");
}

export function signToken(payload: Omit<DecodedToken, "iat" | "exp">): string {
  // Use the same primary secret as auth service
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check cookies
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies.token || cookies.authToken || null;
  }

  return null;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export function hasAdminRole(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded?.role === "ADMIN";
  } catch {
    return false;
  }
}

export function refreshTokenIfNeeded(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;

    // Refresh if token expires in less than 1 hour
    if (timeUntilExpiry < 3600) {
      return signToken({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      });
    }

    return token;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}
