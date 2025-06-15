'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { HiOutlineUser, HiOutlineKey, HiOutlineCog } from 'react-icons/hi'
import Link from 'next/link'

export default function AdminUtils() {
  const [formData, setFormData] = useState({
    email: '',
    role: 'ADMIN',
    secretKey: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah role pengguna')
      }

      toast.success(`Role pengguna ${formData.email} berhasil diubah menjadi ${formData.role}`)
      
      // Reset form
      setFormData({
        email: '',
        role: 'ADMIN',
        secretKey: ''
      })
    } catch (error) {
      console.error('Update role error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah role pengguna')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo dan Header */}
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <HiOutlineCog className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Utilitas Admin</h2>
          <p className="mt-2 text-zinc-400">
            Ubah role pengguna untuk mengonfigurasi akses sistem
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-lg bg-zinc-900/70 p-6 shadow-md border border-zinc-800">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email Pengguna
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg 
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="email@pengguna.com"
                />
              </div>
            </div>
            
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-300">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-3 border border-zinc-800 rounded-lg 
                  bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </div>
            
            {/* Secret Key */}
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-zinc-300">
                Kunci Rahasia
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineKey className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="secretKey"
                  type="password"
                  required
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg 
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Kunci rahasia untuk admin"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">Masukkan kunci rahasia admin (default: rahasia-admin-msta-2024)</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Ubah Role Pengguna'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-400">
              <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300">
                Kembali ke login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 