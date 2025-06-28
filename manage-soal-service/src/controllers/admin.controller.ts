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

// Get question statistics
export const getQuestionStats = async (
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
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get total question count
    const totalQuestions = await prisma.question.count();

    // Calculate question growth rate
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );

    const currentPeriodQuestions = await prisma.question.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    const previousPeriodQuestions = await prisma.question.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    const questionsGrowthRate =
      previousPeriodQuestions > 0
        ? ((currentPeriodQuestions - previousPeriodQuestions) /
            previousPeriodQuestions) *
          100
        : 100;

    // Get questions by category
    const questionsByCategory = await prisma.question.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Get questions by difficulty
    const questionsByDifficulty = await prisma.question.groupBy({
      by: ["difficulty"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Get questions by type
    const questionsByType = await prisma.question.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Get questions by status
    const questionsByStatus = await prisma.question.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Get question creation trend
    const questionCreationTrend = await prisma.question.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format creation trend data by day
    const trendByDay = new Map();
    const daysDiff = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Initialize all days with 0
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      trendByDay.set(dateKey, 0);
    }

    // Populate with actual data
    questionCreationTrend.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split("T")[0];
      trendByDay.set(dateKey, item._count.id);
    });

    const formattedTrend = Array.from(trendByDay.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // Get top categories
    const topCategories = questionsByCategory
      .slice(0, 5)
      .map((item, index) => ({
        category: item.category,
        count: item._count.id,
        percentage:
          totalQuestions > 0
            ? Math.round((item._count.id / totalQuestions) * 100)
            : 0,
      }));

    // Get recent questions
    const recentQuestions = await prisma.question.findMany({
      select: {
        id: true,
        question: true,
        category: true,
        difficulty: true,
        type: true,
        status: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const stats = {
      totalQuestions,
      questionsGrowthRate: Math.round(questionsGrowthRate * 100) / 100,
      questionsByCategory: questionsByCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
      questionsByDifficulty: questionsByDifficulty.map((item) => ({
        difficulty: item.difficulty,
        count: item._count.id,
      })),
      questionsByType: questionsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      questionsByStatus: questionsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      questionCreationTrend: formattedTrend,
      topCategories,
      recentQuestions: recentQuestions.map((q) => ({
        ...q,
        question:
          q.question.length > 100
            ? q.question.substring(0, 100) + "..."
            : q.question,
      })),
    };

    return res.json(stats);
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch question statistics" });
  }
};

// Get questions with filters and pagination
export const getQuestionsAdmin = async (
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
      search = "",
      category = "",
      difficulty = "",
      type = "",
      status = "",
      createdBy = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { explanation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === "asc" ? "asc" : "desc";

    // Get questions with pagination
    const [questions, totalQuestions] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.question.count({ where }),
    ]);

    const totalPages = Math.ceil(totalQuestions / limitNum);

    return res.json({
      questions,
      pagination: {
        total: totalQuestions,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
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

    const { questionId } = req.params;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Delete question
    await prisma.question.delete({
      where: { id: questionId },
    });

    return res.json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({ error: "Failed to delete question" });
  }
};

// Update question status
export const updateQuestionStatus = async (
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

    const { questionId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Update question status
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: { status },
    });

    return res.json({
      message: "Question status updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Error updating question status:", error);
    return res.status(500).json({ error: "Failed to update question status" });
  }
};

// Get question analytics
export const getQuestionAnalytics = async (
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

    // Get all analytics in parallel
    const [
      totalQuestions,
      questionsInPeriod,
      questionsToday,
      categoryStats,
      difficultyStats,
      typeStats,
      creationActivity,
      recentQuestions,
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
      prisma.question.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
      prisma.question.groupBy({
        by: ["difficulty"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
      prisma.question.groupBy({
        by: ["type"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
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
          category: true,
          difficulty: true,
          type: true,
          createdAt: true,
          createdBy: true,
        },
      }),
    ]);

    const analytics = {
      overview: {
        total: totalQuestions,
        inPeriod: questionsInPeriod,
        today: questionsToday,
        growth: {
          absolute: questionsInPeriod,
          percentage:
            totalQuestions > 0
              ? Number(((questionsInPeriod / totalQuestions) * 100).toFixed(1))
              : 0,
        },
      },
      categoryDistribution: categoryStats.map((item) => ({
        category: item.category,
        count: item._count.id,
        percentage:
          totalQuestions > 0
            ? Number(((item._count.id / totalQuestions) * 100).toFixed(1))
            : 0,
      })),
      difficultyDistribution: difficultyStats.map((item) => ({
        difficulty: item.difficulty,
        count: item._count.id,
        percentage:
          totalQuestions > 0
            ? Number(((item._count.id / totalQuestions) * 100).toFixed(1))
            : 0,
      })),
      typeDistribution: typeStats.map((item) => ({
        type: item.type,
        count: item._count.id,
        percentage:
          totalQuestions > 0
            ? Number(((item._count.id / totalQuestions) * 100).toFixed(1))
            : 0,
      })),
      trends: {
        questions: creationActivity.map((item) => ({
          date: item.date.toISOString().split("T")[0],
          count: Number(item.count),
        })),
      },
      recentActivity: recentQuestions.map((question) => ({
        id: `question-${question.id}`,
        type: "question_creation",
        action: `Created ${question.difficulty} question`,
        description: `New ${question.difficulty} question added to ${question.category}`,
        user: question.createdBy || "System",
        target: question.question.substring(0, 50) + "...",
        timestamp: question.createdAt,
        status: "COMPLETED",
        metadata: {
          questionId: question.id,
          category: question.category,
          difficulty: question.difficulty,
          type: question.type,
        },
      })),
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
    };

    return res.json(analytics);
  } catch (error) {
    console.error("Error fetching question analytics:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch question analytics" });
  }
};
