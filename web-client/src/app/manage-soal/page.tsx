'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { HiOutlinePencil, HiOutlineTrash, HiOutlineFilter, HiOutlineSearch, HiOutlineCheck, HiOutlineX, HiOutlineDocumentText, HiOutlineArrowRight } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  answer: string
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  }
  explanation: string
  difficulty: string
  category: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  type: 'MCQ' | 'ESSAY'
  createdAt: string
}

interface QuestionGroup {
  category: string
  createdAt: string
  questions: Question[]
}

export default function ManageSoal() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [groups, setGroups] = useState<QuestionGroup[]>([])
  const [filteredGroups, setFilteredGroups] = useState<QuestionGroup[]>([])

  // Check authentication
  useEffect(() => {
    const authToken = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
    
    if (!authToken) {
      // Not authenticated, redirect to login
      toast.error('Silakan login terlebih dahulu');
      router.push('/login');
    } else {
      // Fetch questions if authenticated
      fetchQuestions();
    }
  }, [router]);

  // Apply filters and search whenever filter criteria change
  useEffect(() => {
    // Apply filters to the groups
    let filtered = [...groups];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map(group => {
        // Create a new group with only questions that match the search query
        return {
          ...group,
          questions: group.questions.filter(q => 
            q.category.toLowerCase().includes(query) || 
            q.question.toLowerCase().includes(query)
          )
        };
      }).filter(group => group.questions.length > 0); // Remove empty groups
    }
    
    // Apply type filter
    if (selectedType) {
      filtered = filtered.map(group => {
        return {
          ...group,
          questions: group.questions.filter(q => q.type === selectedType)
        };
      }).filter(group => group.questions.length > 0);
    }
    
    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.map(group => {
        return {
          ...group,
          questions: group.questions.filter(q => q.difficulty === selectedDifficulty)
        };
      }).filter(group => group.questions.length > 0);
    }
    
    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.map(group => {
        return {
          ...group,
          questions: group.questions.filter(q => q.status === selectedStatus)
        };
      }).filter(group => group.questions.length > 0);
    }
    
    setFilteredGroups(filtered);
  }, [groups, searchQuery, selectedType, selectedDifficulty, selectedStatus]);

  // Fetch questions from the API
  const fetchQuestions = async () => {
    try {
      setLoading(true)
      
      // Verifikasi autentikasi terlebih dahulu
      try {
        const authResponse = await fetch('/api/auth/verify', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!authResponse.ok) {
          console.error('Auth verification failed, status:', authResponse.status);
          toast.error('Sesi Anda tidak valid. Silakan login kembali.');
          router.push('/login');
          return;
        }
      } catch (authError) {
        console.error('Auth verification request error:', authError);
        toast.error('Gagal memverifikasi sesi. Silakan coba lagi.');
        router.push('/login');
        return;
      }

      // Tambahkan timestamp untuk mencegah cache
      const timestamp = new Date().getTime();
      
      // Get auth token dan user data dari localStorage
      const authToken = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      
      if (!authToken || !userId) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        router.push('/login');
        return;
      }
      
      console.log('[DEBUG] Token untuk fetch soal:', authToken ? 'Ada (masked)' : 'Tidak ada');
      console.log('[DEBUG] User ID untuk fetch soal:', userId);
      
      // Tambahkan createdBy ke URL untuk filter soal milik user saat ini
            const uniqueUrl = `/api/v1/manage-soal/questions?createdBy=${encodeURIComponent(userId)}&_t=${timestamp}`;
      
      const response = await fetch(uniqueUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Authorization': `Bearer ${authToken}`,
          'X-User-ID': userId, // Tambahkan header dengan user ID
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.status === 401) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ERROR] Gagal fetch questions, status:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch questions');
      }
      
      // Parse response
      const data = await response.json();
      console.log('Received questions data, count:', Array.isArray(data) ? data.length : 'N/A');

      // Normalize data structure
      const questions = (Array.isArray(data) ? data : (data.items || [])) as Question[];
      
      // Deduplikasi berdasarkan ID
      const questionMap = new Map<string, Question>();
      questions.forEach(question => {
        if (!questionMap.has(question.id)) {
          questionMap.set(question.id, question);
        }
      });
      
      // Convert kembali ke array
      const uniqueQuestions = Array.from(questionMap.values());
      console.log('After deduplication, count:', uniqueQuestions.length);
      
      // Group questions by category and batch (createdAt)
      const groups = groupQuestions(uniqueQuestions);
      setGroups(groups);
      setFilteredGroups(groups); // Set initial filtered groups
    } catch (error) {
      console.error('[ERROR] Error fetching questions:', error)
      toast.error('Gagal mengambil data soal')
    } finally {
      setLoading(false)
    }
  }

  const groupQuestions = (questions: Question[]): QuestionGroup[] => {
    const groups: { [key: string]: Question[] } = {}
    
    questions.forEach(question => {
      // Buat key unik berdasarkan kategori dan timestamp (dibulatkan ke menit terdekat)
      const date = new Date(question.createdAt)
      const timeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`
      const groupKey = `${question.category.toLowerCase()}_${timeKey}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(question)
    })

    // Konversi ke array dan urutkan berdasarkan waktu terbaru
    return Object.entries(groups).map(([key, questions]) => {
      const [category] = key.split('_')
      return {
        category,
        createdAt: questions[0].createdAt,
        questions: questions
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return
    try {
      // Get auth token dan user data dari localStorage
      const authToken = localStorage.getItem('authToken')
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = userData.id
      
      if (!authToken || !userId) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
        router.push('/login')
        return
      }
      
      console.log('[INFO] Menghapus soal dengan ID:', id)
      
            const response = await fetch(`/api/v1/manage-soal/${id}?ownerId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-User-ID': userId,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        if (response.status === 403) {
          toast.error('Anda tidak memiliki izin untuk menghapus soal ini.');
          return;
        }
        
        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        console.error('[ERROR] Gagal menghapus soal:', errorData);
        throw new Error(errorData.error || 'Gagal menghapus soal');
      }
      
      // Refresh data after successful deletion
      fetchQuestions();
      toast.success('Soal berhasil dihapus')
    } catch (error) {
      console.error('[ERROR] Error deleting question:', error)
      toast.error('Gagal menghapus soal')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      // Get auth token dan user data dari localStorage
      const authToken = localStorage.getItem('authToken')
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = userData.id
      
      if (!authToken || !userId) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
        router.push('/login')
        return
      }
      
      console.log(`[INFO] Mengubah status soal ${id} menjadi ${status}`)
      
      const response = await fetch(`/api/manage-soal/${id}/status?ownerId=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-User-ID': userId,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        if (response.status === 403) {
          toast.error('Anda tidak memiliki izin untuk mengubah status soal ini.');
          return;
        }
        
        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        console.error('[ERROR] Gagal mengubah status soal:', errorData);
        throw new Error(errorData.error || 'Gagal mengubah status soal');
      }
      
      // Refresh data after successful update
      fetchQuestions()
      toast.success(`Status soal berhasil diubah menjadi ${status}`)
    } catch (error) {
      console.error('[ERROR] Error changing question status:', error)
      toast.error('Gagal mengubah status soal')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-800 text-amber-400 border-zinc-700'
      case 'PUBLISHED': return 'bg-zinc-800 text-green-400 border-zinc-700'
      case 'ARCHIVED': return 'bg-zinc-800 text-zinc-400 border-zinc-700'
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-zinc-800 text-green-400 border-zinc-700'
      case 'MEDIUM': return 'bg-zinc-800 text-amber-400 border-zinc-700'
      case 'HARD': return 'bg-zinc-800 text-red-400 border-zinc-700'
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-zinc-900 w-full transition-all duration-300">
          <div className="flex-1 flex flex-col overflow-hidden justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-b-transparent border-cyan-500 animate-pulse-shadow"></div>
            <p className="mt-4 text-cyan-400 font-medium">Memuat data soal...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-zinc-900 w-full transition-all duration-300">
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kelola Soal</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Atur, filter, dan kelola semua soal Anda di satu tempat.</p>
          </header>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative flex-grow max-w-md">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
              <input 
                type="text"
                placeholder="Cari berdasarkan kategori atau pertanyaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <HiOutlineFilter className="w-5 h-5" />
              <span>Filter</span>
              {(selectedType || selectedDifficulty || selectedStatus) && (
                <span className="ml-1.5 flex items-center justify-center w-5 h-5 text-xs bg-cyan-500 text-white rounded-full">
                  {(selectedType ? 1 : 0) + (selectedDifficulty ? 1 : 0) + (selectedStatus ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mb-6 p-5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Tipe Soal</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Semua Tipe</option>
                  <option value="MCQ">Pilihan Ganda</option>
                  <option value="ESSAY">Essay</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Tingkat Kesulitan</label>
                <select 
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Semua Kesulitan</option>
                  <option value="EASY">Mudah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HARD">Sulit</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Status</label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          )}

          {/* Question Groups */}
          {filteredGroups.length === 0 ? (
            <div className="mt-16 text-center p-10 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60">
              <HiOutlineDocumentText className="mx-auto h-16 w-16 text-zinc-700 dark:text-zinc-400 mb-4" />
              <h3 className="text-zinc-400 dark:text-zinc-500 text-xl font-medium mb-3">Tidak ada soal yang ditemukan</h3>
              <p className="text-zinc-600 dark:text-zinc-500 max-w-md mx-auto">Coba buat soal baru terlebih dahulu atau ubah filter pencarian Anda</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/50 rounded-2xl shadow-lg overflow-hidden">
                  {/* Group Header */}
                  <div className="p-5 bg-slate-100 dark:bg-gradient-to-r dark:from-zinc-800/80 dark:to-zinc-900/90 border-b border-slate-200 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <span className="w-2 h-10 bg-cyan-500 rounded-full mr-3 hidden sm:block"></span>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{group.category}</h2>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">{new Date(group.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 shadow-sm">
                        {group.questions.length} soal
                      </span>
                      {group.questions.length > 0 && (
                        <>
                          <Link
                            href={`/manage-soal/edit/${group.questions[0].id}`}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-cyan-500/30 dark:border-cyan-900/20 bg-cyan-500/10 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-900/30 focus:ring-2 focus:ring-cyan-500/40 dark:focus:ring-cyan-900/40 transition-all"
                          >
                            <HiOutlinePencil className="inline-block h-3.5 w-3.5 mr-1" />
                            Edit Soal
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Questions List - Showing only first 2 questions */}
                  <div className="p-4 divide-y divide-zinc-800/50">
                    {group.questions.slice(0, 2).map((question, questionIndex) => (
                      <div key={question.id} className="py-5 border-b border-slate-200 dark:border-zinc-700/50 last:border-b-0">
                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-start mb-3.5">
                          <div className="flex-1">
                            <div className="mb-2.5 font-medium text-slate-900 dark:text-white">
                              {questionIndex + 1}. {question.question}
                            </div>
                            {question.type === 'MCQ' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm my-2 text-zinc-400 dark:text-zinc-500">
                                {Object.entries(question.options).map(([key, value]) => (
                                  <div key={key} className="flex items-start">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5 
                                      ${key === question.answer ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700'}`}>
                                      {key}
                                    </span>
                                    <span className={key === question.answer ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-zinc-300'}>{value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm p-3 my-2.5 bg-slate-100 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/50 rounded-lg text-zinc-400 dark:text-zinc-500">
                                <p className="font-medium text-zinc-300 dark:text-zinc-400 mb-1">Jawaban:</p>
                                {question.answer}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(question.status)}`}>
                              {question.status === 'DRAFT' ? 'Draft' : question.status === 'PUBLISHED' ? 'Published' : 'Archived'}
                            </span>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty === 'EASY' ? 'Mudah' : question.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Link
                            href={`/manage-soal/edit/${question.id}`}
                            className="px-3 py-1.5 text-xs rounded-lg border border-cyan-500/30 dark:border-cyan-900/20 bg-cyan-500/10 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-900/30 focus:ring-2 focus:ring-cyan-500/40 dark:focus:ring-cyan-900/40 transition-all"
                          >
                            <HiOutlinePencil className="inline-block h-3.5 w-3.5 mr-1" />
                            Edit
                          </Link>
                            <button
                              onClick={() => handleDelete(question.id)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 dark:border-red-900/20 bg-red-500/10 dark:bg-red-900/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-900/30 focus:ring-2 focus:ring-red-500/40 dark:focus:ring-red-900/40 transition-all"
                            >
                            <HiOutlineTrash className="inline-block h-3.5 w-3.5 mr-1" />
                            Hapus
                            </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show "View All in Editor" button if there are more than 2 questions */}
                    {group.questions.length > 2 && (
                      <div className="pt-4 pb-2 text-center">
                        <Link 
                          href={`/manage-soal/edit/${group.questions[0].id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700/60 hover:bg-slate-300 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          <span>Lihat Semua Soal di Editor</span>
                          <HiOutlineArrowRight className="h-4 w-4" />
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">{group.questions.length - 2} soal lainnya tidak ditampilkan</p>
                    </div>
                  )}
                  </div>
                </div>
              ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}