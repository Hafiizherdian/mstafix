import { Router } from "express";
import {
  getUsers,
  getUserStats,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getUserAnalytics,
  bulkUpdateUsers,
  getSystemHealth,
  updateUserRole,
} from "../controllers/admin.controller";
import {
  authenticateToken,
  requireAdminRole,
} from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdminRole);

// User Management Routes
router.get("/users", getUsers);
router.post("/users", createUser);
router.get("/users/stats", getUserStats);
router.get("/users/:userId", getUserById);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

// Bulk Operations
router.post("/users/bulk", bulkUpdateUsers);

// Analytics Routes
router.get("/analytics/users", getUserAnalytics);

// System Health
router.get("/health", getSystemHealth);

// Update user role - untuk admin creation system
router.post("/update-role", updateUserRole);

export default router;
