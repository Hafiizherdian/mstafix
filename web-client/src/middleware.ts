import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/register', '/setup-admin', '/admin-utils']
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = publicRoutes.includes(path)
  const isAdminPath = adminRoutes.some(route => path.startsWith(route))

  // Cek token dari cookie
  const token = request.cookies.get('authToken')?.value
  
  console.log(`Middleware checking path: ${path}, isPublicPath: ${isPublicPath}, isAdminPath: ${isAdminPath}, hasToken: ${!!token}`);

  // Redirect authenticated users away from public routes
  if (isPublicPath && token) {
    console.log('Redirecting authenticated user from public path');
    
    // Karena middleware tidak memiliki akses langsung ke decoded token,
    // kita hanya bisa memeriksa apakah pengguna terarah ke admin dari cookie
    // Ini akan ditangani oleh halaman login dan homepage
    
    // Default redirect ke generate-soal (regular user)
    return NextResponse.redirect(new URL('/generate-soal', request.url))
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    console.log('Redirecting unauthenticated user to login');
    const loginUrl = new URL('/login', request.url)
    // Store the requested path so we can redirect back after login
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Cek akses admin pada rute admin - akan dicek lebih detail di API endpoint
  // Karena middleware tidak bisa memeriksa role user (membutuhkan verifikasi token server-side)
  // Maka kita hanya cek keberadaan token. Verifikasi role akan dilakukan pada halaman dan API

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/generate-soal/:path*',
    '/manage-soal/:path*',
    '/admin/:path*',
  ]
}