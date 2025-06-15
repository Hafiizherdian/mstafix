"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionStatus = exports.deleteQuestion = exports.updateQuestion = exports.getQuestionById = exports.getQuestions = void 0;
exports.setNotificationService = setNotificationService;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let notificationService = {
    sendNotification: async () => {
        console.warn('Notification service not configured. Messages will not be sent.');
    }
};
function setNotificationService(service) {
    notificationService = service;
}
async function sendQuestionNotification(type, payload) {
    try {
        await notificationService.sendNotification('soal-notifications', Object.assign(Object.assign({ type }, payload), { timestamp: new Date() }));
    }
    catch (error) {
        console.error('Failed to send notification:', error);
    }
}
const getQuestions = async (filters = {}) => {
    try {
        const questions = await prisma.question.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.category && {
                category: filters.category.toLowerCase()
            })), (filters.createdAt && {
                createdAt: {
                    gte: new Date(new Date(filters.createdAt).getTime() - 1000),
                    lte: new Date(new Date(filters.createdAt).getTime() + 1000)
                }
            })), (filters.difficulty && { difficulty: filters.difficulty })), (filters.status && { status: filters.status })),
            select: {
                id: true,
                question: true,
                options: true,
                answer: true,
                explanation: true,
                category: true,
                difficulty: true,
                type: true,
                status: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return questions;
    }
    catch (error) {
        console.error('Error getting questions:', error);
        throw error;
    }
};
exports.getQuestions = getQuestions;
const getQuestionById = async (id) => {
    try {
        const question = await prisma.question.findUnique({
            where: { id },
            select: {
                id: true,
                question: true,
                options: true,
                answer: true,
                explanation: true,
                category: true,
                difficulty: true,
                type: true,
                status: true,
                createdAt: true
            }
        });
        if (!question)
            throw new Error('Question not found');
        return question;
    }
    catch (error) {
        console.error('Error getting question:', error);
        throw error;
    }
};
exports.getQuestionById = getQuestionById;
const updateQuestion = async (id, data) => {
    try {
        const question = await prisma.question.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date() })
        });
        await sendQuestionNotification('SOAL_UPDATED', {
            questionId: id,
            updates: data
        });
        return question;
    }
    catch (error) {
        console.error('Error updating question:', error);
        throw error;
    }
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (id) => {
    try {
        await prisma.question.delete({
            where: { id }
        });
        await sendQuestionNotification('SOAL_DELETED', {
            questionId: id
        });
        return true;
    }
    catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
};
exports.deleteQuestion = deleteQuestion;
const updateQuestionStatus = async (id, status) => {
    try {
        const question = await prisma.question.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });
        await sendQuestionNotification('STATUS_CHANGED', {
            questionId: id,
            newStatus: status
        });
        return question;
    }
    catch (error) {
        console.error('Error updating question status:', error);
        throw error;
    }
};
exports.updateQuestionStatus = updateQuestionStatus;
//# sourceMappingURL=question.controller.js.map