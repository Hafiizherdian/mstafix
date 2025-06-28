import { Router } from "express";
import {
  getGenerationStats,
  getGenerationAnalytics,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkUpdateQuestions,
  bulkDeleteQuestions,
  getSystemHealth,
} from "../controllers/admin.controller";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin generation management routes
router.get("/stats", getGenerationStats);
router.get("/analytics/generations", getGenerationAnalytics);
router.get("/questions", getAllQuestions);
router.get("/questions/:id", getQuestionById);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);
router.post("/questions/bulk-update", bulkUpdateQuestions);
router.post("/questions/bulk-delete", bulkDeleteQuestions);
router.get("/health", getSystemHealth);

export default router;
