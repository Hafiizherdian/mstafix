import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Ambil URL API Gateway dari environment variables
const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

/**
 * Menangani permintaan GET untuk mengambil daftar pengguna.
 * Meneruskan permintaan ke API Gateway dengan menyertakan query params dan token otentikasi.
 */
export async function GET(request: NextRequest) {
  // Pastikan API_GATEWAY_URL sudah di-set
  if (!API_GATEWAY_URL) {
    console.error('API_GATEWAY_URL environment variable is not set.');
    return NextResponse.json(
      { success: false, message: 'Konfigurasi API gateway tidak ditemukan.' },
      { status: 500 }
    );
  }

  // Ekstrak search parameters dari permintaan masuk
  const { searchParams } = new URL(request.url);
  const fullUrl = `${API_GATEWAY_URL}/api/admin/users?${searchParams.toString()}`;

  // Ekstrak header Authorization dari permintaan masuk
  const authToken = request.headers.get('Authorization');

  try {
    console.log(`[BFF /api/admin/users] Meneruskan permintaan ke API Gateway: ${fullUrl}`);

    const response = await axios.get(fullUrl, {
      headers: {
        // Teruskan header Authorization jika ada
        ...(authToken && { Authorization: authToken }),
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Tambahkan timeout untuk menghindari hang
    });

    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error('[BFF /api/admin/users] Gagal meneruskan permintaan ke API Gateway:', error.response?.data || error.message);

    // Teruskan status dan pesan error dari gateway jika tersedia
    const status = error.response?.status || 502;
    const data = error.response?.data || {
      success: false,
      message: 'Gagal mengambil data pengguna dari API Gateway.',
      error: error.message,
    };

    return NextResponse.json(data, { status });
  }
}
