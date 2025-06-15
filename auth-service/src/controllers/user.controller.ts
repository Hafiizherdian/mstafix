import { PrismaClient } from '@prisma/client';
import { Role } from '../types/user';

const prisma = new PrismaClient();

// Ambil semua data pengguna (untuk admin)
export const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // Jangan tampilkan password
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to retrieve users');
  }
};

// Ambil statistik pengguna (jumlah dan data pendaftaran per bulan)
export const getUserStats = async () => {
  try {
    // Hitung jumlah total pengguna
    const totalCount = await prisma.user.count();
    
    // Ambil data pengguna dikelompokkan per bulan
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Kelompokkan berdasarkan bulan
    const monthlyData: Record<string, number> = {};
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    users.forEach(user => {
      const date = new Date(user.createdAt);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      
      monthlyData[monthYear]++;
    });
    
    // Format data untuk response
    const monthlyRegistration = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
    
    // Hitung jumlah per role
    const adminCount = await prisma.user.count({
      where: {
        role: Role.ADMIN,
      },
    });
    
    const userCount = await prisma.user.count({
      where: {
        role: Role.USER,
      },
    });
    
    return {
      count: totalCount,
      monthlyRegistration,
      byRole: {
        admin: adminCount,
        user: userCount,
      },
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error('Failed to retrieve user statistics');
  }
};

// Ambil data aktivitas pengguna (untuk dashboard)
export const getUserActivity = async () => {
  try {
    // Ambil data 7 hari terakhir
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    // Dalam kasus nyata, Anda mungkin memiliki tabel aktivitas
    // Karena kita tidak memilikinya, kita akan menggunakan refresh tokens sebagai proxy aktivitas
    // dengan asumsi bahwa login = aktivitas
    const refreshTokens = await prisma.refreshToken.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        userId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Kelompokkan berdasarkan hari
    const dailyData: Record<string, number> = {};
    
    // Inisialisasi data untuk 7 hari terakhir
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      dailyData[dateString] = 0;
    }
    
    // Hitung aktivitas per hari
    refreshTokens.forEach(token => {
      const date = new Date(token.createdAt);
      const dateString = date.toISOString().split('T')[0];
      
      if (dateString in dailyData) {
        dailyData[dateString]++;
      }
    });
    
    // Format data untuk response
    const dailyActivity = Object.entries(dailyData)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)); // Urutkan berdasarkan tanggal (lama ke baru)
    
    return {
      dailyActivity,
      totalActivity: Object.values(dailyData).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw new Error('Failed to retrieve user activity');
  }
}; 