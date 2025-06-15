import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// URL API
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'
const MANAGE_SOAL_SERVICE_URL = process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003'
const GENERATE_SOAL_SERVICE_URL = process.env.GENERATE_SOAL_SERVICE_URL || 'http://generate-soal-service:3002'

export async function GET(request: NextRequest) {
  // Ambil token dari cookie
  const token = cookies().get('authToken')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      { status: 401 }
    )
  }

  try {
    // Verifikasi token dan dapatkan data user
    const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { user } = await verifyResponse.json()

    // Cek jika user bukan admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized, admin access required' },
        { status: 403 }
      )
    }

    // Variabel untuk menyimpan data yang berhasil diambil
    let userCountData = { count: 0, monthlyRegistration: [] };
    let questionStats = { totalCount: 0, byCategory: {}, byDifficulty: {} };
    let userActivity = { dailyActivity: [] };

    // Coba ambil data pengguna dengan handling error
    try {
      const userCountResponse = await fetch(`${AUTH_SERVICE_URL}/users/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (userCountResponse.ok) {
        userCountData = await userCountResponse.json()
      } else {
        console.error('Failed to fetch user count, using dummy data')
      }
    } catch (error) {
      console.error('Error fetching user count:', error)
    }

    // Coba ambil data statistik soal dengan handling error
    try {
      const questionCountResponse = await fetch(`${MANAGE_SOAL_SERVICE_URL}/questions/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (questionCountResponse.ok) {
        questionStats = await questionCountResponse.json()
      } else {
        console.error('Failed to fetch question stats, using dummy data')
      }
    } catch (error) {
      console.error('Error fetching question stats:', error)
    }

    // Coba ambil data aktivitas dengan handling error
    try {
      const userActivityResponse = await fetch(`${AUTH_SERVICE_URL}/users/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (userActivityResponse.ok) {
        userActivity = await userActivityResponse.json()
      } else {
        console.error('Failed to fetch user activity, using dummy data')
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
    }

    // Membuat data dummy jika API belum diimplementasikan
    // Ini adalah placeholder yang nantinya diganti dengan data sesungguhnya
    const mockData = {
      userCount: userCountData.count || 10,
      questionCount: questionStats.totalCount || 50,
      userActivity: userActivity.dailyActivity || Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 15)
      })),
      questionsByCategory: questionStats.byCategory || {
        'matematika': 15,
        'bahasa inggris': 10,
        'fisika': 8,
        'kimia': 7,
        'biologi': 10
      },
      questionsByDifficulty: questionStats.byDifficulty || {
        'EASY': 20,
        'MEDIUM': 20,
        'HARD': 10
      },
      usersRegisteredByMonth: userCountData.monthlyRegistration || [
        { month: 'Januari', count: 3 },
        { month: 'Februari', count: 5 },
        { month: 'Maret', count: 2 },
        { month: 'April', count: 4 },
        { month: 'Mei', count: 6 }
      ]
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    
    // Kembalikan data dummy jika terjadi error
    const fallbackData = {
      userCount: 10,
      questionCount: 50,
      userActivity: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 15)
      })),
      questionsByCategory: {
        'matematika': 15,
        'bahasa inggris': 10,
        'fisika': 8,
        'kimia': 7,
        'biologi': 10
      },
      questionsByDifficulty: {
        'EASY': 20,
        'MEDIUM': 20,
        'HARD': 10
      },
      usersRegisteredByMonth: [
        { month: 'Januari', count: 3 },
        { month: 'Februari', count: 5 },
        { month: 'Maret', count: 2 },
        { month: 'April', count: 4 },
        { month: 'Mei', count: 6 }
      ]
    }
    
    return NextResponse.json(fallbackData)
  }
} 