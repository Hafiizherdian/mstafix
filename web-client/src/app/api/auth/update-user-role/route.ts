import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Endpoint untuk mengubah role pengguna - hanya dapat diakses oleh admin
 */
export async function POST(request: NextRequest) {
  try {
    // Dapatkan token dari cookie
    const token = cookies().get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Parse request body
    const { userId, role } = await request.json();
    
    // Validasi input
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID dan role diperlukan' },
        { status: 400 }
      );
    }
    
    // Validasi role value
    if (role !== 'ADMIN' && role !== 'USER') {
      return NextResponse.json(
        { error: 'Role tidak valid. Hanya ADMIN atau USER yang diizinkan' },
        { status: 400 }
      );
    }
    
    // Siapkan headers untuk request ke backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Tambahkan admin secret key jika mengubah ke role ADMIN
    if (role === 'ADMIN') {
      const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY || 'rahasia-admin-msta-2024';
      headers['admin-secret-key'] = ADMIN_CREATION_KEY;
    }
    
    // Kirim request ke backend service
    const response = await fetch(`${AUTH_SERVICE_URL}/api/admin/update-role`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, role })
    });

    // Jika response tidak OK, lempar error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || 'Gagal mengupdate role pengguna',
          details: errorData.details
        },
        { status: response.status }
      );
    }

    // Jika berhasil, kembalikan response dari backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan saat mengubah role pengguna',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}