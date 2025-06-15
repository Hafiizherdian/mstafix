'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineLightningBolt } from 'react-icons/hi'
import { api } from '@/utils/api'

export default function Register() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/api/auth/register', formData, { skipAuth: true })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal')
      }

      // Store user data (non-sensitive) in localStorage
      localStorage.setItem('user', JSON.stringify(data.user))

      toast.success('Registrasi berhasil')
      router.push('/generate-soal')
    } catch (error) {
      console.error('Register error:', error)
      toast.error(error instanceof Error ? error.message : 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo dan Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-10 w-10 bg-cyan-500 rounded-lg flex items-center justify-center">
            <HiOutlineLightningBolt className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">MSTA</h1>
          </div>
          <h2 className="text-3xl font-bold text-white">Buat Akun Baru</h2>
          <p className="mt-2 text-zinc-400">
            Daftar untuk mulai menggunakan Sistem Soal AI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Nama */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Nama Lengkap
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg 
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg 
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg 
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Masukkan password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                shadow-sm text-sm font-medium text-black bg-cyan-500 hover:bg-cyan-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-cyan-500 hover:text-cyan-400">
                Login di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}