'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

// --- TypeScript Interface ---
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

// --- Custom Hook for user management ---
export function useUsers() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/users');
      setData(response.data.data || []);
    } catch (err: any) {
      console.error('[useUsers] Failed to fetch users:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat data pengguna';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: 'ADMIN' | 'USER') => {
    setUpdatingId(userId);
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update local state
      setData(prevData => 
        prevData.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast.success(`Berhasil mengubah role pengguna ke ${newRole}`);
      return true;
    } catch (err: any) {
      console.error(`[useUsers] Failed to update user role:`, err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui role pengguna';
      toast.error(errorMessage);
      return false;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { 
    data, 
    loading, 
    error, 
    updatingId,
    refetch: fetchUsers, 
    updateUserRole 
  };
}
