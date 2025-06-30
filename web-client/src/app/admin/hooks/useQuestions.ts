import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, FilterOptions } from '../types';
import { api } from '../services/api';
import { QuestionType } from '../components/questions/QuestionsTable';

/**
 * Tipe untuk data pagination dari API
 */
interface PaginationData {
  items: QuestionType[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Tipe untuk response dari endpoint questions
 */
type QuestionsResponse = ApiResponse<PaginationData>;

interface UseQuestionsReturn {
  data: QuestionType[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: FilterOptions;
  setFilters: (filters: Partial<FilterOptions>) => void;
  refetch: () => Promise<void>;
}

export function useQuestions(initialFilters: Partial<FilterOptions> = {}): UseQuestionsReturn {
  const [data, setData] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilterState] = useState<FilterOptions>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buat query parameters dari filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.set(key, String(value));
        }
      });

      console.log('[useQuestions] Fetching questions with params:', Object.fromEntries(queryParams.entries()));
      
      const response = await api.get<QuestionsResponse>(
        `/admin/questions?${queryParams.toString()}`
      );
      
      console.log('[useQuestions] Response:', response);
      
      // Pastikan response valid
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memuat daftar soal');
      }

      // Ekstrak data dari response
      const { 
        items = [], 
        page = 1, 
        limit = 10, 
        total = 0, 
        totalPages = 1 
      } = response.data;
      
      // Update state dengan data yang diterima
      setData(items);
      setPagination({
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      });
    } catch (error: any) {
      console.error('[useQuestions] Error:', error);
      
      // Handle error response dari API
      if (error?.response?.data) {
        const { error: errorMsg, message, code } = error.response.data;
        console.error(`[useQuestions] API Error (${code}):`, message || errorMsg);
        setError(message || errorMsg || 'Terjadi kesalahan saat memuat data');
        
        // Handle unauthorized
        if (code === 'UNAUTHORIZED' || error.response.status === 401) {
          // Redirect akan dihandle oleh interceptor
          return;
        }
      } else {
        setError(error?.message || 'Terjadi kesalahan saat memuat data');
      }
      
      // Reset data jika error
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    return fetchQuestions();
  }, [fetchQuestions]);

  const setFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilterState(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // Reset to first page when filters change
    }));
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    data,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
