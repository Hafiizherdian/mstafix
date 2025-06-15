'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { toast } from 'react-hot-toast'
import { 
  HiOutlineLightningBolt, 
  HiOutlineAcademicCap, 
  HiOutlineQuestionMarkCircle, 
  HiOutlineDocumentText, 
  HiMinus, 
  HiPlus, 
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineSave
} from 'react-icons/hi'
import FileUpload from '@/components/FileUpload'

interface GenerateResult {
  question: string;
  options?: Record<string, string>;
  answer: string;
  explanation: string;
}

export default function GenerateSoal() {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [questionType, setQuestionType] = useState('MCQ')
  const [questionCount, setQuestionCount] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<GenerateResult[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Periksa auth saat komponen dimuat
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Memeriksa autentikasi di halaman generate-soal')
        
        // Coba mendapatkan token dari localStorage
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          console.log('Token tidak ditemukan di localStorage, redirect ke login')
          router.push('/login')
          return
        }
        
        console.log('Token ditemukan di localStorage, panjang:', token.length)
        
        // Karena middleware sudah memeriksa token di cookie, kita bisa skip validasi
        // tambahan jika kita yakin middleware berfungsi dengan baik
        // Namun tetap jalankan validasi untuk keamanan
        try {
          const response = await fetch('/api/auth/validate', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          const data = await response.json()
          
          if (response.ok && data.valid) {
            console.log('Token berhasil divalidasi')
          } else if (data.warning) {
            console.warn('Peringatan validasi:', data.warning)
          }
        } catch (validationError) {
          // Jika validasi gagal (misalnya server down), tetap lanjutkan
          console.warn('Validasi token gagal, tetapi tetap melanjutkan:', validationError)
        }
        
        // Lanjutkan loading halaman
        setIsLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  const handleGenerate = async () => {
    // Validate input - make sure only one source is selected
    if (category && selectedFile) {
      toast.error('Harap pilih salah satu: file atau kategori')
      return
    }
    if (!category && !selectedFile) {
      toast.error('Mohon isi kategori soal atau upload file')
      return
    }

    // Tambahan validasi ukuran file
    if (selectedFile && selectedFile.size > 8 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 8MB')
      return
    }

    setGenerating(true)
    try {
      const formData = new FormData()
      formData.append('difficulty', difficulty)
      formData.append('questionType', questionType)
      formData.append('questionCount', questionCount.toString())
      
      if (selectedFile) {
        formData.append('file', selectedFile)
        toast.loading(`Sedang memproses file ${selectedFile.name}...`, { 
          id: 'file-processing',
          // Kurangi durasi toast untuk file besar (2 menit max)
          duration: selectedFile.size > 300000 ? 2 * 60 * 1000 : 60000 
        })
      } else {
        formData.append('category', category)
      }

      // Set timeout lebih singkat untuk fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5 * 60 * 1000); // 5 menit timeout

      const response = await fetch('/api/generate-soal', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
        toast.dismiss('file-processing');
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle different error status codes
        if (response.status === 401) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          // Optional: redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (response.status === 408 || response.status === 504) {
          toast.error('Permintaan timeout. File terlalu besar atau format tidak didukung.');
        } else if (response.status === 413) {
          toast.error('Ukuran file terlalu besar. Maksimal 8MB.');
        } else if (response.status === 415) {
          toast.error('Format file tidak didukung. Gunakan TXT, PDF, DOC, atau DOCX.');
        } else if (response.status === 422) {
          toast.error('Konten file tidak dapat diekstrak. File mungkin berisi gambar atau terenkripsi.');
        } else if (response.status === 429) {
          toast.error('Batas penggunaan AI tercapai. Mohon tunggu beberapa saat dan coba lagi.');
        } else {
          throw new Error(error.message || 'Gagal generate soal');
        }
        
        return;
      }
      
      const data = await response.json()
      setQuestions(data.questions)
      toast.success('Soal berhasil digenerate!')
    } catch (error: any) {
      console.error('Error:', error)
      if (error.name === 'AbortError') {
        toast.error('Permintaan dibatalkan karena terlalu lama. Coba file yang lebih kecil atau kategori.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Gagal generate soal');
      }
    } finally {
      setGenerating(false)
    }
  }

  // Fungsi untuk menyimpan soal ke database
  const handleSaveQuestions = async () => {
    try {
      setSaving(true)
      
      // Dapatkan token dan userId dari localStorage
      const token = localStorage.getItem('authToken')
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = userData.id
      
      if (!token || !userId) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
        router.push('/login')
        return
      }
      
      console.log('[INFO] Memulai penyimpanan soal dengan userId:', userId)
      
      // Persiapkan data soal untuk disimpan
      const questionsToSave = questions.map(q => ({
        ...q,
        createdBy: userId, // Penting: Tambahkan ID pengguna ke setiap soal
        userId: userId, // Alternatif field untuk userId jika dibutuhkan
        difficulty: difficulty,
        type: questionType,
        category: category || (selectedFile ? selectedFile.name.split('.')[0] : 'Uncategorized'),
        status: 'DRAFT'
      }))
      
      console.log(`[INFO] Menyiapkan ${questionsToSave.length} soal untuk disimpan`)
      
      // Kirim ke endpoint API
      const response = await fetch('/api/manage-soal/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId, // Penting: Tambahkan header dengan ID pengguna
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          questions: questionsToSave,
          userId: userId, // Penting: Sertakan ID pengguna di body request
          createdBy: userId // Alternatif field untuk createdBy
        })
      })
      
      console.log('[INFO] Status response:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[ERROR] Detail error:', errorData)
        throw new Error(errorData.error || `Failed to save questions: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[INFO] Save result:', data)
      
      toast.success(`${data.totalSaved} soal berhasil disimpan!`)
      setSavedSuccess(true)
      
      // Opsional: Redirect ke halaman manage-soal setelah berhasil
      setTimeout(() => {
        router.push('/manage-soal')
      }, 2000)
    } catch (error) {
      console.error('[ERROR] Error saving questions:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan soal')
    } finally {
      setSaving(false)
    }
  }

  // Clear category when file is selected and vice versa
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (file) setCategory('')
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    if (value) setSelectedFile(null)
  }

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-4 lg:p-6 xl:p-8 lg:ml-0 w-full transition-all duration-300">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-b-transparent border-cyan-500 dark:border-cyan-400"></div>
            <p className="mt-4 text-cyan-500 dark:text-cyan-400 font-medium">Memuat...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto relative lg:pl-16 xl:pl-24 lg:pr-4 xl:pr-12">
            {/* Header Section */}
            <div className="mb-8 mt-10 lg:mt-0 relative">
              <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                Generate Soal <span className="text-cyan-500 dark:text-cyan-400">AI</span>
              </h1>
              <p className="text-slate-400 dark:text-zinc-400">Buat soal secara otomatis dengan bantuan AI</p>
            </div>

            {/* Error Alert for File Upload Issues */}
            {selectedFile && (
              <div className="mb-6 bg-blue-900/30 dark:bg-blue-900/50 border border-blue-700/50 dark:border-blue-800/50 rounded-xl p-4 text-sm text-blue-300 dark:text-blue-400 shadow-lg card-glass">
                <p className="flex items-start">
                  <HiOutlineDocumentText className="flex-shrink-0 mr-3 h-6 w-6 mt-0.5 text-blue-400 dark:text-blue-500" />
                  <span>
                    <strong>Tip:</strong> Jika upload file gagal, pastikan file Anda dalam format TXT, PDF, DOC, atau DOCX 
                    dan berukuran kurang dari 10MB. Coba gunakan file dengan konten teks yang dapat diakses.
                  </span>
                </p>
              </div>
            )}

            {/* Generator Card */}
            <div className="bg-white dark:bg-zinc-800/60 rounded-xl p-5 lg:p-6 shadow-xl border border-slate-200 dark:border-zinc-700/50">
              <div className="grid gap-5 lg:gap-6 relative">
                {/* Category Input */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-slate-600 dark:text-zinc-300 select-none">
                    <HiOutlineAcademicCap className="w-5 h-5 mr-2.5 text-cyan-500 dark:text-cyan-400" />
                    Kategori Soal
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      placeholder="Contoh: Matematika, Fisika, Biologi..."
                      disabled={!!selectedFile}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-800/60 bg-slate-100 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus-ring transition-colors 
                        disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {category && (
                      <button
                        onClick={() => setCategory('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-800/50"
                      >
                        <HiOutlineX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-yellow-500 dark:text-yellow-400 text-sm flex items-center">
                      <HiOutlineExclamation className="w-4 h-4 mr-1 flex-shrink-0" />
                      Nonaktifkan file untuk menggunakan kategori
                    </p>
                  )}
                </div>

                {/* Add File Upload Component */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-slate-600 dark:text-zinc-300">
                    <HiOutlineDocumentText className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                    Upload File
                  </label>
                  <FileUpload onFileSelect={handleFileSelect} disabled={!!category} />
                  {category && (
                    <p className="text-yellow-500 dark:text-yellow-400 text-sm flex items-center">
                      <HiOutlineExclamation className="w-4 h-4 mr-1 flex-shrink-0" />
                      Hapus kategori untuk menggunakan file
                    </p>
                  )}
                  {selectedFile && (
                    <p className="text-sm text-slate-400 dark:text-zinc-500">
                      Soal akan digenerate berdasarkan konten dari file {selectedFile.name}
                    </p>
                  )}
                </div>

                {/* Question Type & Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-600 dark:text-zinc-300">
                      <HiOutlineQuestionMarkCircle className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                      Jenis Soal
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQuestionType('MCQ')}
                        className={`px-4 py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                          ${questionType === 'MCQ' 
                            ? 'bg-cyan-900/30 dark:bg-cyan-900/50 text-cyan-400 dark:text-cyan-500 border border-cyan-800 dark:border-cyan-900' 
                            : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70'}`}
                      >
                        Pilihan Ganda
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionType('ESSAY')}
                        className={`px-4 py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                          ${questionType === 'ESSAY' 
                            ? 'bg-cyan-900/30 dark:bg-cyan-900/50 text-cyan-400 dark:text-cyan-500 border border-cyan-800 dark:border-cyan-900' 
                            : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70'}`}
                      >
                        Essay
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-600 dark:text-zinc-300">
                      <HiOutlineAcademicCap className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                      Tingkat Kesulitan
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`px-4 py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                            ${difficulty === level 
                              ? 'bg-cyan-900/30 dark:bg-cyan-900/50 text-cyan-400 dark:text-cyan-500 border border-cyan-800 dark:border-cyan-900' 
                              : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70'}`}
                        >
                          {level === 'EASY' ? 'Mudah' : level === 'MEDIUM' ? 'Sedang' : 'Sulit'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Count Selection - Compact Version */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-medium text-slate-600 dark:text-zinc-300">
                    <HiOutlineDocumentText className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                    Jumlah Soal
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Number Input with Stepper */}
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => questionCount > 1 && setQuestionCount(questionCount - 1)}
                        className="h-10 w-10 rounded-l-lg bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70 text-slate-600 dark:text-zinc-300 flex items-center justify-center"
                      >
                        <HiMinus className="w-5 h-5" />
                      </button>
                      
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={questionCount}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value > 0 && value <= 30) {
                              setQuestionCount(value);
                            }
                          }}
                          className="w-16 h-10 text-center text-xl font-bold text-cyan-400 dark:text-cyan-500 bg-slate-100 dark:bg-zinc-900/80 border-y-2 border-cyan-800 dark:border-cyan-900
                            focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-transparent
                            [appearance:textfield]
                            [&::-webkit-outer-spin-button]:appearance-none 
                            [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => questionCount < 30 && setQuestionCount(questionCount + 1)}
                        className="h-10 w-10 rounded-r-lg bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70 text-slate-600 dark:text-zinc-300 flex items-center justify-center"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Preset Amounts - Grid on Mobile, Row on Desktop */}
                    <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                      {[5, 10, 15, 20].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setQuestionCount(count)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                            ${questionCount === count 
                              ? 'bg-cyan-900/30 dark:bg-cyan-900/50 text-cyan-400 dark:text-cyan-500 border border-cyan-800 dark:border-cyan-900' 
                              : 'bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800/70'}`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Text */}
                  <div className="text-center text-sm text-slate-400 dark:text-zinc-500">
                    {questionCount === 1 ? (
                      'Akan dibuat 1 soal'
                    ) : (
                      <>
                        <span className="font-medium text-cyan-400 dark:text-cyan-500">{questionCount}</span> soal akan dibuat
                        {(category || selectedFile) && (
                          <>
                            {' '}untuk {category ? <>kategori <span className="font-medium text-cyan-400 dark:text-cyan-500">{category}</span></> : 
                            <>file <span className="font-medium text-cyan-400 dark:text-cyan-500">{selectedFile?.name}</span></>}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Warning if count is high */}
                  {questionCount > 20 && (
                    <div className="text-center text-sm text-yellow-500 dark:text-yellow-400 bg-yellow-900/20 dark:bg-yellow-900/50 border border-yellow-800/50 dark:border-yellow-900/50 rounded-lg p-2">
                      <HiOutlineExclamation className="inline-block w-4 h-4 mr-1" />
                      Generating banyak soal mungkin membutuhkan waktu lebih lama
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || (!category && !selectedFile)}
                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium 
                      shadow-lg transition-all duration-300 
                      ${generating || (!category && !selectedFile) 
                        ? 'bg-slate-100 dark:bg-zinc-900/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed' 
                        : 'bg-cyan-600 dark:bg-cyan-700 text-white hover:bg-cyan-700 dark:hover:bg-cyan-800 hover:shadow-md active:translate-y-0.5'}`}
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-r-transparent border-white"></div>
                        <span>Membuat Soal...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineLightningBolt className="w-5 h-5" />
                        <span>Generate Soal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {generating && (
              <div className="mt-8 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/60 p-6 rounded-xl shadow-xl">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 dark:border-cyan-500/50"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Sedang Membuat Soal...</h3>
                  <p className="text-slate-400 dark:text-zinc-500 max-w-md">
                    {selectedFile 
                      ? `Sedang memproses file "${selectedFile.name}" dan menghasilkan ${questionCount} soal ${questionType === "MCQ" ? "pilihan ganda" : "essay"}.`
                      : `AI sedang membuat ${questionCount} soal ${questionType === "MCQ" ? "pilihan ganda" : "essay"} dengan tingkat kesulitan ${difficulty === "EASY" ? "mudah" : difficulty === "MEDIUM" ? "sedang" : "sulit"}.`
                    }
                  </p>
                  <div className="mt-6 w-full max-w-md space-y-2">
                    <div className="h-2 w-full bg-cyan-500 dark:bg-cyan-600 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 dark:bg-cyan-600 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-500">
                      <span>Proses ini bisa memakan waktu 1-2 menit</span>
                      <span>Harap bersabar</span>
                    </div>
                  </div>
                  {selectedFile && selectedFile.size > 300000 && (
                    <div className="mt-4 p-3 bg-blue-900/30 dark:bg-blue-900/50 text-blue-300 dark:text-blue-400 text-sm rounded-lg border border-blue-800 dark:border-blue-900">
                      <p>File Anda berukuran besar ({Math.round(selectedFile.size/1024)} KB). Proses mungkin membutuhkan waktu lebih lama.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Section */}
            {questions.length > 0 && !generating && (
              <div className="mt-10 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-5 lg:p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                    <HiOutlineDocumentText className="mr-2 h-6 w-6 text-cyan-500" />
                    Hasil Generate ({questions.length} soal)
                  </h2>
                  
                  {/* Tambahkan tombol simpan */}
                  <button 
                    onClick={handleSaveQuestions}
                    disabled={saving || savedSuccess}
                    className={`flex items-center px-4 py-2.5 rounded-lg shadow-md font-medium
                      ${saving 
                        ? 'bg-slate-200 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 cursor-wait' 
                        : savedSuccess
                          ? 'bg-green-100 dark:bg-green-600/80 text-green-700 dark:text-white cursor-default'
                          : 'bg-cyan-600 text-white hover:bg-cyan-700 transition-colors duration-200'
                      }`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-r-transparent border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : savedSuccess ? (
                      <>
                        <HiOutlineCheck className="mr-1.5 h-5 w-5" />
                        Tersimpan
                      </>
                    ) : (
                      <>
                        <HiOutlineSave className="mr-1.5 h-5 w-5" />
                        Simpan Soal
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-6">
                  {questions.map((q, index) => (
                    <div key={index} className="p-5 bg-slate-100 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/20 shadow-md hover-lift">
                      <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm mr-2.5">
                          {index + 1}
                        </span>
                        <span>Pertanyaan</span>
                      </h3>
                      <p className="text-slate-800 dark:text-zinc-100 mb-4 leading-relaxed">{q.question}</p>
                      
                      {q.options && (
                        <div className="mb-5 pl-4 border-l-2 border-cyan-300 dark:border-cyan-800/50 rounded-sm py-1">
                          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-2">Pilihan Jawaban:</p>
                          <ul className="space-y-1">
                            {Object.entries(q.options).map(([key, value]) => (
                              <li key={key} className={`text-slate-700 dark:text-zinc-300 pl-2 py-1 rounded ${key === q.answer ? 'bg-cyan-100 dark:bg-cyan-900/20 border-l-2 border-cyan-500' : ''}`}>
                                <strong className={`${key === q.answer ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-zinc-500'} mr-1.5`}>{key}.</strong> {value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="bg-slate-100 dark:bg-zinc-900/80 p-4 rounded-lg border border-slate-200 dark:border-zinc-800/80">
                        <p className="text-sm text-slate-600 dark:text-zinc-300 mb-2">
                          <strong className="text-cyan-600 dark:text-cyan-400">Jawaban:</strong> {q.answer}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-3 leading-relaxed">
                          <strong className="text-slate-700 dark:text-zinc-300 block mb-1">Penjelasan:</strong> {q.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}