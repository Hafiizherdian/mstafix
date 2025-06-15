"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.getQuestions = exports.saveQuestion = void 0;
exports.setNotificationService = setNotificationService;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const defaultNotificationService = {
    sendNotification: async () => {
        console.warn('Notification service not configured. Message not sent.');
    }
};
let notificationService = defaultNotificationService;
function setNotificationService(service) {
    notificationService = service;
}
const saveQuestion = async (questionData) => {
    try {
        console.log('Saving question data:', questionData);
        const questionsToSave = Array.isArray(questionData.questions)
            ? questionData.questions
            : [questionData.questions];
        const batchTimestamp = new Date();
        const questions = await Promise.all(questionsToSave.map(async (q) => {
            const data = {
                question: q.question,
                options: q.type === 'MCQ' ? q.options : null,
                answer: q.answer,
                explanation: q.explanation,
                category: q.category.toLowerCase(),
                difficulty: q.difficulty,
                type: q.type,
                status: 'DRAFT',
                createdAt: batchTimestamp,
                updatedAt: batchTimestamp
            };
            console.log('Saving individual question:', data);
            const question = await prisma.question.create({ data });
            await notificationService.sendNotification('soal-notifications', {
                type: 'SOAL_GENERATED',
                questionId: question.id,
                category: question.category,
                timestamp: new Date()
            });
            return question;
        }));
        console.log(`Successfully saved ${questions.length} questions`);
        return questions;
    }
    catch (error) {
        console.error('Save error:', error);
        throw error;
    }
};
exports.saveQuestion = saveQuestion;
const getQuestions = async (filters = {}) => {
    try {
        const questions = await prisma.question.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (filters.status && { status: filters.status })), (filters.difficulty && { difficulty: filters.difficulty })), (filters.category && { category: filters.category })),
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
const updateQuestion = async (id, data) => {
    try {
        const question = await prisma.question.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date() })
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
        return true;
    }
    catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
};
exports.deleteQuestion = deleteQuestion;
//# sourceMappingURL=question.controller.js.map