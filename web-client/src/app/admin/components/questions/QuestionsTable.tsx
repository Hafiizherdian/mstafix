// File: QuestionsTable.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/Button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/Input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileEdit, 
  Trash2, 
  Archive, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2, 
  AlertCircle,
  RefreshCw,
  FileQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from 'use-debounce';
import { Skeleton } from '@/app/admin/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { useQuestions } from '../../hooks/useQuestions';

// Constants
export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', variant: 'outline' as const },
  PUBLISHED: { label: 'Diterbitkan', variant: 'default' as const },
  ARCHIVED: { label: 'Diarsipkan', variant: 'secondary' as const },
  REJECTED: { label: 'Ditolak', variant: 'destructive' as const },
};

export const DIFFICULTY_LABELS = {
  EASY: 'Mudah',
  MEDIUM: 'Sedang',
  HARD: 'Sulit'
} as const;

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasi',
  ARCHIVED: 'Diarsipkan'
} as const;

export const DIFFICULTY_COLORS = {
  EASY: 'bg-green-500/20 text-green-300 hover:bg-green-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30',
  HARD: 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
} as const;

export const STATUS_COLORS = {
  DRAFT: 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700/80',
  PUBLISHED: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30',
  ARCHIVED: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
} as const;

export type Difficulty = keyof typeof DIFFICULTY_LABELS;
export type QuestionStatus = keyof typeof STATUS_LABELS;

export interface QuestionType {
  id: string;
  question: string;
  category: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
  topic?: string;
  tags?: string[];
  lastUsed?: string;
  usageCount?: number;
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
  metadata?: Record<string, unknown>;
}

export interface QuestionsTableProps {
  questions: QuestionType[];
  loading?: boolean;
  error?: string | null;
  onQuestionSelect?: (question: QuestionType) => void;
  onQuestionEdit?: (question: QuestionType) => void;
  onQuestionDelete?: (id: string) => Promise<boolean>;
  onQuestionStatusChange?: (id: string, status: QuestionStatus) => Promise<void>;
  onFilterChange?: (filters: FilterState) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  refetchQuestions: () => Promise<void>;
  stats?: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
}

export type FilterState = {
  search?: string;
  category?: string;
  status?: QuestionStatus | 'ALL';
  difficulty?: Difficulty | 'ALL';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export type NullableSortConfig = SortConfig | null;

const toast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
};

const componentLogger = logger.child({ component: 'QuestionsTable' });

export function QuestionsTable({
  questions: initialQuestions = [],
  loading: initialLoading = false,
  onQuestionEdit,
  onQuestionDelete,
  onQuestionStatusChange,
  onFilterChange,
  pagination: initialPagination,
  refetchQuestions,
  stats
}: QuestionsTableProps) {
  const {
    data: questions,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch
  } = useQuestions();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; question: QuestionType | null }>({ open: false, question: null });

  useEffect(() => {
    setFilters({ search: debouncedSearchQuery });
  }, [debouncedSearchQuery, setFilters]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | number) => {
    setFilters({ [key]: value });
    if (onFilterChange) {
      onFilterChange({ [key]: value });
    }
  }, [setFilters, onFilterChange]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters({ page: newPage });
    if (onFilterChange) {
      onFilterChange({ page: newPage });
    }
  }, [setFilters, onFilterChange]);

  const handleDelete = useCallback((question: QuestionType) => {
    setDeleteDialog({ open: true, question });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteDialog.question) {
      await onQuestionDelete?.(deleteDialog.question.id);
      setDeleteDialog({ open: false, question: null });
      refetch();
    }
  }, [deleteDialog.question, onQuestionDelete, refetch]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialog({ open: false, question: null });
  }, []);

  const handleStatusChange = useCallback(async (questionId: string, newStatus: QuestionStatus) => {
    await onQuestionStatusChange?.(questionId, newStatus);
    refetch();
  }, [onQuestionStatusChange, refetch]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setFilters({ limit: newLimit, page: 1 });
    if (onFilterChange) {
      onFilterChange({ limit: newLimit, page: 1 });
    }
  }, [setFilters, onFilterChange]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchQuestions();
  }, [refetch, refetchQuestions]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-400 text-sm px-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <p className="text-red-400">Gagal memuat data soal</p>
          <p className="text-zinc-400">Terjadi kesalahan saat memuat data. Silakan coba lagi.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="mt-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Total dari pagination mencerminkan total keseluruhan soal
  const total = pagination.total;

  return (
    <div className="max-w-full space-y-4 px-2 sm:px-4 py-4 sm:py-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-col sm:items-start items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 text-center sm:text-left">Kelola Soal</h2>
          <p className="text-xs sm:text-sm text-zinc-400 text-center sm:text-left">Total {total} soal</p>
        </div>
        <div className="flex gap-2 items-center justify-center sm:justify-start">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefresh}
            className="border-cyan-700 text-cyan-400 hover:bg-cyan-500/10 h-9 w-9 sm:w-auto sm:px-3"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => onQuestionEdit?.({ id: '', question: '', category: '', difficulty: 'EASY', status: 'DRAFT', createdAt: '', updatedAt: '' })}
            className="h-9 bg-cyan-500/80 hover:bg-cyan-600/90 hover:scale-105 text-white transition-all duration-200 ease-in-out"
          >
            <FileQuestion className="h-4 w-4 mr-2" />
            Buat Soal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-zinc-700/20 border border-zinc-700/40 rounded-lg p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/40 hover:bg-zinc-700/30 transition-all duration-300 ease-in-out">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full" />
          <div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-1">Total Soal</p>
            <p className="text-lg sm:text-xl font-bold text-cyan-400">{stats?.total ?? total}</p>
          </div>
        </div>
        <div className="bg-zinc-700/20 border border-zinc-700/40 rounded-lg p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/40 hover:bg-zinc-700/30 transition-all duration-300 ease-in-out">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full" />
          <p className="text-xs sm:text-sm text-zinc-400 mb-1">Dipublikasi</p>
          <p className="text-lg sm:text-xl font-bold text-green-400">{stats?.published ?? questions.filter(q => q.status === 'PUBLISHED').length}</p>
        </div>
        <div className="bg-zinc-700/20 border border-zinc-700/40 rounded-lg p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/40 hover:bg-zinc-700/30 transition-all duration-300 ease-in-out">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full" />
          <p className="text-xs sm:text-sm text-zinc-400 mb-1">Draft</p>
          <p className="text-lg sm:text-xl font-bold text-yellow-400">{stats?.draft ?? questions.filter(q => q.status === 'DRAFT').length}</p>
        </div>
        <div className="bg-zinc-700/20 border border-zinc-700/40 rounded-lg p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/40 hover:bg-zinc-700/30 transition-all duration-300 ease-in-out">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full" />
          <p className="text-xs sm:text-sm text-zinc-400 mb-1">Diarsipkan</p>
          <p className="text-lg sm:text-xl font-bold text-purple-400">{stats?.archived ?? questions.filter(q => q.status === 'ARCHIVED').length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 md:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Cari soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 bg-zinc-700/30 border-zinc-700/50 text-zinc-200 focus-visible:ring-cyan-500/50"
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/30"
            >
              <Filter className="h-4 w-4 mr-2" />
              Kategori
              {filters.category && filters.category !== 'ALL' && (
                <span className="ml-1 text-cyan-400">({filters.category})</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700/50" align="end">
            <DropdownMenuItem 
              onClick={() => handleFilterChange('category', 'ALL')}
              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
            >
              Semua Kategori
              {filters.category === 'ALL' && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
            </DropdownMenuItem>
            {Array.from(new Set(questions.map(q => q.category))).map(cat => (
              <DropdownMenuItem 
                key={cat} 
                onClick={() => handleFilterChange('category', cat)}
                className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
              >
                {cat}
                {filters.category === cat && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/30"
            >
              <Filter className="h-4 w-4 mr-2" />
              Status
              {filters.status && filters.status !== 'ALL' && (
                <span className="ml-1 text-cyan-400">({STATUS_LABELS[filters.status as QuestionStatus] || filters.status})</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700/50" align="end">
            <DropdownMenuItem 
              onClick={() => handleFilterChange('status', 'ALL')}
              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
            >
              Semua Status
              {filters.status === 'ALL' && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
            </DropdownMenuItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem 
                key={key} 
                onClick={() => handleFilterChange('status', key as QuestionStatus)}
                className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
              >
                {label}
                {filters.status === key && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/30"
            >
              <Filter className="h-4 w-4 mr-2" />
              Tingkat Kesulitan
              {filters.difficulty && filters.difficulty !== 'ALL' && (
                <span className="ml-1 text-cyan-400">({DIFFICULTY_LABELS[filters.difficulty as Difficulty] || filters.difficulty})</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700/50" align="end">
            <DropdownMenuItem 
              onClick={() => handleFilterChange('difficulty', 'ALL')}
              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
            >
              Semua Tingkat
              {filters.difficulty === 'ALL' && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
            </DropdownMenuItem>
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <DropdownMenuItem 
                key={key} 
                onClick={() => handleFilterChange('difficulty', key as Difficulty)}
                className="text-zinc-300 focus:bg-zinc-700/50 focus:text-zinc-200"
              >
                {label}
                {filters.difficulty === key && <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-cyan-400" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-700/40 shadow-md shadow-zinc-900/20">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px] md:min-w-full w-full">
            <TableHeader className="bg-zinc-700/80 backdrop-blur-sm">
              <TableRow>
                <TableHead 
                  className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90 w-[28%] min-w-[180px] max-w-[320px]" 
                  onClick={() => handleFilterChange('sortBy', 'question')}
                >
                  <div className="flex items-center gap-1">
                    Soal
                    {filters.sortBy === 'question' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hidden md:table-cell hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90 w-[14%] min-w-[100px] max-w-[180px]" onClick={() => handleFilterChange('sortBy', 'category')}>
                  <div className="flex items-center gap-1">
                    Kategori
                    {filters.sortBy === 'category' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hidden lg:table-cell hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90 w-[10%] min-w-[80px] max-w-[110px]" onClick={() => handleFilterChange('sortBy', 'difficulty')}>
                  <div className="flex items-center gap-1">
                    Kesulitan
                    {filters.sortBy === 'difficulty' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hidden sm:table-cell hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90 w-[12%] min-w-[90px] max-w-[120px]" onClick={() => handleFilterChange('sortBy', 'status')}>
                  <div className="flex items-center gap-1">
                    Status
                    {filters.sortBy === 'status' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hidden md:table-cell hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90" onClick={() => handleFilterChange('sortBy', 'createdAt')}>
                  <div className="flex items-center gap-1">
                    Dibuat
                    {filters.sortBy === 'createdAt' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm hidden lg:table-cell hover:text-cyan-400 cursor-pointer hover:bg-zinc-700/90" onClick={() => handleFilterChange('sortBy', 'updatedAt')}>
                  <div className="flex items-center gap-1">
                    Diperbarui
                    {filters.sortBy === 'updatedAt' && (
                      filters.sortOrder === 'asc' ? 
                      <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : 
                      <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400 uppercase tracking-wider text-xs sm:text-sm text-right w-[10%] min-w-[80px] max-w-[110px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-zinc-800/90 divide-zinc-700/50">
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableRow key={idx} className="border-zinc-700/30 hover:bg-zinc-800/50 transition-colors duration-300 ease-in-out">
                    <TableCell className="px-4 py-4 font-medium max-w-xs">
                      <Skeleton className="h-5 w-3/4 bg-zinc-700/40" />
                      <Skeleton className="h-3 w-1/4 mt-2 bg-zinc-700/30" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-4">
                      <Skeleton className="h-5 w-16 bg-zinc-700/40" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-4">
                      <Skeleton className="h-5 w-20 bg-zinc-700/40" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-4 py-4">
                      <Skeleton className="h-5 w-24 bg-zinc-700/40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-4">
                      <Skeleton className="h-5 w-28 bg-zinc-700/40" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-4">
                      <Skeleton className="h-5 w-28 bg-zinc-700/40" />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <Skeleton className="h-8 w-8 ml-auto bg-zinc-700/40" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // Error State
                <TableRow className="border-0 hover:bg-zinc-800/50 transition-colors duration-300 ease-in-out">
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-zinc-400 bg-zinc-800/80">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <AlertCircle className="h-10 w-10 text-zinc-500 mb-2" />
                      <p className="text-lg font-medium mb-1">Terjadi Kesalahan</p>
                      <p className="text-zinc-400 max-w-sm mb-4">Gagal memuat data soal. Silakan coba lagi.</p>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-700/50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Coba Lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                // Empty State
                <TableRow className="border-0 hover:bg-zinc-800/50 transition-colors duration-300 ease-in-out">
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-zinc-400 bg-zinc-800/80">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <FileQuestion className="h-10 w-10 text-zinc-500 mb-2" />
                      <p className="text-lg font-medium mb-1">Tidak Ada Soal</p>
                      <p className="text-zinc-400 max-w-sm mb-4">Belum ada soal yang dibuat. Klik tombol &quot;Buat Soal&quot; untuk mulai membuat soal baru.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                questions.map((question) => (
                  <TableRow 
                    key={question.id} 
                    className="border-zinc-700/30 hover:bg-zinc-800/50 transition-colors duration-300 ease-in-out"
                  >
                    <TableCell className="px-4 py-4 font-medium max-w-xs">
                      <div className="line-clamp-2 text-ellipsis text-white">
                        {question.question}
                      </div>
                      <div className="sm:hidden mt-2 flex flex-wrap gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-zinc-700/60 bg-zinc-700/30 text-zinc-300"
                        >
                          {question.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-zinc-700/60 ${DIFFICULTY_COLORS[question.difficulty]}`}
                        >
                          {DIFFICULTY_LABELS[question.difficulty]}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-zinc-700/60 ${STATUS_COLORS[question.status]}`}
                        >
                          {STATUS_LABELS[question.status]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2 sm:px-4 py-4 text-zinc-300 align-top">
                      {question.category}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-4">
                      <Badge className={DIFFICULTY_COLORS[question.difficulty]}>
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-4 text-zinc-300 align-top">
                      <Badge className={STATUS_COLORS[question.status]}>
                        {STATUS_LABELS[question.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2 sm:px-4 py-4 text-zinc-400 text-sm align-top">
                      {question.createdAt}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-2 sm:px-4 py-4 text-zinc-400 text-sm align-top">
                      {question.updatedAt}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-zinc-700/50 text-zinc-400 hover:text-cyan-400"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-800 border-zinc-700/50" align="end">
                          <DropdownMenuItem 
                            onClick={() => onQuestionEdit?.(question)}
                            className="text-zinc-300 focus:bg-zinc-700/50 focus:text-cyan-400"
                          >
                            <FileEdit className="mr-2.5 h-4 w-4 text-muted-foreground" />
                            Edit Soal
                          </DropdownMenuItem>
                          {question.status !== 'PUBLISHED' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(question.id, 'PUBLISHED')}
                              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-cyan-400"
                            >
                              <FileEdit className="mr-2.5 h-4 w-4 text-muted-foreground" />
                              Publikasikan
                            </DropdownMenuItem>
                          )}
                          {question.status !== 'ARCHIVED' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(question.id, 'ARCHIVED')}
                              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-purple-400"
                            >
                              <Archive className="mr-2.5 h-4 w-4 text-amber-500" />
                              Arsipkan
                            </DropdownMenuItem>
                          )}
                          {question.status === 'ARCHIVED' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(question.id, 'DRAFT')}
                              className="text-zinc-300 focus:bg-zinc-700/50 focus:text-yellow-400"
                            >
                              <Archive className="mr-2.5 h-4 w-4 text-amber-500" />
                              Kembalikan ke Draft
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-zinc-700/50" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(question)}
                            className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
                          >
                            <Trash2 className="mr-2.5 h-4 w-4 text-red-500" />
                            Hapus Soal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, question: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} onClick={handleCancelDelete}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
