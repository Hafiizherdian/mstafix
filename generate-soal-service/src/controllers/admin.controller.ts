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

// Get generation statistics
export const getGenerationStats = async (
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

    // Calculate date range based on period
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

    // Get question statistics from database
    const totalQuestions = await prisma.question.count();
    const questionsInPeriod = await prisma.question.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
    const questionsToday = await prisma.question.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Get questions by status
    const questionsByStatus = await prisma.question.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Get questions by difficulty
    const questionsByDifficulty = await prisma.question.groupBy({
      by: ["difficulty"],
      _count: {
        id: true,
      },
    });

    // Get questions by category
    const questionsByCategory = await prisma.question.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    });

    // Get questions by type
    const questionsByType = await prisma.question.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    // Calculate success rate based on published questions
    const publishedQuestions = await prisma.question.count({
      where: { status: "PUBLISHED" },
    });
    const successRate =
      totalQuestions > 0
        ? ((publishedQuestions / totalQuestions) * 100).toFixed(2)
        : "0.00";

    // Get daily questions for chart data
    const dailyQuestions = await prisma.question.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format daily data for charts
    const chartData = dailyQuestions.map((item: any) => ({
      date: item.createdAt.toISOString().split("T")[0],
      count: item._count.id,
    }));

    return res.json({
      success: true,
      data: {
        totalQuestions,
        questionsInPeriod,
        questionsToday,
        successRate: parseFloat(successRate),
        questionsByStatus: questionsByStatus.map((item: any) => ({
          status: item.status,
          count: item._count.id,
        })),
        questionsByDifficulty: questionsByDifficulty.map((item: any) => ({
          difficulty: item.difficulty,
          count: item._count.id,
        })),
        questionsByCategory: questionsByCategory.map((item: any) => ({
          category: item.category,
          count: item._count.id,
        })),
        questionsByType: questionsByType.map((item: any) => ({
          type: item.type,
          count: item._count.id,
        })),
        chartData,
        period,
      },
    });
  } catch (error) {
    console.error("Error getting generation stats:", error);
    return res.status(500).json({
      error: "Failed to get generation statistics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all questions with pagination and filters
export const getAllQuestions = async (
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

    const {
      page = "1",
      limit = "10",
      status,
      difficulty,
      category,
      type,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { question: { contains: search as string, mode: "insensitive" } },
        { explanation: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Get questions with pagination
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.question.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting questions:", error);
    return res.status(500).json({
      error: "Failed to get questions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get question by ID
export const getQuestionById = async (
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

    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({
        error: "Question not found",
      });
    }

    return res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Error getting question:", error);
    return res.status(500).json({
      error: "Failed to get question",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update question
export const updateQuestion = async (
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

    const { id } = req.params;
    const updateData = req.body;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        error: "Question not found",
      });
    }

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: updatedQuestion,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({
      error: "Failed to update question",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete question
export const deleteQuestion = async (
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

    const { id } = req.params;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        error: "Question not found",
      });
    }

    // Delete question
    await prisma.question.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({
      error: "Failed to delete question",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Bulk update questions
export const bulkUpdateQuestions = async (
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

    const { questionIds, updateData } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        error: "Question IDs array is required",
      });
    }

    // Update multiple questions
    const updatedQuestions = await prisma.question.updateMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: {
        updatedCount: updatedQuestions.count,
      },
      message: `${updatedQuestions.count} questions updated successfully`,
    });
  } catch (error) {
    console.error("Error bulk updating questions:", error);
    return res.status(500).json({
      error: "Failed to bulk update questions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Bulk delete questions
export const bulkDeleteQuestions = async (
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

    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        error: "Question IDs array is required",
      });
    }

    // Delete multiple questions
    const deletedQuestions = await prisma.question.deleteMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    return res.json({
      success: true,
      data: {
        deletedCount: deletedQuestions.count,
      },
      message: `${deletedQuestions.count} questions deleted successfully`,
    });
  } catch (error) {
    console.error("Error bulk deleting questions:", error);
    return res.status(500).json({
      error: "Failed to bulk delete questions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
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
