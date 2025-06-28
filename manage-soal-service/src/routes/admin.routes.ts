import { Router } from "express";
import {
  getQuestionStats,
  getQuestionsAdmin,
  deleteQuestion,
  updateQuestionStatus,
  getQuestionAnalytics,
} from "../controllers/admin.controller";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin question management routes
router.get("/stats", getQuestionStats);
router.get("/questions", getQuestionsAdmin);
router.get("/analytics", getQuestionAnalytics);
router.get("/analytics/questions", getQuestionAnalytics);
router.delete("/questions/:questionId", deleteQuestion);
router.patch("/questions/:questionId/status", updateQuestionStatus);

export default router;
