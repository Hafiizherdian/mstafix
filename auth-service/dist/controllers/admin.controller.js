"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.bulkUpdateUsers = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUserAnalytics = exports.getUserStats = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const validateAdminAccess = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        res.status(403).json({ error: "Unauthorized, admin access required" });
        return false;
    }
    return true;
};
const getDateRange = (period = "30d") => {
    const now = new Date();
    let startDate = new Date();
    switch (period) {
        case "7d":
            startDate.setDate(now.getDate() - 7);
            break;
        case "30d":
            startDate.setDate(now.getDate() - 30);
            break;
        case "90d":
            startDate.setDate(now.getDate() - 90);
            break;
        case "1y":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 30);
    }
    return { startDate, endDate: now };
};
const getUsers = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { page = "1", limit = "10", search = "", role = "", status = "", sortBy = "createdAt", sortOrder = "desc", } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        if (role && role !== "all") {
            where.role = role.toUpperCase();
        }
        if (status && status !== "all") {
        }
        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "name",
            "email",
            "role",
        ];
        const validSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const validSortOrder = sortOrder === "asc" ? "asc" : "desc";
        const orderBy = {};
        orderBy[validSortBy] = validSortOrder;
        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma.user.count({ where }),
        ]);
        const usersWithStats = users.map((user) => (Object.assign(Object.assign({}, user), { isActive: true, lastLoginAt: user.updatedAt, questionCount: 0, generationCount: 0 })));
        const totalPages = Math.ceil(totalUsers / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPreviousPage = pageNum > 1;
        res.json({
            data: usersWithStats,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalUsers,
                hasNextPage,
                hasPreviousPage,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};
exports.getUsers = getUsers;
const getUserStats = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { period = "30d" } = req.query;
        const { startDate } = getDateRange(period);
        const [totalUsers, activeUsers, newUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate,
                    },
                },
            }),
        ]);
        const usersByRole = await prisma.user.groupBy({
            by: ["role"],
            _count: {
                id: true,
            },
        });
        const userGrowthData = await prisma.$queryRaw `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        const formattedGrowthData = userGrowthData.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: Number(item.count),
        }));
        const recentUsers = await prisma.user.findMany({
            take: 10,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });
        const recentActivity = recentUsers.map((user) => ({
            id: `user-${user.id}`,
            type: "user",
            description: `New user registration`,
            user: user.name,
            timestamp: user.createdAt,
            status: "COMPLETED",
        }));
        res.json({
            total: totalUsers,
            active: activeUsers,
            new: newUsers,
            growth: {
                total: newUsers,
                percentage: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : "0",
            },
            distribution: {
                byRole: usersByRole.map((item) => ({
                    name: item.role,
                    value: item._count.id,
                })),
            },
            trends: formattedGrowthData,
            recentActivity,
            period,
        });
    }
    catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Failed to fetch user statistics" });
    }
};
exports.getUserStats = getUserStats;
const getUserAnalytics = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { period = "30d" } = req.query;
        const { startDate } = getDateRange(period);
        const [totalUsers, activeUsers, newUsers, usersByRole, userGrowthData, recentUsers, userActivity,] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate,
                    },
                },
            }),
            prisma.user.groupBy({
                by: ["role"],
                _count: { id: true },
            }),
            prisma.$queryRaw `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM "User"
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            }),
            prisma.$queryRaw `
        SELECT
          DATE(updated_at) as date,
          COUNT(*) as count
        FROM "User"
        WHERE updated_at >= ${startDate}
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `,
        ]);
        const analytics = {
            overview: {
                total: totalUsers,
                active: activeUsers,
                new: newUsers,
                growth: {
                    absolute: newUsers,
                    percentage: totalUsers > 0
                        ? Number(((newUsers / totalUsers) * 100).toFixed(1))
                        : 0,
                },
            },
            distribution: {
                byRole: usersByRole.map((item) => ({
                    name: item.role,
                    value: item._count.id,
                    percentage: totalUsers > 0
                        ? Number(((item._count.id / totalUsers) * 100).toFixed(1))
                        : 0,
                })),
            },
            trends: {
                registrations: userGrowthData.map((item) => ({
                    date: item.date.toISOString().split("T")[0],
                    count: Number(item.count),
                })),
                activity: userActivity.map((item) => ({
                    date: item.date.toISOString().split("T")[0],
                    count: Number(item.count),
                })),
            },
            recentActivity: recentUsers.map((user) => ({
                id: `user-reg-${user.id}`,
                type: "user_registration",
                description: `${user.name} joined the platform`,
                user: user.name,
                timestamp: user.createdAt,
                status: "COMPLETED",
                metadata: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
            })),
            period,
            dateRange: {
                start: startDate,
                end: new Date(),
            },
        };
        res.json(analytics);
    }
    catch (error) {
        console.error("Error fetching user analytics:", error);
        res.status(500).json({ error: "Failed to fetch user analytics" });
    }
};
exports.getUserAnalytics = getUserAnalytics;
const getUserById = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const userWithStats = Object.assign(Object.assign({}, user), { isActive: true, lastLoginAt: user.updatedAt, questionCount: 0, generationCount: 0 });
        res.json({
            success: true,
            data: userWithStats,
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { email, password, name, role = "USER" } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({
                error: "Email, password, and name are required",
                details: {
                    email: !email ? "Email is required" : null,
                    password: !password ? "Password is required" : null,
                    name: !name ? "Name is required" : null,
                },
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long",
            });
        }
        if (!["USER", "ADMIN"].includes(role.toUpperCase())) {
            return res.status(400).json({
                error: "Invalid role. Must be USER or ADMIN",
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name.trim(),
                role: role.toUpperCase(),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: Object.assign(Object.assign({}, newUser), { isActive: true, lastLoginAt: null, questionCount: 0, generationCount: 0 }),
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    var _a;
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { userId } = req.params;
        const { name, email, role, isActive } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid email format" });
            }
            if (email !== existingUser.email) {
                const emailExists = await prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                });
                if (emailExists) {
                    return res.status(400).json({ error: "Email already exists" });
                }
            }
        }
        if (role && !["USER", "ADMIN"].includes(role.toUpperCase())) {
            return res.status(400).json({ error: "Invalid role" });
        }
        if (userId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) &&
            role &&
            role.toUpperCase() !== existingUser.role) {
            return res.status(400).json({
                error: "Cannot change your own role",
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name.trim();
        if (email !== undefined)
            updateData.email = email.toLowerCase();
        if (role !== undefined)
            updateData.role = role.toUpperCase();
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            message: "User updated successfully",
            data: Object.assign(Object.assign({}, updatedUser), { isActive: true, lastLoginAt: updatedUser.updatedAt, questionCount: 0, generationCount: 0 }),
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    var _a;
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        if (userId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(400).json({
                error: "Cannot delete your own account",
            });
        }
        if (existingUser.role === "ADMIN") {
            const adminCount = await prisma.user.count({
                where: { role: "ADMIN" },
            });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: "Cannot delete the last admin user",
                });
            }
        }
        await prisma.user.delete({
            where: { id: userId },
        });
        res.json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
};
exports.deleteUser = deleteUser;
const bulkUpdateUsers = async (req, res) => {
    var _a;
    try {
        if (!validateAdminAccess(req, res))
            return;
        const { userIds, operation, data } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: "User IDs array is required" });
        }
        if (!operation) {
            return res.status(400).json({ error: "Operation is required" });
        }
        let result;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        switch (operation) {
            case "delete":
                const filteredIds = userIds.filter((id) => id !== currentUserId);
                result = await prisma.user.deleteMany({
                    where: {
                        id: { in: filteredIds },
                    },
                });
                break;
            case "update_role":
                if (!(data === null || data === void 0 ? void 0 : data.role) || !["USER", "ADMIN"].includes(data.role)) {
                    return res.status(400).json({ error: "Valid role is required" });
                }
                const updateIds = userIds.filter((id) => id !== currentUserId);
                result = await prisma.user.updateMany({
                    where: {
                        id: { in: updateIds },
                    },
                    data: {
                        role: data.role,
                    },
                });
                break;
            default:
                return res.status(400).json({ error: "Invalid operation" });
        }
        res.json({
            success: true,
            message: `Bulk ${operation} completed successfully`,
            affected: result.count,
        });
    }
    catch (error) {
        console.error("Error in bulk operation:", error);
        res.status(500).json({ error: "Failed to perform bulk operation" });
    }
};
exports.bulkUpdateUsers = bulkUpdateUsers;
const getSystemHealth = async (req, res) => {
    try {
        if (!validateAdminAccess(req, res))
            return;
        const dbHealth = await prisma.$queryRaw `SELECT 1`;
        const userCount = await prisma.user.count();
        const recentUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        res.json({
            status: "healthy",
            service: "auth-service",
            timestamp: new Date().toISOString(),
            database: {
                connected: !!dbHealth,
                status: "healthy",
            },
            metrics: {
                totalUsers: userCount,
                recentSignups: recentUsers,
                uptime: process.uptime(),
            },
        });
    }
    catch (error) {
        console.error("Error checking system health:", error);
        res.status(500).json({
            status: "unhealthy",
            service: "auth-service",
            timestamp: new Date().toISOString(),
            error: "Failed to check system health",
        });
    }
};
exports.getSystemHealth = getSystemHealth;
//# sourceMappingURL=admin.controller.js.map