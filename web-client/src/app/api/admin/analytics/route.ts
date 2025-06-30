import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

// Helper untuk melakukan panggilan API dengan penanganan error terpusat
const fetchStat = async (url: string, config: object, serviceName: string) => {
  try {
    console.log(`[BFF /api/admin/analytics] Fetching ${serviceName} stats from: ${url}`);
    const response = await axios.get(url, { ...config, timeout: 5000 });
    return response.data;
  } catch (error: any) {
    console.error(`[BFF /api/admin/analytics] Gagal mengambil statistik ${serviceName}:`, error.response?.data || error.message);
    // Mengembalikan null agar Promise.allSettled bisa menanganinya
    return null;
  }
};

export async function GET(request: NextRequest) {
  if (!API_GATEWAY_URL) {
    console.error('API_GATEWAY_URL environment variable is not set.');
    return NextResponse.json({ success: false, message: 'Konfigurasi API gateway tidak ditemukan.' }, { status: 500 });
  }

  const authToken = request.headers.get('Authorization');
  const headers = { ...(authToken && { Authorization: authToken }), 'Content-Type': 'application/json' };

  // Mendefinisikan endpoint statistik di API Gateway
  const endpoints = {
    userStats: `${API_GATEWAY_URL}/api/admin/users/stats`,
    questionStats: `${API_GATEWAY_URL}/api/admin/questions/stats`,
    generationStats: `${API_GATEWAY_URL}/api/admin/generated-questions/stats`,
  };

  try {
    // Menjalankan semua panggilan API secara paralel
    const results = await Promise.allSettled([
      fetchStat(endpoints.userStats, { headers }, 'User'),
      fetchStat(endpoints.questionStats, { headers }, 'Question'),
      fetchStat(endpoints.generationStats, { headers }, 'Generation'),
    ]);

    // Memproses hasil dan memberikan nilai default jika gagal
    const userStats = results[0].status === 'fulfilled' && results[0].value ? results[0].value : { overview: { total: 0, newThisWeek: 0 }, activeRole: [] };
    const questionStats = results[1].status === 'fulfilled' && results[1].value ? results[1].value : { total: 0, recent: [] };
    const generationStats = results[2].status === 'fulfilled' && results[2].value ? results[2].value : { total: 0, mostFrequent: [] };

    return NextResponse.json({ 
      success: true, 
      data: { userStats, questionStats, generationStats } 
    });

  } catch (error: any) {
    console.error('[BFF /api/admin/analytics] Terjadi kesalahan tak terduga:', error.message);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal pada server.' },
      { status: 500 }
    );
  }
}
