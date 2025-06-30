// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'TEACHER';
  createdAt: string;
  updatedAt?: string;
}

// Question related types
export interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MCQ' | 'ESSAY' | 'TRUE_FALSE';
  options?: Record<string, string>;
  answer: string;
  explanation?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  topic?: string;
  tags?: string[];
  lastUsed?: string;
  usageCount?: number;
  metadata?: Record<string, unknown>;
}

// Analytics types
export interface AnalyticsData {
  userStats: {
    total: number;
    active: number;
    new: number;
    growth: {
      total: number;
      percentage: string;
    };
    distribution: {
      byRole: Array<{ name: string; value: number }>;
    };
    trends: Array<{ date: string; count: number }>;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      user: string;
      timestamp: string;
      status: string;
    }>;
    period: string;
  };
  questionStats: {
    total: number;
    recent: Question[];
  };
  generationStats: {
    total: number;
    mostFrequent: Array<{ type: string; count: number }>;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  code?: string;
  [key: string]: any; // Untuk kompatibilitas dengan properti tambahan
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  validate: (value: T) => string | undefined;
}

// Filter types
export interface FilterOptions {
  search?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
