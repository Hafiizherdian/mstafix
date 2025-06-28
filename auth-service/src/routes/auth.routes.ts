import express from "express";
import * as authController from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth";
import jwt from "jsonwebtoken";

// Extended request dengan user
interface AuthenticatedRequest extends express.Request {
  user?: jwt.JwtPayload;
}

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok", service: "auth-service" });
});

// Register
router.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    const result = await authController.register(userData);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

// Create Admin - endpoint khusus untuk membuat admin dengan secret key
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password, name, adminSecretKey } = req.body;

    // Validasi input
    if (!email || !password || !name || !adminSecretKey) {
      return res.status(400).json({
        error: "Email, password, name, dan admin secret key diperlukan",
      });
    }

    const userData = {
      email,
      password,
      name,
      role: "ADMIN",
      adminSecretKey,
    };

    const result = await authController.register(userData);
    return res.status(201).json({
      message: "Admin berhasil dibuat",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authController.login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

// Token verification endpoint
router.get("/verify", verifyToken, (req: AuthenticatedRequest, res) => {
  // Jika middleware verifyToken berhasil dilewati, maka token valid
  // req.user berisi payload token yang sudah di-decode
  const user = req.user;

  console.log("[AUTH] Token verified successfully for user:", user);

  if (!user) {
    console.error("[AUTH] User data not found in token");
    return res.status(401).json({
      authenticated: false,
      error: "User data not found in token",
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
    message: "Token valid",
  });
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const tokens = await authController.refreshAccessToken(refreshToken);
    return res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    await authController.logout(refreshToken);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

export default router;
