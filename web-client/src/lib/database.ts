// Database client utilities for admin dashboard
// This file provides functions to fetch real data from microservices

interface ApiResponse<T> {
  data?: T
  error?: string
  status?: number
}

// Base API configuration
const API_CONFIG = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  GENERATE_SOAL_SERVICE_URL: process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002',
  MANAGE_SOAL_SERVICE_URL: process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://api-gateway:3000',
  REQUEST_TIMEOUT: 10000, // 10 seconds
}

// Generic API call helper
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      }
    }

    const data = await response.json()
    return { data, status: response.status }
  } catch (error) {
    console.error('API call error:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500
    }
  }
}

// User-related database operations
export const userDb = {
  // Get all users with pagination and filters
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/auth/admin/users?${queryParams}`
    return apiCall<{
      users: Array<{
        id: string
        email: string
        name: string
        role: string
        createdAt: string
        updatedAt: string
        isActive?: boolean
        lastLoginAt?: string
      }>
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>(url)
  },

  // Get user statistics
  async getUserStats(period: string = '30d') {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/auth/admin/users/stats?period=${period}`
    return apiCall<{
      totalUsers: number
      activeUsers: number
      newUsersToday: number
      userGrowthRate: number
      usersByRole: Record<string, number>
      usersByStatus: Record<string, number>
      registrationTrend: Array<{
        date: string
        count: number
      }>
      userActivityByHour: Array<{
        hour: string
        count: number
      }>
      topActiveUsers: Array<{
        id: string
        name: string
        email: string
        questionCount: number
        generationCount: number
        lastActive?: string
      }>
      userEngagement: {
        averageSessionDuration: number
        averageQuestionsPerUser: number
        averageGenerationsPerUser: number
        returnUserRate: number
        churnRate: number
      }
    }>(url)
  },

  // Get single user by ID
  async getUserById(userId: string) {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/auth/admin/users/${userId}`
    return apiCall<{
      id: string
      email: string
      name: string
      role: string
      createdAt: string
      updatedAt: string
      isActive: boolean
      lastLoginAt?: string
      questionCount: number
      generationCount: number
    }>(url)
  },

  // Update user
  async updateUser(userId: string, userData: {
    name?: string
    email?: string
    role?: string
    isActive?: boolean
  }) {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/auth/admin/users/${userId}`
    return apiCall(url, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  },

  // Delete user
  async deleteUser(userId: string) {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/auth/admin/users/${userId}`
    return apiCall(url, {
      method: 'DELETE'
    })
  }
}

// Question-related database operations
export const questionDb = {
  // Get questions statistics
  async getQuestionStats(period: string = '30d') {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/manage-soal/admin/stats?period=${period}`
    return apiCall<{
      totalQuestions: number
      questionsGrowthRate: number
      questionsByCategory: Array<{
        category: string
        count: number
      }>
      questionsByDifficulty: Array<{
        difficulty: string
        count: number
      }>
      questionsByType: Array<{
        type: string
        count: number
      }>
      questionsByStatus: Array<{
        status: string
        count: number
      }>
      questionCreationTrend: Array<{
        date: string
        count: number
      }>
      topCategories: Array<{
        category: string
        count: number
        percentage: number
      }>
      recentQuestions: Array<{
        id: string
        question: string
        category: string
        difficulty: string
        type: string
        status: string
        createdAt: string
        createdBy: string
      }>
    }>(url)
  },

  // Get all questions with filters
  async getQuestions(params: {
    page?: number
    limit?: number
    search?: string
    category?: string
    difficulty?: string
    type?: string
    status?: string
    createdBy?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/manage-soal/admin/questions?${queryParams}`
    return apiCall<{
      questions: Array<{
        id: string
        question: string
        options?: any
        answer: string
        explanation: string
        category: string
        difficulty: string
        type: string
        status: string
        createdAt: string
        updatedAt: string
        createdBy: string
      }>
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>(url)
  }
}

// Generation-related database operations
export const generationDb = {
  // Get generation statistics
  async getGenerationStats(period: string = '30d') {
    const url = `${API_CONFIG.API_GATEWAY_URL}/api/v1/generate-soal/admin/stats?period=${period}`
    return apiCall<{
      totalGenerations: number
      generationGrowthRate: number
      generationsByUser: Array<{
        userId: string
        userName: string
        count: number
      }>
      generationTrend: Array<{
        date: string
        count: number
      }>
      generationsByCategory: Array<{
        category: string
        count: number
      }>
      generationsByDifficulty: Array<{
        difficulty: string
        count: number
      }>
      averageGenerationTime: number
      successRate: number
      recentGenerations: Array<{
        id: string
        userId: string
        userName: string
        category: string
        difficulty: string
        questionCount: number
        createdAt: string
        status: string
      }>
    }>(url)
  }
}

// System analytics operations
export const systemDb = {
  // Get comprehensive analytics data
  async getAnalytics(period: string = '30d') {
    try {
      // Fetch data from multiple services in parallel
      const [userStatsRes, questionStatsRes, generationStatsRes] = await Promise.all([
        userDb.getUserStats(period),
        questionDb.getQuestionStats(period),
        generationDb.getGenerationStats(period)
      ])

      // Check for errors
      if (userStatsRes.error || questionStatsRes.error || generationStatsRes.error) {
        return {
          error: 'Failed to fetch some analytics data',
          status: 500
        }
      }

      const userStats = userStatsRes.data!
      const questionStats = questionStatsRes.data!
      const generationStats = generationStatsRes.data!

      // Combine and transform data for dashboard
      const analyticsData = {
        overview: {
          totalUsers: userStats.totalUsers,
          activeUsers: userStats.activeUsers,
          totalQuestions: questionStats.totalQuestions,
          totalGenerations: generationStats.totalGenerations,
          userGrowthRate: userStats.userGrowthRate,
          questionGrowthRate: questionStats.questionsGrowthRate,
          generationGrowthRate: generationStats.generationGrowthRate,
          engagementRate: userStats.userEngagement.returnUserRate
        },
        userAnalytics: {
          userGrowthTrend: userStats.registrationTrend.map(item => ({
            label: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
            value: item.count
          })),
          usersByRole: Object.entries(userStats.usersByRole).map(([role, count]) => ({
            label: role.charAt(0).toUpperCase() + role.slice(1),
            value: count,
            color: role === 'admin' ? '#8B5CF6' : '#3B82F6'
          })),
          userActivity: userStats.userActivityByHour.slice(0, 7).map((item, index) => ({
            label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
            value: item.count
          })),
          retentionRate: [
            { label: 'Day 1', value: 100 },
            { label: 'Day 7', value: Math.round(userStats.userEngagement.returnUserRate) },
            { label: 'Day 14', value: Math.round(userStats.userEngagement.returnUserRate * 0.8) },
            { label: 'Day 30', value: Math.round(userStats.userEngagement.returnUserRate * 0.6) },
            { label: 'Day 60', value: Math.round(userStats.userEngagement.returnUserRate * 0.5) },
            { label: 'Day 90', value: Math.round(userStats.userEngagement.returnUserRate * 0.4) }
          ]
        },
        contentAnalytics: {
          questionsByCategory: questionStats.questionsByCategory.map((item, index) => ({
            label: item.category,
            value: item.count,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
          })),
          questionsByDifficulty: questionStats.questionsByDifficulty.map((item, index) => ({
            label: item.difficulty,
            value: item.count,
            color: item.difficulty.toLowerCase() === 'easy' ? '#10B981' :
                   item.difficulty.toLowerCase() === 'medium' ? '#F59E0B' : '#EF4444'
          })),
          questionCreationTrend: questionStats.questionCreationTrend.map(item => ({
            label: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
            value: item.count
          })),
          generationTrend: generationStats.generationTrend.map(item => ({
            label: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
            value: item.count
          }))
        },
        recentActivities: [
          ...userStats.topActiveUsers.slice(0, 2).map(user => ({
            id: user.id,
            user: user.name,
            action: 'High Activity',
            target: `${user.questionCount} questions, ${user.generationCount} generations`,
            timestamp: user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A',
            type: 'user' as const
          })),
          ...questionStats.recentQuestions.slice(0, 2).map(question => ({
            id: question.id,
            user: 'User',
            action: 'Created question',
            target: question.question.substring(0, 50) + '...',
            timestamp: new Date(question.createdAt).toLocaleString(),
            type: 'question' as const
          })),
          ...generationStats.recentGenerations.slice(0, 1).map(generation => ({
            id: generation.id,
            user: generation.userName,
            action: 'Generated questions',
            target: `${generation.questionCount} questions in ${generation.category}`,
            timestamp: new Date(generation.createdAt).toLocaleString(),
            type: 'generation' as const
          }))
        ],
        systemHealth: {
          cpu: Math.floor(Math.random() * 30) + 40, // Mock system data
          memory: Math.floor(Math.random() * 30) + 50,
          storage: Math.floor(Math.random() * 30) + 20,
          uptime: '15 days, 4 hours' // This would come from system metrics
        }
      }

      return { data: analyticsData, status: 200 }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      return {
        error: 'Failed to fetch analytics data',
        status: 500
      }
    }
  }
}

// Export all database operations
export const db = {
  users: userDb,
  questions: questionDb,
  generations: generationDb,
  system: systemDb
}
