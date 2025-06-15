import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'

/**
 * Endpoint untuk mengubah role pengguna - hanya dapat diakses oleh admin atau dengan kunci keamanan
 */
export async function POST(request: NextRequest) {
  try {
    const { email, role, secretKey } = await request.json()
    
    // Validasi input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email dan role diperlukan' },
        { status: 400 }
      )
    }
    
    // Validasi role value
    if (role !== 'ADMIN' && role !== 'USER') {
      return NextResponse.json(
        { error: 'Role tidak valid. Hanya ADMIN atau USER yang diizinkan' },
        { status: 400 }
      )
    }
    
    // Periksa autentikasi (token atau kunci rahasia)
    let isAuthorized = false
    
    // Cek kunci admin
    const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY || 'rahasia-admin-msta-2024'
    if (secretKey === ADMIN_CREATION_KEY) {
      isAuthorized = true
    } else {
      // Cek token jika tidak menggunakan secret key
      const token = cookies().get('authToken')?.value
      
      if (!token) {
        return NextResponse.json(
          { error: 'Tidak terautentikasi' },
          { status: 401 }
        )
      }
      
      // Verifikasi token
      const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: 'Token tidak valid' },
          { status: 401 }
        )
      }
      
      const { user } = await verifyResponse.json()
      
      // Hanya admin yang bisa mengubah role
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Tidak memiliki izin untuk mengubah role pengguna' },
          { status: 403 }
        )
      }
      
      isAuthorized = true
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk mengubah role pengguna' },
        { status: 403 }
      )
    }
    
    // Dalam implementasi sebenarnya, ini akan terhubung ke database
    // Untuk sementara, berikan respons sukses palsu
    return NextResponse.json({
      success: true, 
      message: `Role untuk pengguna ${email} berhasil diubah menjadi ${role}`,
      email,
      role
    })
    
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah role pengguna' },
      { status: 500 }
    )
  }
} 