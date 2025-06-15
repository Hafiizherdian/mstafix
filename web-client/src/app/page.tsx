'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiOutlineLightningBolt, HiOutlineCollection, HiOutlineRefresh } from 'react-icons/hi'
import LandingHeader from '../components/LandingHeader' // New import
import LandingFooter from '../components/LandingFooter' // New import

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // This useEffect hook correctly handles redirection for authenticated users.
  // No changes needed here.
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const userDataString = localStorage.getItem('user')
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString)
              if (userData.role === 'ADMIN') {
                router.push('/admin')
              } else {
                router.push('/generate-soal')
              }
            } catch (parseError) {
              router.push('/generate-soal')
            }
          } else {
            router.push('/generate-soal')
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error memeriksa token:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <p className="ml-3 text-cyan-500">Memuat...</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#00778455,transparent)]"></div>
      </div>
      
      <LandingHeader />

      <main className="relative z-0">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center pt-40 pb-20 px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-white mb-6">
            Revolusi Ujian dengan <span className="text-cyan-400">Kecerdasan Buatan</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Buat, kelola, dan analisis bank soal secara efisien. Hemat waktu Anda dan tingkatkan kualitas evaluasi pendidikan dengan platform MSTA.
          </p>
          
          <div className="flex justify-center items-center space-x-4">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-cyan-500 text-black font-bold rounded-lg shadow-[0_0_20px_rgba(0,206,209,0.5)] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,206,209,0.7)] transition-all duration-300"
            >
              Mulai Sekarang
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-transparent border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:bg-zinc-900 hover:text-white transition-colors duration-300"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto py-20 px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Semua yang Anda Butuhkan</h2>
            <p className="text-lg text-zinc-400 mt-4">Fitur canggih untuk manajemen soal yang modern.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 transform hover:-translate-y-2 transition-transform duration-300 group hover:border-cyan-800/80 hover:shadow-2xl hover:shadow-cyan-900/20">
              <div className="h-12 w-12 bg-cyan-900/30 rounded-lg flex items-center justify-center mb-6 border border-cyan-800/50 group-hover:bg-cyan-900/50 transition-colors">
                <HiOutlineLightningBolt className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Generate Soal Cerdas</h3>
              <p className="text-zinc-400">
                Buat soal pilihan ganda dan esai secara otomatis dari materi Anda. AI kami memastikan relevansi dan variasi soal.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 transform hover:-translate-y-2 transition-transform duration-300 group hover:border-cyan-800/80 hover:shadow-2xl hover:shadow-cyan-900/20">
              <div className="h-12 w-12 bg-cyan-900/30 rounded-lg flex items-center justify-center mb-6 border border-cyan-800/50 group-hover:bg-cyan-900/50 transition-colors">
                <HiOutlineCollection className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Manajemen Bank Soal</h3>
              <p className="text-zinc-400">
                Organisir, edit, publikasi, dan arsipkan ribuan soal dengan mudah melalui antarmuka yang terstruktur dan intuitif.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 transform hover:-translate-y-2 transition-transform duration-300 group hover:border-cyan-800/80 hover:shadow-2xl hover:shadow-cyan-900/20">
              <div className="h-12 w-12 bg-cyan-900/30 rounded-lg flex items-center justify-center mb-6 border border-cyan-800/50 group-hover:bg-cyan-900/50 transition-colors">
                <HiOutlineRefresh className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Update Real-time</h3>
              <p className="text-zinc-400">
                Setiap perubahan pada soal akan langsung tersinkronisasi, memastikan semua pengguna melihat versi yang paling mutakhir.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
} 