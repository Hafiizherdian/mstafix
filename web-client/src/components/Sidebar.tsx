'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  HiOutlineDocument, 
  HiOutlineDocumentAdd, 
  HiOutlineLogout,
  HiOutlineMenu, 
  HiOutlineX,
  HiOutlineLightningBolt,
  HiOutlineClipboardList,
  HiOutlineCog
} from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  {
    name: 'Generate Soal',
    href: '/generate-soal',
    icon: HiOutlineDocumentAdd
  },
  {
    name: 'Kelola Soal',
    href: '/manage-soal',
    icon: HiOutlineDocument
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Deteksi ukuran layar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
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

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    // Hapus data auth dari localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    // Hapus cookie authToken
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Redirect ke login
    router.push('/login')
  }

  // Cek jika user adalah admin
  const isAdmin = user?.role === 'ADMIN'

  return (
    <>
      {/* Hamburger button untuk mobile */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm text-slate-700 dark:text-white border border-slate-200/80 dark:border-zinc-800/80 shadow-lg shadow-black/20"
        onClick={toggleSidebar}
        aria-label="Open Menu"
      >
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      {/* Overlay untuk mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:fixed lg:w-56 
          w-[240px] max-w-[80%] bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800/70 flex flex-col h-screen overflow-y-auto`}
      >
        {/* Logo section */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-700/50">
              <HiOutlineLightningBolt className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <div className="text-slate-900 dark:text-white font-bold">MSTA</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400"></div>
            </div>
            
            {/* Close button - visible only on mobile */}
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden ml-auto p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 flex flex-col justify-between">
          <div className="space-y-1 px-3">
            {[
              { title: 'Generate Soal', icon: HiOutlineLightningBolt, href: '/generate-soal' },
              { title: 'Kelola Soal', icon: HiOutlineClipboardList, href: '/manage-soal' },
              // Admin menu khusus untuk admin
              ...(isAdmin ? [{ title: 'Admin Dashboard', icon: HiOutlineCog, href: '/admin' }] : []),
            ].map(({title, icon: Icon, href}) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (isOpen) setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${pathname === href || pathname.startsWith(`${href}/`) 
                    ? 'bg-cyan-50 dark:bg-zinc-800/90 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-zinc-700/50 shadow-md' 
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${pathname === href || pathname.startsWith(`${href}/`) ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span>{title}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="mt-auto pt-2 border-t border-slate-200 dark:border-zinc-800/70">
            {user ? (
              <div className="px-3 py-2">
                <div className="bg-slate-100/70 dark:bg-zinc-800/70 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center border border-slate-200 dark:border-zinc-800/30 text-cyan-600 dark:text-cyan-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        {user.email}
                      </div>
                      {isAdmin && (
                        <div className="text-xs bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                          Admin
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThemeToggle />
                      <button
                        onClick={handleLogout}
                        className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700/80 rounded-lg transition-all"
                        title="Logout"
                      >
                        <HiOutlineLogout className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3 py-2">
                <Link 
                  href="/login"
                  className="block text-center py-2 rounded-xl bg-slate-100/70 dark:bg-zinc-800/70 text-cyan-600 dark:text-cyan-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors border border-slate-200 dark:border-zinc-700/50"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content Spacer - hanya untuk desktop view */}
      <div className="hidden lg:block w-56 flex-shrink-0"></div>
    </>
  )
}