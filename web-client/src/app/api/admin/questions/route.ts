// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Menangani permintaan GET untuk mengambil daftar pertanyaan.
 * Meneruskan permintaan ke API Gateway menggunakan fetch API.
 */
export async function GET(request: NextRequest) {
  const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

  if (!API_GATEWAY_URL) {
    console.error('API_GATEWAY_URL environment variable is not set.');
    return NextResponse.json(
      { success: false, message: 'Konfigurasi API gateway tidak ditemukan.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const fullUrl = `${API_GATEWAY_URL}/api/admin/questions?${searchParams.toString()}`;
  const authToken = request.headers.get('Authorization');

  try {
    console.log(`[BFF /api/admin/questions] Meneruskan permintaan ke API Gateway: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        ...(authToken && { Authorization: authToken }),
        'Content-Type': 'application/json',
      },
    });

    // Coba parsing JSON, jika gagal, baca sebagai teks untuk melihat pesan error HTML
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const errorText = await response.text();
      console.error('[BFF /api/admin/questions] Gagal parsing JSON, respons mentah:', errorText);
      return NextResponse.json(
        {
          success: false,
          message: 'Respons tidak valid dari API Gateway.',
          error: 'Unexpected token < in JSON at position 0',
          rawError: errorText.substring(0, 500) // Kirim potongan error mentah
        },
        { status: response.status }
      );
    }

    if (!response.ok) {
      console.error('[BFF /api/admin/questions] Gagal meneruskan permintaan ke API Gateway:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error('[BFF /api/admin/questions] Terjadi kesalahan internal:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data pertanyaan dari API Gateway.',
        error: error.message,
      },
      { status: 502 } // Bad Gateway
    );
  }
}