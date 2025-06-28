type SuccessApiResponse<T> = {
  status: "success";
  success: true;
  data: T;
  message?: string;
};

type ErrorApiResponse = {
  status: "error";
  success: false;
  error: string;
  message?: string;
  data?: undefined; // Explicitly undefined
};

type ApiResponse<T = any> = SuccessApiResponse<T> | ErrorApiResponse;

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

// Service URLs - detect environment and use appropriate URLs
const getServiceUrl = (envVar: string, port: string) => {
  // Check if we're in production (running on VPS)
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (isProduction) {
    // In production, use the same host as the web client
    // For now, assume services are running on the same host with different ports
    // In the future, this could be configured to use subdomains or different hosts
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}`
        : `http://localhost`;
    
    // For production, we might need to use a reverse proxy or API gateway
    // For now, try the direct port approach
    return `${baseUrl}:${port}`;
  }

  // Development/Docker environment - use environment variables or localhost
  return process.env[envVar] || `http://localhost:${port}`;
};

const SERVICE_URLS = {
  AUTH_SERVICE: getServiceUrl("AUTH_SERVICE_URL", "3001"),
  GENERATE_SOAL_SERVICE: getServiceUrl("GENERATE_SOAL_SERVICE_URL", "3002"),
  MANAGE_SOAL_SERVICE: getServiceUrl("MANAGE_SOAL_SERVICE_URL", "3003"),
  NOTIFICATION_SERVICE: getServiceUrl("NOTIFICATION_SERVICE_URL", "3004"),
  API_GATEWAY: getServiceUrl("API_GATEWAY_URL", "4000"),
};

console.log("Service URLs configured:", SERVICE_URLS);

// Generic API client
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const requestOptions = {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
      };

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        const errorMessage = `API Error (${response.status}): ${response.statusText}. Details: ${errorText}`;
        console.error(errorMessage);
        return { status: "error", success: false, error: errorMessage };
      }

      const responseText = await response.text();
      if (!responseText) {
        return { status: "success", success: true, data: undefined as T };
      }

      const data = JSON.parse(responseText);
      return { status: "success", success: true, data };

    } catch (error: any) {
      console.error(`Request failed for ${this.baseUrl}${endpoint}:`, error);
      let errorMessage = error.message || "An unknown network error occurred";

      if (error.name === 'AbortError') {
        errorMessage = `Request to ${this.baseUrl}${endpoint} timed out after 15 seconds.`;
      } else if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
        errorMessage = `Network error: Unable to connect to ${this.baseUrl}. Please check if the service is running.`;
      }
      
      return { status: "error", success: false, error: errorMessage };
    }
  }

  async get<T = any>(
    endpoint: string,
    token?: string,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    token?: string,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    token?: string,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async delete<T = any>(
    endpoint: string,
    token?: string,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

// Service clients
const authServiceClient = new ApiClient(SERVICE_URLS.AUTH_SERVICE);
const manageSoalServiceClient = new ApiClient(SERVICE_URLS.MANAGE_SOAL_SERVICE);
const generateSoalServiceClient = new ApiClient(
  SERVICE_URLS.GENERATE_SOAL_SERVICE,
);
const notificationServiceClient = new ApiClient(
  SERVICE_URLS.NOTIFICATION_SERVICE || "http://localhost:3004",
);
const apiGatewayClient = new ApiClient(SERVICE_URLS.API_GATEWAY);

// Auth Service APIs
export const authService = {
  // Get user analytics from auth service
  async getUserAnalytics(period: string = "30d", token: string) {
    return authServiceClient.get(
      `/admin/analytics/users?period=${period}`,
      token,
    );
  },

  // Get all users with pagination and filters
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    token: string,
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return authServiceClient.get<PaginatedResponse<any>>(
      `/admin/users?${queryParams.toString()}`,
      token,
    );
  },

  // Create new user
  async createUser(
    userData: {
      name: string;
      email: string;
      password: string;
      role?: "USER" | "ADMIN";
    },
    token: string,
  ) {
    return authServiceClient.post("/admin/users", userData, token);
  },

  // Update user
  async updateUser(
    userId: string,
    userData: {
      name?: string;
      email?: string;
      role?: "USER" | "ADMIN";
      isActive?: boolean;
    },
    token: string,
  ) {
    return authServiceClient.put(`/admin/users/${userId}`, userData, token);
  },

  // Delete user
  async deleteUser(userId: string, token: string) {
    return authServiceClient.delete(`/admin/users/${userId}`, token);
  },

  // Get user statistics
  async getUserStats(token: string) {
    return authServiceClient.get("/admin/stats/users", token);
  },
};

// Generate Soal Service APIs
export const generateSoalService = {
  // Get generation analytics
  async getGenerationAnalytics(period: string = "30d", token: string) {
    return generateSoalServiceClient.get(
      `/admin/analytics/generations?period=${period}`,
      token,
    );
  },

  // Get all generations with pagination
  async getGenerations(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      userId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    token: string,
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return generateSoalServiceClient.get<PaginatedResponse<any>>(
      `/admin/generations?${queryParams.toString()}`,
      token,
    );
  },

  // Get generation statistics
  async getGenerationStats(token: string) {
    return generateSoalServiceClient.get("/admin/stats/generations", token);
  },

  // Get generation trends
  async getGenerationTrends(period: string = "30d", token: string) {
    return generateSoalServiceClient.get(
      `/admin/trends/generations?period=${period}`,
      token,
    );
  },
};

// Manage Soal Service APIs
export const manageSoalService = {
  // Get question analytics
  async getQuestionAnalytics(period: string = "30d", token: string) {
    return manageSoalServiceClient.get(
      `/admin/analytics?period=${period}`,
      token,
    );
  },

  // Get all questions with pagination and filters
  async getQuestions(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
      category?: string;
      type?: string;
      difficulty?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    token: string,
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return manageSoalServiceClient.get<PaginatedResponse<any>>(
      `/admin/questions?${queryParams.toString()}`,
      token,
    );
  },

  // Create new question
  async createQuestion(
    questionData: {
      title: string;
      content: string;
      category: string;
      type: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
    },
    token: string,
  ) {
    return manageSoalServiceClient.post(
      "/admin/questions",
      questionData,
      token,
    );
  },

  // Update question
  async updateQuestion(
    questionId: string,
    questionData: {
      title?: string;
      content?: string;
      category?: string;
      type?: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      isActive?: boolean;
    },
    token: string,
  ) {
    return manageSoalServiceClient.put(
      `/admin/questions/${questionId}`,
      questionData,
      token,
    );
  },

  // Delete question
  async deleteQuestion(questionId: string, token: string) {
    return manageSoalServiceClient.delete(
      `/admin/questions/${questionId}`,
      token,
    );
  },

  // Get question statistics
  async getQuestionStats(token: string) {
    return manageSoalServiceClient.get("/admin/stats/questions", token);
  },

  // Get question categories
  async getQuestionCategories(token: string) {
    return manageSoalServiceClient.get("/admin/categories", token);
  },

  // Get question types
  async getQuestionTypes(token: string) {
    return manageSoalServiceClient.get("/admin/types", token);
  },
};

// Combined Analytics Service
export const analyticsService = {
  // Get comprehensive dashboard analytics
  async getDashboardAnalytics(
    period: string = "30d",
    token: string,
  ): Promise<ApiResponse<any>> {
    const results = await Promise.all([
      authService.getUserAnalytics(period, token),
      manageSoalService.getQuestionAnalytics(period, token),
      generateSoalService.getGenerationAnalytics(period, token),
    ]);

    const errors: string[] = [];
    const successfulData: { [key: string]: any } = {};

    results.forEach((res, index) => {
      const serviceName = ['auth', 'questions', 'generations'][index];
      if (res.success) {
        successfulData[serviceName] = res.data;
      } else {
        errors.push(`${serviceName} service failed: ${res.error}`);
      }
    });

    if (Object.keys(successfulData).length === 0) {
      return {
        status: "error",
        success: false,
        error: `All analytics services failed. Errors: [${errors.join(", ")}]`,
      };
    }
    
    const userAnalytics = successfulData.auth;
    const questionAnalytics = successfulData.questions;
    const generationAnalytics = successfulData.generations;

    const combinedData = {
      overview: {
        users: {
          total: userAnalytics?.overview?.total || 0,
          active: userAnalytics?.overview?.active || 0,
          new: userAnalytics?.overview?.new || 0,
          growth: userAnalytics?.overview?.growth || 0,
        },
                questions: {
          total: questionAnalytics?.overview?.total || 0,
          published: questionAnalytics?.overview?.published || 0,
          draft: questionAnalytics?.overview?.draft || 0,
          inPeriod: questionAnalytics?.overview?.inPeriod || 0,
          today: questionAnalytics?.overview?.today || 0,
        },
        generations: {
          total: generationAnalytics?.overview?.total || 0,
          inPeriod: generationAnalytics?.overview?.inPeriod || 0,
          today: generationAnalytics?.overview?.today || 0,
          successful: generationAnalytics?.overview?.successful || 0,
          failed: generationAnalytics?.overview?.failed || 0,
          successRate: generationAnalytics?.overview?.successRate || 0,
        },
      },
      distributions: {
        questionCategories: this.processDistributionData(
          questionAnalytics?.distributions?.categories || []
        ),
        questionTypes: this.processDistributionData(
          questionAnalytics?.distributions?.types || []
        ),
        questionDifficulty: this.processDistributionData(
          questionAnalytics?.distributions?.difficulty || []
        ),
      },
      trends: {
        userGrowth: this.processTrendData(userAnalytics?.trends?.userGrowth || []),
        generationTrend: this.processTrendData(
          generationAnalytics?.trends?.generationTrend || []
        ),
      },
      recentActivity: this.combineRecentActivities([
        userAnalytics?.recentActivity || [],
        questionAnalytics?.recentActivity || [],
        generationAnalytics?.recentActivity || [],
      ]),
      errors: errors.length > 0 ? errors : undefined,
    };

    return {
      status: "success",
      success: true,
      data: combinedData,
    };
  },

  // Helper method to process trend data
  processTrendData(trendArray: any[]): any[] {
    if (!Array.isArray(trendArray)) return [];
    return trendArray.map((item) => ({
      date: item.date || item._id,
      count: item.count,
    }));
  },

  // Helper method to process distribution data
  processDistributionData(distributionArray: any[]): any[] {
    if (!Array.isArray(distributionArray)) return [];
    return distributionArray.map((item) => ({
      name: item.name || item._id,
      value: item.count,
    }));
  },

  // Helper method to combine recent activities
  combineRecentActivities(activityArrays: any[][]): any[] {
    const allActivities = activityArrays.flat().filter(Boolean);
    return allActivities
      .map((activity) => ({
        id: activity.id,
        type: activity.type || 'unknown',
        description: activity.description,
        timestamp: activity.timestamp,
        user: activity.user?.name || 'Unknown User',
        status: activity.status || 'unknown',
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Limit to latest 10 activities
  },
};

// Notification Service
export const notificationService = {
  // Get notifications with filters and pagination
  async getNotifications(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });

      if (params.search) queryParams.append("search", params.search);
      if (params.type) queryParams.append("type", params.type);
      if (params.status) queryParams.append("status", params.status);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      return notificationServiceClient.get(
        `/admin/notifications?${queryParams.toString()}`,
        "",
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        status: "error",
        success: false,
        error: "Failed to fetch notifications",
      };
    }
  },

  // Update notification (mark as read/unread)
  async updateNotification(id: string, action: string): Promise<ApiResponse<any>> {
    try {
      return notificationServiceClient.put(
        `/admin/notifications/${id}`,
        { action },
        "",
      );
    } catch (error) {
      console.error("Error updating notification:", error);
      return {
        status: "error",
        success: false,
        error: "Failed to update notification",
      };
    }
  },

  // Delete notification
  async deleteNotification(id: string): Promise<ApiResponse<any>> {
    try {
      return notificationServiceClient.delete(`/admin/notifications/${id}`, "");
    } catch (error) {
      console.error("Error deleting notification:", error);
      return {
        status: "error",
        success: false,
        error: "Failed to delete notification",
      };
    }
  },
};

// API Gateway Service (for unified endpoints if available)
export const apiGateway = {
  // Get system health
  async getSystemHealth(token: string) {
    return apiGatewayClient.get("/admin/health", token);
  },

  // Get system metrics
  async getSystemMetrics(token: string) {
    return apiGatewayClient.get("/admin/metrics", token);
  },
};

// Helper function to get auth token from cookies
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find(
    (cookie) =>
      cookie.trim().startsWith("authToken=") ||
      cookie.trim().startsWith("token="),
  );

  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1];
}

// Export types for use in components
export type { ApiResponse, PaginatedResponse };
