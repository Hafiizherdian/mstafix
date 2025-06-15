"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const question_controller_1 = require("../controllers/question.controller");
const router = express_1.default.Router();
router.get('/', (_req, res) => {
    return res.json({ message: 'Manage Soal Service API' });
});
router.get('/questions', async (req, res) => {
    try {
        const questions = await (0, question_controller_1.getQuestions)(req.query);
        return res.json(questions);
    }
    catch (error) {
        console.error('Route error:', error);
        return res.status(500).json({ error: 'Failed to get questions' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const question = await (0, question_controller_1.getQuestionById)(req.params.id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        console.log('Sending question:', question);
        return res.json(question);
    }
    catch (error) {
        console.error('Route error:', error);
        return res.status(500).json({ error: 'Failed to get question' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        console.log('Updating question with data:', req.body);
        const question = await (0, question_controller_1.updateQuestion)(req.params.id, req.body);
        console.log('Updated question:', question);
        return res.json(question);
    }
    catch (error) {
        console.error('Route error:', error);
        return res.status(500).json({ error: 'Failed to update question' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await (0, question_controller_1.deleteQuestion)(req.params.id);
        return res.json({ success: true, message: 'Question deleted successfully' });
    }
    catch (error) {
        console.error('Route error:', error);
        return res.status(500).json({ error: 'Failed to delete question' });
    }
});
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const question = await (0, question_controller_1.updateQuestionStatus)(req.params.id, status);
        return res.json(question);
    }
    catch (error) {
        console.error('Route error:', error);
        return res.status(500).json({ error: 'Failed to update question status' });
    }
});
exports.default = router;
//# sourceMappingURL=question.routes.js.map