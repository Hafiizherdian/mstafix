import { Router } from "express";
import {
  getGenerationAnalytics,
  getSystemHealth,
} from "../controllers/admin.controller";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin generation management routes
router.get("/analytics/generations", getGenerationAnalytics);

router.get("/health", getSystemHealth);

export default router;
