// Reworked Admin Dashboard - Refactored to use AdminLayout
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users, HelpCircle, GitBranch, Loader2, ServerCrash } from 'lucide-react';

// --- TypeScript Interfaces ---
interface User { id: string; name: string; email: string; createdAt: string; }
interface Question { id: string; question: string; category: string; }
interface AnalyticsData {
  userStats: { overview: { total: number }; recent: User[]; };
  questionStats: { total: number; recent: Question[]; };
  generationStats: { total: number; };
}

// --- API Configuration ---
const API_ANALYTICS_URL = '/api/admin/analytics';
const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

// --- Data Fetching ---
async function getAnalytics(): Promise<AnalyticsData | null> {
  try {
    const response = await axios.get(API_ANALYTICS_URL, { headers: { Authorization: `Bearer ${hardcodedToken}` } });
    return response.data;
  } catch (error) {
    console.error('[getAnalytics] Failed to fetch analytics:', error);
    return null;
  }
}

// --- Main Component ---
export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAnalytics().then(analyticsData => {
      if (analyticsData) {
        setData(analyticsData);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, []);

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <span className="ml-4 text-xl">Memuat Data Dashboard...</span>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Gagal Memuat Data</h2>
        <p className="text-zinc-400">Terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.</p>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Dashboard Admin</h1>
      
      {/* Grid untuk Statistik Utama */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.userStats?.overview?.total ?? 0}</div>
            <p className="text-xs text-zinc-400">Jumlah pengguna terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Soal di Bank</CardTitle>
            <HelpCircle className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.questionStats?.total ?? 0}</div>
            <p className="text-xs text-zinc-400">Jumlah soal di manage-soal-service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soal Hasil Generate</CardTitle>
            <GitBranch className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.generationStats?.total ?? 0}</div>
            <p className="text-xs text-zinc-400">Jumlah paket soal digenerate</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid untuk Daftar Terbaru */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Kartu Pengguna Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle>Pengguna Baru</CardTitle>
            <CardDescription>5 pengguna terakhir yang mendaftar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.userStats?.recent && data.userStats.recent.length > 0 ? (
                data.userStats.recent.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Tidak ada pengguna baru.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kartu Soal Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle>Soal Terbaru di Bank Soal</CardTitle>
            <CardDescription>5 soal terakhir yang ditambahkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.questionStats?.recent && data.questionStats.recent.length > 0 ? (
                data.questionStats.recent.map((question) => (
                  <div key={question.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none truncate w-60">{question.question}</p>
                      <p className="text-sm text-zinc-500">Kategori: {question.category}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Tidak ada soal baru.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
