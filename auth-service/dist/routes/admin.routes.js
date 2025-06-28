"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireAdminRole);
router.get("/users", admin_controller_1.getUsers);
router.post("/users", admin_controller_1.createUser);
router.get("/users/stats", admin_controller_1.getUserStats);
router.get("/users/:userId", admin_controller_1.getUserById);
router.put("/users/:userId", admin_controller_1.updateUser);
router.delete("/users/:userId", admin_controller_1.deleteUser);
router.post("/users/bulk", admin_controller_1.bulkUpdateUsers);
router.get("/analytics/users", admin_controller_1.getUserAnalytics);
router.get("/health", admin_controller_1.getSystemHealth);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map