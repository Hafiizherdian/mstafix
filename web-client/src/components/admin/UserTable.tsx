'use client'
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from 'sonner';
import { Pencil, Trash2, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
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

  const handleDelete = async (userId: string) => {
    if (showDeleteConfirm !== userId) {
      setShowDeleteConfirm(userId);
      return;
    }

    setIsDeleting(userId);
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: getAuthHeaders()
      });
      await fetchUsers();
      toast.success('Pengguna berhasil dihapus');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus pengguna';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Manajemen Pengguna</h2>
          <p className="text-zinc-400 mt-1">Kelola data dan peran pengguna</p>
        </div>
        <button 
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => {}}
        >
          Tambah Pengguna
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-zinc-800 rounded-lg">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Nama</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Bergabung</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900/50 divide-y divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editData.name || ''}
                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full"
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {editingId === user.id ? (
                          <input
                            type="email"
                            value={editData.email || ''}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingId === user.id ? (
                          <select
                            value={editData.role}
                            onChange={(e) => setEditData({...editData, role: e.target.value as 'ADMIN' | 'USER'})}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' 
                              ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' 
                              : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {editingId === user.id ? (
                            <>
                              <button
                                onClick={() => handleSave(user.id)}
                                className="text-green-400 hover:text-green-300 p-1.5 rounded-full hover:bg-green-900/20"
                                disabled={!editData.name || !editData.email}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-zinc-400 hover:text-zinc-300 p-1.5 rounded-full hover:bg-zinc-700/50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(user)}
                                className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-full hover:bg-cyan-900/20"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded-full hover:bg-red-900/20"
                                disabled={isDeleting === user.id}
                              >
                                {isDeleting === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : showDeleteConfirm === user.id ? (
                                  <span className="flex items-center gap-1 text-xs">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Yakin?
                                  </span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
