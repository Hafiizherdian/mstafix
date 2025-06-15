import express from 'express'
import { 
  getQuestions, 
  getQuestionById, 
  updateQuestion, 
  deleteQuestion,
  updateQuestionStatus,
  saveQuestions
} from '../controllers/question.controller'

const router = express.Router()

// Root endpoint
router.get('/', (_req, res) => {
  return res.json({ message: 'Manage Soal Service API' });
});

// Helper function to extract user ID from request
const getUserIdFromRequest = (req: express.Request): string | null => {
  // Try from X-User-ID header
  if (req.headers['x-user-id']) {
    return req.headers['x-user-id'] as string;
  }
  
  // Try from query parameter
  if (req.query.createdBy) {
    return req.query.createdBy as string;
  }
  
  // Try from request body
  if (req.body && req.body.userId) {
    return req.body.userId;
  }
  
  // Couldn't find user ID
  return null;
};

// Get question by ID endpoint
router.get('/questions/:id', async (req, res) => {
  try {
    console.log('GET request for question ID:', req.params.id);
    
    // Log authorization header untuk debug (masked)
    const authHeader = req.headers.authorization;
    console.log('Auth header (masked):', authHeader ? `${authHeader.substring(0, 20)}...` : 'missing');
    
    // Ekstrak user ID untuk validasi kepemilikan
    const userId = getUserIdFromRequest(req);
    console.log('User ID from request:', userId);
    
    if (!userId) {
      console.error('User ID missing from request for fetching individual question');
      return res.status(400).json({
        error: 'User ID is required for this operation',
        details: 'Please provide user ID in the X-User-ID header or query parameter'
      });
    }
    
    // Ambil soal dari database
    const question = await getQuestionById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Validasi kepemilikan soal (PENTING UNTUK KEAMANAN)
    // Mengakses createdBy secara aman dengan type assertion
    const questionWithCreatedBy = question as any;
    const createdBy = questionWithCreatedBy.createdBy;
    
    // Jika soal memiliki createdBy dan tidak cocok dengan user ID
    if (createdBy && createdBy !== userId) {
      console.error(`Unauthorized access attempt: User ${userId} tried to access question owned by ${createdBy}`);
      return res.status(403).json({ 
        error: 'You do not have permission to access this question',
        details: 'Questions can only be accessed by their creator'
      });
    }
    
    console.log('Sending question:', question.id);
    return res.json(question);
  } catch (error) {
    console.error('Error getting question by ID:', error);
    return res.status(500).json({ 
      error: 'Failed to get question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add questions - new endpoint
router.post('/questions', async (req, res) => {
  try {
    console.log('Receiving questions in manage-soal-service:', req.body.questions?.length || '0', 'questions with category:', req.body.category || 'unknown');
    
    // Ekstrak data dari headers untuk logging
    const headers = {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers.authorization ? `Present (length: ${req.headers.authorization.length})` : 'Not provided',
      userId: req.headers['x-user-id'] ? `${req.headers['x-user-id']}` : 'Not provided'
    };
    console.log('Headers:', headers);
    
    // Ekstrak userId dari:
    // 1. Header X-User-ID
    // 2. Token JWT (jika tersedia)
    // 3. Request body
    let userId = req.headers['x-user-id'] as string;

    // Jika tidak ada di header, coba extract dari token JWT
    if (!userId && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        // Decode token JWT tanpa verifikasi (hanya untuk ekstrak data)
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = decoded.userId;
        console.log('Extracted userId from JWT token:', userId);
      } catch (error) {
        console.error('Failed to extract userId from JWT token:', error);
      }
    }
    
    // Jika masih tidak ada, coba ambil dari body request
    if (!userId && req.body.userId) {
      userId = req.body.userId;
      console.log('Using userId from request body:', userId);
    }
    
    // Jika masih tidak ada, coba dari field createdBy
    if (!userId && req.body.createdBy) {
      userId = req.body.createdBy;
      console.log('Using createdBy as userId:', userId);
    }
    
    console.log('User ID for saving questions:', userId || 'null');
    
    // Validasi userId: jika masih tidak ada, kembalikan error
    if (!userId) {
      console.log('User ID missing from request for saving questions');
      return res.status(400).json({
        error: 'User ID is required for this operation',
        details: 'Please provide user ID in the X-User-ID header'
      });
    }
    
    // Tambahkan userId ke body request
    req.body.userId = userId;
    req.body.createdBy = userId;
    
    // Validasi basic struktur data
    if (!req.body.questions || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: 'Request must include a non-empty questions array'
      });
    }
    
    // Tambahkan userId ke setiap soal
    req.body.questions.forEach((q: any) => {
      if (!q.createdBy) {
        q.createdBy = userId;
      }
    });
    
    console.log(`Processing ${req.body.questions.length} questions for saving...`);
    
    // Proses penyimpanan soal
    const result = await saveQuestions(req.body);
    
    // Tambahkan lebih banyak informasi ke respons
    return res.status(201).json({
      success: true,
      message: `Questions saved successfully`,
      totalRequested: req.body.questions.length,
      totalSaved: Array.isArray(result) ? result.length : 0,
      questions: result
    });
  } catch (error) {
    console.error('Error in POST /questions:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    });
  }
});

// Get questions (list/search)
router.get('/questions', async (req, res) => {
  try {
    console.log('GET request for questions with query:', req.query);
    
    // Log authorization header untuk debug (masked)
    const authHeader = req.headers.authorization;
    console.log('Auth header for list (masked):', authHeader ? `${authHeader.substring(0, 20)}...` : 'missing');
    
    // Ekstrak user ID untuk validasi kepemilikan
    const userId = getUserIdFromRequest(req);
    console.log('User ID for question list:', userId);
    
    if (!userId) {
      console.error('User ID missing from request for fetching questions list');
      return res.status(400).json({
        error: 'User ID is required for this operation',
        details: 'Please provide user ID in the X-User-ID header or as createdBy query parameter'
      });
    }
    
    // Tambahkan filter createdBy untuk memastikan user hanya melihat soalnya sendiri
    const filters = { ...req.query, createdBy: userId };
    console.log('Applying filters with user ownership:', filters);
    
    const questionsResult = await getQuestions(filters);
    
    console.log(`Returning ${questionsResult.items.length} questions for user ${userId}`);
    return res.json(questionsResult.items);
  } catch (error) {
    console.error('Error getting questions:', error);
    return res.status(500).json({
      error: 'Failed to get questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update question
router.put('/questions/:id', async (req, res) => {
  try {
    console.log('PUT request for question ID:', req.params.id);
    
    // Log authorization header untuk debug (masked)
    const authHeader = req.headers.authorization;
    console.log('Auth header for update (masked):', authHeader ? `${authHeader.substring(0, 20)}...` : 'missing');
    
    // Log request body untuk debugging (tanpa data sensitif)
    console.log('Update request body:', {
      id: req.body.id,
      question: req.body.question ? `${req.body.question.substring(0, 30)}...` : 'missing',
      type: req.body.type,
      status: req.body.status,
      hasOptions: !!req.body.options,
      category: req.body.category
    });
    
    // Validasi ID parameter dan request body
    if (!req.params.id) {
      console.error('Missing ID parameter in update request');
      return res.status(400).json({ error: 'Question ID is required' });
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Empty request body for update');
      return res.status(400).json({ error: 'Update data is required' });
    }
    
    // Validasi bahwa ID di URL dan body cocok (jika body memiliki ID)
    if (req.body.id && req.body.id !== req.params.id) {
      console.error(`ID mismatch: URL ID ${req.params.id} does not match body ID ${req.body.id}`);
      return res.status(400).json({ 
        error: 'ID in URL does not match ID in request body',
        urlId: req.params.id,
        bodyId: req.body.id
      });
    }
    
    // Ekstrak user ID untuk validasi kepemilikan
    const userId = getUserIdFromRequest(req);
    console.log('User ID for update:', userId);
    
    if (!userId) {
      console.error('User ID missing from request for updating question');
      return res.status(400).json({
        error: 'User ID is required for this operation',
        details: 'Please provide user ID in the X-User-ID header'
      });
    }
    
    // Verifikasi kepemilikan soal sebelum update
    try {
      const existingQuestion = await getQuestionById(req.params.id);
      
      if (!existingQuestion) {
        console.error(`Question not found for update: ${req.params.id}`);
        return res.status(404).json({ error: 'Question not found' });
      }
      
      // Mengakses createdBy secara aman dengan type assertion
      const questionWithCreatedBy = existingQuestion as any;
      const createdBy = questionWithCreatedBy.createdBy;
      
      // Jika soal memiliki createdBy dan tidak cocok dengan user ID
      if (createdBy && createdBy !== userId) {
        console.error(`Unauthorized update attempt: User ${userId} tried to update question owned by ${createdBy}`);
        return res.status(403).json({ 
          error: 'You do not have permission to update this question',
          details: 'Questions can only be updated by their creator'
        });
      }
      
      // Tambahkan createdBy ke body jika tidak ada
      if (!req.body.createdBy) {
        req.body.createdBy = userId;
      }
      
      // Lanjutkan dengan update
      const updatedQuestion = await updateQuestion(req.params.id, req.body);
      
      if (!updatedQuestion) {
        console.error(`Question not found for update: ${req.params.id}`);
        return res.status(404).json({ error: 'Question not found' });
      }
      
      console.log('Question updated successfully:', updatedQuestion.id);
      return res.json(updatedQuestion);
    } catch (dbError) {
      console.error('Database error during question update:', dbError);
      return res.status(500).json({ 
        error: 'Failed to update question in database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ 
      error: 'Failed to update question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete question
router.delete('/questions/:id', async (req, res) => {
  try {
    console.log('DELETE request for question ID:', req.params.id);
    
    // Ekstrak user ID untuk validasi kepemilikan
    const userId = getUserIdFromRequest(req);
    console.log('User ID for delete:', userId);
    
    if (!userId) {
      console.error('User ID missing from request for deleting question');
      return res.status(400).json({
        error: 'User ID is required for this operation',
        details: 'Please provide user ID in the X-User-ID header'
      });
    }
    
    // Verifikasi kepemilikan soal sebelum delete
    try {
      const existingQuestion = await getQuestionById(req.params.id);
      
      if (!existingQuestion) {
        console.error(`Question not found for delete: ${req.params.id}`);
        return res.status(404).json({ error: 'Question not found' });
      }
      
      // Mengakses createdBy secara aman dengan type assertion
      const questionWithCreatedBy = existingQuestion as any;
      const createdBy = questionWithCreatedBy.createdBy;
      
      // Jika soal memiliki createdBy dan tidak cocok dengan user ID
      if (createdBy && createdBy !== userId) {
        console.error(`Unauthorized delete attempt: User ${userId} tried to delete question owned by ${createdBy}`);
        return res.status(403).json({ 
          error: 'You do not have permission to delete this question',
          details: 'Questions can only be deleted by their creator'
        });
      }
      
      // Lanjutkan dengan delete
      await deleteQuestion(req.params.id);
      
      return res.json({ success: true, message: 'Question deleted successfully' });
    } catch (dbError) {
      console.error('Database error during question delete:', dbError);
      return res.status(500).json({ 
        error: 'Failed to delete question from database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ 
      error: 'Failed to delete question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update question status
router.patch('/questions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedQuestion = await updateQuestionStatus(req.params.id, status);
    
    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question status:', error);
    return res.status(500).json({ 
      error: 'Failed to update question status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router