import { PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

interface UserFilters {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Helper function to validate admin access
const validateAdminAccess = (
  req: AuthenticatedRequest,
  res: Response,
): boolean => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Unauthorized, admin access required" });
    return false;
  }
  return true;
};

// Helper function to get date range based on period
const getDateRange = (period: string = "30d") => {
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

// Get all users with pagination and filters
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const {
      page = "1",
      limit = "10",
      search = "",
      role = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as UserFilters;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

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
      // For now, we'll consider all users as active since we don't have isActive field
      // This can be extended when the database schema includes this field
    }

    // Validate sortBy field
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

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[validSortBy] = validSortOrder;

    // Get users with pagination
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

    // Calculate additional user stats and format response
    const usersWithStats = users.map((user) => ({
      ...user,
      isActive: true, // Default to true for now
      lastLoginAt: user.updatedAt, // Use updatedAt as proxy for lastLogin
      questionCount: 0, // Will be fetched from manage-soal service
      generationCount: 0, // Will be fetched from generate-soal service
    }));

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
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user statistics for dashboard
export const getUserStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { period = "30d" } = req.query;
    const { startDate } = getDateRange(period as string);

    // Get comprehensive user statistics
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
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

    // Get users by role distribution
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    });

    // Get user growth data (daily breakdown)
    const userGrowthData = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const formattedGrowthData = userGrowthData.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      count: Number(item.count),
    }));

    // Get recent user registrations for activity feed
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
        percentage:
          totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : "0",
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
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
};

// Get user analytics for dashboard (comprehensive endpoint)
export const getUserAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { period = "30d" } = req.query;
    const { startDate } = getDateRange(period as string);

    // Get all analytics in parallel for better performance
    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByRole,
      userGrowthData,
      recentUsers,
      userActivity,
    ] = await Promise.all([
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
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
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
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE("updatedAt") as date,
          COUNT(*) as count
        FROM "User"
        WHERE "updatedAt" >= ${startDate}
        GROUP BY DATE("updatedAt")
        ORDER BY date ASC
      `,
    ]);

    // Format the response
    const analytics = {
      overview: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        growth: {
          absolute: newUsers,
          percentage:
            totalUsers > 0
              ? Number(((newUsers / totalUsers) * 100).toFixed(1))
              : 0,
        },
      },
      distribution: {
        byRole: usersByRole.map((item) => ({
          name: item.role,
          value: item._count.id,
          percentage:
            totalUsers > 0
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
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ error: "Failed to fetch user analytics" });
  }
};

// Get single user by ID
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

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

    const userWithStats = {
      ...user,
      isActive: true, // Default to true
      lastLoginAt: user.updatedAt,
      questionCount: 0, // To be fetched from manage-soal service
      generationCount: 0, // To be fetched from generate-soal service
    };

    res.json({
      success: true,
      data: userWithStats,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create new user
export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { email, password, name, role = "USER" } = req.body;

    // Validate input
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Validate role
    if (!["USER", "ADMIN"].includes(role.toUpperCase())) {
      return res.status(400).json({
        error: "Invalid role. Must be USER or ADMIN",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: role.toUpperCase() as Role,
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
      data: {
        ...newUser,
        isActive: true,
        lastLoginAt: null,
        questionCount: 0,
        generationCount: 0,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { userId } = req.params;
    const { name, email, role, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Check if email is already taken by another user
      if (email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (emailExists) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }
    }

    // Validate role if provided
    if (role && !["USER", "ADMIN"].includes(role.toUpperCase())) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Prevent admin from changing their own role
    if (
      userId === req.user?.userId &&
      role &&
      role.toUpperCase() !== existingUser.role
    ) {
      return res.status(400).json({
        error: "Cannot change your own role",
      });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role.toUpperCase();
    // Note: isActive would be handled here when the field is added to schema

    // Update user
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
      data: {
        ...updatedUser,
        isActive: true, // Default for now
        lastLoginAt: updatedUser.updatedAt,
        questionCount: 0,
        generationCount: 0,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user?.userId) {
      return res.status(400).json({
        error: "Cannot delete your own account",
      });
    }

    // Check if this is the last admin
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

    // In a real implementation, you might want to:
    // 1. Check for associated data in other services
    // 2. Implement soft delete instead of hard delete
    // 3. Archive user data before deletion

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Bulk user operations
export const bulkUpdateUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    const { userIds, operation, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs array is required" });
    }

    if (!operation) {
      return res.status(400).json({ error: "Operation is required" });
    }

    let result;
    const currentUserId = req.user?.userId;

    switch (operation) {
      case "delete":
        // Prevent deleting current user
        const filteredIds = userIds.filter((id) => id !== currentUserId);
        result = await prisma.user.deleteMany({
          where: {
            id: { in: filteredIds },
          },
        });
        break;

      case "update_role":
        if (!data?.role || !["USER", "ADMIN"].includes(data.role)) {
          return res.status(400).json({ error: "Valid role is required" });
        }

        // Prevent changing current user's role
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
  } catch (error) {
    console.error("Error in bulk operation:", error);
    res.status(500).json({ error: "Failed to perform bulk operation" });
  }
};

// Get system health from auth service perspective
export const getSystemHealth = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!validateAdminAccess(req, res)) return;

    // Check database connectivity
    const dbHealth = await prisma.$queryRaw`SELECT 1`;

    // Get basic system stats
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
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(500).json({
      status: "unhealthy",
      service: "auth-service",
      timestamp: new Date().toISOString(),
      error: "Failed to check system health",
    });
  }
};

// Update user role - untuk admin creation system
export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const { userId, role } = req.body;
    const adminSecretKey = req.headers["admin-secret-key"] as string;
    const ADMIN_SECRET_KEY =
      process.env.ADMIN_CREATION_KEY || "rahasia-admin-msta-2024";

    // Validate admin secret key for creating admin users
    if (role === "ADMIN" && adminSecretKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({
        error: "Invalid admin secret key",
      });
    }

    // Validate input
    if (!userId || !role) {
      return res.status(400).json({
        error: "User ID and role are required",
      });
    }

    // Validate role
    if (!["USER", "ADMIN"].includes(role.toUpperCase())) {
      return res.status(400).json({
        error: "Invalid role. Must be USER or ADMIN",
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role.toUpperCase() as Role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role.toUpperCase()}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};
