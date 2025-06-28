"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivity = exports.getUserStats = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const user_1 = require("../types/user");
const prisma = new client_1.PrismaClient();
const getAllUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users;
    }
    catch (error) {
        console.error('Error getting all users:', error);
        throw new Error('Failed to retrieve users');
    }
};
exports.getAllUsers = getAllUsers;
const getUserStats = async () => {
    try {
        const totalCount = await prisma.user.count();
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
        const monthlyData = {};
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        users.forEach(user => {
            const date = new Date(user.createdAt);
            const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            monthlyData[monthYear]++;
        });
        const monthlyRegistration = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            count,
        }));
        const adminCount = await prisma.user.count({
            where: {
                role: user_1.Role.ADMIN,
            },
        });
        const userCount = await prisma.user.count({
            where: {
                role: user_1.Role.USER,
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
    }
    catch (error) {
        console.error('Error getting user stats:', error);
        throw new Error('Failed to retrieve user statistics');
    }
};
exports.getUserStats = getUserStats;
const getUserActivity = async () => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
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
        const dailyData = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            dailyData[dateString] = 0;
        }
        refreshTokens.forEach(token => {
            const date = new Date(token.createdAt);
            const dateString = date.toISOString().split('T')[0];
            if (dateString in dailyData) {
                dailyData[dateString]++;
            }
        });
        const dailyActivity = Object.entries(dailyData)
            .map(([date, count]) => ({
            date,
            count,
        }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
        return {
            dailyActivity,
            totalActivity: Object.values(dailyData).reduce((sum, count) => sum + count, 0),
        };
    }
    catch (error) {
        console.error('Error getting user activity:', error);
        throw new Error('Failed to retrieve user activity');
    }
};
exports.getUserActivity = getUserActivity;
//# sourceMappingURL=user.controller.js.map