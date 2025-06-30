import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Helper function to get date range based on period
const getDateRange = (period: string) => {
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
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate: now };
};

// Get comprehensive generation analytics for dashboard
export const getGenerationAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Unauthorized, admin access required" });
    }

    const { period = "30d" } = req.query;
    const { startDate } = getDateRange(period as string);

    // Get all analytics in parallel for better performance
    const [
      totalGenerations,
      generationsInPeriod,
      generationsToday,
      successfulGenerations,
      failedGenerations,
      generationsByStatus,
      generationsByDifficulty,
      generationTrend,
      recentGenerations,
    ] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.question.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.question.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.question.count({
        where: { status: "DRAFT" },
      }),
      prisma.question.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.question.groupBy({
        by: ["difficulty"],
        _count: { id: true },
      }),
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM "Question"
        WHERE createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
      prisma.question.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          question: true,
          status: true,
          difficulty: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate success rate
    const successRate =
      totalGenerations > 0
        ? Number(((successfulGenerations / totalGenerations) * 100).toFixed(1))
        : 0;

    // Format the response
    const analytics = {
      overview: {
        total: totalGenerations,
        inPeriod: generationsInPeriod,
        today: generationsToday,
        successful: successfulGenerations,
        failed: failedGenerations,
        successRate,
        growth: {
          absolute: generationsInPeriod,
          percentage:
            totalGenerations > 0
              ? Number(
                  ((generationsInPeriod / totalGenerations) * 100).toFixed(1),
                )
              : 0,
        },
      },
      distribution: {
        byStatus: generationsByStatus.map((item) => ({
          name: item.status,
          value: item._count.id,
          percentage:
            totalGenerations > 0
              ? Number(((item._count.id / totalGenerations) * 100).toFixed(1))
              : 0,
        })),
        byDifficulty: generationsByDifficulty.map((item) => ({
          name: item.difficulty,
          value: item._count.id,
          percentage:
            totalGenerations > 0
              ? Number(((item._count.id / totalGenerations) * 100).toFixed(1))
              : 0,
        })),
      },
      trends: {
        generations: generationTrend.map((item) => ({
          date: item.date.toISOString().split("T")[0],
          count: Number(item.count),
        })),
      },
      recentActivity: recentGenerations.map((generation) => ({
        id: `gen-${generation.id}`,
        type: "question_generation",
        action: `Generated ${generation.difficulty} question`,
        description: `New ${generation.difficulty} question created in ${generation.category}`,
        user: "System",
        target: generation.question.substring(0, 50) + "...",
        timestamp: generation.createdAt,
        status: generation.status,
        metadata: {
          generationId: generation.id,
          difficulty: generation.difficulty,
          category: generation.category,
          status: generation.status,
        },
      })),
      period,
      dateRange: {
        start: startDate,
        end: new Date(),
      },
    };

    return res.json(analytics);
  } catch (error) {
    console.error("Error fetching generation analytics:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch generation analytics" });
  }
};


// Get system health for generate-soal service
export const getSystemHealth = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Unauthorized, admin access required" });
    }

    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get basic stats
    const totalQuestions = await prisma.question.count();
    const publishedQuestions = await prisma.question.count({
      where: { status: "PUBLISHED" },
    });

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        database: {
          connected: true,
          totalQuestions,
          publishedQuestions,
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        version: process.version,
      },
    });
  } catch (error) {
    console.error("Error checking system health:", error);
    return res.status(500).json({
      success: false,
      error: "System health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
