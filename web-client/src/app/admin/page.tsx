'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Loader2, ServerCrash, RefreshCw } from 'lucide-react';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { RecentActivity } from './components/dashboard/RecentActivity';
import { QuestionsTable } from './components/questions/QuestionsTable';
import { useAnalytics } from './hooks/useAnalytics';

// Main Admin Dashboard Component
export default function AdminDashboardPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useAnalytics();

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Memuat Dashboard
          </h2>
          <p className="text-zinc-400">Menyiapkan data statistik Anda...</p>
        </div>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-4">
          <ServerCrash className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Gagal Memuat Data</h2>
        <p className="text-zinc-400 mb-6 max-w-md">
          Terjadi kesalahan saat menghubungi server. Pastikan koneksi internet Anda stabil dan coba lagi.
        </p>
        <Button
          onClick={refetch}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Muat Ulang
        </Button>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col space-y-1 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Dashboard Admin
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Ringkasan aktivitas dan statistik sistem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-1 sm:px-0">
        <DashboardStats data={data} loading={loading} error={error} refetch={refetch} />
      </div>

      {/* Recent Activity & Questions Table */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        

        <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <div className="flex sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">Soal Terbaru</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Daftar soal yang baru ditambahkan
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm"
                onClick={() => router.push('/admin/questions')}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              <QuestionsTable 
                questions={data?.questionStats?.recent || []} 
                loading={loading}
                onQuestionEdit={(question) => router.push(`/admin/questions/edit/${question.id}`)}
                onQuestionDelete={async () => false}
                onQuestionStatusChange={async () => {}}
                onFilterChange={() => {}}
                pagination={{
                  page: 1,
                  limit: 5,
                  total: data?.questionStats?.total || 0,
                  totalPages: 1,
                  hasNextPage: false,
                  hasPreviousPage: false,
                }}
                refetchQuestions={refetch}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
