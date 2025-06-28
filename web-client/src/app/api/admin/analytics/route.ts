// Reworked API Route: /api/admin/analytics
// Fetches data in parallel for improved performance and resilience.

import { NextResponse } from 'next/server';
import axios from 'axios';

// Asumsi: URL microservice disimpan di environment variables untuk best practice
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://127.0.0.1:3001/api/v1/users/stats';
const QUESTION_SERVICE_URL = process.env.MANAGE_SOAL_SERVICE_URL || 'http://127.0.0.1:3003/api/v1/questions/stats';
const GENERATION_SERVICE_URL = process.env.GENERATE_SOAL_SERVICE_URL || 'http://127.0.0.1:3002/api/v1/generate/stats';

// Helper untuk membuat request dengan header otorisasi
const createAuthorizedRequest = (token: string | null) => {
  if (!token) {
    // Dalam production, ini seharusnya melempar error atau ditangani oleh middleware
    console.warn('Authorization token is missing. Proceeding without auth for development.');
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Fungsi untuk mengambil statistik pengguna
const fetchUserStats = async (config: any) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/stats`, config);
    return response.data; // Expected: { overview: { total: number }, recent: User[] }
  } catch (error) {
    console.error('[AnalyticsRoute] Failed to fetch user stats:', error);
    return { overview: { total: 0 }, recent: [] }; // Fallback data
  }
};

// Fungsi untuk mengambil statistik soal
const fetchQuestionStats = async (config: any) => {
  try {
    const response = await axios.get(`${QUESTION_SERVICE_URL}/stats`, config);
    return response.data; // Expected: { total: number, recent: Question[] }
  } catch (error) {
    console.error('[AnalyticsRoute] Failed to fetch question stats:', error);
    return { total: 0, recent: [] }; // Fallback data
  }
};

// Fungsi untuk mengambil statistik soal hasil generate
const fetchGenerationStats = async (config: any) => {
  try {
    const response = await axios.get(`${GENERATION_SERVICE_URL}/stats`, config);
    return response.data; // Expected: { total: number }
  } catch (error) {
    console.error('[AnalyticsRoute] Failed to fetch generation stats:', error);
    return { total: 0 }; // Fallback data
  }
};

export async function GET(request: Request) {
  try {
    // Untuk keperluan sidang, kita gunakan token hardcoded.
    const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';
    const config = createAuthorizedRequest(hardcodedToken);

    // Jalankan semua promise secara paralel untuk efisiensi
    const results = await Promise.allSettled([
      fetchUserStats(config),
      fetchQuestionStats(config),
      fetchGenerationStats(config),
    ]);

    // Proses hasil dari Promise.allSettled
    const userStats = results[0].status === 'fulfilled' ? results[0].value : { overview: { total: 0 }, recent: [] };
    const questionStats = results[1].status === 'fulfilled' ? results[1].value : { total: 0, recent: [] };
    const generationStats = results[2].status === 'fulfilled' ? results[2].value : { total: 0 };

    // Struktur data disesuaikan dengan yang diharapkan oleh frontend
    return NextResponse.json({
        userStats,
        questionStats,
        generationStats,
    });

  } catch (error) {
    console.error('[AnalyticsRoute] An unexpected error occurred:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
