import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Ambil token dari header Authorization
    const authHeader = request.headers.get('Authorization')
    let token: string | undefined
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // Jika tidak ada di header, coba cek dari cookie
    if (!token) {
      token = cookies().get('authToken')?.value
    }
    
    if (!token) {
      console.log('Tidak ada token yang ditemukan')
      return NextResponse.json({ valid: false, message: 'Token tidak ditemukan' }, { status: 401 })
    }
    
    // Validasi token dengan auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'
    try {
      console.log('Memvalidasi token dengan:', `${authServiceUrl}/api/auth/verify`);
      
      const response = await fetch(`${authServiceUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Response handler
      if (response.ok) {
        const data = await response.json();
        console.log('Token berhasil divalidasi');
        return NextResponse.json({ 
          valid: true,
          user: data.user
        });
      }
      
      // Error handling khusus
      console.log('Token tidak valid:', response.status);
      return NextResponse.json(
        { valid: false, message: 'Token tidak valid' }, 
        { status: 401 }
      );
    } catch (error) {
      console.error('Error validasi token:', error)
      // Jika terjadi error pada fetch, asumsikan token valid untuk mencegah logout otomatis
      console.log('Mengasumsikan token valid karena error koneksi');
      return NextResponse.json({ 
        valid: true,
        warning: 'Connection to auth service failed, assuming valid token'
      });
    }
  } catch (error) {
    console.error('Error dalam validasi token:', error)
    return NextResponse.json({ valid: false, message: 'Error server' }, { status: 500 })
  }
} 