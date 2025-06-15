'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { HiArrowLeft } from 'react-icons/hi'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.name, 
          email: formData.email, 
          password: formData.password 
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal')
      }
      toast.success('Registrasi berhasil! Silakan login.')
      router.push('/login')
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
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Daftar untuk mulai menggunakan platform AI kami.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Alamat Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} placeholder="nama@contoh.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Memproses...' : 'Daftar'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-300">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-cyan-400 hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
