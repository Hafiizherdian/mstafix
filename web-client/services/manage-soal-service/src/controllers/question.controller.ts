import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Definisikan interface untuk tipe data Question yang sesuai dengan Prisma schema
interface QuestionData {
  id?: string;
  question: string;  // required
  options?: any;
  answer: string;    // required
  explanation: string; // required
  category: string;  // required
  difficulty: string; // required
  type: string;      // required
  status: string;    // required
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  userId?: string;
}

// Interface untuk request yang berisi multiple questions
interface SaveQuestionsRequest {
  questions: {
    id?: string;
    question: string;
    options?: any;
    answer: string;
    explanation: string;
    category?: string;
    difficulty?: string;
    type?: string;
    status?: string;
    createdBy?: string;
    userId?: string;
  }[];
  userId?: string;
  createdBy?: string;
  category?: string;
  difficulty?: string;
  type?: string;
  questionCount?: number;
}

// Notification service interface
interface NotificationService {
  sendNotification: (queue: string, message: any) => Promise<void>;
}

// Default implementation (can be replaced with real implementation)
let notificationService: NotificationService = {
  sendNotification: async () => {
    console.warn('Notification service not configured. Messages will not be sent.');
  }
};

// Function to set custom notification service
export function setNotificationService(service: NotificationService): void {
  notificationService = service;
}

// Helper function to send notifications
async function sendQuestionNotification(type: string, payload: any): Promise<void> {
  try {
    await notificationService.sendNotification('soal-notifications', {
      type,
      ...payload,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't throw error as notification failure shouldn't fail the main operation
  }
}

export const getQuestions = async (filters: any = {}) => {
  try {
    console.log('Getting questions with filters:', filters);
    
    const questions = await prisma.$transaction(async (tx) => {
      let where: any = {};
      
      // Basic filters
      if (filters.category) {
        // Case-insensitive exact match for category
        where.category = {
          equals: filters.category,
          mode: 'insensitive'
        };
        console.log('Applying category filter:', filters.category);
      }
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      
      // User filter - PENTING untuk keamanan
      if (filters.createdBy) {
        where.createdBy = filters.createdBy;
        console.log('Filtering by creator ID:', filters.createdBy);
      }
      
      // Batch time filter - flexibel mendukung format dari frontend
      if (filters.batchTime) {
        const batchTimeStr = filters.batchTime;
        console.log('Raw batchTime value:', batchTimeStr);
        
        try {
          // Parse batchTime, which might be in full ISO or truncated format (YYYY-MM-DDTHH:MM)
          const batchDate = new Date(batchTimeStr);
          
          if (isNaN(batchDate.getTime())) {
            console.warn('Invalid batchTime format:', batchTimeStr);
          } else {
            // Reset seconds and milliseconds
            batchDate.setSeconds(0, 0);
            const batchEnd = new Date(batchDate);
            batchEnd.setMinutes(batchDate.getMinutes() + 1);
            
            where.createdAt = {
              gte: batchDate,
              lt: batchEnd
            };
            
            console.log('Filtering by batch time:', {
              start: batchDate.toISOString(),
              end: batchEnd.toISOString()
            });
          }
        } catch (e) {
          console.error('Error parsing batchTime:', e);
        }
      }
      
      // Date filter (tanggal lengkap)
      if (filters.date) {
        try {
          const dateStr = filters.date;
          const startDate = new Date(dateStr);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          
          where.createdAt = {
            gte: startDate,
            lte: endDate
          };
          
          console.log('Filtering by date:', {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          });
        } catch (e) {
          console.error('Error parsing date filter:', e);
        }
      }

      // Get total count with filters
      const total = await tx.question.count({ where });

      // Get questions with filters
      const items = await tx.question.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${items.length} questions matching filters:`, {
        where,
        resultCount: items.length,
        categories: [...new Set(items.map(q => q.category))],
        timestamps: [...new Set(items.map(q => q.createdAt.toISOString()))]
      });

      return { total, items };
    });

    return questions;
  } catch (error) {
    console.error('Error in getQuestions:', error);
    throw error;
  }
};

export const getQuestionById = async (id: string) => {
  try {
    console.log(`Looking for question with ID: ${id}`);
    
    // Get all fields dari question
    const question = await prisma.question.findUnique({
      where: { id }
    });
    
    if (!question) {
      console.log(`Question not found with ID: ${id}`);
      throw new Error('Question not found');
    }
    
    console.log(`Question found with ID: ${id}, category: ${question.category}`);
    return question;
  } catch (error) {
    console.error('Error getting question by ID:', error);
    throw error;
  }
};

export const updateQuestion = async (id: string, data: any): Promise<any> => {
  try {
    console.log(`Updating question ${id} with data:`, data);

    // Validasi data
    if (!id) {
      throw new Error('Question ID is required for update');
    }

    // Siapkan data update (hanya field yang diizinkan)
    const updateData: any = {};
    
    // Update field teks
    if (data.question) updateData.question = data.question;
    if (data.answer) updateData.answer = data.answer;
    if (data.explanation) updateData.explanation = data.explanation;
    if (data.category) updateData.category = data.category.toLowerCase();
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.type) updateData.type = data.type;
    if (data.status) updateData.status = data.status;
    
    // Handle options khusus untuk MCQ
    if (data.options) {
      updateData.options = data.options;
    } else if (data.type === 'MCQ' && !data.options) {
      // Jika tipe MCQ tapi options tidak disediakan, gunakan array kosong
      updateData.options = [];
    }
    
    // Tambahkan createdBy jika tersedia
    if (data.createdBy) {
      updateData.createdBy = data.createdBy;
    }
    
    // Selalu update timestamp
    updateData.updatedAt = new Date();

    // Update question di database
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    // Send notification
    await sendQuestionNotification('SOAL_UPDATED', {
      questionId: id,
      updates: updateData,
    });

    return updatedQuestion;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (id: string) => {
  try {
    await prisma.question.delete({
      where: { id }
    });

    // Send notification
    await sendQuestionNotification('SOAL_DELETED', {
      questionId: id
    });

    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

export const updateQuestionStatus = async (id: string, status: string) => {
  try {
    const question = await prisma.question.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date() // Ensure updatedAt is always set
      }
    });

    // Send notification
    await sendQuestionNotification('STATUS_CHANGED', {
      questionId: id,
      newStatus: status
    });

    return question;
  } catch (error) {
    console.error('Error updating question status:', error);
    throw error;
  }
};

// Fungsi untuk menyimpan soal-soal baru dari generate-soal
export const saveQuestions = async (requestData: any): Promise<any[]> => {
  try {
    console.log('Saving questions in saveQuestions controller:', requestData);

    // Handle both direct questions array and questions in request body
    const questionsToSave = requestData.questions;
    if (!Array.isArray(questionsToSave)) {
      throw new Error('Questions must be an array');
    }

    // Buat timestamp yang sama untuk semua soal dalam batch ini
    const batchTimestamp = new Date();
    const processedIds = new Set<string>();
    
    // Ekstrak userId dari request jika tersedia
    const userId = requestData.userId || requestData.createdBy || '';
    console.log('User ID for batch save:', userId);

    // Validate and save or update questions
    const questions = await Promise.all(
      questionsToSave.map(async (q: any) => {
        // Validate required fields
        if (!q.question || !q.type || !q.difficulty) {
          console.error('Invalid question data:', q);
          throw new Error('Missing required question fields');
        }

        // Cek untuk duplikasi ID dalam batch yang sama
        if (q.id && processedIds.has(q.id)) {
          console.log(`Skipping duplicate question ID in batch: ${q.id}`);
          return null;
        }

        // Prepare data for database
        const data: any = {
          question: q.question,
          options: q.type === 'MCQ' ? q.options : null,
          answer: q.answer || '',
          explanation: q.explanation || '',
          category: (q.category || requestData.category || 'uncategorized').toLowerCase(),
          difficulty: q.difficulty || requestData.difficulty || 'MEDIUM',
          type: q.type || requestData.type || 'MCQ',
          status: q.status || 'DRAFT',
          updatedAt: batchTimestamp,
        };
        
        // Tambahkan createdBy dari soal, request, atau userId parameter
        const createdByValue = q.createdBy || q.userId || userId || requestData.createdBy || null;
        if (createdByValue) {
          data.createdBy = createdByValue;
          console.log(`Setting createdBy for question: ${createdByValue}`);
        } else {
          console.warn('No createdBy value available for question');
        }

        // Cek apakah soal dengan question, category, dan type sudah ada
        const existing = await prisma.question.findFirst({
          where: {
            question: data.question,
            category: data.category,
            type: data.type,
          },
        });

        let savedQuestion;
        if (existing) {
          // Update existing question
          console.log(`Question already exists with ID: ${existing.id}, updating instead of creating new`);
          savedQuestion = await prisma.question.update({
            where: { id: existing.id },
            data: {
              ...data,
              createdAt: existing.createdAt, // pertahankan createdAt lama
            },
          });
          
          if (savedQuestion.id) {
            processedIds.add(savedQuestion.id);
          }
          
          await sendQuestionNotification('SOAL_UPDATED', {
            questionId: savedQuestion.id,
            updates: data,
          });
        } else {
          // Insert baru - gunakan UUID untuk mencegah duplikasi dengan IDs yang dibuat secara manual
          const { v4: uuidv4 } = require('uuid');
          
          // Jika ID sudah ada dan valid, gunakan ID tersebut
          // Jika tidak, buat UUID baru
          const questionId = (q.id && typeof q.id === 'string' && q.id.length > 10) 
            ? q.id 
            : uuidv4();
            
          console.log(`Creating new question with ID: ${questionId}`);
          
          // Insert baru
          savedQuestion = await prisma.question.create({
            data: {
              ...data,
              id: questionId,
              createdAt: batchTimestamp,
            },
          });
          
          if (savedQuestion.id) {
            processedIds.add(savedQuestion.id);
          }
          
          await sendQuestionNotification('SOAL_CREATED', {
            questionId: savedQuestion.id,
            category: savedQuestion.category,
          });
        }
        return savedQuestion;
      })
    );

    // Filter out null values from skipped duplicates
    const validQuestions = questions.filter(q => q !== null);
    console.log(`Successfully saved or updated ${validQuestions.length} questions in manage-soal-service`);
    return validQuestions;
  } catch (error) {
    console.error('Save error in manage-soal-service:', error);
    throw error;
  }
};