// Reworked User Management Page - Refactored to use AdminLayout
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, ServerCrash, User, Users } from 'lucide-react';

// --- TypeScript Interface ---
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

// --- API Configuration ---
const API_USERS_URL = '/api/admin/users';
const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

// --- Data Fetching Function ---
async function getUsers(): Promise<UserData[] | null> {
  try {
    const response = await axios.get(API_USERS_URL, {
      headers: { Authorization: `Bearer ${hardcodedToken}` },
    });
    // The API is expected to return an object like { users: [...] }
    return response.data.users;
  } catch (error) {
    console.error('[getUsers] Failed to fetch users:', error);
    return null;
  }
}

// --- Main Component ---
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getUsers().then(data => {
      if (data) {
        setUsers(data);
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
        <span className="ml-4 text-xl">Memuat Data Pengguna...</span>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Gagal Memuat Pengguna</h2>
        <p className="text-zinc-400">Terjadi kesalahan saat mengambil data dari server.</p>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Kelola Pengguna</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Daftar Pengguna Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-zinc-700 rounded-full mr-4">
                      <User className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-cyan-500 text-zinc-900' : 'bg-zinc-600 text-white'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-sm text-zinc-500">
                      Dibuat: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500">Tidak ada pengguna untuk ditampilkan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
