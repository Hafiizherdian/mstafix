import express from 'express'
import multer from 'multer'
import { saveQuestion, getQuestions, updateQuestion, deleteQuestion } from '../controllers/question.controller'
import { extractPDFContent } from '../services/pdfExtractor'

// Konfigurasi Multer yang lebih sederhana
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
})

const router = express.Router()

// Add new endpoint for content extraction
router.post('/extract-content', upload.single('file'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const content = await extractPDFContent(req.file.buffer);
    
    res.json({
      success: true,
      content,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/questions', async (req, res): Promise<void> => {
  try {
    console.log('Received request:', { body: req.body });

    // Validate request body
    if (!req.body.questions || !Array.isArray(req.body.questions)) {
      res.status(400).json({ 
        error: 'Questions array is required',
        details: 'Request body must include a questions array'
      });
      return;
    }

    const questions = await saveQuestion(req.body);
    console.log('Questions saved successfully:', questions.length);
    res.status(201).json(questions);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      error: 'Failed to save questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/questions', async (req, res): Promise<void> => {
  try {
    const filters = {
      category: req.query.category as string,
      difficulty: req.query.difficulty as string,
      type: req.query.type as string,
      status: req.query.status as string,
      batchTime: req.query.batchTime as string
    };
    
    console.log('Fetching questions with filters:', filters);
    const result = await getQuestions(filters);
    
    res.json({
      total: result.total,
      items: result.items || []
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/questions/:id', async (req, res): Promise<void> => {
  try {
    console.log('Updating question:', req.params.id, 'with data:', req.body);
    const question = await updateQuestion(req.params.id, req.body);
    console.log('Question updated successfully');
    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ 
      error: 'Failed to update question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/questions/:id', async (req, res): Promise<void> => {
  try {
    console.log('Deleting question:', req.params.id);
    await deleteQuestion(req.params.id);
    console.log('Question deleted successfully');
    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ 
      error: 'Failed to delete question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router