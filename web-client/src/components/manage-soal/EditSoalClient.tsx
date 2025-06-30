'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { HiOutlineSave, HiOutlineArrowLeft, HiOutlineTrash, HiChevronLeft, HiChevronRight, HiOutlineExclamation, HiOutlineMenu, HiOutlineCheck, HiOutlineDownload, HiOutlineX } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { getToken, redirectToLogin, isAuthenticated } from '@/utils/auth'

// Fungsi untuk menghasilkan HTML template
const generateHtmlTemplate = (title: string, questions: any[], showAnswers: boolean = false) => {
  // Format tanggal Indonesia
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        .date {
          font-size: 14px;
          color: #666;
        }
        .question {
          margin-bottom: 20px;
          padding: 10px;
          border-left: 3px solid #2563eb;
          background-color: #f9fafb;
        }
        .question-text {
          font-weight: 500;
          margin-bottom: 10px;
        }
        .option {
          margin-left: 20px;
          margin-bottom: 8px;
        }
        .key-separator {
          page-break-before: always;
          margin-top: 50px;
          border-top: 2px dashed #ccc;
          padding-top: 20px;
          text-align: center;
          font-weight: bold;
        }
        .answer {
          padding: 10px;
          background-color: #f0f9ff;
          border-left: 3px solid #0ea5e9;
          margin-top: 10px;
        }
        .explanation {
          padding: 10px;
          background-color: #f0f9ff;
          border-left: 3px solid #0ea5e9;
          font-style: italic;
          color: #555;
          margin-top: 5px;
        }
        .difficulty {
          display: inline-block;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 10px;
          margin-left: 10px;
          font-weight: normal;
        }
        .easy { background-color: #dcfce7; color: #166534; }
        .medium { background-color: #fef9c3; color: #854d0e; }
        .hard { background-color: #fee2e2; color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${title}</h1>
        <p class="date">${formattedDate}</p>
      </div>

      <div class="questions">
        ${questions.map((q, idx) => `
          <div class="question">
            <div class="question-text">
              ${idx+1}. ${q.question}
              <span class="difficulty ${q.difficulty.toLowerCase()}">
                ${q.difficulty === 'EASY' ? 'Mudah' : q.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit'}
              </span>
            </div>
            ${q.type === 'MCQ' && q.options ? `
              <div class="options">
                ${Object.entries(q.options).map(([key, value]) => `
                  <div class="option">${key}. ${value}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      ${showAnswers ? `
        <div class="key-separator">KUNCI JAWABAN</div>
        <div class="answer-key">
          ${questions.map((q, idx) => `
            <div class="question">
              <div class="question-text">${idx+1}. ${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}</div>
              <div class="answer">
                <strong>Jawaban:</strong> ${q.type === 'MCQ' ? q.answer : q.answer || '-'}
              </div>
              <div class="explanation">
                <strong>Penjelasan:</strong> ${q.explanation || '-'}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

// Fungsi untuk menghasilkan konten teks untuk dokumen
const generateTextContent = (title: string, questions: any[], showAnswers: boolean = false) => {
  // Format tanggal Indonesia
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  let content = `${title.toUpperCase()}\n`;
  content += `${formattedDate}\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  // Bagian soal
  questions.forEach((q, idx) => {
    content += `${idx + 1}. ${q.question}\n`;
    content += `   Tingkat Kesulitan: ${q.difficulty === 'EASY' ? 'Mudah' : q.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit'}\n`;
    
    // Tambahkan opsi jika soal pilihan ganda
    if (q.type === 'MCQ' && q.options) {
      Object.entries(q.options).forEach(([key, value]) => {
        content += `   ${key}. ${value}\n`;
      });
    }
    
    content += '\n';
  });
  
  // Tambahkan kunci jawaban jika diperlukan
  if (showAnswers) {
    content += `\n\n${'='.repeat(20)} KUNCI JAWABAN ${'='.repeat(20)}\n\n`;
    
    questions.forEach((q, idx) => {
      content += `${idx + 1}. Jawaban: ${q.type === 'MCQ' ? q.answer : q.answer || '-'}\n`;
      content += `   Penjelasan: ${q.explanation || '-'}\n\n`;
    });
  }
  
  return content;
};

// Definisikan tipe untuk options
type OptionKey = 'A' | 'B' | 'C' | 'D';
type Options = Record<OptionKey, string>;

interface Question {
  id: string
  question: string
  options: Options
  answer: OptionKey
  explanation: string
  category: string
  difficulty: string
  type: 'MCQ' | 'ESSAY'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: string
  createdBy?: string
  userId?: string
}

// Ubah komponen SideNavigation
const SideNavigation = ({ questions, currentIndex, onSelect, isMobile }: { 
  questions: Question[], 
  currentIndex: number,
  onSelect: (index: number) => void,
  isMobile: boolean
}) => {
  return (
    <div className={`overflow-hidden transition-all duration-300 
      ${isMobile 
        ? 'fixed bottom-0 left-0 right-0 z-40 max-h-[40vh] bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800/60 pb-safe-area-inset-bottom shadow-xl' 
        : 'h-screen flex-shrink-0 w-full border-r border-zinc-800/60 sticky top-0'}
    `}
    >
      <div className={`flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/60 
        ${isMobile ? '' : 'sticky top-0 bg-zinc-900/90 backdrop-blur-lg z-10'}`}>
        <span className="font-medium text-white">Navigasi Soal</span>
        <span className="text-xs text-zinc-400 bg-zinc-800/80 rounded-full px-2.5 py-1">
          {questions.length} Soal
        </span>
      </div>
      
      <div className={`${isMobile ? 'max-h-[25vh]' : 'max-h-[calc(100vh-60px)]'} overflow-y-auto py-1`}>
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => onSelect(idx)}
            className={`w-full text-left p-3 rounded-lg truncate transition-colors ${
              currentIndex === idx 
                ? 'bg-cyan-100 dark:bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 font-semibold' 
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center 
              ${currentIndex === idx 
                ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' 
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700'}
            `}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">
                {q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isMobile && (
        <div className="px-4 py-3 flex justify-between border-t border-zinc-200/60">
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-200/90 dark:bg-zinc-800/90 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80"
          >
            Lihat Penjelasan
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-200/90 dark:bg-zinc-800/90 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80"
          >
            Kembali ke Atas
          </button>
        </div>
      )}
    </div>
  );
};

export default function EditSoal() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Deteksi ukuran layar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    // Jalankan saat pertama kali komponen muncul
    checkScreenSize()

    // Tambahkan event listener untuk resize
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  useEffect(() => {
    // Check if auth token exists in localStorage directly
    const checkAuth = async () => {
      try {
        console.log('=== DEBUG: Checking authentication in edit page ===');
        
        // Get token directly from localStorage
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token in localStorage:', authToken ? `Ya (panjang: ${authToken.length})` : 'Tidak');
        
        if (!authToken) {
          console.error('Auth token not found in localStorage, redirecting to login');
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          
          // Clear any existing auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Direct redirect
          router.push('/login');
          return;
        }
        
        // Ambil data user langsung dari localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id;
        
        if (!userId) {
          console.error('User ID not found in localStorage, redirecting to login');
          toast.error('Data pengguna tidak ditemukan. Silakan login kembali.');
          router.push('/login');
          return;
        }

        console.log('Authentication successful, proceeding to fetch questions');
        // Lanjutkan fetch questions dengan mengirimkan userId
        fetchQuestions(userId);
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Terjadi masalah autentikasi. Silakan login kembali.');
        
        // Direct redirect on error
        router.push('/login');
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      setCurrentQuestion(questions[currentIndex]);
    } else {
      setCurrentQuestion(null);
    }
  }, [currentIndex, questions]);



  const fetchQuestions = async (userId: string) => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      toast.error("Sesi berakhir, silakan login kembali.");
      redirectToLogin(true);
      setLoading(false);
      return;
    }

    const { id } = params;
    if (!id || typeof id !== 'string') {
      toast.error('ID soal tidak valid.');
      router.push('/manage-soal');
      setLoading(false);
      return;
    }

    try {
      // 1. Ambil soal tunggal untuk mendapatkan konteks batch (kategori)
            const singleQuestionRes = await fetch(`/api/v1/manage-soal/questions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId,
        },
      });

      if (!singleQuestionRes.ok) {
        if (singleQuestionRes.status === 401) {
            toast.error("Sesi tidak valid.");
            redirectToLogin(true);
        }
        throw new Error(`Gagal mengambil data soal: ${singleQuestionRes.statusText}`);
      }

      const singleQuestion: Question = await singleQuestionRes.json();
      const batchCategory = singleQuestion.category.trim();

      // Jika tidak ada kategori, muat saja soal tunggal ini
      if (!batchCategory) {
        setQuestions([singleQuestion]);
        setCurrentIndex(0);
        setCurrentQuestion(singleQuestion);
        toast.success('Soal dimuat, tetapi tidak ada batch terkait.');
        setLoading(false);
        return;
      }

      // 2. Ambil semua soal dari batch (kategori) yang sama
            const batchQuestionsRes = await fetch(`/api/v1/manage-soal/questions?category=${encodeURIComponent(batchCategory)}&createdBy=${encodeURIComponent(userId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId,
        },
      });

      if (!batchQuestionsRes.ok) {
        throw new Error(`Gagal mengambil soal dari batch: ${batchQuestionsRes.statusText}`);
      }

      const rawBatchData = await batchQuestionsRes.json();
      console.log('[DEBUG] Raw batch data response:', rawBatchData);

      let batchQuestions: Question[];

      // Check if the actual question data is nested (e.g., in an 'items' or 'data' property)
      if (rawBatchData && Array.isArray(rawBatchData.items)) {
        batchQuestions = rawBatchData.items;
      } else if (rawBatchData && Array.isArray(rawBatchData.data)) {
        batchQuestions = rawBatchData.data;
      } else if (Array.isArray(rawBatchData)) {
        batchQuestions = rawBatchData;
      } else {
        batchQuestions = [];
        // toast.error('Format data soal dari batch tidak valid.'); // Error will be shown if batchQuestions remains empty after logic
      }
      
      if (!batchQuestions.length && !Array.isArray(rawBatchData)) {
        // Only show error if the raw data wasn't an array and we couldn't extract an array from it
        // And if the initial fetch was not an empty array itself (which is a valid response)
        toast.error('Format data soal dari batch tidak valid atau tidak ada soal ditemukan.');
        console.error('Invalid batch data format or no questions in batch:', rawBatchData);
      }

      // Pastikan batchQuestions selalu array untuk operasi selanjutnya
      if (!Array.isArray(batchQuestions)) {
        batchQuestions = [];
      }

      if (!Array.isArray(batchQuestions)) { // This check is now somewhat redundant due to above, but kept for safety during refactor
        batchQuestions = [];
        toast.error('Format data soal dari batch tidak valid.');
      }

      // Hapus soal yang sedang diedit dari daftar batch (untuk menghindari duplikat)
      const otherQuestions = batchQuestions.filter(q => q.id !== id);

      // Gabungkan soal yang sedang diedit dengan sisa batch
      const combinedQuestions = [singleQuestion, ...otherQuestions];

      const sortedQuestions = combinedQuestions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setQuestions(sortedQuestions);

      const initialIndex = sortedQuestions.findIndex(q => q.id === id);
      if (initialIndex !== -1) {
        setCurrentIndex(initialIndex);
        setCurrentQuestion(sortedQuestions[initialIndex]);
      } else {
        toast.error('Soal tidak ditemukan dalam batch yang dimuat.');
        router.push('/manage-soal');
      }

    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat soal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const questionToSave = questions[currentIndex];
    if (!questionToSave) return;
    
    setSaving(true);
    toast.loading('Menyimpan perubahan...', { id: 'save-toast' });

    try {
      const token = getToken();
      if (!token) {
        toast.error('Sesi tidak valid. Silakan login kembali.', { id: 'save-toast' });
        setSaving(false);
        redirectToLogin(true);
        return;
      }

            const response = await fetch(`/api/v1/manage-soal/questions/${questionToSave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': questionToSave.createdBy || ''
        },
        body: JSON.stringify(questionToSave)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal menyimpan soal');
      }

      toast.success('Soal berhasil disimpan!', { id: 'save-toast' });

    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan', { id: 'save-toast' });
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (updates: Partial<Question>) => {
    setQuestions(prev => 
      prev.map((q, index) => 
        index === currentIndex ? { ...q, ...updates } : q
      )
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    }, [currentQuestion, saving]);

  useEffect(() => {
    if (explanationRef.current) {
      explanationRef.current.style.height = 'auto';
      explanationRef.current.style.height = `${explanationRef.current.scrollHeight}px`;
    }
  }, [currentQuestion?.explanation]);

  const handleExport = (type: 'html' | 'html-key' | 'txt') => {
    const title = `Kumpulan Soal - ${new Date().toLocaleDateString('id-ID')}`;
    let blob;
    let filename;

    switch (type) {
      case 'html':
        const htmlContent = generateHtmlTemplate(title, questions, false);
        blob = new Blob([htmlContent], { type: 'text/html' });
        filename = `${title}.html`;
        break;
      case 'html-key':
        const htmlContentKey = generateHtmlTemplate(`${title} (Dengan Kunci)`, questions, true);
        blob = new Blob([htmlContentKey], { type: 'text/html' });
        filename = `${title} (Dengan Kunci).html`;
        break;
      case 'txt':
        const textContent = generateTextContent(title, questions, false);
        blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        filename = `${title}.txt`;
        break;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Soal berhasil diekspor ke ${type.toUpperCase()}!`);
  };

  const handleDelete = async () => {
    if (!currentQuestion || deleting) return;

    toast((t) => (
      <div className="bg-zinc-100 dark:bg-zinc-900 text-slate-900 dark:text-white p-4 rounded-lg shadow-lg flex flex-col gap-4 max-w-sm">
        <div className="flex items-start gap-3">
          <HiOutlineExclamation className="w-12 h-12 text-red-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Konfirmasi Hapus</h4>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Anda yakin ingin menghapus soal ini secara permanen? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="px-4 py-2 text-sm rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              setDeleting(true);
              toast.loading('Menghapus soal...', { id: 'delete-toast' });
              try {
                const token = getToken();
                                const response = await fetch(`/api/v1/manage-soal/delete`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ questionId: currentQuestion.id })
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Gagal menghapus soal');
                }

                toast.success('Soal berhasil dihapus.', { id: 'delete-toast' });
                
                const newQuestions = questions.filter(q => q.id !== currentQuestion.id);
                setQuestions(newQuestions);
                
                if (newQuestions.length > 0) {
                  setCurrentIndex(Math.max(0, currentIndex - 1));
                } else {
                  router.push('/generate-soal');
                }

              } catch (error) {
                console.error('Delete error:', error);
                toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan', { id: 'delete-toast' });
              } finally {
                setDeleting(false);
              }
            }}
            className="px-4 py-2 text-sm rounded-md bg-red-600 dark:bg-red-700 text-white transition-colors"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-100 dark:bg-zinc-900 text-slate-900 dark:text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-r-transparent border-cyan-500"></div>
        <p className="ml-4 text-lg">Memuat Editor...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-100 dark:bg-zinc-900 text-slate-900 dark:text-white">
        <HiOutlineExclamation className="w-16 h-16 text-yellow-400 mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Tidak Ada Soal</h2>
        <p className="text-zinc-400 dark:text-zinc-500 mb-6">Tidak ada soal yang ditemukan atau semua soal telah dihapus.</p>
        <button 
          onClick={() => router.push('/generate-soal')}
          className="px-6 py-2 rounded-lg bg-cyan-600 dark:bg-cyan-700 text-white hover:bg-cyan-700 dark:hover:bg-cyan-800 transition-colors"
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900 text-slate-900 dark:text-white">
      <Sidebar />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 flex-shrink-0">
          <SideNavigation 
            questions={questions}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            isMobile={false}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-zinc-100 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-200/60 z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/manage-soal')}
                className="p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-white transition-colors"
                title="Kembali ke Daftar Soal"
              >
                <HiOutlineArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Soal</h1>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Soal {currentIndex + 1} dari {questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDelete}
                className="p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Hapus Soal"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
              <div className="relative group">
                 <button
                    onClick={() => handleExport('html')}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <HiOutlineDownload className="w-5 h-5" />
                    <span>Ekspor</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20">
                      <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">Ekspor Soal</button>
                      <button onClick={() => handleExport('html-key')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">Ekspor dengan Kunci</button>
                      <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">Ekspor ke Teks</button>
                  </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all duration-300
                  ${saving 
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed' 
                    : 'bg-cyan-600 dark:bg-cyan-700 text-white hover:bg-cyan-700 dark:hover:bg-cyan-800'}`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-r-transparent border-white"></div>
                    <span>Menyimpan</span>
                  </>
                ) : (
                  <>
                    <HiOutlineSave className="w-5 h-5" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
              {/* Question Text Area */}
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                <label htmlFor="question-text" className="block text-sm font-medium text-zinc-400 dark:text-zinc-500 mb-2">Teks Pertanyaan</label>
                <textarea
                  id="question-text"
                  value={currentQuestion.question}
                  onChange={(e) => updateQuestion({ question: e.target.value })}
                  className="w-full bg-transparent text-xl font-semibold p-4 focus:outline-none focus:bg-slate-100 dark:focus:bg-zinc-800 rounded-t-lg text-slate-900 dark:text-white"
                  placeholder="Tulis pertanyaan di sini..."
                  rows={4}
                />
              </div>

              {/* Options for MCQ */}
              {currentQuestion.type === 'MCQ' && (
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mb-3">Pilihan Jawaban</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(currentQuestion.options).map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <label 
                          htmlFor={`option-${key}`}
                          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-bold rounded-lg cursor-pointer transition-colors
                            ${currentQuestion.answer === key 
                              ? 'bg-green-600 dark:bg-green-700 text-white border-2 border-green-400 dark:border-green-600'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                        >
                          {key}
                        </label>
                        <input
                          id={`option-${key}`}
                          type="text"
                          value={currentQuestion.options[key as OptionKey]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newOptions = { ...currentQuestion.options, [key]: e.target.value };
                            updateQuestion({ options: newOptions });
                          }}
                          className="w-full bg-transparent text-xl font-semibold p-4 focus:outline-none focus:bg-slate-100 dark:focus:bg-zinc-800 rounded-t-lg text-slate-900 dark:text-white"
                        />
                        <button 
                          onClick={() => updateQuestion({ answer: key as OptionKey })}
                          className={`p-2 rounded-full transition-colors ${currentQuestion.answer === key ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white'}`}
                          title={`Jadikan ${key} sebagai jawaban`}
                        >
                          <HiOutlineCheck className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="p-5 border-b border-slate-200 dark:border-zinc-800/60">
                <h3 className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-3">Penjelasan Jawaban</h3>
                <textarea
                  ref={explanationRef}
                  id="explanation"
                  value={currentQuestion.explanation}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion({ explanation: e.target.value })}
                  className="w-full h-full bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-none overflow-hidden"
                  placeholder="Berikan penjelasan singkat..."
                  rows={1}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <div className="lg:hidden flex items-center justify-around bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-2">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-3 rounded-full text-slate-500 dark:text-zinc-300 disabled:text-slate-300 dark:disabled:text-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-800"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-sm">
            Soal <span className="font-bold text-slate-900 dark:text-white">{currentIndex + 1}</span> dari <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span>
          </div>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="p-3 rounded-full text-slate-500 dark:text-zinc-300 disabled:text-slate-300 dark:disabled:text-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-800"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

