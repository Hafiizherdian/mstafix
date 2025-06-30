'use client';

import React, { useCallback, useState } from 'react';
import { Loader2, Plus, ServerCrash } from 'lucide-react';
import { QuestionsTable, QuestionType } from '../components/questions/QuestionsTable';
import { useQuestions } from '../hooks/useQuestions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'ALL',
    difficulty: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    page: 1,
    limit: 10,
  });

  const { 
    data: questions, 
    loading, 
    error, 
    pagination, 
    refetch 
  } = useQuestions({
    ...filters,
    status: filters.status === 'ALL' ? undefined : filters.status,
    difficulty: filters.difficulty === 'ALL' ? undefined : filters.difficulty,
  });

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);  

  const handleQuestionEdit = useCallback((question: QuestionType) => {
    router.push(`/admin/questions/${question.id}`);
  }, [router]);

  const handleQuestionDelete = useCallback(async (id: string) => {
    // TODO: Implement actual API call
    console.log(`Request to delete question ${id}`);
    toast.success('Soal berhasil dihapus (simulasi)');
    await refetch();
    return true;
  }, [refetch]);

  const handleQuestionStatusChange = useCallback(async (id: string, status: QuestionType['status']) => {
    // TODO: Implement actual API call
    console.log(`Request to change status of ${id} to ${status}`);
    toast.success(`Status soal berhasil diubah menjadi ${status} (simulasi)`);
    await refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <span className="ml-4 text-xl">Memuat Data Soal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh]">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Gagal Memuat Soal</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Button onClick={refetch}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-white">Bank Soal</h1>
          <p className="text-zinc-400 mt-2">
            Kelola dan pantau semua soal yang tersedia dalam sistem.
          </p>
        </div>
        <Button onClick={() => router.push('/admin/questions/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Soal Baru
        </Button>
      </div>

      {/* Questions Table Container */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <QuestionsTable
          questions={questions as QuestionType[]}
          loading={loading}
          error={null} // Error is handled globally above
          onQuestionEdit={handleQuestionEdit}
          onQuestionDelete={handleQuestionDelete}
          onQuestionStatusChange={handleQuestionStatusChange}
          onFilterChange={handleFilterChange}
          pagination={pagination}
          refetchQuestions={refetch}
        />
      </div>
    </div>
  );
}
