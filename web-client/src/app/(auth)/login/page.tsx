'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { HiArrowLeft } from 'react-icons/hi'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal')
      }

      const token = data.token || data.accessToken;
      if (!token || !data.user) {
        throw new Error('Respons tidak valid dari server')
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      toast.success(`Login berhasil, ${data.user.name}!`);
      
      router.refresh();
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const redirectPath = data.user.role === 'ADMIN' ? '/admin' : '/generate-soal';
      window.location.href = redirectPath;

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-cyan-900/20 p-8">
      <Link href="/" className="absolute top-4 left-4 text-zinc-400 hover:text-white transition-colors" aria-label="Kembali ke beranda">
        <HiArrowLeft className="h-6 w-6" />
      </Link>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Selamat Datang Kembali
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Masuk untuk melanjutkan ke akun Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-gray-300">Alamat Email</Label>
          <Input 
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="nama@contoh.com"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className="text-gray-300">Password</Label>
          <Input 
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-300">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-cyan-400 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </div>
  )
}
