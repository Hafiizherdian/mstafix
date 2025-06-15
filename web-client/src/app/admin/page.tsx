'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  HiOutlineUsers, 
  HiOutlineDocumentText, 
  HiOutlineChartBar, 
  HiOutlineBell, 
  HiOutlineCog, 
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi'

// Tipe data untuk statistik dasbor
interface DashboardStats {
  userCount: number
  questionCount: number
  userActivity: {
    date: string
    count: number
  }[]
  questionsByCategory: Record<string, number>
  questionsByDifficulty: Record<string, number>
  usersRegisteredByMonth: {
    month: string
    count: number
  }[]
  byRole: {
    admin: number
    user: number
  }
}

// Tipe data untuk user
interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await fetchDashboardData()
      await fetchUsers()
      setTimeout(() => setRefreshing(false), 500) // Tampilkan efek animasi minimal 500ms
    } catch (error) {
      console.error('Error refreshing data:', error)
      setRefreshing(false)
    }
  }

  // Ambil data dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      const data = await response.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setLoading(false)
    }
  }

  // Ambil data pengguna
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  useEffect(() => {
    // Pastikan user sudah login dan memiliki role ADMIN
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'ADMIN') {
      router.push('/generate-soal')
      return
    }

    fetchDashboardData()
    fetchUsers()
  }, [isAuthenticated, router, user])

  // Filter users berdasarkan pencarian dan role
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      // Filter berdasarkan query pencarian
      const matchesSearch = 
        !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter berdasarkan role
      const matchesRole = !roleFilter || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-14 w-14 animate-spin rounded-full border-t-3 border-b-3 border-blue-500 mx-auto"></div>
          <p className="text-lg text-white">Memuat data dashboard admin...</p>
          <p className="text-sm text-gray-400 mt-2">Mohon tunggu sebentar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 py-4 px-6 shadow-lg border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <HiOutlineCog className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={refreshData}
              className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
              title="Refresh data"
            >
              <HiOutlineRefresh className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <button className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <HiOutlineBell className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-700 rounded-full flex items-center justify-center">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 font-medium">{user?.name}</span>
            </div>
            <Link 
              href="/generate-soal" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Aplikasi
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto mt-6 px-6">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex items-center px-5 py-3 ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-px bg-gray-800 rounded-t-lg'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 hover:rounded-t-lg'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <HiOutlineChartBar className="mr-2 h-5 w-5" />
            Ringkasan
          </button>
          <button
            className={`flex items-center px-5 py-3 ${
              activeTab === 'users'
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-px bg-gray-800 rounded-t-lg'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 hover:rounded-t-lg'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <HiOutlineUsers className="mr-2 h-5 w-5" />
            Pengguna
          </button>
          <button
            className={`flex items-center px-5 py-3 ${
              activeTab === 'questions'
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-px bg-gray-800 rounded-t-lg'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 hover:rounded-t-lg'
            }`}
            onClick={() => setActiveTab('questions')}
          >
            <HiOutlineDocumentText className="mr-2 h-5 w-5" />
            Soal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto mt-6 px-6 pb-12">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-200">Total Pengguna</h3>
                  <p className="text-4xl font-bold text-blue-400">{stats?.userCount || 0}</p>
                  <p className="text-gray-400 mt-2 text-sm">Jumlah total pengguna terdaftar</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <HiOutlineUsers className="h-7 w-7 text-blue-400" />
                </div>
              </div>
              {stats?.byRole && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Admin:</span>
                    <span className="text-purple-400 font-medium">{stats.byRole.admin || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Pengguna:</span>
                    <span className="text-blue-400 font-medium">{stats.byRole.user || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Questions Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-200">Total Soal</h3>
                  <p className="text-4xl font-bold text-green-400">{stats?.questionCount || 0}</p>
                  <p className="text-gray-400 mt-2 text-sm">Jumlah soal yang telah dibuat</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <HiOutlineDocumentText className="h-7 w-7 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="grid grid-cols-3 gap-2">
                  {stats?.questionsByDifficulty && Object.entries(stats.questionsByDifficulty).map(([difficulty, count]) => {
                    const colors: Record<string, { bg: string, text: string }> = {
                      EASY: { bg: 'bg-green-500/20', text: 'text-green-400' },
                      MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
                      HARD: { bg: 'bg-red-500/20', text: 'text-red-400' },
                    };
                    const style = colors[difficulty] || { bg: 'bg-blue-500/20', text: 'text-blue-400' };
                    return (
                      <div key={difficulty} className={`${style.bg} rounded-lg p-2 text-center`}>
                        <p className="text-xs text-gray-300 uppercase">{difficulty.toLowerCase()}</p>
                        <p className={`text-base font-bold ${style.text}`}>{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* User Activity Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-200">Aktivitas Pengguna</h3>
                  <p className="text-4xl font-bold text-purple-400">
                    {stats?.userActivity?.reduce((sum, day) => sum + day.count, 0) || 0}
                  </p>
                  <p className="text-gray-400 mt-2 text-sm">Total aktivitas 7 hari terakhir</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <HiOutlineChartBar className="h-7 w-7 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 pt-2">
                <div className="flex h-10 items-end space-x-1">
                  {stats?.userActivity && [...stats.userActivity].reverse().map((day, index) => (
                    <div 
                      key={day.date} 
                      className="flex-1 bg-purple-500/50 hover:bg-purple-500/70 transition-all rounded-t-sm" 
                      style={{ height: `${Math.max(10, day.count * 10)}%` }}
                      title={`${new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long' })}: ${day.count} aktivitas`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>7 hari lalu</span>
                  <span>Hari ini</span>
                </div>
              </div>
            </div>
            
            {/* Questions by Category */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all md:col-span-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Soal berdasarkan Kategori</h3>
                <button className="text-gray-400 hover:text-white text-sm flex items-center">
                  <HiOutlineDownload className="h-4 w-4 mr-1" />
                  Ekspor
                </button>
              </div>
              {stats?.questionsByCategory && Object.keys(stats.questionsByCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.questionsByCategory).map(([category, count], index) => {
                    // Generate a different color for each category based on index
                    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={category} className="flex items-center">
                        <span className="w-1/3 text-gray-300 capitalize">{category}</span>
                        <div className="w-2/3">
                          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color}`} 
                              style={{ 
                                width: `${Math.min(count / (stats.questionCount || 1) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-400">{count} soal</span>
                            <span className="text-sm font-medium text-white">
                              {Math.round(count / (stats.questionCount || 1) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <HiOutlineDocumentText className="h-12 w-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">Belum ada data kategori soal</p>
                  <p className="text-gray-500 text-sm mt-1">Data akan muncul saat soal mulai dibuat</p>
                </div>
              )}
            </div>

            {/* Registration Trend */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Tren Pendaftaran</h3>
                <div className="text-xs bg-gray-700 rounded-full px-2 py-1 text-gray-300">6 bulan terakhir</div>
              </div>
              {stats?.usersRegisteredByMonth && stats.usersRegisteredByMonth.length > 0 ? (
                <div className="space-y-3">
                  {stats.usersRegisteredByMonth.map((item, index) => (
                    <div key={item.month} className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {index === 0 ? '🔥' : (item.month.charAt(0) || '📅')}
                        </div>
                        <span className="text-gray-300 ml-3">{item.month}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-white">{item.count}</span>
                        <span className="text-xs text-gray-400 ml-1">pengguna</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <HiOutlineUsers className="h-12 w-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">Belum ada data pendaftaran</p>
                  <p className="text-gray-500 text-sm mt-1">Data akan muncul saat pengguna mendaftar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
              <div className="p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Daftar Pengguna</h3>
                <div className="flex space-x-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari pengguna..." 
                      className="bg-gray-700/50 text-gray-200 rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <HiOutlineSearch className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <div className="relative">
                    <select 
                      className="bg-gray-700/50 text-gray-200 rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">Semua Role</option>
                      <option value="ADMIN">Admin</option>
                      <option value="USER">Pengguna</option>
                    </select>
                    <HiOutlineChevronDown className="h-5 w-5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900/50 border-t border-b border-gray-700">
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Terdaftar</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-6 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{user.name || 'Tidak Diketahui'}</div>
                                <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-900/30 text-purple-400' 
                                : 'bg-blue-900/30 text-blue-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400">
                              Aktif
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button className="text-gray-400 hover:text-white p-1" title="Edit pengguna">
                                <HiOutlinePencil className="h-4 w-4" />
                              </button>
                              <button className="text-gray-400 hover:text-white p-1" title="Detail pengguna">
                                <HiOutlineEye className="h-4 w-4" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 p-1" title="Hapus pengguna">
                                <HiOutlineTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <HiOutlineUsers className="h-12 w-12 text-gray-600 mb-3" />
                            {searchQuery || roleFilter ? (
                              <>
                                <p className="text-gray-400">Tidak ada pengguna ditemukan</p>
                                <p className="text-gray-500 text-sm mt-1">Coba ubah filter pencarian</p>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-400">Belum ada pengguna</p>
                                <p className="text-gray-500 text-sm mt-1">Pengguna akan muncul saat mendaftar</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-900/30 px-6 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Menampilkan <span className="font-medium text-white">{filteredUsers.length}</span> dari <span className="font-medium text-white">{users.length}</span> pengguna
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      Sebelumnya
                    </button>
                    <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                      1
                    </button>
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
              <div className="p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Kelola Soal</h3>
                <div className="flex space-x-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari soal..." 
                      className="bg-gray-700/50 text-gray-200 rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <HiOutlineSearch className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <button className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                    <HiOutlinePlus className="h-5 w-5 mr-2" />
                    Buat Soal
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-0">
                {/* Filter Panel */}
                <div className="md:col-span-1">
                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
                    <h4 className="text-lg font-medium text-white mb-4">Filter</h4>
                    
                    <div className="space-y-5">
                      {/* Filter by Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Kategori</label>
                        <div className="relative">
                          <select className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-3 pr-8 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                            <option value="">Semua Kategori</option>
                            <option value="programming">Programming</option>
                            <option value="database">Database</option>
                            <option value="networking">Networking</option>
                            <option value="algorithms">Algorithms</option>
                          </select>
                          <HiOutlineChevronDown className="h-5 w-5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                        </div>
                      </div>
                      
                      {/* Filter by Difficulty */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tingkat Kesulitan</label>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">
                            Semua
                          </button>
                          <button className="px-3 py-1 rounded-full bg-green-900/30 text-green-400 hover:bg-green-900/50 text-sm">
                            Mudah
                          </button>
                          <button className="px-3 py-1 rounded-full bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 text-sm">
                            Sedang
                          </button>
                          <button className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 hover:bg-red-900/50 text-sm">
                            Sulit
                          </button>
                        </div>
                      </div>
                      
                      {/* Filter by Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="active" className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500/50" />
                            <label htmlFor="active" className="ml-2 text-sm text-gray-300">Aktif</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="draft" className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500/50" />
                            <label htmlFor="draft" className="ml-2 text-sm text-gray-300">Draft</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="archived" className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500/50" />
                            <label htmlFor="archived" className="ml-2 text-sm text-gray-300">Diarsipkan</label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Apply Filters Button */}
                      <div className="pt-2">
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors">
                          Terapkan Filter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Questions List */}
                <div className="md:col-span-2">
                  {/* Question Cards */}
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-medium text-white">Bagaimana cara mengoptimalkan kueri SQL?</h4>
                          <div className="flex space-x-1">
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400">
                              Sedang
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-gray-400 text-sm">
                          <p>Jelaskan tiga cara untuk mengoptimalkan kueri SQL yang lambat pada database skala besar...</p>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 text-xs rounded-lg bg-blue-900/30 text-blue-400">
                              Database
                            </span>
                            <span className="text-gray-400 text-xs">
                              ID: ABC123
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-gray-400 hover:text-white p-1" title="Edit soal">
                              <HiOutlinePencil className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-white p-1" title="Preview soal">
                              <HiOutlineEye className="h-4 w-4" />
                            </button>
                            <button className="text-red-400 hover:text-red-300 p-1" title="Hapus soal">
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      <HiOutlineChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                      1
                    </button>
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      2
                    </button>
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      3
                    </button>
                    <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                      <HiOutlineChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 