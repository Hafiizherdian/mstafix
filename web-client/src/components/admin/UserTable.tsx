'use client'
import { Avatar } from '@/app/admin/components/ui/avatar';
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from 'sonner';
import { Pencil, Trash2, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  avatar?: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export default function UserTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}; // Handle server-side rendering
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    } as Record<string, string>;
  };

  const fetchUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/users", {
        headers: getAuthHeaders()
      });
      setUsers(res.data.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal memuat data pengguna';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Jika token tidak valid, arahkan ke halaman login
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = async (userId: string) => {
    if (!editData.role) {
      toast.error('Role tidak boleh kosong');
      return;
    }

    try {
      // Siapkan payload sesuai dengan yang diharapkan oleh backend
      const payload = { 
        userId,
        role: editData.role
      };

      console.log('Mengupdate role user dengan payload:', JSON.stringify(payload, null, 2));
      
      // Siapkan headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      // Jika mengubah ke ADMIN, tambahkan admin secret key ke header
      if (editData.role === 'ADMIN') {
        const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'rahasia-admin-msta-2024';
        headers['admin-secret-key'] = ADMIN_SECRET_KEY;
      }
      
      // Gunakan endpoint proxy yang sudah kita buat
      const response = await fetch('/api/auth/update-user-role', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response body:', responseText);
      
      if (!response.ok) {
        let errorMessage = `Gagal memperbarui role: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // Tambahkan detail error jika ada
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (e) {
          // Jika response bukan JSON, gunakan teks response sebagai pesan error
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
        console.log('Update role response:', result);
      } catch (e) {
        console.warn('Response bukan JSON yang valid:', responseText);
        result = { success: true, message: 'Role berhasil diperbarui' };
      }

      // Refresh daftar user
      await fetchUsers();
      setEditingId(null);
      setEditData({});
      
      toast.success(result.message || 'Role berhasil diperbarui');
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui role';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (userId: string) => {
    setIsDeleting(userId);
    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/admin/users/${userId}`, { headers });
      toast.success('Pengguna berhasil dihapus');
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.message || 'Gagal menghapus pengguna';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setShowDeleteConfirm(userId);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-300">Memuat data pengguna...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden shadow-lg shadow-zinc-900/30">
        <thead className="bg-zinc-800/80 backdrop-blur-sm">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-16">Avatar</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Nama</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Dibuat</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900/90 divide-y divide-zinc-800">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                Tidak ada data pengguna yang ditemukan.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors duration-300 ease-in-out">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white w-16">
                  <Avatar
                    name={user.name}
                    src={user.avatar}
                    className="h-10 w-10 text-lg border border-zinc-700/50 rounded-full shadow-md shadow-zinc-900/20"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  <span className={cn(
                    "px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full shadow shadow-zinc-900/30",
                    user.role === 'ADMIN' ? 'bg-cyan-900/70 text-cyan-300' : 'bg-zinc-800/70 text-zinc-200'
                  )}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Pengguna'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleEdit(user)} 
                      disabled={!!editingId}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600/80 hover:bg-cyan-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 ease-in-out"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </button>
                    {user.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleDeleteClick(user.id)}
                        disabled={!!editingId || isDeleting === user.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600/80 hover:bg-red-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 ease-in-out"
                      >
                        {isDeleting === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div className="relative bg-zinc-800/95 rounded-xl shadow-2xl shadow-zinc-900/40 max-w-md w-full mx-4 transform transition-all duration-300 ease-in-out scale-100 hover:scale-102">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-5 tracking-wide">Edit Pengguna</h3>
              <div className="mb-5">
                <label className="block text-zinc-300 text-sm font-medium mb-1.5">Nama</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500/60 bg-zinc-700/30 text-white shadow-inner shadow-zinc-900/20"
                  disabled={editingId === currentUser?.id}
                />
              </div>
              <div className="mb-5">
                <label className="block text-zinc-300 text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500/60 bg-zinc-700/30 text-white shadow-inner shadow-zinc-900/20"
                  disabled={editingId === currentUser?.id}
                />
              </div>
              <div className="mb-6">
                <label className="block text-zinc-300 text-sm font-medium mb-1.5">Role</label>
                <select
                  value={editData.role || ''}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="w-full px-3 py-2 border border-zinc-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500/60 bg-zinc-700/30 text-white shadow-inner shadow-zinc-900/20"
                  disabled={editingId === currentUser?.id}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="USER">Pengguna</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-zinc-700/60 rounded-lg shadow-sm text-sm font-medium text-zinc-300 bg-zinc-700/40 hover:bg-zinc-600/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 ease-in-out"
                  onClick={handleCancel}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600/80 hover:bg-green-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
                  onClick={() => handleSave(editingId)}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div className="relative bg-zinc-800/95 rounded-xl shadow-2xl shadow-zinc-900/40 max-w-md w-full mx-4 transform transition-all duration-300 ease-in-out scale-100 hover:scale-102">
            <div className="p-6">
              <div className="flex items-center mb-5 text-red-400">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold text-white tracking-wide">Konfirmasi Penghapusan</h3>
              </div>
              <p className="mb-6 text-zinc-300 leading-relaxed">Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-zinc-700/60 rounded-lg shadow-sm text-sm font-medium text-zinc-300 bg-zinc-700/40 hover:bg-zinc-600/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 ease-in-out"
                  onClick={handleDeleteCancel}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600/80 hover:bg-red-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ease-in-out"
                  onClick={() => handleDelete(showDeleteConfirm)}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
