import { PrismaClient } from '@prisma/client'
import { messageQueue } from '../services/messageQueue'

const prisma = new PrismaClient()

// Optional: Create a notification service interface
interface NotificationService {
  sendNotification: (queue: string, message: any) => Promise<void>;
}

// Default implementation that does nothing (can be replaced with real implementation)
const defaultNotificationService: NotificationService = {
  sendNotification: async () => {
    console.warn('Notification service not configured. Message not sent.');
  }
}

let notificationService: NotificationService = defaultNotificationService;

// Optional: Function to set a custom notification service
export function setNotificationService(service: NotificationService) {
  notificationService = service;
}

export const saveQuestion = async (questionData: any) => {
  try {
    console.log('Processing question data:', questionData);

    // Handle both direct questions array and questions in request body
    const questionsToSave = questionData.questions || [];
    if (!Array.isArray(questionsToSave)) {
      throw new Error('Questions must be an array');
    }

    if (questionsToSave.length === 0) {
      console.warn('No questions to process');
      return [];
    }

    // Buat timestamp yang sama untuk semua soal dalam batch ini
    const batchTimestamp = new Date();

    // Kirim notifikasi untuk setiap soal ke message queue
    // Penyimpanan ke database akan dilakukan oleh manage-soal-service
    const processedQuestions = [];
    
    for (const q of questionsToSave) {
      try {
        // Validate required fields
        if (!q.question || !q.type || !q.difficulty) {
          console.warn('Skipping invalid question data (missing required fields):', q);
          continue;
        }

        // Generate a temporary ID for tracking
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Prepare data for notification
        const questionData = {
          id: tempId,
          question: q.question,
          options: q.type === 'MCQ' ? (q.options || []) : null,
          answer: q.answer || '',
          explanation: q.explanation || '',
          category: (q.category || 'uncategorized').toLowerCase(),
          difficulty: q.difficulty,
          type: q.type,
          status: q.status || 'DRAFT',
          createdAt: batchTimestamp,
          updatedAt: batchTimestamp
        };

        console.log(`Sending question to message queue: ${tempId}`);
        
        // Send notification through message queue
        await messageQueue.publishQuestionCreated(questionData);
        
        // Add to processed questions
        processedQuestions.push({
          ...questionData,
          status: 'queued',
          message: 'Question queued for processing'
        });
        
      } catch (error) {
        console.error(`Error processing question:`, error);
        processedQuestions.push({
          id: `error_${Date.now()}`,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          originalData: q
        });
      }
    }

    console.log(`Processed ${processedQuestions.length} questions`);
    return processedQuestions;
    
  } catch (error) {
    console.error('Error in saveQuestion:', error);
    // Re-throw with more context if needed
    throw new Error(`Failed to process questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const getQuestions = async (filters: any = {}) => {
  try {
    console.log('Getting questions with filters:', filters);
    
    const questions = await prisma.$transaction(async (tx) => {
      let where: any = {};
      
      // Basic filters
      if (filters.category) {
        where.category = {
          equals: filters.category,
          mode: 'insensitive'
        };
      }
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      
      // Batch time filter
      if (filters.batchTime) {
        const batchDate = new Date(filters.batchTime);
        batchDate.setSeconds(0, 0);
        const batchEnd = new Date(batchDate);
        batchEnd.setMinutes(batchDate.getMinutes() + 1);
        
        where.createdAt = {
          gte: batchDate,
          lt: batchEnd
        };
      }

      const total = await tx.question.count({ where });
      const items = await tx.question.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      console.log(`Found ${items.length} questions matching filters`);
      return { total, items };
    });

    return questions;
  } catch (error) {
    console.error('Error in getQuestions:', error);
    throw error;
  }
}

export const updateQuestion = async (id: string, data: any) => {
  try {
    const question = await prisma.question.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date() // Always update the timestamp
      }
    })
    return question
  } catch (error) {
    console.error('Error updating question:', error)
    throw error
  }
}

export const deleteQuestion = async (id: string) => {
  try {
    await prisma.question.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error('Error deleting question:', error)
    throw error
  }
}