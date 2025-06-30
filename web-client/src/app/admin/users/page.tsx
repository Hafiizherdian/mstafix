'use client';

import React from 'react';
import { Loader2, ServerCrash } from 'lucide-react';
import { useUsers } from './hooks/useUsers';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';

// Dynamically import UserTable with no SSR to avoid hydration issues
const UserTable = dynamic<{}>(
  () => import('@/components/admin/UserTable').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center p-4"><Loader2 className="animate-spin h-8 w-8" /></div>
  }
);

// --- Main Component ---
export default function AdminUsersPage() {
  const { 
    data: users, 
    loading, 
    error, 
    refetch
  } = useUsers();

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <span className="ml-4 text-xl">Memuat Data Pengguna...</span>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh]">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Gagal Memuat Pengguna</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Button onClick={refetch}>Coba Lagi</Button>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Kelola Pengguna</h1>
          <p className="text-zinc-400 mt-1">
            Lihat dan kelola data pengguna terdaftar.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <UserTable />
    </div>
  );
}

