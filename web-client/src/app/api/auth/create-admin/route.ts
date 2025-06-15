import { NextRequest, NextResponse } from 'next/server'

// Secret key untuk membuat admin pertama - seharusnya disimpan di environment variable
// Tapi untuk demonstrasi kita gunakan nilai tetap
const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY || 'rahasia-admin-msta-2024'
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, secretKey } = body
    
    // Verifikasi secret key
    if (secretKey !== ADMIN_CREATION_KEY) {
      return NextResponse.json(
        { error: 'Kunci keamanan tidak valid' },
        { status: 403 }
      )
    }
    
    // Validasi input dasar
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. Email, password, dan nama diperlukan' },
        { status: 400 }
      )
    }
    
    // 1. Buat akun user biasa terlebih dahulu
    const registerResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name
      }),
    })
    
    const registerData = await registerResponse.json()
    
    if (!registerResponse.ok) {
      return NextResponse.json(
        { error: registerData.error || 'Gagal membuat akun' },
        { status: registerResponse.status }
      )
    }
    
    // 2. Ambil ID user yang baru dibuat
    const userId = registerData.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Gagal mendapatkan ID user yang dibuat' },
        { status: 500 }
      )
    }
    
    // 3. Update role user menjadi ADMIN melalui endpoint update admin khusus
    const updateAdminResponse = await fetch(`${AUTH_SERVICE_URL}/api/admin/update-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Admin-Secret-Key': ADMIN_CREATION_KEY  // Gunakan key yang sama sebagai header auth
      },
      body: JSON.stringify({
        userId,
        role: 'ADMIN'
      }),
    })
    
    // 4. Cek respon update admin
    if (!updateAdminResponse.ok) {
      // Jika gagal, tampilkan pesan bahwa user terdaftar tapi role belum diubah
      return NextResponse.json({
        message: 'Akun berhasil dibuat tetapi gagal mengubah menjadi admin. Hubungi administrator untuk mengubah role secara manual.',
        user: registerData.user,
        partial: true
      }, { status: 207 }) // 207 Multi-Status response
    }
    
    // 5. Berhasil membuat dan mengubah role menjadi admin
    return NextResponse.json({
      message: 'Akun admin berhasil dibuat',
      user: {
        ...registerData.user,
        role: 'ADMIN' // Override role dari respons awal
      }
    })
  } catch (error) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat akun admin' },
      { status: 500 }
    )
  }
} 