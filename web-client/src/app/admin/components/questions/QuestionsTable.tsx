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
  EASY: 'bg-green-100 text-green-800 hover:bg-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  HARD: 'bg-red-100 text-red-800 hover:bg-red-200'
} as const;

export const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  PUBLISHED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  ARCHIVED: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
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
  questions = [],
  loading = false,
  error = null,
  onQuestionEdit,
  onQuestionDelete,
  onQuestionStatusChange,
  onFilterChange,
  pagination,
  refetchQuestions
}: QuestionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    questions.forEach(q => {
      if (q.category) uniqueCategories.add(q.category);
    });
    return Array.from(uniqueCategories).sort();
  }, [questions]);
  const initialFilters: FilterState = {
    search: '',
    category: '',
    status: 'ALL',
    difficulty: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  };
  
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortConfig, setSortConfig] = useState<NullableSortConfig>({
    key: 'createdAt',
    direction: 'desc',
  } as SortConfig);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFilterChange = useCallback((updated: Partial<FilterState>) => {
    setFilters(prevFilters => {
      const newFilters: FilterState = { 
        ...prevFilters, 
        ...updated,
        // Ensure page is reset when filters change
        ...(Object.keys(updated).some(k => k !== 'page' && k !== 'limit') 
          ? { page: 1 } 
          : {})
      };
      
      onFilterChange?.(newFilters);
      
      componentLogger.debug('Filters updated', { 
        previousFilters: prevFilters,
        updates: updated,
        newFilters
      });
      
      return newFilters;
    });
  }, [onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update search filter immediately
    handleFilterChange({ search: value || undefined });
    
    componentLogger.debug('Search query changed', { value });
  }, [handleFilterChange]);

  const handleSort = useCallback((field: keyof QuestionType) => {
    componentLogger.info('Sorting requested', { field, currentSort: sortConfig });
    
    setSortConfig(prevSort => {
      const direction: SortDirection = 
        prevSort?.key === field && prevSort.direction === 'asc' ? 'desc' : 'asc';
      
      const newSort: SortConfig = { key: field, direction };
      
      handleFilterChange({ 
        sortBy: field, 
        sortOrder: direction,
        page: 1 // Reset to first page when sorting
      });
      
      componentLogger.debug('Sort applied', { 
        field, 
        direction,
        newSort 
      });
      
      return newSort;
    });
  }, [handleFilterChange]);

  const handleQuestionAction = useCallback(async (
    action: 'edit' | 'publish' | 'archive',
    question: QuestionType
  ) => {
    try {
      setIsLoading(true);
      
      switch (action) {
        case 'edit':
          onQuestionEdit?.(question);
          break;
        case 'publish':
        case 'archive':
          const newStatus = action === 'publish' ? 'PUBLISHED' : 'ARCHIVED';
          if (onQuestionStatusChange) {
            await onQuestionStatusChange(question.id, newStatus as QuestionStatus);
            await refetchQuestions();
            toast.success(`Soal berhasil di${action === 'publish' ? 'terbitkan' : 'arsipkan'}`);
          }
          break;
      }
    } catch (err) {
      const error = err as Error;
      componentLogger.error(`Gagal melakukan aksi ${action}`, { 
        error: error.message,
        questionId: question.id 
      });
      toast.error(`Gagal melakukan aksi: ${error.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsLoading(false);
    }
  }, [onQuestionEdit, onQuestionStatusChange, refetchQuestions]);

  const handleConfirmDelete = useCallback(async () => {
    if (!questionToDelete || !onQuestionDelete) return;
    
    try {
      setIsDeleting(true);
      const success = await onQuestionDelete(questionToDelete.id);
      
      if (success) {
        toast.success('Soal berhasil dihapus');
        componentLogger.info('Question deleted successfully', { 
          questionId: questionToDelete.id 
        });
        await refetchQuestions();
      } else {
        throw new Error('Gagal menghapus soal');
      }
    } catch (err) {
      const error = err as Error;
      componentLogger.error('Failed to delete question', { 
        error: error.message,
        questionId: questionToDelete.id 
      });
      toast.error(`Gagal menghapus soal: ${error.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  }, [questionToDelete, onQuestionDelete, refetchQuestions]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Gagal memuat data soal</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Muat Ulang
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Render sort indicator
  const renderSortIndicator = useCallback((field: keyof QuestionType) => {
    if (!sortConfig || sortConfig.key !== field) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  }, [sortConfig]);

  // Render badge for status
  const renderStatusBadge = (status: QuestionStatus, size: 'sm' | 'default' = 'default') => {
    const statusConfig = STATUS_CONFIG[status] || {
      label: status,
      variant: 'default' as const,
    };

    return (
      <Badge 
        variant={statusConfig.variant} 
        className={cn(
          size === 'sm' ? 'h-5 text-[10px]' : 'h-6',
          'whitespace-nowrap'
        )}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  // Render badge for difficulty
  const renderDifficultyBadge = (difficulty: Difficulty, size: 'sm' | 'default' = 'default') => (
    <span 
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        DIFFICULTY_COLORS[difficulty],
      )}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );

  // Render delete confirmation dialog
  const renderDeleteDialog = () => (
    <AlertDialog 
      open={isDeleteDialogOpen} 
      onOpenChange={(open) => {
        if (!open) setIsDeleteDialogOpen(false);
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
          <AlertDialogCancel disabled={isDeleting}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-4">
      {renderDeleteDialog()}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari soal..."
            className="pl-9 h-10 w-full text-sm"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto justify-start">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.category}
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ 
                    status: e.target.value as QuestionStatus | 'ALL' 
                  })}
                >
                  <option value="ALL">Semua Status</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 w-full sm:w-auto"
            onClick={() => {
              setSearchQuery('');
              handleFilterChange({
                search: '',
                category: 'all',
                status: 'ALL',
                difficulty: 'ALL',
                page: 1
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>Reset Filter</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden border-border bg-card">
        <div className="relative overflow-x-auto">
          <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-transparent to-card/80 w-8 h-full right-0 absolute"></div>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <Table className="min-w-[800px] w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/30 transition-colors min-w-[200px]"
                onClick={() => handleSort('question')}
              >
                <div className="flex items-center">
                  Soal
                  {renderSortIndicator('question')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/30 transition-colors hidden md:table-cell"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Kategori
                  {renderSortIndicator('category')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/30 transition-colors hidden lg:table-cell"
                onClick={() => handleSort('difficulty')}
              >
                <div className="flex items-center">
                  Kesulitan
                  {renderSortIndicator('difficulty')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/30 transition-colors hidden sm:table-cell"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIndicator('status')}
                </div>
              </TableHead>
              <TableHead className="w-[80px] sm:w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground px-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm sm:text-base">Memuat data...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <FileQuestion className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm sm:text-base">Tidak ada soal ditemukan</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setSearchQuery('');
                          handleFilterChange({
                            search: '',
                            category: 'all',
                            status: 'ALL',
                            difficulty: 'ALL',
                            page: 1
                          });
                        }}
                      >
                        Reset Filter
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow 
                  key={question.id} 
                  className="hover:bg-muted/10 group border-b border-border last:border-b-0"
                  onClick={() => onQuestionEdit?.(question)}
                  role="button"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell px-3 py-3">
                    <div className="truncate w-16">{question.id.slice(0, 4)}...</div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] px-3 py-3">
                    <div className="flex flex-col">
                      <span className="truncate text-sm sm:text-base">{question.question}</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 bg-muted/80 text-muted-foreground rounded-md text-[10px] sm:text-xs">
                          {question.category}
                        </span>
                        <div className="hidden xs:inline-flex">
                          {renderDifficultyBadge(question.difficulty)}
                        </div>
                        <div className="hidden sm:inline-flex">
                          {renderStatusBadge(question.status, 'sm')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-3 py-3">
                    <span className="px-2 py-0.5 bg-muted/80 text-muted-foreground rounded-md text-xs whitespace-nowrap">
                      {question.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-3 py-3">
                    {renderDifficultyBadge(question.difficulty)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-3 py-3">
                    {renderStatusBadge(question.status)}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 p-0 bg-muted/50 hover:bg-muted/80 transition-colors duration-200 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-48 p-1.5 bg-popover border border-border shadow-lg rounded-lg z-[100]"
                        sideOffset={8}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem 
                          className="flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleQuestionAction('edit', question);
                          }}
                        >
                          <FileEdit className="mr-2.5 h-4 w-4 text-muted-foreground" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        {question.status !== 'PUBLISHED' && (
                          <DropdownMenuItem 
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuestionAction('publish', question);
                            }}
                          >
                            <CheckCircle2 className="mr-2.5 h-4 w-4 text-emerald-500" />
                            <span>Terbitkan</span>
                          </DropdownMenuItem>
                        )}
                        {question.status !== 'ARCHIVED' && (
                          <DropdownMenuItem 
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuestionAction('archive', question);
                            }}
                          >
                            <Archive className="mr-2.5 h-4 w-4 text-amber-500" />
                            <span>Arsipkan</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-1 border-t border-gray-200" />
                        <DropdownMenuItem 
                          className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuestionToDelete(question);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2.5 h-4 w-4 text-red-500" />
                          <span>Hapus</span>
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
      </div>
    </div>
  );
}
