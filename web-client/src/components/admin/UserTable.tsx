'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await axios.get("/api/admin/analytics");
        setUsers(res.data.users || []);
      } catch (err: any) {
        setError("Gagal mengambil data pengguna");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="bg-zinc-800 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-cyan-400">Daftar Pengguna</h2>
        <button className="btn btn-primary bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">Tambah User</button>
      </div>
      {loading ? (
        <div className="text-center py-6">Memuat data...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-700 text-cyan-300">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Nama</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Created At</th>
                <th className="py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-700 hover:bg-zinc-900">
                  <td className="py-2 px-3">{user.id}</td>
                  <td className="py-2 px-3">{user.email}</td>
                  <td className="py-2 px-3">{user.name}</td>
                  <td className="py-2 px-3">{user.role}</td>
                  <td className="py-2 px-3">{new Date(user.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <button className="text-cyan-400 hover:underline mr-2">Edit</button>
                    <button className="text-red-400 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
