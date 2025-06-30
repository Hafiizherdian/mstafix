import { useState, useEffect, useCallback } from 'react';
import { AnalyticsData, Question } from '../types';
import { api } from '../services/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  [key: string]: any;
}

interface UserStatsResponse {
  total: number;
  active: number;
  new: number;
  growth: number | { total: number; percentage: number };
  distribution?: {
    byRole: Array<{ name: string; value: number }>;
  };
  trends?: Array<{ date: string; count: number }>;
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
    status: string;
  }>;
  period?: string;
}

interface QuestionStatsResponse {
  total: number;
  byCategory?: Array<{ name: string; value: number }>;
  byDifficulty?: Array<{ name: string; value: number }>;
  recent?: Question[];
}

interface GenerationStatsResponse {
  total: number;
  successRate?: number;
  byType?: Array<{ name: string; value: number }>;
  recent?: any[];
}

interface CombinedAnalyticsData {
  userStats: UserStatsResponse;
  questionStats: QuestionStatsResponse;
  generationStats: GenerationStatsResponse;
}

type CombinedAnalyticsResponse = ApiResponse<CombinedAnalyticsData>;

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Menggunakan endpoint gabungan yang baru
      const response = await api.get<CombinedAnalyticsResponse>('/admin/analytics/combined');
      
      if (response.success && response.data) {
        // Pastikan response.data ada dan memiliki properti yang diperlukan
        const responseData = response.data;
        
        // Berikan nilai default yang sesuai jika data tidak tersedia
        const defaultUserStats: UserStatsResponse = {
          total: 0,
          active: 0,
          new: 0,
          growth: 0,
          distribution: { byRole: [] },
          trends: [],
          recentActivity: [],
          period: '30d'
        };
        
        const defaultQuestionStats: QuestionStatsResponse = {
          total: 0,
          recent: []
        };
        
        const defaultGenerationStats: GenerationStatsResponse = {
          total: 0,
          recent: []
        };
        
        // Gunakan data dari response atau nilai default
        const userStats: UserStatsResponse = responseData.userStats || defaultUserStats;
        const questionStats: QuestionStatsResponse = responseData.questionStats || defaultQuestionStats;
        const generationStats: GenerationStatsResponse = responseData.generationStats || defaultGenerationStats;
        
        // Format user stats
        const growthTotal = typeof userStats.growth === 'number' 
          ? userStats.growth 
          : userStats.growth?.total || 0;
          
        const growthPercentage = typeof userStats.growth === 'object' && userStats.growth !== null
          ? userStats.growth.percentage || 0
          : 0;

        // Pastikan semua field yang diperlukan ada
        const formattedUserStats: AnalyticsData['userStats'] = {
          total: userStats.total || 0,
          active: userStats.active || 0,
          new: userStats.new || 0,
          growth: {
            total: growthTotal,
            percentage: `${growthPercentage}%`
          },
          distribution: {
            byRole: userStats.distribution?.byRole || []
          },
          trends: userStats.trends || [],
          recentActivity: (userStats.recentActivity || []).map(activity => ({
            id: activity.id || '',
            type: activity.type || '',
            description: activity.description || '',
            user: activity.user || '',
            timestamp: activity.timestamp || new Date().toISOString(),
            status: activity.status || 'completed'
          })),
          period: userStats.period || '30d'
        };

        // Format question stats
        const formattedQuestionStats: AnalyticsData['questionStats'] = {
          total: questionStats.total || 0,
          recent: (questionStats.recent || []).map(question => ({
            id: question.id || '',
            question: question.question || '',
            category: question.category || '',
            difficulty: question.difficulty || 'MEDIUM',
            type: question.type || 'MCQ',
            answer: question.answer || '',
            status: question.status || 'PUBLISHED',
            createdAt: question.createdAt || new Date().toISOString(),
            updatedAt: question.updatedAt || new Date().toISOString(),
            ...(question.options && { options: question.options }),
            ...(question.explanation && { explanation: question.explanation }),
            ...(question.topic && { topic: question.topic }),
            ...(question.tags && { tags: question.tags })
          }))
        };

        // Format generation stats
        const formattedGenerationStats: AnalyticsData['generationStats'] = {
          total: generationStats.total || 0,
          mostFrequent: (generationStats.byType || []).map(item => ({
            type: item?.name || 'unknown',
            count: item?.value || 0
          }))
        };

        // Gabungkan semua data yang sudah diformat
        const formattedData: AnalyticsData = {
          userStats: formattedUserStats,
          questionStats: formattedQuestionStats,
          generationStats: formattedGenerationStats
        };
        
        setData(formattedData);
      } else {
        setError(response.error || 'Gagal memuat data analitik');
      }
    } catch (err) {
      console.error('[useAnalytics] Error:', err);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refetch = useCallback(() => {
    return fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
